import { AccessibilityProfileId } from '../types/hazard';

export const DEFAULT_SELECTED_PROFILES: AccessibilityProfileId[] = ['wheelchair'];

const ALL_PROFILE_IDS: AccessibilityProfileId[] = [
  'wheelchair',
  'low_vision',
  'limited_mobility',
  'hearing_impaired',
  'neurodivergent',
  'elderly',
  'parents_with_prams',
];

function isAccessibilityProfileId(value: unknown): value is AccessibilityProfileId {
  return typeof value === 'string' && ALL_PROFILE_IDS.includes(value as AccessibilityProfileId);
}

export function normalizeSelectedProfiles(
  selectedProfiles?: unknown,
  selectedProfile?: unknown
): AccessibilityProfileId[] {
  const candidates = [
    ...(Array.isArray(selectedProfiles) ? selectedProfiles : []),
    ...(selectedProfile ? [selectedProfile] : []),
  ];

  const normalized = Array.from(new Set(candidates.filter(isAccessibilityProfileId)));
  return normalized.length > 0 ? normalized : DEFAULT_SELECTED_PROFILES;
}

export function getPrimaryProfile(profiles?: AccessibilityProfileId[] | null): AccessibilityProfileId {
  return profiles && profiles.length > 0 ? profiles[0] : DEFAULT_SELECTED_PROFILES[0];
}
