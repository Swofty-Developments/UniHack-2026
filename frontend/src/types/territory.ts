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
  avatarUrl?: string;
}

export interface HazardSummary {
  total: number;
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface Territory {
  id: string;
  name: string;
  description: string;
  buildingType: 'university' | 'shopping' | 'hospital' | 'office' | 'public' | 'other';
  claimedBy: ClaimedBy;
  scanDate: string;
  areaSqMeters: number;
  polygon: TerritoryPolygon;
  center: Coordinate;
  modelUrl: string;
  thumbnailUrl: string;
  hazardSummary: HazardSummary;
  fillColor: string;
  status: 'processing' | 'active' | 'flagged';
  createdAt: string;
  updatedAt: string;
}
