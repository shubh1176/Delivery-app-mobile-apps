import mongoose, { Schema, Document } from 'mongoose';

export interface IPickupDropOrder extends Document {
  type: 'pickup-drop';
  userId: mongoose.Types.ObjectId;
  partnerId?: mongoose.Types.ObjectId;
  status: 'pending' | 'assigned' | 'picked' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: Date;
  pickup: {
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
    scheduledTime: Date;
    actualTime?: Date;
    package: {
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
      specialInstructions?: string;
      isFragile: boolean;
      requiresRefrigeration: boolean;
      description: string;
    };
  };
  drops: Array<{
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
  }>;
  pricing: {
    base: number;
    distance: number;
    surge?: number;
    tax: number;
    total: number;
    currency: string;
    breakdown: {
      [key: string]: number;
    };
    discounts?: Array<{
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      amount: number;
    }>;
  };
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method?: 'cash' | 'online' | 'wallet';
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
  };
  tracking: {
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
        id: mongoose.Types.ObjectId;
      };
    }>;
  };
  ratings?: {
    user?: {
      rating: number;
      review?: string;
      timestamp: Date;
    };
    partner?: {
      rating: number;
      review?: string;
      timestamp: Date;
    };
  };
  issues?: Array<{
    type: string;
    description: string;
    status: 'open' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
  }>;
  maxDrops: number;
  routeOptimized: boolean;
  estimatedDuration: number;
  vehicleType: 'bike' | 'scooter' | 'car' | 'mini-truck' | 'large-truck';
}

const PickupDropOrderSchema = new Schema({
  type: {
    type: String,
    enum: ['pickup-drop'],
    default: 'pickup-drop',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'Partner'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  pickup: {
    address: {
      full: {
        type: String,
        required: true
      },
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      pincode: {
        type: String,
        required: true
      }
    },
    contact: {
      name: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      alternatePhone: String
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    actualTime: Date,
    package: {
      category: {
        type: String,
        enum: ['documents', 'electronics', 'clothing', 'food', 'medicine', 'other'],
        required: true
      },
      type: {
        type: String,
        required: true
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true
      },
      weight: {
        type: Number,
        required: true,
        min: 0,
        max: 20 // kg
      },
      dimensions: {
        length: {
          type: Number,
          required: true,
          min: 0
        },
        width: {
          type: Number,
          required: true,
          min: 0
        },
        height: {
          type: Number,
          required: true,
          min: 0
        }
      },
      value: {
        type: Number,
        required: true,
        min: 0
      },
      photos: {
        type: [String],
        required: true,
        validate: [(val: string[]) => val.length > 0, 'At least one photo is required']
      },
      specialInstructions: String,
      isFragile: {
        type: Boolean,
        default: false
      },
      requiresRefrigeration: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        required: true
      }
    }
  },
  drops: [{
    address: {
      full: {
        type: String,
        required: true
      },
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      pincode: {
        type: String,
        required: true
      }
    },
    contact: {
      name: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      alternatePhone: String
    },
    status: {
      type: String,
      default: 'pending'
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    actualTime: Date,
    sequence: {
      type: Number,
      required: true
    },
    proofOfDelivery: {
      photos: [String],
      signature: String,
      otp: String,
      receiverName: String,
      receiverRelation: String
    }
  }],
  pricing: {
    base: {
      type: Number,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    surge: Number,
    tax: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    breakdown: {
      type: Map,
      of: Number
    },
    discounts: [{
      code: String,
      type: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      value: Number,
      amount: Number
    }]
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'online', 'wallet']
    },
    transactionId: String,
    paidAmount: Number,
    refundAmount: Number,
    refundReason: String,
    attempts: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: String,
      method: String,
      error: String
    }]
  },
  tracking: {
    liveTracking: {
      isEnabled: {
        type: Boolean,
        default: true
      },
      currentLocation: {
        coordinates: {
          type: [Number],
          index: '2dsphere'
        },
        timestamp: Date,
        accuracy: Number,
        speed: Number,
        bearing: Number
      },
      route: {
        plannedPath: [[Number]],
        actualPath: [[Number]],
        eta: Date,
        distance: {
          planned: Number,
          actual: Number
        }
      }
    },
    history: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      location: String,
      note: String,
      updatedBy: {
        type: {
          type: String,
          enum: ['system', 'partner', 'admin'],
          required: true
        },
        id: {
          type: Schema.Types.ObjectId,
          required: true
        }
      }
    }]
  },
  ratings: {
    user: {
      rating: Number,
      review: String,
      timestamp: Date
    },
    partner: {
      rating: Number,
      review: String,
      timestamp: Date
    }
  },
  issues: [{
    type: String,
    description: String,
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolution: String
  }],
  maxDrops: {
    type: Number,
    default: 3,
    max: 3
  },
  routeOptimized: {
    type: Boolean,
    default: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'mini-truck', 'large-truck'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes
PickupDropOrderSchema.index({ userId: 1, status: 1 });
PickupDropOrderSchema.index({ partnerId: 1, status: 1 });
PickupDropOrderSchema.index({ 'pickup.scheduledTime': 1 });
PickupDropOrderSchema.index({ 'pickup.address.coordinates': '2dsphere' });
PickupDropOrderSchema.index({ 'drops.address.coordinates': '2dsphere' });
PickupDropOrderSchema.index({ 'payment.status': 1 });
PickupDropOrderSchema.index({ createdAt: 1 });

// Methods for price calculation
PickupDropOrderSchema.methods.calculateBasePrice = async function(): Promise<number> {
  // Implement base price calculation logic
  return 0;
};

PickupDropOrderSchema.methods.calculateTotalPrice = async function(): Promise<number> {
  // Implement total price calculation logic
  return 0;
};

// Validation methods
PickupDropOrderSchema.methods.validateDrops = function(): boolean {
  return this.drops.length <= this.maxDrops;
};

PickupDropOrderSchema.methods.validatePackageSize = function(): boolean {
  if (!this.pickup.package?.dimensions) return true;
  
  const { length, width, height } = this.pickup.package.dimensions;
  const volume = length * width * height;
  
  switch (this.pickup.package.size) {
    case 'small': return volume <= 27000; // 30x30x30 cm
    case 'medium': return volume <= 125000; // 50x50x50 cm
    case 'large': return volume <= 1000000; // 100x100x100 cm
    default: return false;
  }
};

export const PickupDropOrder = mongoose.model<IPickupDropOrder>('PickupDropOrder', PickupDropOrderSchema);
export default PickupDropOrder; 