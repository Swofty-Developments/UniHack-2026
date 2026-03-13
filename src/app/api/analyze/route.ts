import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "~/server/db";
import { env } from "~/env";
import { readFile } from "fs/promises";
import path from "path";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const ANALYSIS_PROMPT = `You are an accessibility auditor analyzing a 3D scan of an indoor space. The image shows a 3D model captured by LiDAR.

Analyze this space for accessibility hazards across these profiles:
- wheelchair: stairs without ramps, narrow doorways (<80cm), steep gradients (>5%), high thresholds, inaccessible surfaces
- low-vision: poor lighting, low-contrast edges, unmarked glass, missing tactile indicators
- limited-mobility: long distances without rest points, no seating, heavy doors, missing elevators
- hearing-impaired: audio-only alerts, no visual signage, intercom-only entry
- neurodivergent: overwhelming environments, no quiet spaces, confusing wayfinding, flickering lights
- elderly: trip hazards, missing handrails, poor signage, slippery surfaces
- parents-prams: stairs, narrow passages, heavy doors (same physical barriers as wheelchair)

Return a JSON array of hazards. Each hazard must have:
{
  "type": "string (e.g. stairs, narrow_doorway, poor_lighting, trip_hazard)",
  "severity": "high" | "medium" | "low",
  "title": "Short title (e.g. 'Stairs without ramp')",
  "description": "Detailed description of the hazard and why it's problematic",
  "x": number (estimated X position in 3D space, range -5 to 5),
  "y": number (estimated Y position, range 0 to 3),
  "z": number (estimated Z position, range -5 to 5),
  "profiles": ["wheelchair", "elderly", ...] (which profiles this affects)
}

Be thorough but realistic. Only flag genuine hazards visible in the image. Estimate 3D positions based on where the hazard appears in the scene. Return ONLY the JSON array, no other text.`;

export async function POST(request: Request) {
  try {
    const { scanId } = (await request.json()) as { scanId: string };

    if (!scanId) {
      return NextResponse.json(
        { error: "scanId is required" },
        { status: 400 }
      );
    }

    const scan = await db.scan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Update status to analyzing
    await db.scan.update({
      where: { id: scanId },
      data: { status: "analyzing" },
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Read the 3D model file and send as binary
    const filePath = path.join(process.cwd(), "public", scan.fileUrl);
    const fileBuffer = await readFile(filePath);
    const base64Data = fileBuffer.toString("base64");

    // Determine MIME type
    const ext = path.extname(scan.filename).toLowerCase();
    const mimeType = ext === ".glb" ? "model/gltf-binary" : "model/gltf+json";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: ANALYSIS_PROMPT },
    ]);

    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1]!;
    }

    let hazardList: Array<{
      type: string;
      severity: "high" | "medium" | "low";
      title: string;
      description: string;
      x: number;
      y: number;
      z: number;
      profiles: string[];
    }>;

    try {
      hazardList = JSON.parse(jsonText.trim());
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      await db.scan.update({
        where: { id: scanId },
        data: { status: "error" },
      });
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Insert hazards and update scan status in a single transaction
    const [, insertedHazards] = await db.$transaction(async (tx) => {
      await tx.hazard.createMany({
        data: hazardList.map((hazard) => ({
          scanId,
          type: hazard.type,
          severity: hazard.severity,
          title: hazard.title,
          description: hazard.description,
          x: hazard.x,
          y: hazard.y,
          z: hazard.z,
          profiles: JSON.stringify(hazard.profiles),
        })),
      });

      await tx.scan.update({
        where: { id: scanId },
        data: { status: "complete" },
      });

      const hazards = await tx.hazard.findMany({
        where: { scanId },
      });

      return [null, hazards.map((h) => ({
        ...h,
        profiles: JSON.parse(h.profiles) as string[],
      }))];
    });

    return NextResponse.json({
      hazards: insertedHazards,
      count: insertedHazards.length,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze scan" },
      { status: 500 }
    );
  }
}
