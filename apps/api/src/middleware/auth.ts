import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as User | undefined;
      req.user = user;
    } catch {
      // ignore invalid token for optional auth
    }
  }

  next();
}
