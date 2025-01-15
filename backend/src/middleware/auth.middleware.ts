import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { AuthenticatedRequest } from '../types/auth.types';

interface JWTPayload {
  userId: string;
  role: string;
  deviceId?: string;
}

interface UserDocument {
  _id: { toString(): string };
  email: string;
  role: string;
  status: 'active' | 'blocked' | 'deleted';
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const user = await User.findById(decoded.userId).select('_id email role status');
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive'
      });
    }

    const userData = user.toObject() as UserDocument;
    req.user = {
      _id: userData._id.toString(),
      email: userData.email,
      role: userData.role || 'user',
      status: userData.status,
      deviceId: decoded.deviceId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
}; 