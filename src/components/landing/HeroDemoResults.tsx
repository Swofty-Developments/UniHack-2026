const PROFILES = [
  { label: "Wheelchair", active: true },
  { label: "Low Vision", active: false },
  { label: "Elderly", active: true },
  { label: "Prams", active: false },
];

export function HeroDemoResults() {
  return (
    <div className="flex h-full items-center gap-6">
      {/* Mini viewer with route */}
      <div className="relative h-44 w-44 shrink-0 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#060b18] overflow-hidden">
        <div className="absolute inset-0 topo-grid opacity-30" />

        {/* Fake room outline */}
        <div className="absolute inset-6 border border-[rgba(255,255,255,0.06)] rounded-sm" />

        {/* Route path */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <path
            d="M 15 85 Q 25 60 40 50 Q 55 40 70 35 Q 80 30 85 20"
            fill="none"
            stroke="#00ddb3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="200"
            style={{ animation: "dash 2s ease-in-out forwards" }}
          />
          <circle cx="15" cy="85" r="3" fill="#51cf66" />
          <circle cx="85" cy="20" r="3" fill="#ff6b6b" />
        </svg>

        {/* Hazard dots (avoided) */}
        <div className="absolute" style={{ left: "35%", top: "30%" }}>
          <div className="h-2 w-2 rounded-full bg-[#ff6b6b] opacity-40" />
        </div>
        <div className="absolute" style={{ left: "60%", top: "60%" }}>
          <div className="h-2 w-2 rounded-full bg-[#ffa94d] opacity-40" />
        </div>
      </div>

      {/* Results panel */}
      <div className="flex-1">
        <div className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[#f0f2f5]">
          Route Generated
        </div>
        <div className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[#515c72]">
          Avoiding 3 hazards · 47m path
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#515c72] mb-2">
            Active Profiles
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROFILES.map((p) => (
              <span
                key={p.label}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  p.active
                    ? "bg-[rgba(0,221,179,0.1)] text-[#00ddb3] border border-[rgba(0,221,179,0.2)]"
                    : "bg-[#131d35] text-[#515c72]"
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#131d35] px-3 py-2">
            <div className="font-[family-name:var(--font-mono)] text-lg font-bold text-[#ff6b6b]">5</div>
            <div className="text-[10px] text-[#515c72]">Hazards</div>
          </div>
          <div className="rounded-lg bg-[#131d35] px-3 py-2">
            <div className="font-[family-name:var(--font-mono)] text-lg font-bold text-[#51cf66]">1</div>
            <div className="text-[10px] text-[#515c72]">Safe Route</div>
          </div>
        </div>
      </div>
    </div>
  );
}
