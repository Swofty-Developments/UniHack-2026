import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const allScans = await db.scan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ scans: allScans });
  } catch (error) {
    console.error("Scans list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scans" },
      { status: 500 }
    );
  }
}
