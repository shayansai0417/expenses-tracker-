import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Access denied. No bearer token provided in Authorization header.',
        error: 'Unauthorized'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        message: 'Access denied. Token is missing or malformed.',
        error: 'Unauthorized'
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_expense_tracker_2026_change_in_production';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        message: 'Invalid token payload: userId missing.',
        error: 'Unauthorized'
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        message: 'Authentication token has expired. Please log in again.',
        error: 'TokenExpired'
      });
      return;
    }

    res.status(401).json({
      message: 'Failed to authenticate token.',
      error: err.message || 'InvalidToken'
    });
  }
};

