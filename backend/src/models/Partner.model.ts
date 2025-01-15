import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPartner extends Document {
  phone: string;
  email?: string;
  password: string;
  name: string;
  currentLocation: {
    coordinates: [number, number];
    accuracy?: number;
    heading?: number;
    speed?: number;
    lastUpdated: Date;
  };
  status: 'active' | 'offline' | 'blocked' | 'deleted';
  deviceToken?: string;
  vehicle: {
    type: 'bike' | 'scooter' | 'cycle';
    number: string;
    documents: {
      rc?: string;
      insurance?: string;
      permit?: string;
    };
  };
  documents: {
    idProof?: string;
    addressProof?: string;
    drivingLicense?: string;
    verification: {
      phone: boolean;
      email: boolean;
      identity: boolean;
      address: boolean;
      vehicle: boolean;
    };
  };
  serviceArea: {
    city: string;
    boundaries?: Array<[number, number]>;
    preferredLocations?: Array<{
      coordinates: [number, number];
      radius: number;
    }>;
  };
  metrics: {
    rating: number;
    totalOrders: number;
    completionRate: number;
    cancelRate: number;
    avgResponseTime: number;
    totalAssigned: number;
    totalAccepted: number;
    totalCompleted: number;
    totalCancelled: number;
  };
  earnings: {
    balance: number;
    incentives: Array<{
      amount: number;
      reason: string;
      timestamp: Date;
    }>;
    transactions: Array<{
      amount: number;
      type: 'credit' | 'debit';
      description: string;
      timestamp: Date;
    }>;
  };
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    holderName: string;
    verified: boolean;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const PartnerSchema = new Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  currentLocation: {
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    },
    accuracy: Number,
    heading: Number,
    speed: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'offline', 'blocked', 'deleted'],
    default: 'offline'
  },
  deviceToken: String,
  vehicle: {
    type: {
      type: String,
      enum: ['bike', 'scooter', 'cycle'],
      required: true
    },
    number: {
      type: String,
      required: true
    },
    documents: {
      rc: String,
      insurance: String,
      permit: String
    }
  },
  documents: {
    idProof: String,
    addressProof: String,
    drivingLicense: String,
    verification: {
      phone: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: false
      },
      identity: {
        type: Boolean,
        default: false
      },
      address: {
        type: Boolean,
        default: false
      },
      vehicle: {
        type: Boolean,
        default: false
      }
    }
  },
  serviceArea: {
    city: {
      type: String,
      required: true
    },
    boundaries: [[Number]],
    preferredLocations: [{
      coordinates: {
        type: [Number],
        required: true
      },
      radius: {
        type: Number,
        required: true
      }
    }]
  },
  metrics: {
    rating: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    cancelRate: {
      type: Number,
      default: 0
    },
    avgResponseTime: {
      type: Number,
      default: 0
    },
    totalAssigned: {
      type: Number,
      default: 0
    },
    totalAccepted: {
      type: Number,
      default: 0
    },
    totalCompleted: {
      type: Number,
      default: 0
    },
    totalCancelled: {
      type: Number,
      default: 0
    }
  },
  earnings: {
    balance: {
      type: Number,
      default: 0
    },
    incentives: [{
      amount: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    transactions: [{
      amount: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    holderName: String,
    verified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
PartnerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Compare password method
PartnerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    return false;
  }
};

// Create 2dsphere index for location-based queries
PartnerSchema.index({ 'currentLocation.coordinates': '2dsphere' });
PartnerSchema.index({ 'serviceArea.preferredLocations.coordinates': '2dsphere' });

// Create index for status-based queries
PartnerSchema.index({ status: 1 });
PartnerSchema.index({ 'metrics.rating': -1 });

export const Partner = mongoose.model<IPartner>('Partner', PartnerSchema);
export default Partner; 