import { AccessibilityProfile } from '../types/profile';

export const ACCESSIBILITY_PROFILES: AccessibilityProfile[] = [
  {
    id: 'wheelchair',
    label: 'Wheelchair User',
    icon: 'wheelchair',
    description: 'Flags stairs without ramps, narrow doorways, steep gradients, and high thresholds',
    flaggedHazards: ['stairs', 'narrow_doorway', 'steep_gradient', 'high_threshold', 'no_ramp'],
  },
  {
    id: 'low_vision',
    label: 'Low Vision',
    icon: 'eye-off',
    description: 'Flags poor lighting, low-contrast edges, unmarked glass, and missing tactile indicators',
    flaggedHazards: ['poor_lighting', 'unmarked_glass', 'no_tactile'],
  },
  {
    id: 'limited_mobility',
    label: 'Limited Mobility',
    icon: 'walk',
    description: 'Flags long distances without rest points, no seating, heavy doors, and missing elevators',
    flaggedHazards: ['no_seating', 'heavy_door', 'no_elevator', 'stairs'],
  },
  {
    id: 'hearing_impaired',
    label: 'Hearing Impaired',
    icon: 'ear',
    description: 'Flags audio-only alerts, missing visual signage, and intercom-only entry systems',
    flaggedHazards: ['audio_only_alert'],
  },
  {
    id: 'neurodivergent',
    label: 'Neurodivergent',
    icon: 'brain',
    description: 'Flags overwhelming environments, missing quiet spaces, and confusing wayfinding',
    flaggedHazards: ['confusing_wayfinding'],
  },
  {
    id: 'elderly',
    label: 'Elderly / Aging',
    icon: 'heart',
    description: 'Flags trip hazards, missing handrails, poor signage, and slippery surfaces',
    flaggedHazards: ['trip_hazard', 'missing_handrail', 'slippery_surface', 'poor_lighting'],
  },
  {
    id: 'parents_with_prams',
    label: 'Parents with Prams',
    icon: 'baby-carriage',
    description: 'Flags the same physical barriers as wheelchair users: stairs, narrow doors, and missing ramps',
    flaggedHazards: ['stairs', 'narrow_doorway', 'steep_gradient', 'high_threshold', 'no_ramp'],
  },
];
