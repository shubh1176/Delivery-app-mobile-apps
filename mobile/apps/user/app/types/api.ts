import type { 
  Address, 
  Contact, 
  OrderPricing, 
  VehicleType, 
  PackageCategory, 
  PackageSize,
  PickupDropOrder 
} from './order';

export interface APIResponse<T> {
  status: 'success' | 'error';
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Route {
  distance: number;
  duration: number;
  polyline: string;
  waypoints: Array<{
    latitude: number;
    longitude: number;
  }>;
}

export interface EstimatePickupDropRequest {
  pickup: {
    address: Address;
    package: {
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
      isFragile: boolean;
      requiresRefrigeration: boolean;
      description: string;
    };
  };
  drops: Array<{
    address: Address;
    sequence: number;
  }>;
}

export interface EstimatePickupDropResponse {
  status: 'success';
  data: {
    estimation: OrderPricing;
    vehicleType: VehicleType;
    estimatedDuration: number;
    availableSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface CreatePickupDropRequest extends Omit<PickupDropOrder, '_id' | 'createdAt' | 'updatedAt'> {} 