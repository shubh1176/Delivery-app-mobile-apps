import { Router } from 'express';
import { RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import {
  estimatePickupDropOrder,
  createPickupDropOrder,
  estimateCourierOrder,
  createCourierOrder,
  getOrderDetails,
  cancelOrder,
  rateOrder,
  getOrderDetailsForInvoice,
  getUserOrders
} from '../controllers/order.controller';

const router = Router();

// Cast handlers to RequestHandler
const handle = (fn: any): RequestHandler => fn;

// Pickup-Drop Order Routes
router.post('/pickup-drop/estimate', handle(authenticateUser), handle(estimatePickupDropOrder));
router.post('/pickup-drop/create', handle(authenticateUser), handle(createPickupDropOrder));

// Courier Order Routes
router.post('/courier/estimate', handle(authenticateUser), handle(estimateCourierOrder));
router.post('/courier/create', handle(authenticateUser), handle(createCourierOrder));

// Common Order Operations
router.get('/', handle(authenticateUser), handle(getUserOrders));
router.get('/:id', handle(authenticateUser), handle(getOrderDetails));
router.post('/:id/cancel', handle(authenticateUser), handle(cancelOrder));
router.post('/:id/rate', handle(authenticateUser), handle(rateOrder));

// Get order details for invoice
router.get('/:orderId/invoice-details', handle(authenticateUser), handle(getOrderDetailsForInvoice));

export default router; 