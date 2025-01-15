import mongoose, { Schema, Document } from 'mongoose';
import { IOTPRequest } from '../types/auth.types';

const OTPRequestSchema: Schema = new Schema({
  phone: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  cooldownUntil: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
OTPRequestSchema.index({ phone: 1, createdAt: 1 });
OTPRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<IOTPRequest & Document>('OTPRequest', OTPRequestSchema); 