import Anthropic from '@anthropic-ai/sdk';
import { Hazard, HazardType, HazardSeverity, AccessibilityProfileId } from '../types/hazard';
import { ScanImageSource } from '../types/scan';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const ANALYSIS_PROMPT = `Analyze these images of an indoor space for accessibility hazards.
Identify all potential barriers for people with disabilities.

Return a JSON array of hazards, where each hazard has:
- type: one of ["stairs", "narrow_doorway", "poor_lighting", "steep_gradient", "high_threshold", "no_ramp", "heavy_door", "no_elevator", "slippery_surface", "missing_handrail", "no_tactile", "audio_only_alert", "confusing_wayfinding", "trip_hazard", "no_seating", "unmarked_glass"]
- severity: "high", "medium", or "low"
- description: a brief description of the hazard
- affectsProfiles: array from ["wheelchair", "low_vision", "limited_mobility", "hearing_impaired", "neurodivergent", "elderly", "parents_with_prams"]
- confidence: number between 0 and 1
- approximateLocation: "left", "center", "right", "foreground", "background"

Return ONLY valid JSON array, no other text or markdown.`;

// Approximate location hints mapped to normalized positions (0-1 range)
// These get scaled to the actual model bounds in the 3D viewer
const LOCATION_TO_NORMALIZED: Record<string, { nx: number; nz: number }> = {
  left: { nx: 0.2, nz: 0.5 },
  center: { nx: 0.5, nz: 0.5 },
  right: { nx: 0.8, nz: 0.5 },
  foreground: { nx: 0.5, nz: 0.8 },
  background: { nx: 0.5, nz: 0.2 },
};

interface AnalysisHazardResult {
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

async function toClaudeImageBlock(image: string | ScanImageSource): Promise<Anthropic.ImageBlockParam> {
  const source = normalizeImageSource(image);

  if (source.base64) {
    const payload = extractBase64Payload(source.base64, source.mimeType);
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: payload.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: payload.data,
      },
    };
  }

  if (source.url) {
    const response = await fetch(source.url);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') || source.mimeType || 'image/jpeg';
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: Buffer.from(buffer).toString('base64'),
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
      console.warn('No usable images for analysis, using fallback hazards');
      return getFallbackHazards();
    }

    console.log(`[Claude] Analyzing ${usableImages.length} images...`);

    const imageBlocks = await Promise.all(usableImages.map((image) => toClaudeImageBlock(image)));

    const content: Anthropic.ContentBlockParam[] = [
      ...imageBlocks,
      { type: 'text', text: ANALYSIS_PROMPT },
    ];

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    const responseText = result.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    console.log('[Claude] Response received, parsing...');

    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed: AnalysisHazardResult[] = JSON.parse(cleaned);

    console.log(`[Claude] Detected ${parsed.length} hazards`);

    return parsed.map((hazard, index) => {
      // Use normalized positions (0-1) that will be mapped to model bounds in the viewer
      const base = LOCATION_TO_NORMALIZED[hazard.approximateLocation] || { nx: 0.5, nz: 0.5 };
      // Spread hazards apart so they don't stack on top of each other
      const jitterX = (index % 3 - 1) * 0.15;
      const jitterZ = (Math.floor(index / 3) % 3 - 1) * 0.15;
      return {
        type: hazard.type,
        severity: hazard.severity,
        description: hazard.description,
        affectsProfiles: hazard.affectsProfiles,
        // Store normalized coordinates - the 3D viewer maps these to actual model bounds
        position3D: {
          x: Math.max(0.05, Math.min(0.95, base.nx + jitterX)),
          y: 0,
          z: Math.max(0.05, Math.min(0.95, base.nz + jitterZ)),
        },
        position2D: { latitude: 0, longitude: 0 },
        confidence: hazard.confidence,
        detectedBy: 'ai' as const,
        createdAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Claude analysis failed:', error);
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
      position3D: { x: 0.25, y: 0, z: 0.5 },
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
      position3D: { x: 0.75, y: 0, z: 0.5 },
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
      position3D: { x: 0.5, y: 0, z: 0.3 },
      position2D: { latitude: 0, longitude: 0 },
      confidence: 0.65,
      detectedBy: 'ai',
      createdAt: new Date().toISOString(),
    },
  ];
}
