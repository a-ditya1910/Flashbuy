import { Router, Request, Response } from 'express';
import pool from '../db/mysql';
import { adminAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => { const [r] = await pool.execute('SELECT * FROM products'); res.json(r); });
router.get('/:id', async (req, res: Response) => {
  const [r]: any = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!r[0]) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(r[0]);
});
router.post('/', adminAuth, async (req: Request, res: Response) => {
  const { name, price, image_url, description } = req.body;
  if (!name || !price) { res.status(400).json({ message: 'name and price required' }); return; }
  const [r]: any = await pool.execute('INSERT INTO products (name, price, image_url, description) VALUES (?, ?, ?, ?)', [name, price, image_url || null, description || null]);
  res.status(201).json({ productId: r.insertId });
});

export default router;
