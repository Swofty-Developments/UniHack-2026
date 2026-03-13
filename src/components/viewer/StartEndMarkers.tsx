"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";

interface StartEndMarkersProps {
  start: THREE.Vector3 | null;
  end: THREE.Vector3 | null;
}

export function StartEndMarkers({ start, end }: StartEndMarkersProps) {
  return (
    <group>
      {start && (
        <group position={start}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          <Html
            position={[0, 0.3, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="rounded-md bg-green-900/90 px-2 py-1 text-[10px] font-bold text-green-300 whitespace-nowrap">
              START
            </div>
          </Html>
        </group>
      )}

      {end && (
        <group position={end}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <Html
            position={[0, 0.3, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="rounded-md bg-red-900/90 px-2 py-1 text-[10px] font-bold text-red-300 whitespace-nowrap">
              END
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
