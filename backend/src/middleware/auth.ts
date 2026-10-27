import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
    const userRes = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
};
