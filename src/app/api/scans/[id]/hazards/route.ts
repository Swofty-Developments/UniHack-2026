import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const profile = url.searchParams.get("profile");

    const scanHazards = await db.hazard.findMany({
      where: { scanId: id },
    });

    let parsed = scanHazards.map((h) => ({
      ...h,
      profiles: JSON.parse(h.profiles) as string[],
    }));

    if (profile) {
      parsed = parsed.filter((h) => h.profiles.includes(profile));
    }

    return NextResponse.json({ hazards: parsed });
  } catch (error) {
    console.error("Hazards fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hazards" },
      { status: 500 }
    );
  }
}
