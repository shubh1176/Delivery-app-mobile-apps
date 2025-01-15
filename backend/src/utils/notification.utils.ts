import { IPartner } from '../models/Partner.model';
import { ICourierOrder } from '../models/CourierOrder.model';
import { IPickupDropOrder } from '../models/PickupDropOrder.model';
import { sendPushNotification } from './firebase.utils';
import { Types } from 'mongoose';

interface OrderNotification {
  type: string;
  orderId: string;
  pickup: {
    address: string;
    distance: number;
    eta: string;
  };
  earnings: {
    base: number;
    incentives: number;
    total: number;
  };
  expiresIn: number;
}

/**
 * Send order notification to partner
 */
export const sendOrderNotification = async (partner: IPartner, order: ICourierOrder | IPickupDropOrder) => {
  if (!partner.deviceToken) {
    console.warn(`No device token for partner ${partner._id}`);
    return;
  }

  const notification: OrderNotification = {
    type: 'NEW_ORDER',
    orderId: (order._id as Types.ObjectId).toString(),
    pickup: {
      address: order.pickup.address.full,
      distance: calculateDistance(
        partner.currentLocation.coordinates,
        [order.pickup.address.coordinates.longitude, order.pickup.address.coordinates.latitude]
      ),
      eta: calculateETA(
        partner.currentLocation.coordinates,
        [order.pickup.address.coordinates.longitude, order.pickup.address.coordinates.latitude]
      )
    },
    earnings: calculateEarnings(order),
    expiresIn: 30
  };

  await sendPushNotification(partner.deviceToken, {
    title: 'New Order Available',
    body: `Pickup from ${order.pickup.address.full}`,
    data: {
      type: notification.type,
      orderId: notification.orderId,
      pickup_address: notification.pickup.address,
      pickup_distance: notification.pickup.distance.toString(),
      pickup_eta: notification.pickup.eta,
      earnings_base: notification.earnings.base.toString(),
      earnings_incentives: notification.earnings.incentives.toString(),
      earnings_total: notification.earnings.total.toString(),
      expires_in: notification.expiresIn.toString()
    }
  });
};

/**
 * Notify user that no partners are available
 */
export const notifyUserNoPartners = async (order: ICourierOrder | IPickupDropOrder) => {
  // TODO: Implement user notification through appropriate channels
  // This could be push notification, SMS, email, etc.
  console.log(`No partners available for order ${(order._id as Types.ObjectId).toString()}`);
};

/**
 * Calculate distance between two points in kilometers
 */
const calculateDistance = (point1: number[], point2: number[]): number => {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

/**
 * Calculate ETA based on distance and average speed
 */
const calculateETA = (point1: number[], point2: number[]): string => {
  const distance = calculateDistance(point1, point2);
  const avgSpeedKmH = 25; // Average speed in city
  const timeInHours = distance / avgSpeedKmH;
  const eta = new Date(Date.now() + timeInHours * 60 * 60 * 1000);
  return eta.toISOString();
};

/**
 * Calculate earnings for an order
 */
const calculateEarnings = (order: ICourierOrder | IPickupDropOrder) => {
  // Base calculation logic
  const baseAmount = order.pricing.total * 0.8; // 80% of order amount
  
  // Incentive calculation
  const incentiveAmount = calculateIncentives(order);
  
  return {
    base: baseAmount,
    incentives: incentiveAmount,
    total: baseAmount + incentiveAmount
  };
};

/**
 * Calculate incentives for an order
 */
const calculateIncentives = (order: ICourierOrder | IPickupDropOrder): number => {
  let incentives = 0;
  
  // Peak hour bonus
  if (isPeakHour()) {
    incentives += 50;
  }
  
  // Long distance bonus
  const distance = calculateOrderDistance(order);
  if (distance > 10) { // More than 10km
    incentives += 100;
  }
  
  return incentives;
};

/**
 * Check if current time is peak hour
 */
const isPeakHour = (): boolean => {
  const hour = new Date().getHours();
  return (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20);
};

interface DropLocation {
  address: {
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
}

/**
 * Calculate total order distance
 */
const calculateOrderDistance = (order: ICourierOrder | IPickupDropOrder): number => {
  const pickupCoords = [
    order.pickup.address.coordinates.longitude,
    order.pickup.address.coordinates.latitude
  ];
  
  let dropCoords: number[];
  if (order.type === 'courier' && Array.isArray(order.drops) && order.drops.length > 0) {
    const firstDrop = order.drops[0] as DropLocation;
    dropCoords = [
      firstDrop.address.coordinates.longitude,
      firstDrop.address.coordinates.latitude
    ];
  } else if (order.type === 'pickup-drop' && 'address' in order.drops) {
    const drop = order.drops as DropLocation;
    dropCoords = [
      drop.address.coordinates.longitude,
      drop.address.coordinates.latitude
    ];
  } else {
    throw new Error('Invalid drops format in order');
  }
  
  return calculateDistance(pickupCoords, dropCoords);
};