import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/mysql';

const router = Router();

function getUser(req: Request): number | null {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return (jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }).userId; } catch { return null; }
}

router.get('/:orderId', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const [rows]: any = await pool.execute(
    `SELECT * FROM payments WHERE order_id = ? AND user_id = ?`,
    [req.params.orderId, userId]
  );
  if (!rows[0]) { res.status(404).json({ message: 'Payment not found' }); return; }
  res.json(rows[0]);
});

export default router;
