import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { AccessibilityProfileId, Hazard } from '../types/hazard';

export const DEFAULT_SELECTED_PROFILES: AccessibilityProfileId[] = ['wheelchair'];

const PROFILE_IDS = new Set(
  ACCESSIBILITY_PROFILES.map((profile) => profile.id) as AccessibilityProfileId[]
);

function isAccessibilityProfileId(value: unknown): value is AccessibilityProfileId {
  return typeof value === 'string' && PROFILE_IDS.has(value as AccessibilityProfileId);
}

export function normalizeSelectedProfiles(
  profiles?: AccessibilityProfileId[] | null
): AccessibilityProfileId[] {
  const normalized = Array.from(new Set((profiles || []).filter(isAccessibilityProfileId)));
  return normalized.length > 0 ? normalized : DEFAULT_SELECTED_PROFILES;
}

export function getPrimaryProfile(profiles?: AccessibilityProfileId[] | null): AccessibilityProfileId {
  return normalizeSelectedProfiles(profiles)[0];
}

export function toggleSelectedProfile(
  profiles: AccessibilityProfileId[],
  profileId: AccessibilityProfileId
): AccessibilityProfileId[] {
  const normalized = normalizeSelectedProfiles(profiles);

  if (normalized.includes(profileId)) {
    return normalized.length === 1
      ? normalized
      : normalized.filter((profile) => profile !== profileId);
  }

  return [...normalized, profileId];
}

export function hazardMatchesSelectedProfiles(
  hazard: Pick<Hazard, 'affectsProfiles'>,
  profiles: AccessibilityProfileId[]
) {
  const normalized = normalizeSelectedProfiles(profiles);
  return normalized.some((profile) => hazard.affectsProfiles.includes(profile));
}

export function getSelectedProfileLabels(profiles?: AccessibilityProfileId[] | null): string[] {
  const normalized = normalizeSelectedProfiles(profiles);

  return normalized
    .map((profileId) => ACCESSIBILITY_PROFILES.find((profile) => profile.id === profileId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getSelectedProfilesSummary(profiles?: AccessibilityProfileId[] | null): string {
  const labels = getSelectedProfileLabels(profiles);

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} + ${labels[1]}`;
  }

  return `${labels.length} accessibility modes active`;
}
