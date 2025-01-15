export interface Location {
  address: {
    full: string;
    landmark?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    pincode: string;
  };
  contact: {
    name: string;
    phone: string;
    alternatePhone?: string;
  };
} 