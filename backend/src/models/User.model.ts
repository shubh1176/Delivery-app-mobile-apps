import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
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
  addresses: Array<{
    type: string;
    address: string;
    landmark?: string;
    location: {
      latitude: number;
      longitude: number;
    };
    pincode: string;
    isDefault: boolean;
    label?: string;
  }>;
  wallet: {
    balance: number;
    currency: string;
    transactions: Array<{
      amount: number;
      type: 'credit' | 'debit';
      description: string;
      orderId?: mongoose.Types.ObjectId;
      timestamp: Date;
    }>;
  };
  savedCards: Array<{
    last4: string;
    cardType: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }>;
  deviceTokens: string[];
  status: 'active' | 'blocked' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  profile: {
    avatar: String,
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }
    }
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    pincode: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    label: String
  }],
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    transactions: [{
      amount: Number,
      type: {
        type: String,
        enum: ['credit', 'debit']
      },
      description: String,
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  savedCards: [{
    last4: String,
    cardType: String,
    expiryMonth: String,
    expiryYear: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'blocked', 'deleted'],
    default: 'active'
  },
  deviceTokens: [String]
}, {
  timestamps: true
});

// Password hash middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  console.log('Comparing passwords:', {
    candidatePassword,
    hashedPassword: this.password
  });
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

// Indexes
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ status: 1 });
UserSchema.index({ "addresses.location": "2dsphere" });
UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
export default User; 