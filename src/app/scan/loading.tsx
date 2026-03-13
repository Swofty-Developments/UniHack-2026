import { Loader2 } from "lucide-react";

export default function ScanLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 topo-grid opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16">
        <div className="mb-10">
          <div className="h-4 w-20 rounded bg-[#131d35] animate-pulse" />
          <div className="mt-4 h-8 w-64 rounded bg-[#131d35] animate-pulse" />
          <div className="mt-3 h-5 w-80 rounded bg-[#131d35] animate-pulse" />
        </div>
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#00ddb3]" />
        </div>
      </div>
    </div>
  );
}
