export type AccessibilityProfile =
  | "wheelchair"
  | "low-vision"
  | "limited-mobility"
  | "hearing-impaired"
  | "neurodivergent"
  | "elderly"
  | "parents-prams";

export interface ProfileInfo {
  id: AccessibilityProfile;
  label: string;
  icon: string;
  description: string;
  hazardTypes: string[];
}

export const PROFILES: ProfileInfo[] = [
  {
    id: "wheelchair",
    label: "Wheelchair Users",
    icon: "wheelchair",
    description: "Stairs without ramps, narrow doorways, steep gradients, high thresholds, inaccessible surfaces",
    hazardTypes: ["stairs", "narrow_doorway", "steep_gradient", "high_threshold", "inaccessible_surface", "no_ramp", "heavy_door"],
  },
  {
    id: "low-vision",
    label: "Low Vision",
    icon: "eye-off",
    description: "Poor lighting, low-contrast edges, unmarked glass, missing tactile indicators",
    hazardTypes: ["poor_lighting", "low_contrast", "unmarked_glass", "missing_tactile", "glare"],
  },
  {
    id: "limited-mobility",
    label: "Limited Mobility",
    icon: "activity",
    description: "Long distances without rest points, no seating, heavy doors, missing elevators",
    hazardTypes: ["long_distance", "no_seating", "heavy_door", "missing_elevator", "no_rest_point"],
  },
  {
    id: "hearing-impaired",
    label: "Hearing Impaired",
    icon: "ear-off",
    description: "Audio-only alerts, no visual signage, intercom-only entry",
    hazardTypes: ["audio_only_alert", "no_visual_signage", "intercom_only"],
  },
  {
    id: "neurodivergent",
    label: "Neurodivergent",
    icon: "brain",
    description: "Overwhelming environments, no quiet spaces, confusing wayfinding, flickering lights",
    hazardTypes: ["overwhelming_environment", "no_quiet_space", "confusing_wayfinding", "flickering_lights"],
  },
  {
    id: "elderly",
    label: "Elderly / Aging",
    icon: "heart-handshake",
    description: "Trip hazards, missing handrails, poor signage, slippery surfaces",
    hazardTypes: ["trip_hazard", "missing_handrail", "poor_signage", "slippery_surface"],
  },
  {
    id: "parents-prams",
    label: "Parents with Prams",
    icon: "baby",
    description: "Same physical barriers as wheelchair: stairs, narrow passages, heavy doors",
    hazardTypes: ["stairs", "narrow_doorway", "steep_gradient", "heavy_door", "no_ramp"],
  },
];

export interface HazardData {
  id: string;
  scanId: string;
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  x: number;
  y: number;
  z: number;
  profiles: AccessibilityProfile[];
}

export interface ScanData {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  status: "uploading" | "uploaded" | "analyzing" | "complete" | "error";
  fileUrl: string;
  createdAt: Date;
  hazards?: HazardData[];
}

export interface RouteWaypoint {
  x: number;
  y: number;
  z: number;
}

export interface RouteData {
  profile: AccessibilityProfile;
  waypoints: RouteWaypoint[];
  avoidedHazards: string[];
}
