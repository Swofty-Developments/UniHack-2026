import { Territory } from '../types/territory';

function closeRing(coords: [number, number][]) {
  if (coords.length < 2) return coords;
  const [firstLng, firstLat] = coords[0];
  const [lastLng, lastLat] = coords[coords.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    coords.push([firstLng, firstLat]);
  }
  return coords;
}

function extrusionHeight(t: Territory) {
  return 12 + Math.min((t.hazardSummary?.total ?? 0) * 4, 40) + Math.min(t.areaSqMeters / 50, 20);
}

export function buildTerritoriesGeoJSON(territories: Territory[]) {
  return {
    type: 'FeatureCollection' as const,
    features: territories
      .filter((t) => t.polygon?.coordinates?.length)
      .map((t) => {
        const coords = closeRing(
          (t.polygon!.coordinates).map((c) => [c.longitude, c.latitude] as [number, number])
        );
        return {
          type: 'Feature' as const,
          id: t.id,
          properties: {
            id: t.id,
            fillColor: t.fillColor,
            height: extrusionHeight(t),
          },
          geometry: { type: 'Polygon' as const, coordinates: [coords] },
        };
      }),
  };
}

export function buildCentersGeoJSON(territories: Territory[]) {
  return {
    type: 'FeatureCollection' as const,
    features: territories
      .filter((t) => t.center)
      .map((t) => ({
        type: 'Feature' as const,
        id: t.id,
        properties: { id: t.id, fillColor: t.fillColor },
        geometry: {
          type: 'Point' as const,
          coordinates: [t.center!.longitude, t.center!.latitude],
        },
      })),
  };
}
