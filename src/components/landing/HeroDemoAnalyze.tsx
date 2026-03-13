const HAZARDS = [
  { x: 20, y: 30, color: "#ff6b6b", label: "Stairs (no ramp)", delay: "0s" },
  { x: 65, y: 25, color: "#ffa94d", label: "Narrow doorway", delay: "0.5s" },
  { x: 45, y: 60, color: "#ff6b6b", label: "No elevator", delay: "1s" },
  { x: 80, y: 55, color: "#ffd43b", label: "Poor lighting", delay: "1.5s" },
  { x: 30, y: 75, color: "#ffa94d", label: "Heavy door", delay: "2s" },
];

export function HeroDemoAnalyze() {
  return (
    <div className="flex h-full items-center gap-6">
      {/* Floorplan */}
      <div className="relative h-44 w-44 shrink-0 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#060b18] p-3">
        {/* Grid */}
        <div className="absolute inset-3 topo-grid opacity-50" />

        {/* Room outlines */}
        <div className="absolute inset-3">
          <div className="absolute left-0 top-0 h-1/2 w-2/3 border border-[rgba(255,255,255,0.08)] rounded-sm" />
          <div className="absolute right-0 top-0 h-2/3 w-1/3 border border-[rgba(255,255,255,0.08)] rounded-sm" />
          <div className="absolute bottom-0 left-0 h-1/2 w-full border border-[rgba(255,255,255,0.08)] rounded-sm" />
        </div>

        {/* Hazard pins appearing */}
        {HAZARDS.map((h, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              animation: `scale-in 0.4s ease-out both`,
              animationDelay: h.delay,
            }}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: h.color,
                boxShadow: `0 0 8px ${h.color}60`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Analysis log */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-[#00ddb3] animate-pulse" />
          <span className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[#f0f2f5]">
            Detecting Hazards
          </span>
        </div>
        <div className="space-y-2">
          {HAZARDS.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px]"
              style={{
                animation: "fade-up 0.3s ease-out both",
                animationDelay: h.delay,
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: h.color }} />
              <span className="text-[#8892a7]">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
