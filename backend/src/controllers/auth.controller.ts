import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Session, ISession } from '../models/Session.model';
import { User, IUser } from '../models/User.model';
import { 
  AccessTokenPayload,
  AuthenticatedRequest,
  DeviceInfo,
  LoginRequest,
  TokenResponse
} from '../types/auth.types';
import { generateRefreshToken } from '../utils/jwt.util';
import OTPRequest from '../models/OTPRequest.model';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.util';

const generateAccessToken = (user: IUser & { _id: string }, deviceInfo: DeviceInfo): string => {
  const payload: AccessTokenPayload = {
    userId: user._id,
    email: user.email,
    role: (user.role || 'user') as 'user' | 'admin' | 'partner' | 'store',
    deviceId: deviceInfo.type
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

const handleSession = async (userId: string, deviceInfo: DeviceInfo, refreshToken: string) => {
  // Deactivate existing sessions for this device type
  await Session.updateMany(
    {
      userId,
      'deviceInfo.type': deviceInfo.type,
      isActive: true
    },
    { isActive: false }
  );

  const session = await Session.create({
    userId,
    deviceInfo,
    refreshToken
  });

  const otherSessions = await Session.find({
    userId,
    _id: { $ne: session._id },
    isActive: true
  });

  return { session, otherSessions };
};

const isUserWithId = (user: any): user is IUser & { _id: string } => {
  return user && user._id && typeof user._id.toString === 'function';
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password, deviceInfo } = req.body;
    console.log('\n=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('DeviceInfo:', deviceInfo);

    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    
    if (!user || !isUserWithId(user)) {
      console.log('User not found or invalid ID');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Password validation
    console.log('Attempting password validation...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password validation failed');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const accessToken = generateAccessToken(user as IUser & { _id: string }, deviceInfo);
    const refreshToken = generateRefreshToken();

    const { session, otherSessions } = await handleSession(
      (user._id as unknown as string).toString(),
      deviceInfo,
      refreshToken
    );

    if (otherSessions.length > 0) {
      console.log('New login detected, notifying other sessions');
    }

    const response: TokenResponse = {
      accessToken,
      refreshToken
    };

    res.status(200).json({
      status: 'success',
      data: {
        user,
        tokens: response,
        sessionId: session._id
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Login failed'
    });
  }
};

export const forceLogout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    session.isActive = false;
    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Session terminated successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Force logout failed'
    });
  }
};

export const getActiveSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const sessions = await Session.find({
      userId,
      isActive: true
    }).select('-refreshToken');

    res.status(200).json({
      status: 'success',
      data: { sessions }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get sessions'
    });
  }
};

export const register = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password, deviceInfo } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Create user with required fields
    const user = await User.create({
      email,
      password,
      name: email.split('@')[0], // Default name
      profile: {
        language: 'en',
        notifications: {
          push: true,
          email: true,
          sms: true
        }
      },
      deviceTokens: [],
      wallet: {
        balance: 0,
        currency: 'INR',
        transactions: []
      }
    });

    const accessToken = generateAccessToken(user as IUser & { _id: string }, deviceInfo);
    const refreshToken = generateRefreshToken();

    const { session } = await handleSession(
      user._id.toString(),
      deviceInfo,
      refreshToken
    );

    const response: TokenResponse = {
      accessToken,
      refreshToken
    };

    res.status(201).json({
      status: 'success',
      data: {
        user,
        tokens: response,
        sessionId: session._id
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed'
    });
  }
};

export const sendOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phone } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    // Generate random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('\n=== OTP DETAILS ===');
    console.log('Phone:', phone);
    console.log('OTP:', otp);
    console.log('==================\n');
    
    // Save OTP
    const otpRequest = await OTPRequest.create({
      phone,
      otp,
      userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // In production, send via Twilio
    if (process.env.NODE_ENV === 'production') {
      // Add Twilio implementation
    }

    res.json({
      status: 'success',
      data: {
        requestId: otpRequest._id,
        expiresIn: 300 // 5 minutes
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to send OTP'
    });
  }
};

export const verifyOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId, otp } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const otpRequest = await OTPRequest.findOne({
      _id: requestId,
      userId,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    if (otpRequest.otp !== otp) {
      otpRequest.attempts += 1;
      await otpRequest.save();

      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    // Mark as verified
    otpRequest.verified = true;
    await otpRequest.save();

    // Update user
    await User.findByIdAndUpdate(userId, {
      isPhoneVerified: true,
      phone: otpRequest.phone
    });

    res.json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to verify OTP'
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    // Find and deactivate session
    await Session.findOneAndUpdate(
      { userId, refreshToken },
      { isActive: false }
    );

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to logout'
    });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Find active session
    const session = await Session.findOne({
      refreshToken,
      isActive: true
    });

    if (!session) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Get user
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user as IUser & { _id: string }, session.deviceInfo as DeviceInfo);
    const newRefreshToken = generateRefreshToken();

    // Update session
    session.refreshToken = newRefreshToken;
    await session.save();

    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to refresh token'
    });
  }
};

export const sendEmailVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      text: `Please verify your email by clicking: ${verificationUrl}`,
      html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a></p>`
    });

    res.json({
      status: 'success',
      message: 'Verification email sent'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to send verification email'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all sessions
    await Session.updateMany(
      { userId: user._id },
      { isActive: false }
    );

    res.json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to reset password'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to verify email'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Reset your password by clicking: ${resetUrl}`,
      html: `<p>Reset your password by clicking <a href="${resetUrl}">here</a></p>`
    });

    res.json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to send reset email'
    });
  }
}; 