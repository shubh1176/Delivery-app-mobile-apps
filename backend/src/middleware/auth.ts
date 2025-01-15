import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { Partner } from '../models/Partner.model';
import { PartnerAuthenticatedRequest } from '../types/auth.types';

interface JWTPayload {
  userId: string;
  role: string;
  deviceId: string;
}

export const authenticatePartner = async (
  req: Request,
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

    // Verify it's a partner token
    if (decoded.role !== 'partner') {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid token: Not a partner token'
      });
    }

    const partner = await Partner.findById(decoded.userId).select('-password');
    if (!partner || partner.status === 'blocked' || partner.status === 'deleted') {
      return res.status(401).json({
        status: 'error',
        message: 'Partner not found or account is inactive'
      });
    }

    // Convert Mongoose document to plain object
    const partnerData = partner.toObject();

    // Set partner details in request
    (req as PartnerAuthenticatedRequest).user = {
      userId: decoded.userId,
      email: partnerData.email || '',
      role: 'partner',
      deviceId: decoded.deviceId,
      name: partnerData.name || '',
      phone: partnerData.phone || '',
      status: partnerData.status || 'offline',
      currentLocation: partnerData.currentLocation ? {
        coordinates: partnerData.currentLocation.coordinates,
        accuracy: partnerData.currentLocation.accuracy,
        heading: partnerData.currentLocation.heading,
        speed: partnerData.currentLocation.speed,
        lastUpdated: partnerData.currentLocation.lastUpdated
      } : undefined,
      vehicle: {
        type: partnerData.vehicle?.type || '',
        number: partnerData.vehicle?.number || '',
        documents: Object.values(partnerData.vehicle?.documents || {}).filter(Boolean) as string[]
      },
      earnings: {
        balance: partnerData.earnings?.balance || 0,
        incentives: partnerData.earnings?.incentives || [],
        transactions: partnerData.earnings?.transactions || []
      },
      metrics: {
        rating: partnerData.metrics?.rating || 0,
        totalOrders: partnerData.metrics?.totalOrders || 0,
        completionRate: partnerData.metrics?.completionRate || 0,
        cancelRate: partnerData.metrics?.cancelRate || 0,
        avgResponseTime: partnerData.metrics?.avgResponseTime || 0,
        totalAssigned: partnerData.metrics?.totalAssigned || 0,
        totalAccepted: partnerData.metrics?.totalAccepted || 0,
        totalCompleted: partnerData.metrics?.totalCompleted || 0,
        totalCancelled: partnerData.metrics?.totalCancelled || 0
      }
    };

    next();
  } catch (error) {
    console.error('Partner authentication error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
}; 