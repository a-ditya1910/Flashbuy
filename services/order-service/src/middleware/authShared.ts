import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export interface AuthRequest extends Request { userId?: number; }

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ message: 'No token' }); return; }
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    req.userId = p.userId; next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
}
