import { AccessibilityProfileId, Hazard } from './hazard';
import { Territory } from './territory';

export interface ScanCaptureDraft {
  base64: string;
  mimeType: string;
  width?: number;
  height?: number;
  capturedAt: string;
  orientation?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

export interface ScanMeasurement {
  widthMeters: number;
  depthMeters: number;
  estimatedAreaSqMeters: number;
  depthConfidence: number;
  captureCount: number;
  sweepDegrees?: number;
}

export interface ScanLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
}

export interface CompleteScanRequest {
  userId?: string | null;
  displayName?: string | null;
  selectedProfile?: AccessibilityProfileId;
  selectedProfiles?: AccessibilityProfileId[];
  name: string;
  description?: string;
  buildingType: Territory['buildingType'];
  captures: ScanCaptureDraft[];
  measurement: ScanMeasurement;
  location?: ScanLocationPayload | null;
}

export interface CompleteScanResponse {
  status: 'complete';
  territory: Territory & { hazards: Hazard[] };
  hazards: Hazard[];
  summary: {
    total: number;
    bySeverity: {
      high: number;
      medium: number;
      low: number;
    };
  };
  scanner: {
    id: string;
    displayName: string;
    selectedProfile: AccessibilityProfileId;
    selectedProfiles: AccessibilityProfileId[];
  };
  measurement: ScanMeasurement;
}
