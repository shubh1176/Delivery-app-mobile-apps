import mongoose, { Schema, Document } from 'mongoose';
import { UserDevice } from '../types/auth.types';

export interface IUserDevice extends Omit<UserDevice, '_id'>, Document {}

const UserDeviceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    platform: String,
    appVersion: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
UserDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserDeviceSchema.index({ lastActive: 1 });

// Ensure max devices per user
UserDeviceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.model('UserDevice').countDocuments({
      userId: this.userId,
      isActive: true
    });
    
    if (count >= 3) { // Max devices as per AUTH_STRATEGY.md
      // Deactivate oldest device
      await this.model('UserDevice').findOneAndUpdate(
        { userId: this.userId, isActive: true },
        { isActive: false },
        { sort: { lastActive: 1 } }
      );
    }
  }
  next();
});

export default mongoose.model<IUserDevice>('UserDevice', UserDeviceSchema); 