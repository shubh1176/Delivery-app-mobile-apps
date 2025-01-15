import { Request, Response } from 'express';
import { Partner, IPartner } from '../../models/Partner.model';
import OTPRequest from '../../models/OTPRequest.model';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';
import { handle } from '../../utils/error';
import { sendEmail } from '../../utils/email.util';
import { Document, Types } from 'mongoose';

interface PartnerDocument extends Document, IPartner {
  _id: Types.ObjectId;
}

export const sendOTP = handle(async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone number is required'
    });
  }

  // Invalidate any existing OTP requests for this phone
  await OTPRequest.updateMany(
    { phone, verified: false },
    { verified: true }  // Mark as verified to prevent them from being used
  );

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

  // Save OTP request
  const otpRequest = await OTPRequest.create({
    phone,
    otp,
    expiresAt,
    verified: false,
    attempts: 0
  });

  // In production, integrate with SMS service
  // For now, just log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('New OTP Request:', {
      phone,
      otp,
      requestId: otpRequest._id,
      expiresAt
    });
  }

  return res.json({
    status: 'success',
    message: 'OTP sent successfully',
    data: { phone }
  });
});

export const verifyPhoneOTP = handle(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  
  console.log('Verifying OTP:', {
    phone,
    receivedOtp: otp,
    timestamp: new Date().toISOString()
  });

  if (!phone || !otp) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone and OTP are required'
    });
  }

  // Find OTP request
  const otpRequest = await OTPRequest.findOne({
    phone,
    verified: false,
    expiresAt: { $gt: new Date() }
  });

  console.log('Found OTP request:', {
    exists: !!otpRequest,
    storedOtp: otpRequest?.otp,
    attempts: otpRequest?.attempts,
    expiresAt: otpRequest?.expiresAt,
    verified: otpRequest?.verified
  });

  if (!otpRequest) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or expired OTP'
    });
  }

  // Check attempts
  if (otpRequest.attempts >= 3) {
    return res.status(400).json({
      status: 'error',
      message: 'Too many attempts. Please request a new OTP'
    });
  }

  // Verify OTP
  const otpMatch = otpRequest.otp === otp;
  console.log('OTP verification:', {
    received: otp,
    stored: otpRequest.otp,
    matches: otpMatch
  });

  // Mark OTP as verified
  otpRequest.verified = true;
  await otpRequest.save();

  // Check if partner exists
  const existingPartner = await Partner.findOne({ phone }) as PartnerDocument | null;
  if (existingPartner) {
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: existingPartner._id.toString(),
      email: existingPartner.email || '',
      role: 'partner',
      deviceId: req.body.deviceId || ''
    });
    const refreshToken = generateRefreshToken();

    return res.json({
      status: 'success',
      message: 'OTP verified successfully',
      data: {
        accessToken,
        refreshToken,
        partner: {
          id: existingPartner._id,
          phone: existingPartner.phone,
          name: existingPartner.name,
          status: existingPartner.status
        }
      }
    });
  }

  // If partner doesn't exist, return success but indicate registration needed
  return res.json({
    status: 'success',
    message: 'OTP verified successfully',
    data: {
      requiresRegistration: true,
      phone
    }
  });
});

export const register = handle(async (req: Request, res: Response) => {
  const {
    phone,
    email,
    password,
    name,
    vehicle,
    serviceArea
  } = req.body;

  // Validate required fields
  if (!phone || !email || !password || !name || !vehicle || !serviceArea) {
    return res.status(400).json({
      status: 'error',
      message: 'All required fields must be provided'
    });
  }

  // Check if partner already exists
  const existingPartner = await Partner.findOne({
    $or: [{ phone }, { email }]
  });
  if (existingPartner) {
    return res.status(400).json({
      status: 'error',
      message: 'Partner already exists with this phone or email'
    });
  }

  // Create new partner
  const partner = await Partner.create({
    phone,
    email,
    password,
    name,
    vehicle: {
      type: vehicle.type,
      number: vehicle.number,
      documents: {}
    },
    serviceArea: {
      city: serviceArea.city,
      boundaries: [],
      preferredLocations: []
    },
    status: 'offline',
    currentLocation: {
      coordinates: [0, 0],
      lastUpdated: new Date()
    },
    metrics: {
      rating: 0,
      totalOrders: 0,
      completionRate: 0,
      cancelRate: 0,
      avgResponseTime: 0,
      totalAssigned: 0,
      totalAccepted: 0,
      totalCompleted: 0,
      totalCancelled: 0
    },
    earnings: {
      balance: 0,
      incentives: [],
      transactions: []
    },
    documents: {
      verification: {
        phone: true,
        email: false,
        identity: false,
        address: false,
        vehicle: false
      }
    }
  }) as PartnerDocument;

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: partner._id.toString(),
    email: partner.email || '',
    role: 'partner',
    deviceId: req.body.deviceId || ''
  });
  const refreshToken = generateRefreshToken();

  return res.status(201).json({
    status: 'success',
    message: 'Partner registered successfully',
    data: {
      accessToken,
      refreshToken,
      partner: {
        id: partner._id,
        phone: partner.phone,
        name: partner.name,
        status: partner.status
      }
    }
  });
});

export const login = handle(async (req: Request, res: Response) => {
  const { phone, password, deviceId } = req.body;
  if (!phone || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Phone and password are required'
    });
  }

  // Find partner
  const partner = await Partner.findOne({ phone }) as PartnerDocument | null;
  if (!partner) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }

  // Check if partner is blocked or deleted
  if (partner.status === 'blocked' || partner.status === 'deleted') {
    return res.status(403).json({
      status: 'error',
      message: 'Account is not active'
    });
  }

  // Verify password
  const isValid = await partner.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: partner._id.toString(),
    email: partner.email || '',
    role: 'partner',
    deviceId: deviceId || ''
  });
  const refreshToken = generateRefreshToken();

  return res.json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      accessToken,
      refreshToken,
      partner: {
        id: partner._id,
        phone: partner.phone,
        name: partner.name,
        status: partner.status
      }
    }
  });
});

export const updateDeviceToken = handle(async (req: PartnerAuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }

  const { deviceToken } = req.body;
  if (!deviceToken) {
    return res.status(400).json({
      status: 'error',
      message: 'Device token is required'
    });
  }

  const partner = await Partner.findById(req.user.userId);
  if (!partner) {
    return res.status(404).json({
      status: 'error',
      message: 'Partner not found'
    });
  }

  partner.deviceToken = deviceToken;
  await partner.save();

  return res.json({
    status: 'success',
    message: 'Device token updated successfully'
  });
}); 