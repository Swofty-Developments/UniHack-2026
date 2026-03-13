"use client";

import { MapPin, Route, Trash2, Navigation } from "lucide-react";

type PlacementMode = "none" | "start" | "end";

interface RouteControlsProps {
  onStartPlacement: (mode: "start" | "end") => void;
  onGenerateRoute: () => void;
  onClearRoute: () => void;
  hasRoute: boolean;
  hasStart: boolean;
  hasEnd: boolean;
  placementMode: PlacementMode;
}

export function RouteControls({
  onStartPlacement,
  onGenerateRoute,
  onClearRoute,
  hasRoute,
  hasStart,
  hasEnd,
  placementMode,
}: RouteControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425]/95 px-4 py-2 shadow-xl backdrop-blur-md">
      <button
        onClick={() => onStartPlacement("start")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          placementMode === "start"
            ? "border border-green-500/40 bg-green-500/20 text-green-400"
            : hasStart
              ? "bg-green-500/10 text-green-400"
              : "bg-[#131d35] text-[#8892a7] hover:text-[#f0f2f5]"
        }`}
      >
        <MapPin className="h-3.5 w-3.5" />
        {hasStart ? "Start Set" : "Set Start"}
      </button>

      <button
        onClick={() => onStartPlacement("end")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          placementMode === "end"
            ? "border border-red-500/40 bg-red-500/20 text-red-400"
            : hasEnd
              ? "bg-red-500/10 text-red-400"
              : "bg-[#131d35] text-[#8892a7] hover:text-[#f0f2f5]"
        }`}
      >
        <Navigation className="h-3.5 w-3.5" />
        {hasEnd ? "End Set" : "Set End"}
      </button>

      <div className="h-6 w-px bg-[rgba(255,255,255,0.08)]" />

      <button
        onClick={onGenerateRoute}
        disabled={!hasStart || !hasEnd}
        className="flex items-center gap-1.5 rounded-lg bg-[#00ddb3] px-3 py-1.5 text-xs font-medium text-[#060b18] transition-all hover:shadow-[0_0_16px_rgba(0,221,179,0.3)] disabled:bg-[#131d35] disabled:text-[#515c72] disabled:shadow-none"
      >
        <Route className="h-3.5 w-3.5" />
        Find Route
      </button>

      {hasRoute && (
        <button
          onClick={onClearRoute}
          className="flex items-center gap-1.5 rounded-lg bg-[#131d35] px-3 py-1.5 text-xs font-medium text-[#8892a7] transition-colors hover:text-[#f0f2f5]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
