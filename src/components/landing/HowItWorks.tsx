import { Smartphone, Upload, BrainCircuit } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    number: "01",
    title: "Scan",
    description:
      "Use Polycam on a LiDAR-capable iPhone to capture a detailed 3D scan of any indoor space.",
  },
  {
    icon: Upload,
    number: "02",
    title: "Upload",
    description:
      "Export as .gltf or .glb and upload to AccessScan. The model loads instantly in your browser.",
  },
  {
    icon: BrainCircuit,
    number: "03",
    title: "Analyze",
    description:
      "Gemini Vision AI identifies accessibility hazards and maps them in 3D, personalised to your profile.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28">
      <div className="absolute inset-0 topo-grid opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <span className="font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.2em] text-[#00ddb3]">
            Process
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[#f0f2f5] sm:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[#8892a7]">
            Three steps to a complete accessibility audit of any space.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`animate-fade-up delay-${i + 1} group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-8 transition-all hover:border-[rgba(0,221,179,0.2)] hover:shadow-[0_0_40px_rgba(0,221,179,0.06)]`}
            >
              <span className="font-[family-name:var(--font-mono)] text-xs text-[#515c72]">
                {step.number}
              </span>
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(0,221,179,0.08)] text-[#00ddb3] transition-colors group-hover:bg-[rgba(0,221,179,0.12)]">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-heading)] text-xl font-semibold text-[#f0f2f5]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#8892a7]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
