"use client";

import type { HazardData } from "~/lib/types";

interface HazardPanelProps {
  hazards: HazardData[];
  selectedHazard: string | null;
  onHazardClick: (id: string) => void;
}

const SEVERITY_COLORS: Record<string, { dot: string; text: string }> = {
  high: { dot: "bg-[#ff6b6b]", text: "text-[#ff6b6b]" },
  medium: { dot: "bg-[#ffa94d]", text: "text-[#ffa94d]" },
  low: { dot: "bg-[#ffd43b]", text: "text-[#ffd43b]" },
};

const PROFILE_LABELS: Record<string, string> = {
  wheelchair: "Wheelchair",
  "low-vision": "Low Vision",
  "limited-mobility": "Limited Mobility",
  "hearing-impaired": "Hearing",
  neurodivergent: "Neuro",
  elderly: "Elderly",
  "parents-prams": "Prams",
};

export function HazardPanel({
  hazards,
  selectedHazard,
  onHazardClick,
}: HazardPanelProps) {
  if (hazards.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-sm text-[#515c72]">
        No hazards detected
      </div>
    );
  }

  return (
    <div className="flex max-h-[600px] flex-col gap-2 overflow-y-auto pr-1">
      {hazards.map((hazard) => {
        const severity = SEVERITY_COLORS[hazard.severity] ?? SEVERITY_COLORS.low!;
        const isSelected = selectedHazard === hazard.id;

        return (
          <button
            key={hazard.id}
            onClick={() => onHazardClick(hazard.id)}
            className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-all
              ${
                isSelected
                  ? "border-[rgba(0,221,179,0.3)] bg-[rgba(0,221,179,0.04)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[#0c1425] hover:border-[rgba(255,255,255,0.12)]"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${severity.dot}`} />
              <span className="text-sm font-medium text-[#f0f2f5]">
                {hazard.title}
              </span>
              <span
                className={`ml-auto text-xs font-medium capitalize ${severity.text}`}
              >
                {hazard.severity}
              </span>
            </div>

            <p className="line-clamp-2 text-xs leading-relaxed text-[#515c72]">
              {hazard.description}
            </p>

            {hazard.profiles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hazard.profiles.map((profile) => (
                  <span
                    key={profile}
                    className="rounded-md bg-[#131d35] px-1.5 py-0.5 text-[10px] font-medium text-[#515c72]"
                  >
                    {PROFILE_LABELS[profile] ?? profile}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
