export type WalletTransaction = {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  orderId?: string;
  timestamp: Date;
};

export type SavedCard = {
  _id: string;
  last4: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

export interface SavedAddress {
  _id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  label: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profile: {
    avatar?: string;
    language: string;
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  addresses: SavedAddress[];
  wallet: {
    balance: number;
    currency: string;
    transactions: WalletTransaction[];
  };
  savedCards: SavedCard[];
  deviceTokens: string[];
  status: 'active' | 'blocked' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
} 