import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/mysql';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) { res.status(400).json({ message: 'email, name, password required' }); return; }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [r]: any = await pool.execute('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)', [email, name, hash]);
    res.status(201).json({ userId: r.insertId });
  } catch { res.status(409).json({ message: 'Email already registered' }); }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ message: 'Invalid credentials' }); return;
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export default router;
