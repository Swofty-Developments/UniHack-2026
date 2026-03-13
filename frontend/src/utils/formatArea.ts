export function formatArea(sqMeters: number): string {
  if (sqMeters >= 1000) {
    return `${(sqMeters / 1000).toFixed(1)}k sqm`;
  }

  return `${Math.round(sqMeters)} sqm`;
}
