import mongoose, { Schema, Document } from 'mongoose';

const CoordinateSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { _id: false });

const HazardSchema = new Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
  description: { type: String, required: true },
  affectsProfiles: [{ type: String }],
  position3D: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  position2D: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
  },
  confidence: { type: Number, default: 0 },
  detectedBy: { type: String, enum: ['ai', 'manual'], default: 'ai' },
  imageEvidence: { type: String },
}, { timestamps: true });

export interface ITerritory extends Document {
  name: string;
  description: string;
  buildingType: string;
  claimedBy: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  };
  scanDate: Date;
  areaSqMeters: number;
  polygon: {
    coordinates: Array<{ latitude: number; longitude: number }>;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  modelUrl: string;
  thumbnailUrl: string;
  hazards: Array<any>;
  hazardSummary: {
    total: number;
    bySeverity: { high: number; medium: number; low: number };
  };
  fillColor: string;
  status: string;
}

const TerritorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  buildingType: { type: String, default: 'other' },
  claimedBy: {
    userId: { type: String, default: '' },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String },
  },
  scanDate: { type: Date, default: Date.now },
  areaSqMeters: { type: Number, default: 0 },
  polygon: {
    coordinates: [CoordinateSchema],
  },
  center: CoordinateSchema,
  modelUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  hazards: [HazardSchema],
  hazardSummary: {
    total: { type: Number, default: 0 },
    bySeverity: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
  },
  fillColor: { type: String, default: 'rgba(37, 99, 235, 0.3)' },
  status: { type: String, enum: ['processing', 'active', 'flagged'], default: 'active' },
}, { timestamps: true });

export const Territory = mongoose.model<ITerritory>('Territory', TerritorySchema);
