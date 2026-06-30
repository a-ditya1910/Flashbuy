import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request { userId?: number; role?: string; }

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ message: 'No token' }); return; }
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string };
    req.userId = p.userId; req.role = p.role; next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
}

export function adminAuth(req: AuthRequest, res: Response, next: NextFunction) {
  auth(req, res, () => {
    if (req.role !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return; }
    next();
  });
}
