import { Router, Request, Response } from 'express';
import pool from '../db/mysql';
import redis from '../db/redis';
import { adminAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const [rows]: any = await pool.execute(
    `SELECT s.*, p.name as product_name, p.price, p.image_url, p.description
     FROM sales s JOIN products p ON s.product_id = p.id
     WHERE s.starts_at <= NOW() AND s.ends_at >= NOW()
     ORDER BY s.starts_at DESC`
  );
  const sales = await Promise.all(rows.map(async (sale: any) => {
    let inv = await redis.get(`sale:${sale.id}:inventory`);
    if (inv === null) {
      const [cr]: any = await pool.execute(
        `SELECT COUNT(*) as sold FROM orders WHERE sale_id = ? AND status != 'failed'`,
        [sale.id]
      );
      inv = String(sale.total_inventory - cr[0].sold);
      await redis.set(`sale:${sale.id}:inventory`, inv);
    }
    return { ...sale, remaining_inventory: Math.max(0, Number(inv)) };
  }));
  res.json(sales);
});

router.get('/:id', async (req, res: Response) => {
  const [rows]: any = await pool.execute(
    `SELECT s.*, p.name as product_name, p.price, p.image_url, p.description
     FROM sales s JOIN products p ON s.product_id = p.id WHERE s.id = ?`, [req.params.id]
  );
  const sale = rows[0];
  if (!sale) { res.status(404).json({ message: 'Sale not found' }); return; }
  let inv = await redis.get(`sale:${sale.id}:inventory`);
  if (inv === null) {
    const [cr]: any = await pool.execute(`SELECT COUNT(*) as sold FROM orders WHERE sale_id = ? AND status != 'failed'`, [sale.id]);
    inv = String(sale.total_inventory - cr[0].sold);
  }
  res.json({ ...sale, remaining_inventory: Math.max(0, Number(inv)) });
});

const toMysql = (iso: string) => new Date(iso).toISOString().replace('T', ' ').slice(0, 19);

router.post('/', adminAuth, async (req: Request, res: Response) => {
  const { product_id, total_inventory, starts_at, ends_at } = req.body;
  if (!product_id || !total_inventory || !starts_at || !ends_at) {
    res.status(400).json({ message: 'product_id, total_inventory, starts_at, ends_at required' }); return;
  }
  const start = toMysql(starts_at);
  const end = toMysql(ends_at);
  const status = new Date(starts_at) <= new Date() ? 'active' : 'upcoming';
  const [r]: any = await pool.execute(
    `INSERT INTO sales (product_id, total_inventory, starts_at, ends_at, status) VALUES (?, ?, ?, ?, ?)`,
    [product_id, total_inventory, start, end, status]
  );
  await redis.set(`sale:${r.insertId}:inventory`, total_inventory);
  res.status(201).json({ saleId: r.insertId });
});

export default router;
