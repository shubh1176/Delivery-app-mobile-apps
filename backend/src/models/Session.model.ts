import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceInfo: {
    type: string;
    platform: string;
    appVersion: string;
    deviceModel: string;
    osVersion: string;
  };
  refreshToken: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['mobile', 'web'],
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    appVersion: String,
    deviceModel: String,
    osVersion: String
  },
  refreshToken: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
SessionSchema.index({ userId: 1, 'deviceInfo.type': 1 });
SessionSchema.index({ refreshToken: 1 });

// Method to validate session count
SessionSchema.statics.validateSessionCount = async function(userId: string, deviceType: string): Promise<boolean> {
  const activeSessions = await this.countDocuments({
    userId,
    'deviceInfo.type': deviceType,
    isActive: true
  });
  
  return activeSessions < (deviceType === 'mobile' ? 1 : 1); // 1 mobile, 1 web session
};

export const Session = mongoose.model<ISession>('Session', SessionSchema); 