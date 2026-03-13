import { AccessibilityProfileId, HazardType } from './hazard';

export interface AccessibilityProfile {
  id: AccessibilityProfileId;
  label: string;
  icon: string;
  description: string;
  flaggedHazards: HazardType[];
}
