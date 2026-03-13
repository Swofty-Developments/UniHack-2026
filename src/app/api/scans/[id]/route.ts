import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scan = await db.scan.findUnique({
      where: { id },
      include: { hazards: true },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const hazardsWithParsedProfiles = scan.hazards.map((h) => ({
      ...h,
      profiles: JSON.parse(h.profiles) as string[],
    }));

    return NextResponse.json({
      scan,
      hazards: hazardsWithParsedProfiles,
    });
  } catch (error) {
    console.error("Scan fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan" },
      { status: 500 }
    );
  }
}
