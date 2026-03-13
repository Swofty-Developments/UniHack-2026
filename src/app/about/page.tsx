import {
  Smartphone,
  Upload,
  BrainCircuit,
  Eye,
  Accessibility,
  EyeOff,
  Activity,
  EarOff,
  Brain,
  HeartHandshake,
  Baby,
  Users,
} from "lucide-react";
import { PROFILES } from "~/lib/types";
import type { AccessibilityProfile } from "~/lib/types";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<AccessibilityProfile, LucideIcon> = {
  wheelchair: Accessibility,
  "low-vision": EyeOff,
  "limited-mobility": Activity,
  "hearing-impaired": EarOff,
  neurodivergent: Brain,
  elderly: HeartHandshake,
  "parents-prams": Baby,
};

const steps = [
  {
    icon: Smartphone,
    title: "Capture with LiDAR",
    desc: "Use a LiDAR-enabled device (iPhone Pro, iPad Pro) with Polycam to create a detailed 3D scan of any indoor or outdoor space.",
  },
  {
    icon: Upload,
    title: "Upload the Model",
    desc: "Export the scan as a .gltf or .glb file and upload it to AccessScan. The 3D model loads instantly in your browser.",
  },
  {
    icon: BrainCircuit,
    title: "AI Analysis",
    desc: "Our AI engine powered by Google Gemini analyses the geometry, dimensions, and features of the space to detect potential hazards.",
  },
  {
    icon: Eye,
    title: "Review & Act",
    desc: "Hazards are pinned directly onto the 3D model. Filter by accessibility profile, inspect each issue, and generate reports.",
  },
];

export const metadata = {
  title: "About — AccessScan",
  description: "Learn how AccessScan uses LiDAR and AI to detect accessibility hazards in any space.",
};

export default function AboutPage() {
  return (
    <div className="topo-grid relative min-h-screen">
      <div className="mesh-gradient pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-20">
        {/* Header */}
        <div className="animate-fade-up mb-20 text-center">
          <p className="font-[family-name:var(--font-mono)] mb-3 text-xs uppercase tracking-[0.2em] text-[#00ddb3]">
            About
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[#f0f2f5] sm:text-5xl">
            About <span className="text-[#00ddb3]">AccessScan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#8892a7]">
            Making the built environment accessible to everyone through
            LiDAR scanning and AI-powered hazard detection.
          </p>
        </div>

        {/* How it works */}
        <section className="mb-20">
          <p className="animate-fade-up font-[family-name:var(--font-mono)] mb-2 text-xs uppercase tracking-[0.2em] text-[#00ddb3]">
            Process
          </p>
          <h2 className="animate-fade-up delay-1 font-[family-name:var(--font-heading)] mb-10 text-2xl font-bold text-[#f0f2f5]">
            How It Works
          </h2>

          <div className="relative space-y-6">
            {/* Vertical line */}
            <div className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-[rgba(255,255,255,0.06)]" />

            {steps.map((step, i) => (
              <div
                key={step.title}
                className={`animate-fade-up delay-${i + 2} flex gap-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-6 transition-all hover:border-[rgba(255,255,255,0.12)]`}
              >
                <div className="flex flex-shrink-0 flex-col items-center gap-2">
                  <span className="font-[family-name:var(--font-mono)] text-xs font-bold text-[#00ddb3]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(0,221,179,0.08)] text-[#00ddb3]">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[#f0f2f5]">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#8892a7]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Profiles */}
        <section className="mb-20">
          <p className="animate-fade-up font-[family-name:var(--font-mono)] mb-2 text-xs uppercase tracking-[0.2em] text-[#00ddb3]">
            Profiles
          </p>
          <h2 className="animate-fade-up delay-1 font-[family-name:var(--font-heading)] mb-3 text-2xl font-bold text-[#f0f2f5]">
            Accessibility Profiles
          </h2>
          <p className="animate-fade-up delay-2 mb-8 text-[#8892a7]">
            AccessScan evaluates spaces through seven distinct profiles, each
            highlighting different hazards and barriers.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROFILES.map((profile, i) => {
              const Icon = iconMap[profile.id];
              return (
                <div
                  key={profile.id}
                  className={`animate-fade-up delay-${Math.min(i + 3, 7)} rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5 transition-all hover:border-[rgba(255,255,255,0.12)]`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(0,221,179,0.08)] text-[#00ddb3]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-[#f0f2f5]">{profile.label}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#8892a7]">
                    {profile.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team */}
        <section className="mb-20">
          <p className="animate-fade-up font-[family-name:var(--font-mono)] mb-2 text-xs uppercase tracking-[0.2em] text-[#00ddb3]">
            Team
          </p>
          <h2 className="animate-fade-up delay-1 font-[family-name:var(--font-heading)] mb-8 text-2xl font-bold text-[#f0f2f5]">
            The Team
          </h2>
          <div className="animate-fade-up delay-2 glass-panel rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(0,221,179,0.08)] text-[#00ddb3]">
              <Users className="h-7 w-7" />
            </div>
            <p className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#f0f2f5]">
              Built for UNIHACK 2026
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#8892a7]">
              AccessScan was created by a passionate team of students who
              believe technology can break down barriers and make every space
              welcoming for everyone.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
