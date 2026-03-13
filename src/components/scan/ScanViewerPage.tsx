"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { ProfileSelector } from "~/components/ui/ProfileSelector";
import { HazardPanel } from "~/components/ui/HazardPanel";
import { AnalyzeButton } from "~/components/ui/AnalyzeButton";
import { ViewerLoading } from "~/components/viewer/ViewerLoading";
import { RouteControls } from "~/components/viewer/RouteControls";
import type {
  ScanData,
  HazardData,
  AccessibilityProfile,
  RouteData,
} from "~/lib/types";
import { formatFileSize } from "~/lib/utils";
import { Loader2 } from "lucide-react";

const ModelViewer = dynamic(
  () =>
    import("~/components/viewer/ModelViewer").then((m) => ({
      default: m.ModelViewer,
    })),
  { ssr: false, loading: () => <ViewerLoading /> }
);

type PlacementMode = "none" | "start" | "end";

interface ScanViewerPageProps {
  scanId: string;
  initialScan?: ScanData;
  initialHazards?: HazardData[];
}

export function ScanViewerPage({ scanId, initialScan, initialHazards }: ScanViewerPageProps) {
  const [scan, setScan] = useState<ScanData | null>(initialScan ?? null);
  const [hazards, setHazards] = useState<HazardData[]>(initialHazards ?? []);
  const [loading, setLoading] = useState(!initialScan);
  const [selectedProfiles, setSelectedProfiles] = useState<
    AccessibilityProfile[]
  >([]);
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("none");
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector3 | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);

  const fetchScanData = useCallback(async () => {
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      if (!res.ok) throw new Error("Failed to fetch scan");
      const data = (await res.json()) as {
        scan: ScanData;
        hazards: HazardData[];
      };
      setScan(data.scan);
      setHazards(data.hazards ?? []);
    } catch (err) {
      console.error("Failed to fetch scan:", err);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    if (!initialScan) void fetchScanData();
  }, [fetchScanData, initialScan]);

  const filteredHazards = useMemo(() => {
    if (selectedProfiles.length === 0) return hazards;
    return hazards.filter((h) =>
      h.profiles.some((p) => selectedProfiles.includes(p))
    );
  }, [hazards, selectedProfiles]);

  const handleToggleProfile = useCallback((profile: AccessibilityProfile) => {
    setSelectedProfiles((prev) =>
      prev.includes(profile)
        ? prev.filter((p) => p !== profile)
        : [...prev, profile]
    );
  }, []);

  const handleHazardClick = useCallback((hazardId: string) => {
    setSelectedHazard((prev) => (prev === hazardId ? null : hazardId));
  }, []);

  const handleStartPlacement = useCallback((mode: "start" | "end") => {
    setPlacementMode((prev) => (prev === mode ? "none" : mode));
  }, []);

  const handlePointSelected = useCallback(
    (point: THREE.Vector3) => {
      if (placementMode === "start") {
        setStartPoint(point);
        setPlacementMode("none");
      } else if (placementMode === "end") {
        setEndPoint(point);
        setPlacementMode("none");
      }
    },
    [placementMode]
  );

  const handleGenerateRoute = useCallback(() => {
    if (!startPoint || !endPoint) return;

    // Build a simple direct route as waypoints
    // When navmesh pathfinding is available, this would use findPath()
    const waypoints = [
      { x: startPoint.x, y: startPoint.y, z: startPoint.z },
      { x: endPoint.x, y: endPoint.y, z: endPoint.z },
    ];

    setRoute({
      profile: selectedProfiles[0] ?? "wheelchair",
      waypoints,
      avoidedHazards: [],
    });
  }, [startPoint, endPoint, selectedProfiles]);

  const handleClearRoute = useCallback(() => {
    setRoute(null);
    setStartPoint(null);
    setEndPoint(null);
    setPlacementMode("none");
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#060b18] pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#00ddb3]" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#060b18] pt-16">
        <p className="text-[#515c72]">Scan not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] pt-16">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-[rgba(255,255,255,0.06)] bg-[#060b18]">
        <div className="border-b border-[rgba(255,255,255,0.06)] p-4">
          <h2 className="truncate text-lg font-semibold font-[family-name:var(--font-heading)] text-[#f0f2f5]">
            {scan.originalName}
          </h2>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[#515c72]">
            {formatFileSize(scan.fileSize)}
          </p>
          <div className="mt-3">
            <AnalyzeButton
              scanId={scan.id}
              status={scan.status}
              onAnalysisComplete={() => void fetchScanData()}
            />
          </div>
        </div>

        <div className="border-b border-[rgba(255,255,255,0.06)] p-4">
          <h3 className="mb-2 text-sm font-medium font-[family-name:var(--font-heading)] text-[#8892a7]">
            Accessibility Profiles
          </h3>
          <ProfileSelector
            selectedProfiles={selectedProfiles}
            onToggleProfile={handleToggleProfile}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium font-[family-name:var(--font-heading)] text-[#8892a7]">
              Hazards
            </h3>
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#515c72]">
              {filteredHazards.length} found
            </span>
          </div>
          <HazardPanel
            hazards={filteredHazards}
            selectedHazard={selectedHazard}
            onHazardClick={handleHazardClick}
          />
        </div>
      </aside>

      {/* 3D Viewer */}
      <div className="relative flex-1 p-2">
        <ModelViewer
          modelUrl={scan.fileUrl}
          hazards={filteredHazards}
          selectedHazard={selectedHazard}
          onHazardClick={handleHazardClick}
          route={route}
          placementMode={placementMode}
          onPointSelected={handlePointSelected}
          startPoint={startPoint}
          endPoint={endPoint}
        />
        <RouteControls
          onStartPlacement={handleStartPlacement}
          onGenerateRoute={handleGenerateRoute}
          onClearRoute={handleClearRoute}
          hasRoute={!!route}
          hasStart={!!startPoint}
          hasEnd={!!endPoint}
          placementMode={placementMode}
        />
      </div>
    </div>
  );
}
