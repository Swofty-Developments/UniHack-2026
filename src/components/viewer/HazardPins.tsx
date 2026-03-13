"use client";

import { memo, useRef, useState, useCallback } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { HazardData } from "~/lib/types";
import { getSeverityColor } from "~/lib/utils";

interface HazardPinsProps {
  hazards: HazardData[];
  selectedHazard: string | null;
  onHazardClick: (hazardId: string) => void;
}

export function HazardPins({
  hazards,
  selectedHazard,
  onHazardClick,
}: HazardPinsProps) {
  return (
    <group>
      {hazards.map((hazard) => (
        <HazardPin
          key={hazard.id}
          hazard={hazard}
          isSelected={selectedHazard === hazard.id}
          onClick={() => onHazardClick(hazard.id)}
        />
      ))}
    </group>
  );
}

interface HazardPinProps {
  hazard: HazardData;
  isSelected: boolean;
  onClick: () => void;
}

const HazardPin = memo(function HazardPin({ hazard, isSelected, onClick }: HazardPinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = getSeverityColor(hazard.severity);
  const scale = isSelected ? 1.5 : hovered ? 1.2 : 1;

  return (
    <group position={[hazard.x, hazard.y, hazard.z]}>
      {/* Pin sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        scale={scale}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Pulsing ring for selected */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.18, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Pin stem */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Tooltip on hover */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.2, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl border border-gray-700">
            <div className="font-semibold">{hazard.title}</div>
            <div className="text-gray-400 mt-0.5 capitalize">
              {hazard.severity} risk
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});
