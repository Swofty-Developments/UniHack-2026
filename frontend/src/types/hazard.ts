export type HazardType =
  | 'stairs'
  | 'narrow_doorway'
  | 'poor_lighting'
  | 'steep_gradient'
  | 'high_threshold'
  | 'no_ramp'
  | 'heavy_door'
  | 'no_elevator'
  | 'slippery_surface'
  | 'missing_handrail'
  | 'no_tactile'
  | 'audio_only_alert'
  | 'confusing_wayfinding'
  | 'trip_hazard'
  | 'no_seating'
  | 'unmarked_glass';

export type HazardSeverity = 'high' | 'medium' | 'low';

export type AccessibilityProfileId =
  | 'wheelchair'
  | 'low_vision'
  | 'limited_mobility'
  | 'hearing_impaired'
  | 'neurodivergent'
  | 'elderly'
  | 'parents_with_prams';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Hazard {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  description: string;
  affectsProfiles: AccessibilityProfileId[];
  position3D: Position3D;
  position2D: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  detectedBy: 'ai' | 'manual';
  imageEvidence?: string;
  createdAt: string;
}
