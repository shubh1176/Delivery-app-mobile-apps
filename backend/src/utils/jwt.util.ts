import jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '../types/auth.types';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

const JWT_SECRET = getJWTSecret();
const JWT_ISSUER = 'unicapp-auth';
const JWT_AUDIENCE = ['mobile-app', 'web-app'];

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h', // As per AUTH_STRATEGY.md
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: Math.random().toString(36).substr(2)
  });
};

export const generateRefreshToken = (): string => {
  return Math.random().toString(36).substr(2) +
    Math.random().toString(36).substr(2) +
    Math.random().toString(36).substr(2);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    });
    return decoded as AccessTokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.decode(token) as AccessTokenPayload;
  } catch {
    return null;
  }
}; 