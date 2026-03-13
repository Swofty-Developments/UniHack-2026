import { Loader2 } from "lucide-react";

export default function ScanDetailLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#060b18] pt-16">
      <Loader2 className="h-10 w-10 animate-spin text-[#00ddb3]" />
    </div>
  );
}
