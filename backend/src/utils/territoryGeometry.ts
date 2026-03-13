import { Territory } from '../types/territory';
import { ScanLocationInput } from '../types/scan';

const DEFAULT_CENTER = {
  latitude: -37.9107,
  longitude: 145.134,
};

const DEFAULT_SPREAD = {
  latitude: 0.0024,
  longitude: 0.0031,
};

const FILL_COLORS: Record<Territory['buildingType'], string> = {
  university: 'rgba(37, 99, 235, 0.34)',
  shopping: 'rgba(16, 185, 129, 0.34)',
  hospital: 'rgba(239, 68, 68, 0.32)',
  office: 'rgba(245, 158, 11, 0.34)',
  public: 'rgba(139, 92, 246, 0.34)',
  other: 'rgba(14, 165, 233, 0.34)',
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getFillColor(buildingType: Territory['buildingType']) {
  return FILL_COLORS[buildingType] ?? FILL_COLORS.other;
}

export function resolveScanCenter(location?: ScanLocationInput | null) {
  if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  const latitudeJitter = (Math.random() - 0.5) * DEFAULT_SPREAD.latitude;
  const longitudeJitter = (Math.random() - 0.5) * DEFAULT_SPREAD.longitude;
  return {
    latitude: DEFAULT_CENTER.latitude + latitudeJitter,
    longitude: DEFAULT_CENTER.longitude + longitudeJitter,
  };
}

function metersToLatitudeDelta(meters: number) {
  return meters / 111_132;
}

function metersToLongitudeDelta(meters: number, latitude: number) {
  const divisor = 111_320 * Math.cos((latitude * Math.PI) / 180);
  return meters / Math.max(Math.abs(divisor), 1);
}

export function buildRectanglePolygon(options: {
  center: { latitude: number; longitude: number };
  widthMeters: number;
  depthMeters: number;
  headingDegrees?: number | null;
}) {
  const { center } = options;
  const halfWidth = options.widthMeters / 2;
  const halfDepth = options.depthMeters / 2;
  const headingRadians = ((options.headingDegrees ?? 0) * Math.PI) / 180;
  const cos = Math.cos(headingRadians);
  const sin = Math.sin(headingRadians);

  const corners = [
    { east: -halfWidth, north: -halfDepth },
    { east: halfWidth, north: -halfDepth },
    { east: halfWidth, north: halfDepth },
    { east: -halfWidth, north: halfDepth },
  ];

  return {
    coordinates: corners.map((corner) => {
      const rotatedEast = corner.east * cos - corner.north * sin;
      const rotatedNorth = corner.east * sin + corner.north * cos;

      return {
        latitude: center.latitude + metersToLatitudeDelta(rotatedNorth),
        longitude: center.longitude + metersToLongitudeDelta(rotatedEast, center.latitude),
      };
    }),
  };
}
