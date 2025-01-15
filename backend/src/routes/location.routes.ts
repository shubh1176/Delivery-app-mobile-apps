import { Router } from 'express';
import { RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { geocodingLimiter, navigationLimiter, trackingLimiter } from '../middleware/rate-limiter.middleware';
import { searchPlaces, reverseGeocode, getRoute, getETA, updatePartnerLocation, getOrderLocation } from '../controllers/location.controller';

const router = Router();

type Handler = RequestHandler<any, any, any, any>;

// Geocoding routes
router.post('/search', authenticateUser as Handler, geocodingLimiter, searchPlaces as Handler);
router.post('/reverse-geocode', authenticateUser as Handler, geocodingLimiter, reverseGeocode as Handler);

// Navigation routes
router.post('/navigation/route', authenticateUser as Handler, navigationLimiter, getRoute as Handler);
router.post('/navigation/eta', authenticateUser as Handler, navigationLimiter, getETA as Handler);

// Location tracking routes
router.post('/update', authenticateUser as Handler, trackingLimiter, updatePartnerLocation as Handler);
router.get('/order/:orderId', authenticateUser as Handler, trackingLimiter, getOrderLocation as Handler);

export default router; 