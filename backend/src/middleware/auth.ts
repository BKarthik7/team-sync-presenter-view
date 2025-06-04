import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Extend Express Request type to include user and headers
export interface AuthenticatedRequest extends Request {
  user: {
    _id: Types.ObjectId;
    role: string;
  };
  headers: {
    authorization?: string;
  };
}

// Type for the middleware function
export type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const token = (req as AuthenticatedRequest).headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      _id: string;
      role: string;
    };

    (req as AuthenticatedRequest).user = {
      _id: new Types.ObjectId(decoded._id),
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};