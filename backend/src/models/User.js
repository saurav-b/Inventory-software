import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'staff'], index: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);

