import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userType?: 'family' | 'caregiver';
    }
  }
}

// Middleware to verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userType = decoded.type as 'family' | 'caregiver';
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is family
export const requireFamily = (req: Request, res: Response, next: NextFunction) => {
  if (req.userType !== 'family') {
    return res.status(403).json({ error: 'Family access required' });
  }
  next();
};

// Middleware to check if user is caregiver
export const requireCaregiver = (req: Request, res: Response, next: NextFunction) => {
  if (req.userType !== 'caregiver') {
    return res.status(403).json({ error: 'Caregiver access required' });
  }
  next();
};
