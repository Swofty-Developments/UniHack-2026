import Link from "next/link";
import { Box, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { ScanData } from "~/lib/types";

interface ScanCardProps {
  scan: ScanData;
}

const statusConfig = {
  uploading: { icon: Loader2, label: "Uploading", color: "text-[#ffa94d]", spin: true },
  uploaded: { icon: Box, label: "Ready", color: "text-[#00ddb3]", spin: false },
  analyzing: { icon: Loader2, label: "Analyzing", color: "text-[#ffa94d]", spin: true },
  complete: { icon: CheckCircle2, label: "Complete", color: "text-[#51cf66]", spin: false },
  error: { icon: AlertTriangle, label: "Error", color: "text-[#ff6b6b]", spin: false },
};

export function ScanCard({ scan }: ScanCardProps) {
  const status = statusConfig[scan.status];
  const StatusIcon = status.icon;
  const hazardCount = scan.hazards?.length ?? 0;

  return (
    <Link
      href={`/scan/${scan.id}`}
      className="card-interactive group block w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5 text-left transition-all hover:border-[rgba(255,255,255,0.12)]"
      prefetch={true}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#f0f2f5] transition-colors group-hover:text-[#00ddb3]">
            {scan.originalName}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#515c72]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(scan.createdAt).toLocaleDateString()}
            </span>
            <span>{(scan.fileSize / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${status.spin ? "animate-spin" : ""}`} />
          {status.label}
        </div>
      </div>

      {scan.status === "complete" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8892a7]">
          <AlertTriangle className="h-3 w-3" />
          {hazardCount} hazard{hazardCount !== 1 ? "s" : ""} detected
        </div>
      )}
    </Link>
  );
}
