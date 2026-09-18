import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Vérifie et décode le token avec la clé secrète partagée
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    (req as any).user = decoded;
    next(); // Passe à la route suivante
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};