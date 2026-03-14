export const Colors = {
  primary: '#00D4AA',
  primaryDark: '#00B894',
  primaryLight: '#33DDBB',
  accent: '#FFB547',
  accentDark: '#E5A03E',

  hazardHigh: '#FF4757',
  hazardMedium: '#FFA502',
  hazardLow: '#2ED573',

  info: '#3B82F6',

  background: '#0B0B14',
  surface: '#161625',
  surfaceLight: '#222238',
  card: '#161625',

  text: '#EEEDF5',
  textSecondary: '#8B8BA7',
  textMuted: '#7A7A96',

  border: '#2A2A42',
  white: '#FFFFFF',
  black: '#000000',

  // Glow/glass effects
  glowPrimary: 'rgba(0, 212, 170, 0.15)',
  glowAccent: 'rgba(255, 181, 71, 0.12)',
  glowHazardHigh: 'rgba(255, 71, 87, 0.12)',
  glowInfo: 'rgba(59, 130, 246, 0.12)',
  glassSurface: 'rgba(22, 22, 37, 0.88)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',

  // Overlays (consolidate hardcoded rgba)
  overlayHeavy: 'rgba(11, 11, 20, 0.95)',
  overlay: 'rgba(11, 11, 20, 0.88)',
  overlayMedium: 'rgba(22, 22, 37, 0.9)',
  overlayLight: 'rgba(11, 11, 20, 0.6)',
  overlaySubtle: 'rgba(11, 11, 20, 0.5)',

  // Medal / rank
  medalGold: '#FFD166',
  medalSilver: '#C0C7D8',
  medalBronze: '#CD7F32',
  medalGoldGlow: 'rgba(255, 209, 102, 0.18)',
  medalSilverGlow: 'rgba(192, 199, 216, 0.14)',
  medalBronzeGlow: 'rgba(205, 127, 50, 0.14)',

  profileColors: {
    wheelchair: '#3B82F6',
    low_vision: '#A78BFA',
    limited_mobility: '#FFA502',
    hearing_impaired: '#FF6B81',
    neurodivergent: '#00D4AA',
    elderly: '#FF9F43',
    parents_with_prams: '#2ED573',
  } as Record<string, string>,

  territoryFills: [
    'rgba(0, 212, 170, 0.35)',
    'rgba(46, 213, 115, 0.35)',
    'rgba(167, 139, 250, 0.35)',
    'rgba(255, 165, 2, 0.35)',
    'rgba(255, 107, 129, 0.35)',
  ],
};
