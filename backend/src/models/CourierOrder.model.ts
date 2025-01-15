import mongoose, { Schema, Document } from 'mongoose';

export interface ICourierOrder extends Document {
  type: 'courier';
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
    items: Array<{
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  pricing: {
    base: number;
    distance: number;
    weight: number;
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
  insurance: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    validUntil: Date;
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
  vehicleType: 'bike' | 'scooter' | 'car' | 'mini-truck' | 'large-truck';
  estimatedDuration: number;
  handlingInstructions: string[];
  requiresSignature: boolean;
}

const CourierOrderSchema = new Schema({
  type: {
    type: String,
    enum: ['courier'],
    default: 'courier',
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
    actualTime: Date
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
  package: {
    category: {
      type: String,
      required: true,
      enum: ['documents', 'electronics', 'clothing', 'food', 'medicine', 'other']
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
    },
    items: [{
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      value: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  },
  pricing: {
    base: {
      type: Number,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    weight: {
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
  insurance: {
    provider: {
      type: String,
      required: true
    },
    policyNumber: {
      type: String,
      required: true
    },
    coverageAmount: {
      type: Number,
      required: true,
      min: 0
    },
    validUntil: {
      type: Date,
      required: true
    }
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
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'mini-truck', 'large-truck'],
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  handlingInstructions: [String],
  requiresSignature: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
CourierOrderSchema.index({ userId: 1, status: 1 });
CourierOrderSchema.index({ partnerId: 1, status: 1 });
CourierOrderSchema.index({ 'pickup.scheduledTime': 1 });
CourierOrderSchema.index({ 'pickup.address.coordinates': '2dsphere' });
CourierOrderSchema.index({ 'drops.address.coordinates': '2dsphere' });
CourierOrderSchema.index({ 'payment.status': 1 });
CourierOrderSchema.index({ createdAt: 1 });
CourierOrderSchema.index({ 'package.category': 1 });
CourierOrderSchema.index({ 'package.value': 1 });

// Methods for price calculation
CourierOrderSchema.methods.calculateBasePrice = async function(): Promise<number> {
  // Implement base price calculation logic
  return 0;
};

CourierOrderSchema.methods.calculateInsurancePremium = async function(): Promise<number> {
  // Implement insurance premium calculation logic
  return 0;
};

CourierOrderSchema.methods.calculateTotalPrice = async function(): Promise<number> {
  // Implement total price calculation logic
  return 0;
};

// Validation methods
CourierOrderSchema.methods.validatePackageSize = function(): boolean {
  const { length, width, height } = this.package.dimensions;
  const volume = length * width * height;
  
  switch (this.package.size) {
    case 'small': return volume <= 27000; // 30x30x30 cm
    case 'medium': return volume <= 125000; // 50x50x50 cm
    case 'large': return volume <= 1000000; // 100x100x100 cm
    default: return false;
  }
};

export const CourierOrder = mongoose.model<ICourierOrder>('CourierOrder', CourierOrderSchema);
export default CourierOrder; 