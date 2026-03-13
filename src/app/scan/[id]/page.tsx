import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { ScanViewerPage } from "~/components/scan/ScanViewerPage";
import type { Metadata } from "next";
import type { HazardData, ScanData } from "~/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const scan = await db.scan.findUnique({ where: { id }, select: { originalName: true } });

  if (!scan) return { title: "Scan Not Found — AccessScan" };

  return {
    title: `${scan.originalName} — AccessScan`,
    description: `Accessibility analysis for ${scan.originalName}`,
  };
}

export default async function ScanDetailPage({ params }: PageProps) {
  const { id } = await params;

  const scan = await db.scan.findUnique({
    where: { id },
    include: { hazards: true },
  });

  if (!scan) notFound();

  const hazards = scan.hazards.map((h) => ({
    ...h,
    severity: h.severity as HazardData["severity"],
    profiles: JSON.parse(h.profiles) as HazardData["profiles"],
  })) satisfies HazardData[];

  return (
    <ScanViewerPage
      scanId={id}
      initialScan={scan as unknown as ScanData}
      initialHazards={hazards}
    />
  );
}
