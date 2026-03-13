const CUBE_FACES = [
  { transform: "translateZ(64px)" },
  { transform: "translateZ(-64px)" },
  { transform: "rotateY(90deg) translateZ(64px)" },
  { transform: "rotateY(-90deg) translateZ(64px)" },
  { transform: "rotateX(90deg) translateZ(64px)" },
  { transform: "rotateX(-90deg) translateZ(64px)" },
] as const;

export function HeroDemoScan() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative">
        {/* Rotating wireframe cube */}
        <div
          className="h-32 w-32"
          style={{
            perspective: "400px",
          }}
        >
          <div
            className="relative h-full w-full"
            style={{
              transformStyle: "preserve-3d",
              animation: "spin-slow 8s linear infinite",
            }}
          >
            {/* Cube faces as outlines */}
            {CUBE_FACES.map((style, i) => (
              <div
                key={i}
                className="absolute inset-0 border border-[rgba(0,221,179,0.2)] rounded-sm"
                style={style}
              />
            ))}
          </div>
        </div>

        {/* Grid floor lines */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 opacity-30">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-[rgba(0,221,179,0.3)]"
              style={{ top: `${i * 25}%`, transform: `perspective(200px) rotateX(60deg)` }}
            />
          ))}
        </div>

        {/* Scan line sweeping */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,221,179,0.1)] to-transparent"
          style={{ animation: "scan-sweep 2s ease-in-out infinite" }}
        />
      </div>

      <div className="ml-8">
        <div className="font-[family-name:var(--font-heading)] text-sm font-semibold text-[#f0f2f5]">
          Loading 3D Model
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-[#131d35] overflow-hidden">
              <div className="h-full w-full rounded-full bg-[#00ddb3]" style={{ animation: "progress 2.5s ease-in-out infinite" }} />
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#515c72]">venue.glb</span>
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#515c72]">
            14.2 MB · 12,847 vertices
          </div>
        </div>
      </div>
    </div>
  );
}
