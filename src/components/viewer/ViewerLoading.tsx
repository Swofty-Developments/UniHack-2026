export function ViewerLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#060b18]">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-[rgba(0,221,179,0.2)]" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#00ddb3]" />
        </div>
        <p className="text-sm text-[#515c72]">Loading 3D model...</p>
      </div>
    </div>
  );
}
