export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SearchPlacesRequest {
  query: string;
  proximity?: Coordinates;
  limit?: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  placeType: string;
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface Address {
  full: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  mode?: 'driving' | 'walking' | 'cycling';
  alternatives?: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Coordinates;
}

export interface Route {
  distance: number;
  duration: number;
  geometry: any;
  steps: RouteStep[];
}

export interface ETARequest {
  origin: Coordinates;
  destination: Coordinates;
}

export interface ETAResponse {
  eta: string;
  duration: number;
  distance: number;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: Date;
}

export interface OrderLocation {
  id: string;
  type: 'pickup-drop' | 'courier';
  status: string;
  partner?: {
    id: string;
    location: {
      latitude: number;
      longitude: number;
      lastUpdated: string;
    };
  };
  route?: {
    current: {
      latitude: number;
      longitude: number;
    };
    remaining: {
      distance: number;
      duration: number;
    };
  };
  // Pickup-drop specific fields
  maxDrops?: number;
  routeOptimized?: boolean;
  // Courier specific fields
  requiresSignature?: boolean;
} 