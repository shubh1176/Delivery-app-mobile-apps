import { Request, Response, NextFunction } from 'express';

export const validatePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    res.status(400).json({
      status: 'error',
      message: 'Password is required'
    });
    return;
  }

  // Minimum length check
  if (password.length < 8) {
    res.status(400).json({
      status: 'error',
      message: 'Password must be at least 8 characters long'
    });
    return;
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    res.status(400).json({
      status: 'error',
      message: 'Password must contain at least one uppercase letter'
    });
    return;
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    res.status(400).json({
      status: 'error',
      message: 'Password must contain at least one lowercase letter'
    });
    return;
  }

  // Number check
  if (!/\d/.test(password)) {
    res.status(400).json({
      status: 'error',
      message: 'Password must contain at least one number'
    });
    return;
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    res.status(400).json({
      status: 'error',
      message: 'Password must contain at least one special character'
    });
    return;
  }

  next();
}; 