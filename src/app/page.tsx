import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSection } from "~/components/landing/HeroSection";
import { HowItWorks } from "~/components/landing/HowItWorks";
import { ProfilesGrid } from "~/components/landing/ProfilesGrid";
import { StatsBar } from "~/components/landing/StatsBar";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <ProfilesGrid />

      {/* Footer CTA */}
      <section className="relative py-28">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="animate-fade-up mx-auto mb-6 max-w-xs contour-line" />
          <h2 className="animate-fade-up delay-1 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[#f0f2f5] sm:text-5xl">
            Ready to map your space?
          </h2>
          <p className="animate-fade-up delay-2 mt-5 text-lg text-[#8892a7]">
            Upload your first LiDAR scan and discover accessibility insights
            in seconds.
          </p>
          <Link
            href="/scan"
            className="animate-fade-up delay-3 group mt-10 inline-flex items-center gap-2 rounded-xl bg-[#00ddb3] px-8 py-3.5 font-[family-name:var(--font-heading)] text-base font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2] hover:shadow-[0_0_40px_rgba(0,221,179,0.25)]"
            prefetch={true}
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.04)] py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="font-[family-name:var(--font-mono)] text-xs text-[#515c72]">
            Built for UNIHACK 2026 &middot; Powered by LiDAR + Gemini AI
          </p>
        </div>
      </footer>
    </>
  );
}
