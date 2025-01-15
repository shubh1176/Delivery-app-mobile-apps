export interface CourierAddress {
  full: string;
  landmark?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pincode: string;
}

export interface CourierContact {
  name: string;
  phone: string;
  alternatePhone?: string;
}

export interface CourierPackage {
  category: 'documents' | 'electronics' | 'clothing' | 'food' | 'medicine' | 'other';
  type: string;
  size: 'small' | 'medium' | 'large';
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  photos: string[];
  isFragile: boolean;
  requiresRefrigeration: boolean;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
}

export interface CourierEstimateRequest {
  pickup: {
    address: CourierAddress;
  };
  drops: Array<{
    address: CourierAddress;
    sequence: number;
  }>;
  package: CourierPackage;
}

export interface CourierOrderRequest extends CourierEstimateRequest {
  pickup: {
    address: CourierAddress;
    contact: CourierContact;
    scheduledTime: string;
  };
  drops: Array<{
    address: CourierAddress;
    contact: CourierContact;
    scheduledTime: string;
    sequence: number;
  }>;
  payment: {
    method: 'cash' | 'online' | 'wallet';
    transactionId?: string;
  };
  insurance?: {
    required: boolean;
  };
  vehicleType: 'bike' | 'scooter' | 'car' | 'mini-truck' | 'large-truck';
  requiresSignature: boolean;
  handlingInstructions: string[];
}

export interface EstimateResponse {
  estimation: {
    base: number;
    distance: number;
    weight: number;
    tax: number;
    total: number;
    currency: string;
    breakdown: {
      base: number;
      weight: number;
      tax: number;
    };
  };
  insurance: {
    available: boolean;
    premium: number;
    coverage: number;
  };
  vehicleType: string;
  estimatedDuration: number;
}

export interface OrderResponse {
  order: {
    id: string;
    status: string;
    createdAt: string;
    tracking: {
      liveTracking: {
        isEnabled: boolean;
        route: {
          plannedPath: number[][];
          eta: string;
          distance: {
            planned: number;
          };
        };
      };
    };
    estimatedDuration: number;
  };
} 