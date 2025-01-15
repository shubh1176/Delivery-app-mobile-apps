export interface CourierAddress {
  full: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CourierContact {
  name: string;
  phone: string;
  email?: string;
}

export interface CourierPackage {
  category: string;
  size: string;
  weight: number;
  isFragile: boolean;
  requiresRefrigeration: boolean;
}

export interface CourierOrderRequest {
  pickup: {
    address: CourierAddress;
    contact: CourierContact;
    scheduledTime: string;
  };
  drops: {
    address: CourierAddress;
    contact: CourierContact;
    scheduledTime: string;
    sequence: number;
  }[];
  package: CourierPackage;
  payment: {
    method: string;
    transactionId?: string;
  };
  insurance: {
    required: boolean;
  };
  vehicleType: string;
  requiresSignature: boolean;
  handlingInstructions: string[];
}

export interface CourierOrderResponse {
  id: string;
  status: string;
  tracking: {
    id: string;
    url: string;
  };
  created_at: string;
  updated_at: string;
} 