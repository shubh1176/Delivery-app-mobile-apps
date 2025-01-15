import { Router } from 'express';
import { handle } from '../utils/error';
import { authenticatePartner } from '../middleware/auth';
import * as authController from '../controllers/partner/auth.controller';
import * as profileController from '../controllers/partner/profile.controller';
import * as locationController from '../controllers/partner/location.controller';
import * as orderController from '../controllers/partner/order.controller';
import * as earningsController from '../controllers/partner/earnings.controller';
import * as performanceController from '../controllers/partner/performance.controller';

const router = Router();

// Auth routes
router.post('/auth/send-otp', handle(authController.sendOTP));
router.post('/auth/verify-otp', handle(authController.verifyPhoneOTP));
router.post('/auth/register', handle(authController.register));
router.post('/auth/login', handle(authController.login));
router.post('/auth/update-device-token', handle(authenticatePartner), handle(authController.updateDeviceToken));

// Profile routes
router.get('/profile', handle(authenticatePartner), handle(profileController.getProfile));
router.put('/profile', handle(authenticatePartner), handle(profileController.updateProfile));
router.put('/profile/vehicle', handle(authenticatePartner), handle(profileController.updateVehicle));
router.put('/profile/documents', handle(authenticatePartner), handle(profileController.updateDocuments));
router.put('/profile/bank-details', handle(authenticatePartner), handle(profileController.updateBankDetails));
router.put('/profile/service-area', handle(authenticatePartner), handle(profileController.updateServiceArea));

// Location routes
router.post('/location', handle(authenticatePartner), handle(locationController.updateLocation));
router.put('/status', handle(authenticatePartner), handle(locationController.updateStatus));
router.get('/active-partners', handle(authenticatePartner), handle(locationController.getActivePartners));

// Order routes
router.get('/orders', handle(authenticatePartner), handle(orderController.getOrders));
router.get('/orders/:orderId', handle(authenticatePartner), handle(orderController.getOrderDetails));
router.post('/orders/:orderId/accept', handle(authenticatePartner), handle(orderController.acceptOrder));
router.post('/orders/:orderId/reject', handle(authenticatePartner), handle(orderController.rejectOrder));
router.post('/orders/:orderId/status', handle(authenticatePartner), handle(orderController.updateOrderStatus));

// Earnings routes
router.get('/earnings/summary', handle(authenticatePartner), handle(earningsController.getEarningsSummary));
router.get('/earnings/transactions', handle(authenticatePartner), handle(earningsController.getTransactionHistory));
router.post('/earnings/withdraw', handle(authenticatePartner), handle(earningsController.requestWithdrawal));
router.get('/earnings/incentives', handle(authenticatePartner), handle(earningsController.getIncentives));

// Performance routes
router.get('/performance/metrics', handle(authenticatePartner), handle(performanceController.getPerformanceMetrics));
router.get('/performance/ratings', handle(authenticatePartner), handle(performanceController.getRatings));

export default router; 