import {
  Accessibility,
  EyeOff,
  Activity,
  EarOff,
  Brain,
  HeartHandshake,
  Baby,
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

export function ProfilesGrid() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 topo-grid opacity-30" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <span className="font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.2em] text-[#00ddb3]">
            Profiles
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[#f0f2f5] sm:text-5xl">
            7 Accessibility Profiles
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[#8892a7]">
            Every person experiences spaces differently. AccessScan analyses
            hazards through seven distinct lenses.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {PROFILES.map((profile, i) => {
            const Icon = iconMap[profile.id];
            return (
              <div
                key={profile.id}
                className={`animate-fade-up delay-${(i % 7) + 1} card-interactive group rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-6`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,221,179,0.08)] text-[#00ddb3] transition-colors group-hover:bg-[rgba(0,221,179,0.14)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[#f0f2f5]">
                      {profile.label}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#8892a7]">
                      {profile.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
