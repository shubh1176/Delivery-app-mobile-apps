import type { Location } from './location';


export type OrderType = 'pickup-drop';

export type OrderStatus = 'pending' | 'assigned' | 'picked' | 'in-transit' | 'delivered' | 'cancelled';

export type PackageCategory = 'documents' | 'electronics' | 'clothing' | 'food' | 'medicine' | 'other';

export type PackageSize = 'small' | 'medium' | 'large';

export type PaymentMethod = 'cash' | 'online' | 'wallet';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type VehicleType = 'bike' | 'scooter' | 'car' | 'mini-truck' | 'large-truck';

export interface Contact {
  name: string;
  phone: string;
  alternatePhone?: string;
}

export interface Address {
  full: string;
  landmark?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pincode: string;
}

export interface PackageDetails {
  category: PackageCategory;
  type: string;
  size: PackageSize;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  photos: string[];
  specialInstructions?: string;
  isFragile: boolean;
  requiresRefrigeration: boolean;
  description: string;
}

export interface Drop {
  address: Address;
  contact: Contact;
  status: string;
  scheduledTime: Date;
  actualTime?: Date;
  sequence: number;
  proofOfDelivery?: {
    photos?: string[];
    signature?: string;
    otp?: string;
    receiverName?: string;
    receiverRelation?: string;
  };
}

export interface Pickup {
  address: Address;
  contact: Contact;
  scheduledTime: Date;
  actualTime?: Date;
  package: PackageDetails;
}

export interface OrderPricing {
  base: number;
  distance: number;
  surge?: number;
  tax: number;
  total: number;
  currency: string;
  breakdown: Record<string, number>;
  discounts?: Array<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  }>;
}

export interface OrderPayment {
  status: PaymentStatus;
  method?: PaymentMethod;
  transactionId?: string;
  paidAmount?: number;
  refundAmount?: number;
  refundReason?: string;
  attempts?: Array<{
    timestamp: Date;
    status: string;
    method: string;
    error?: string;
  }>;
}

export interface OrderTracking {
  liveTracking: {
    isEnabled: boolean;
    currentLocation?: {
      coordinates: [number, number];
      timestamp: Date;
      accuracy?: number;
      speed?: number;
      bearing?: number;
    };
    route?: {
      plannedPath: Array<[number, number]>;
      actualPath?: Array<[number, number]>;
      eta?: Date;
      distance: {
        planned: number;
        actual?: number;
      };
    };
  };
  history: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    note?: string;
    updatedBy: {
      type: 'system' | 'partner' | 'admin';
      id: string;
    };
  }>;
}

export interface Rating {
  rating: number;
  review?: string;
  timestamp: Date;
}

export interface Issue {
  type: string;
  description: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface OrderEstimate {
  estimation: OrderPricing;
  vehicleType: VehicleType;
  estimatedDuration: number;
  availableSlots: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface PickupDropOrder {
  _id?: string;
  type: OrderType;
  userId: string;
  partnerId?: string;
  status: OrderStatus;
  pickup: Pickup;
  drops: Drop[];
  pricing: OrderPricing;
  payment: OrderPayment;
  tracking: OrderTracking;
  ratings?: {
    user?: Rating;
    partner?: Rating;
  };
  issues?: Issue[];
  maxDrops: number;
  routeOptimized: boolean;
  estimatedDuration: number;
  vehicleType: VehicleType;
  createdAt?: Date;
  updatedAt?: Date;
} 