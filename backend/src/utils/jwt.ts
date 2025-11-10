import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  departmentId?: string;
}

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId || undefined
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '7d'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '30d'
  });
};