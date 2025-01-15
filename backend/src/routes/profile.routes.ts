import { Router } from 'express';
import { RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  addCard,
  getCards,
  deleteCard,
  getWallet
} from '../controllers/profile.controller';

const router = Router();

// Cast handlers to RequestHandler
const handle = (fn: any): RequestHandler => fn;

// Profile Operations
router.get('/', handle(authenticateUser), handle(getProfile));
router.put('/', handle(authenticateUser), handle(updateProfile));

// Address Management
router.post('/addresses', handle(authenticateUser), handle(addAddress));
router.get('/addresses', handle(authenticateUser), handle(getAddresses));
router.put('/addresses/:id', handle(authenticateUser), handle(updateAddress));
router.delete('/addresses/:id', handle(authenticateUser), handle(deleteAddress));

// Payment Methods
router.post('/cards', handle(authenticateUser), handle(addCard));
router.get('/cards', handle(authenticateUser), handle(getCards));
router.delete('/cards/:id', handle(authenticateUser), handle(deleteCard));

// Wallet
router.get('/wallet', handle(authenticateUser), handle(getWallet));

export default router; 