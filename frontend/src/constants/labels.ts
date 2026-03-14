export const BUILDING_TYPE_LABELS: Record<string, string> = {
  university: 'University',
  shopping: 'Shopping',
  hospital: 'Hospital',
  office: 'Office',
  public: 'Public',
  other: 'Other',
};

export const TERRITORY_STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  active: 'Active',
  flagged: 'Flagged',
};

export const HAZARD_TYPE_LABELS: Record<string, string> = {
  stairs: 'Stairs',
  narrow_doorway: 'Narrow Doorway',
  poor_lighting: 'Poor Lighting',
  steep_gradient: 'Steep Gradient',
  high_threshold: 'High Threshold',
  no_ramp: 'No Ramp',
  heavy_door: 'Heavy Door',
  no_elevator: 'No Elevator',
  slippery_surface: 'Slippery Surface',
  missing_handrail: 'Missing Handrail',
  no_tactile: 'No Tactile',
  audio_only_alert: 'Audio Only Alert',
  confusing_wayfinding: 'Confusing Wayfinding',
  trip_hazard: 'Trip Hazard',
  no_seating: 'No Seating',
  unmarked_glass: 'Unmarked Glass',
};

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
