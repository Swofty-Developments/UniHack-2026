import { AccessibilityProfileId } from './hazard';
import { Territory } from './territory';

export interface ScanUploadResponse {
  jobId: string;
  status: 'processing' | 'complete' | 'failed';
  imageUrls: string[];
}

export interface ScanImageSource {
  url?: string;
  base64?: string;
  mimeType?: string;
}

export interface ScanCaptureInput {
  base64: string;
  mimeType?: string;
  width?: number;
  height?: number;
  capturedAt: string;
  orientation?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

export interface ScanMeasurementInput {
  widthMeters: number;
  depthMeters: number;
  estimatedAreaSqMeters: number;
  depthConfidence: number;
  captureCount: number;
  sweepDegrees?: number;
}

export interface ScanLocationInput {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
}

export interface ScanAnalyzeRequest {
  territoryId: string;
  imageUrls: string[];
}

export interface CompleteScanRequest {
  userId?: string;
  displayName?: string;
  selectedProfile?: AccessibilityProfileId;
  selectedProfiles?: AccessibilityProfileId[];
  name: string;
  description?: string;
  buildingType: Territory['buildingType'];
  captures: ScanCaptureInput[];
  measurement: ScanMeasurementInput;
  location?: ScanLocationInput | null;
}

export interface ScanStatusResponse {
  jobId: string;
  status: 'processing' | 'complete' | 'failed';
  progress: number;
  hazards?: import('./hazard').Hazard[];
}
