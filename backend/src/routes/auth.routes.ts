import { Router, RequestHandler } from 'express';
import {
  login,
  register,
  sendOTP,
  verifyOTP,
  logout,
  refreshAccessToken,
  sendEmailVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  forceLogout,
  getActiveSessions
} from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login as RequestHandler);
router.post('/register', register as RequestHandler);
router.post('/refresh-token', refreshAccessToken as RequestHandler);
router.post('/verify-email', verifyEmail as RequestHandler);
router.post('/forgot-password', forgotPassword as RequestHandler);
router.post('/reset-password', resetPassword as RequestHandler);

// Protected routes
router.use(authenticateUser as RequestHandler);
router.post('/send-otp', sendOTP as RequestHandler);
router.post('/verify-otp', verifyOTP as RequestHandler);
router.post('/logout', logout as RequestHandler);
router.post('/send-email-verification', sendEmailVerification as RequestHandler);
router.get('/sessions', getActiveSessions as RequestHandler);
router.post('/sessions/:sessionId/logout', forceLogout as RequestHandler);

export default router; 