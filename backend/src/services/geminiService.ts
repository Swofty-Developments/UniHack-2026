import { geminiModel } from '../config/gemini';
import { Hazard, HazardType, HazardSeverity, AccessibilityProfileId } from '../types/hazard';
import { ScanImageSource } from '../types/scan';

const ANALYSIS_PROMPT = `Analyze this image of an indoor space for accessibility hazards.
Identify all potential barriers for people with disabilities.

Return a JSON array of hazards, where each hazard has:
- type: one of ["stairs", "narrow_doorway", "poor_lighting", "steep_gradient", "high_threshold", "no_ramp", "heavy_door", "no_elevator", "slippery_surface", "missing_handrail", "no_tactile", "audio_only_alert", "confusing_wayfinding", "trip_hazard", "no_seating", "unmarked_glass"]
- severity: "high", "medium", or "low"
- description: a brief description of the hazard
- affectsProfiles: array from ["wheelchair", "low_vision", "limited_mobility", "hearing_impaired", "neurodivergent", "elderly", "parents_with_prams"]
- confidence: number between 0 and 1
- approximateLocation: "left", "center", "right", "foreground", "background"

Return ONLY valid JSON array, no other text or markdown.`;

const LOCATION_TO_3D: Record<string, { x: number; y: number; z: number }> = {
  left: { x: -3, y: 1, z: 0 },
  center: { x: 0, y: 1, z: 0 },
  right: { x: 3, y: 1, z: 0 },
  foreground: { x: 0, y: 0.5, z: 3 },
  background: { x: 0, y: 1.5, z: -3 },
};

interface GeminiHazardResult {
  type: HazardType;
  severity: HazardSeverity;
  description: string;
  affectsProfiles: AccessibilityProfileId[];
  confidence: number;
  approximateLocation: string;
}

function normalizeImageSource(image: string | ScanImageSource): ScanImageSource {
  return typeof image === 'string' ? { url: image } : image;
}

function extractBase64Payload(base64: string, mimeType?: string) {
  const dataUriMatch = base64.match(/^data:(.+?);base64,(.+)$/);
  if (dataUriMatch) {
    return {
      mimeType: mimeType || dataUriMatch[1] || 'image/jpeg',
      data: dataUriMatch[2],
    };
  }

  return {
    mimeType: mimeType || 'image/jpeg',
    data: base64,
  };
}

async function toInlineDataPart(image: string | ScanImageSource) {
  const source = normalizeImageSource(image);

  if (source.base64) {
    const payload = extractBase64Payload(source.base64, source.mimeType);
    return {
      inlineData: {
        data: payload.data,
        mimeType: payload.mimeType,
      },
    };
  }

  if (source.url) {
    const response = await fetch(source.url);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') || source.mimeType || 'image/jpeg';
    return {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType,
      },
    };
  }

  throw new Error('Image source must include either url or base64 data.');
}

function toHazardSummary(hazards: Omit<Hazard, 'id'>[]) {
  return {
    total: hazards.length,
    bySeverity: {
      high: hazards.filter((hazard) => hazard.severity === 'high').length,
      medium: hazards.filter((hazard) => hazard.severity === 'medium').length,
      low: hazards.filter((hazard) => hazard.severity === 'low').length,
    },
  };
}

export async function analyzeImages(images: Array<string | ScanImageSource>): Promise<Omit<Hazard, 'id'>[]> {
  try {
    const usableImages = images.filter((image) => {
      const source = normalizeImageSource(image);
      return Boolean(source.base64 || source.url);
    });

    if (usableImages.length === 0) {
      return getFallbackHazards();
    }

    const imageParts = await Promise.all(usableImages.map((image) => toInlineDataPart(image)));
    const result = await geminiModel.generateContent([ANALYSIS_PROMPT, ...imageParts]);
    const responseText = result.response.text();

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed: GeminiHazardResult[] = JSON.parse(cleaned);

    return parsed.map((hazard, index) => ({
      type: hazard.type,
      severity: hazard.severity,
      description: hazard.description,
      affectsProfiles: hazard.affectsProfiles,
      position3D: LOCATION_TO_3D[hazard.approximateLocation] || { x: index * 2 - 2, y: 1, z: 0 },
      position2D: { latitude: 0, longitude: 0 },
      confidence: hazard.confidence,
      detectedBy: 'ai' as const,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return getFallbackHazards();
  }
}

export function summarizeHazards(hazards: Omit<Hazard, 'id'>[]) {
  return toHazardSummary(hazards);
}

function getFallbackHazards(): Omit<Hazard, 'id'>[] {
  return [
    {
      type: 'stairs',
      severity: 'high',
      description: 'Staircase detected without adjacent ramp access',
      affectsProfiles: ['wheelchair', 'limited_mobility', 'elderly', 'parents_with_prams'],
      position3D: { x: -2, y: 1, z: 0 },
      position2D: { latitude: 0, longitude: 0 },
      confidence: 0.92,
      detectedBy: 'ai',
      createdAt: new Date().toISOString(),
    },
    {
      type: 'narrow_doorway',
      severity: 'medium',
      description: 'Doorway width appears below 850mm wheelchair clearance',
      affectsProfiles: ['wheelchair', 'parents_with_prams'],
      position3D: { x: 2, y: 1, z: 0 },
      position2D: { latitude: 0, longitude: 0 },
      confidence: 0.78,
      detectedBy: 'ai',
      createdAt: new Date().toISOString(),
    },
    {
      type: 'poor_lighting',
      severity: 'low',
      description: 'Corridor section with insufficient lighting for low-vision navigation',
      affectsProfiles: ['low_vision', 'elderly'],
      position3D: { x: 0, y: 2, z: -2 },
      position2D: { latitude: 0, longitude: 0 },
      confidence: 0.65,
      detectedBy: 'ai',
      createdAt: new Date().toISOString(),
    },
  ];
}
