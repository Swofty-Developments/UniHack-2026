export function StatsBar() {
  const stats = [
    { value: "4.4M", label: "Australians with disabilities" },
    { value: "7", label: "Accessibility profiles" },
    { value: "<30s", label: "AI analysis time" },
    { value: "3D", label: "Spatial hazard mapping" },
  ];

  return (
    <section className="relative border-y border-[rgba(255,255,255,0.04)] bg-[#0c1425]/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`animate-fade-up delay-${i + 1} text-center`}>
              <div className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[#00ddb3]">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm text-[#515c72]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
