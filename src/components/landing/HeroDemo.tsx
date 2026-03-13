"use client";

import { useState, useEffect, useCallback } from "react";
import { HeroDemoScan } from "./HeroDemoScan";
import { HeroDemoAnalyze } from "./HeroDemoAnalyze";
import { HeroDemoResults } from "./HeroDemoResults";

const STAGES = ["scan", "analyze", "results"] as const;
const STAGE_DURATION = 3000;

export function HeroDemo() {
  const [state, setState] = useState({ stage: 0, transitioning: false });

  const advance = useCallback(() => {
    setState((prev) => ({ ...prev, transitioning: true }));
    const timeout = setTimeout(() => {
      setState((prev) => ({
        stage: (prev.stage + 1) % STAGES.length,
        transitioning: false,
      }));
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(advance, STAGE_DURATION);
    return () => clearInterval(interval);
  }, [advance]);

  const { stage, transitioning } = state;

  const currentStage = STAGES[stage]!;

  return (
    <div className="animate-fade-up delay-4 w-full max-w-xl" style={{ animation: "float 6s ease-in-out infinite" }}>
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0c1425] shadow-2xl shadow-black/40 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#ffa94d]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#51cf66]" />
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#515c72]">
            AccessScan — Viewer
          </span>
          <div className="ml-auto flex gap-2">
            {STAGES.map((s, i) => (
              <div
                key={s}
                className={`h-1 w-6 rounded-full transition-all duration-500 ${
                  i === stage ? "bg-[#00ddb3]" : "bg-[rgba(255,255,255,0.06)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`relative h-64 p-6 transition-opacity duration-300 ${transitioning ? "opacity-0" : "opacity-100"}`}>
          {currentStage === "scan" && <HeroDemoScan />}
          {currentStage === "analyze" && <HeroDemoAnalyze />}
          {currentStage === "results" && <HeroDemoResults />}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-2">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#515c72]">
            {currentStage === "scan" && "Importing 3D model..."}
            {currentStage === "analyze" && "Gemini Vision analyzing..."}
            {currentStage === "results" && "5 hazards detected · Route generated"}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#00ddb3]">
            {currentStage === "scan" && "Step 1/3"}
            {currentStage === "analyze" && "Step 2/3"}
            {currentStage === "results" && "Step 3/3"}
          </span>
        </div>
      </div>
    </div>
  );
}
