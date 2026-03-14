import { AccessibilityProfileId, Hazard } from '../types/hazard';
import {
  getPrimaryProfile,
  hazardMatchesSelectedProfiles,
  normalizeSelectedProfiles,
} from './profileSelection';

export interface RoutePoint {
  x: number;
  y: number;
  z: number;
}

export interface AccessibleRoute {
  points: RoutePoint[];
  color: number;
  riskCount: number;
}

const PROFILE_COLORS: Record<AccessibilityProfileId, number> = {
  wheelchair: 0x3b82f6,
  low_vision: 0xf59e0b,
  limited_mobility: 0x10b981,
  hearing_impaired: 0xec4899,
  neurodivergent: 0x06b6d4,
  elderly: 0xf97316,
  parents_with_prams: 0x2563eb,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sortHazardsForRoute(hazards: Hazard[]) {
  return hazards
    .slice()
    .sort((left, right) => (right.position3D?.z ?? 0) - (left.position3D?.z ?? 0) || (left.position3D?.x ?? 0) - (right.position3D?.x ?? 0));
}

function detourOffset(hazard: Hazard) {
  switch (hazard.severity) {
    case 'high':
      return 2.4;
    case 'medium':
      return 1.8;
    default:
      return 1.2;
  }
}

function resolveRouteColor(profiles: AccessibilityProfileId[]) {
  return profiles.length === 1 ? PROFILE_COLORS[profiles[0]] : 0x22d3ee;
}

export function buildAccessibleRoute(
  hazards: Hazard[],
  profiles: AccessibilityProfileId[]
): AccessibleRoute {
  const normalizedProfiles = normalizeSelectedProfiles(profiles);
  const relevantHazards = sortHazardsForRoute(
    hazards.filter((hazard) => hazardMatchesSelectedProfiles(hazard, normalizedProfiles))
  );

  const points: RoutePoint[] = [{ x: 0, y: 0.1, z: 4.5 }];
  const primaryProfile = getPrimaryProfile(normalizedProfiles);

  relevantHazards.slice(0, 5).forEach((hazard, index) => {
    const px = hazard.position3D?.x ?? 0;
    const pz = hazard.position3D?.z ?? 0;
    const direction = px >= 0 ? -1 : 1;
    const offset = detourOffset(hazard) + normalizedProfiles.length * 0.15;
    const laneX = clamp(px + direction * offset, -4.2, 4.2);
    const entryZ = pz + 1.15 + index * 0.18;
    const exitZ = pz - 1.1 - index * 0.12;

    points.push({ x: laneX, y: 0.1, z: entryZ });
    points.push({ x: laneX, y: 0.1, z: exitZ });
  });

  points.push({ x: 0, y: 0.1, z: -4.5 - normalizedProfiles.length * 0.18 });

  return {
    points,
    color: resolveRouteColor(normalizedProfiles),
    riskCount: relevantHazards.filter((hazard) => hazard.affectsProfiles.includes(primaryProfile)).length,
  };
}
