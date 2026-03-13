import Link from "next/link";

export default function NotFound() {
  return (
    <div className="topo-grid relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
      <div className="mesh-gradient pointer-events-none absolute inset-0" />
      <div className="relative text-center">
        <p className="font-[family-name:var(--font-mono)] text-7xl font-bold text-[#00ddb3]">
          404
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#f0f2f5]">
          Page not found
        </h1>
        <p className="mt-2 text-[#8892a7]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-[#00ddb3] px-6 py-2.5 font-[family-name:var(--font-heading)] text-sm font-semibold text-[#060b18] transition-all hover:bg-[#00c9a2]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
