import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { ScanCard } from "~/components/ui/ScanCard";
import { UploadSection } from "~/components/scan/UploadSection";
import { Loader2 } from "lucide-react";
import type { ScanData } from "~/lib/types";

export const metadata = {
  title: "Dashboard — AccessScan",
  description: "Upload and manage your LiDAR accessibility scans.",
};

async function ScanList() {
  const scans = await db.scan.findMany({
    orderBy: { createdAt: "desc" },
    include: { hazards: true },
  });

  if (scans.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-12 text-center">
        <p className="text-[#515c72]">No scans yet. Upload your first LiDAR scan above.</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-[#f0f2f5]">
        <span className="font-[family-name:var(--font-mono)] text-xs text-[#515c72]">02</span>
        Your Scans
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {scans.map((scan) => (
          <ScanCard key={scan.id} scan={scan as unknown as ScanData} />
        ))}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 topo-grid opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <span className="font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.2em] text-[#00ddb3]">
            Dashboard
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-[#f0f2f5]">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 text-[#8892a7]">
            Upload a LiDAR scan to analyze for accessibility hazards.
          </p>
        </div>

        {/* Upload section */}
        <section className="mb-16">
          <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-[#f0f2f5]">
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#515c72]">01</span>
            New Scan
          </h2>
          <UploadSection />
        </section>

        {/* Previous scans */}
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00ddb3]" />
            </div>
          }
        >
          <ScanList />
        </Suspense>
      </div>
    </div>
  );
}
