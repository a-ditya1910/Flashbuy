import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/mysql';
import redis from '../db/redis';

const router = Router();

function getUser(req: Request): number | null {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return (jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }).userId; } catch { return null; }
}

// GET /api/notifications — list + unread count from Redis
router.get('/', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const [rows] = await pool.execute(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  const unread = await redis.get(`notif:unread:${userId}`);
  res.json({ notifications: rows, unreadCount: Number(unread || 0) });
});

// PATCH /api/notifications/read-all — mark all read
router.patch('/read-all', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  await pool.execute(`UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, [userId]);
  await redis.set(`notif:unread:${userId}`, 0);
  res.json({ message: 'All marked as read' });
});

export default router;
