"use client";

import { useState } from "react";
import { Scan, Loader2 } from "lucide-react";

interface AnalyzeButtonProps {
  scanId: string;
  status: string;
  onAnalysisComplete: () => void;
}

export function AnalyzeButton({ scanId, status, onAnalysisComplete }: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Analysis failed");
      }

      onAnalysisComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (status === "complete") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#51cf66]">
        <Scan className="h-4 w-4" />
        <span>Analysis complete</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || status === "analyzing"}
        className="flex items-center gap-2 rounded-lg bg-[#00ddb3] px-4 py-2 text-sm font-medium text-[#060b18] transition-all hover:shadow-[0_0_20px_rgba(0,221,179,0.3)] disabled:bg-[#131d35] disabled:text-[#515c72] disabled:shadow-none"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#00ddb3]" />
            Analyzing with Gemini...
          </>
        ) : (
          <>
            <Scan className="h-4 w-4" />
            Analyze for Hazards
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-[#ff6b6b]">{error}</p>}
    </div>
  );
}
