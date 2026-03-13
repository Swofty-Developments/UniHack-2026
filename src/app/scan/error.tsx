"use client";

import { AlertTriangle } from "lucide-react";

export default function ScanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 topo-grid opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-[#ff6b6b]" />
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-xl font-semibold text-[#f0f2f5]">
            Something went wrong
          </h2>
          <p className="mt-2 text-[#8892a7]">
            {error.message || "Failed to load scans."}
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-[#00ddb3] px-6 py-2.5 font-[family-name:var(--font-heading)] text-sm font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
