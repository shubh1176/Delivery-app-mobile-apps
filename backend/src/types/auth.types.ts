import { Request } from 'express';
import { IUser } from '../models/User.model';


// Request Types
export interface SendOTPRequest {
  phone: string;
  userId: string;
  countryCode?: string;
}

export interface VerifyOTPRequest {
  requestId: string;
  otp: string;
  userId: string;
}

// Response Types
export interface SendOTPResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    requestId: string;
    expiresIn: number;
  };
}

export interface VerifyOTPResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: {
      _id: string;
      phone: string;
      name?: string;
      email?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

// Token Types
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'partner' | 'store';
  deviceId: string;
}

export interface RefreshToken {
  token: string;
  userId: string;
  deviceId: string;
  expiresAt: Date;
  isRevoked: boolean;
}

// Auth Request Types
export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: {
    _id: string;
    email: string;
    role: string;
    status: 'active' | 'blocked' | 'deleted';
    deviceId?: string;
  };
}

export interface PartnerAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    deviceId: string;
    name?: string;
    phone?: string;
    status?: string;
    currentLocation?: {
      coordinates: [number, number];
      accuracy?: number;
      heading?: number;
      speed?: number;
      lastUpdated: Date;
    };
    vehicle?: {
      type: string;
      number: string;
      documents: string[];
    };
    earnings?: {
      balance: number;
      incentives: Array<{
        amount: number;
        reason: string;
        timestamp: Date;
      }>;
      transactions: Array<{
        amount: number;
        type: 'credit' | 'debit' | 'withdrawal';
        description: string;
        timestamp: Date;
        status?: 'pending' | 'completed' | 'failed';
      }>;
    };
    metrics?: {
      rating: number;
      totalOrders: number;
      completionRate: number;
      cancelRate: number;
      avgResponseTime: number;
      totalAssigned: number;
      totalAccepted: number;
      totalCompleted: number;
      totalCancelled: number;
    };
  };
}

export interface DeviceInfo {
  type: 'mobile' | 'web';
  platform: string;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Device Types
export interface UserDevice {
  deviceId: string;
  lastActive: Date;
  deviceInfo: {
    type: string;
    name: string;
    platform: string;
    appVersion: string;
  };
}

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

// OTP Types
export interface OTPRequest {
  _id: string;
  phone: string;
  otp: string;
  attempts: number;
  expiresAt: Date;
  verified: boolean;
}

export interface IOTPRequest {
  phone: string;
  otp: string;
  verified: boolean;
  attempts: number;
  cooldownUntil?: Date;
  expiresAt: Date;
} 