import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/mysql';
import redis from '../db/redis';
import { publishOrderPlaced } from '../kafka/producer';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/buy/:saleId', auth, async (req: AuthRequest, res: Response) => {
  const saleId = Number(req.params.saleId);
  const userId = req.userId as number;

  const [rows]: any = await pool.execute(
    `SELECT s.*, p.name as product_name, p.price FROM sales s
     JOIN products p ON s.product_id = p.id
     WHERE s.id = ? AND s.starts_at <= NOW() AND s.ends_at >= NOW()`,
    [saleId]
  );
  const sale = rows[0];
  if (!sale) { res.status(400).json({ message: 'Sale not active' }); return; }

  const redisKey = `sale:${saleId}:inventory`;
  const exists = await redis.exists(redisKey);
  if (!exists) {
    const [cr]: any = await pool.execute(
      `SELECT COUNT(*) as sold FROM orders WHERE sale_id = ? AND status != 'failed'`, [saleId]
    );
    await redis.set(redisKey, sale.total_inventory - cr[0].sold);
  }

  const remaining = await redis.decr(redisKey);
  if (remaining < 0) {
    await redis.incr(redisKey);
    res.status(409).json({ message: 'Out of stock' });
    return;
  }

  const orderId = uuidv4();
  await pool.execute(
    `INSERT INTO orders (id, user_id, sale_id, product_id, status) VALUES (?, ?, ?, ?, 'pending')`,
    [orderId, userId, saleId, sale.product_id]
  );

  await publishOrderPlaced({
    orderId, userId, saleId,
    productId: sale.product_id,
    productName: sale.product_name,
    amount: Number(sale.price),
  });

  res.status(202).json({ orderId, status: 'pending', message: 'Order placed — processing payment' });
});

router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId as number;
  const [rows]: any = await pool.execute(
    `SELECT o.*, p.name as product_name, p.price FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.id = ? AND o.user_id = ?`,
    [req.params.id, userId]
  );
  if (!rows[0]) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(rows[0]);
});

router.get('/', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId as number;
  const [rows] = await pool.execute(
    `SELECT o.*, p.name as product_name, p.price FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.user_id = ? ORDER BY o.created_at DESC`,
    [userId]
  );
  res.json(rows);
});

export default router;
