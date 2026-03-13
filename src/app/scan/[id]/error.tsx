"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ScanDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-[#060b18] pt-16 text-center">
      <AlertTriangle className="h-12 w-12 text-[#ff6b6b]" />
      <h2 className="mt-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-[#f0f2f5]">
        Failed to load scan
      </h2>
      <p className="mt-2 text-[#8892a7]">
        {error.message || "This scan could not be found or loaded."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-[#00ddb3] px-6 py-2.5 font-[family-name:var(--font-heading)] text-sm font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2]"
        >
          Try Again
        </button>
        <Link
          href="/scan"
          className="rounded-xl border border-[rgba(255,255,255,0.1)] px-6 py-2.5 font-[family-name:var(--font-heading)] text-sm font-semibold text-[#f0f2f5] transition-all hover:border-[rgba(255,255,255,0.2)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
