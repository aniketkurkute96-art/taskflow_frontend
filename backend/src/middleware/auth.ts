import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppDataSource } from '../database';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId },
      relations: ['department']
    });

    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid token or user not active.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ 
        where: { id: decoded.userId },
        relations: ['department']
      });

      if (user && user.active) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};