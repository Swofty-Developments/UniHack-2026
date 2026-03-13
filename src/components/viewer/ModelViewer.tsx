"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useCallback, memo } from "react";
import { ModelScene } from "./ModelScene";
import { HazardPins } from "./HazardPins";
import { RouteOverlay } from "./RouteOverlay";
import { StartEndMarkers } from "./StartEndMarkers";
import type { HazardData, RouteData } from "~/lib/types";
import * as THREE from "three";

interface ModelViewerProps {
  modelUrl: string;
  hazards: HazardData[];
  selectedHazard: string | null;
  onHazardClick: (hazardId: string) => void;
  route: RouteData | null;
  placementMode?: "none" | "start" | "end";
  onPointSelected?: (point: THREE.Vector3) => void;
  startPoint?: THREE.Vector3 | null;
  endPoint?: THREE.Vector3 | null;
}

export const ModelViewer = memo(function ModelViewer({
  modelUrl,
  hazards,
  selectedHazard,
  onHazardClick,
  route,
  placementMode = "none",
  onPointSelected,
  startPoint = null,
  endPoint = null,
}: ModelViewerProps) {
  const handleCanvasClick = useCallback(
    (event: { point: THREE.Vector3 }) => {
      if (placementMode === "none" || !onPointSelected) return;
      if (event.point) {
        onPointSelected(event.point.clone());
      }
    },
    [placementMode, onPointSelected]
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#060b18]">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <group onClick={handleCanvasClick}>
            <ModelScene url={modelUrl} />
          </group>
          <HazardPins
            hazards={hazards}
            selectedHazard={selectedHazard}
            onHazardClick={onHazardClick}
          />
          {route && <RouteOverlay route={route} />}
          <StartEndMarkers start={startPoint} end={endPoint} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {placementMode !== "none" && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border border-[rgba(0,221,179,0.3)] bg-[#0c1425]/90 px-4 py-2 text-sm text-[#00ddb3] backdrop-blur-md">
          Click on the model to place {placementMode === "start" ? "start" : "end"} point
        </div>
      )}
    </div>
  );
});
