import rateLimit from 'express-rate-limit';

type RateLimitType = 
  | 'register'
  | 'login'
  | 'send-otp'
  | 'verify-otp'
  | 'forgot-password'
  | 'reset-password'
  | 'refresh-token'
  | 'email-verification'
  | 'verify-email';

const limits: Record<RateLimitType, { max: number; windowMs: number }> = {
  'register': { max: 5, windowMs: 15 * 60 * 1000 },       // 5 attempts per 15 minutes
  'login': { max: 10, windowMs: 15 * 60 * 1000 },        // 10 attempts per 15 minutes
  'send-otp': { max: 3, windowMs: 5 * 60 * 1000 },       // 3 requests per 5 minutes
  'verify-otp': { max: 5, windowMs: 15 * 60 * 1000 },    // 5 attempts per 15 minutes
  'forgot-password': { max: 3, windowMs: 60 * 60 * 1000 },// 3 attempts per hour
  'reset-password': { max: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  'refresh-token': { max: 10, windowMs: 60 * 60 * 1000 }, // 10 refreshes per hour
  'email-verification': { max: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  'verify-email': { max: 5, windowMs: 60 * 60 * 1000 }    // 5 attempts per hour
};

export const createRateLimiter = (type: RateLimitType) => {
  const limit = limits[type];
  return rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    message: {
      status: 'error',
      message: `Too many ${type} attempts. Please try again later.`
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}; 