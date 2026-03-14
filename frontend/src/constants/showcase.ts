import { Territory } from '../types/territory';

export const MONASH_CLAYTON_CENTER = {
  latitude: -37.9107,
  longitude: 145.134,
};

export const MONASH_CLAYTON_BOUNDS = {
  south: -37.9188,
  west: 145.1255,
  north: -37.9034,
  east: 145.1498,
};

export function isWithinMonashShowcaseBounds(
  coordinate?: { latitude: number; longitude: number } | null
) {
  if (!coordinate) {
    return false;
  }

  return (
    coordinate.latitude >= MONASH_CLAYTON_BOUNDS.south &&
    coordinate.latitude <= MONASH_CLAYTON_BOUNDS.north &&
    coordinate.longitude >= MONASH_CLAYTON_BOUNDS.west &&
    coordinate.longitude <= MONASH_CLAYTON_BOUNDS.east
  );
}

export function territoryIsInMonashShowcase(territory: Territory) {
  return (
    isWithinMonashShowcaseBounds(territory.center) ||
    (territory.polygon?.coordinates ?? []).some((coordinate) => isWithinMonashShowcaseBounds(coordinate))
  );
}

export function coerceToMonashShowcaseLocation(
  coordinate?: { latitude: number; longitude: number; accuracy?: number | null; heading?: number | null } | null
) {
  if (isWithinMonashShowcaseBounds(coordinate)) {
    return coordinate;
  }

  return {
    ...MONASH_CLAYTON_CENTER,
    accuracy: coordinate?.accuracy ?? null,
    heading: coordinate?.heading ?? null,
  };
}
