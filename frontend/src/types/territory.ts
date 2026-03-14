export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface TerritoryPolygon {
  coordinates: Coordinate[];
}

export interface ClaimedBy {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface HazardSummary {
  total: number;
  bySeverity?: {
    high: number;
    medium: number;
    low: number;
  } | null;
}

export interface Territory {
  id: string;
  name: string;
  description: string;
  buildingType: string;
  claimedBy?: ClaimedBy | null;
  scanDate: Date | string;
  areaSqMeters: number;
  polygon?: TerritoryPolygon | null;
  center?: Coordinate | null;
  modelUrl: string;
  thumbnailUrl: string;
  hazardSummary?: HazardSummary | null;
  fillColor: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
