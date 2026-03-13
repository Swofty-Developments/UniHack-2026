import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  displayName: string;
  avatarUrl?: string;
  totalAreaScanned: number;
  territoriesCount: number;
  selectedProfile: string;
  selectedProfiles: string[];
}

const UserSchema = new Schema(
  {
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    totalAreaScanned: { type: Number, default: 0 },
    territoriesCount: { type: Number, default: 0 },
    selectedProfile: { type: String, default: 'wheelchair' },
    selectedProfiles: { type: [String], default: ['wheelchair'] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
