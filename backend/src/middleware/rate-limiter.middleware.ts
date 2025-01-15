import rateLimit from 'express-rate-limit';

// Rate limiter configurations
const geocodingConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many geocoding requests, please try again later'
};

const navigationConfig = {
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many navigation requests, please try again later'
};

const trackingConfig = {
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many tracking requests, please try again later'
};

// Create rate limiters
export const geocodingLimiter = rateLimit(geocodingConfig);
export const navigationLimiter = rateLimit(navigationConfig);
export const trackingLimiter = rateLimit(trackingConfig); 