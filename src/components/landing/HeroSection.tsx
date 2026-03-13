import { ArrowRight } from "lucide-react";
import { HeroDemo } from "./HeroDemo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 topo-grid" />
      <div className="absolute inset-0 mesh-gradient" />

      {/* Decorative contour rings */}
      <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[600px] rounded-full border border-[rgba(0,221,179,0.04)]" />
        <div className="absolute inset-8 rounded-full border border-[rgba(0,221,179,0.03)]" />
        <div className="absolute inset-16 rounded-full border border-[rgba(0,221,179,0.02)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        {/* Left — Text content */}
        <div className="text-left">
          {/* Badge */}
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(0,221,179,0.2)] bg-[rgba(0,221,179,0.06)] px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00ddb3] animate-pulse" />
            <span className="text-xs font-medium tracking-wider uppercase text-[#00ddb3]">
              Built for UNIHACK 2026
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-1 font-[family-name:var(--font-heading)] text-5xl font-extrabold tracking-tight sm:text-7xl leading-[0.95]">
            <span className="text-[#f0f2f5]">Map Every Space.</span>
            <br />
            <span className="text-[#f0f2f5]">For </span>
            <span className="text-[#00ddb3]">Every</span>
            <span className="text-[#f0f2f5]"> Person.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-2 mt-8 max-w-lg text-lg leading-relaxed text-[#8892a7]">
            Scan any space with your iPhone&apos;s LiDAR. Our AI detects
            accessibility hazards and generates personalised 3D routes
            for seven distinct accessibility profiles.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-3 mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="/scan"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#00ddb3] px-8 py-3.5 font-[family-name:var(--font-heading)] text-base font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2] hover:shadow-[0_0_40px_rgba(0,221,179,0.25)]"
            >
              Start Scanning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-8 py-3.5 font-[family-name:var(--font-heading)] text-base font-semibold text-[#8892a7] transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-[#f0f2f5]"
            >
              See How It Works
            </a>
          </div>

          {/* Decorative line */}
          <div className="animate-fade-up delay-4 mt-12 max-w-xs contour-line" />
        </div>

        {/* Right — Animated demo window */}
        <div className="flex justify-center lg:justify-end">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
