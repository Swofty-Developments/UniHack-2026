"use client";

import { useCallback } from "react";
import * as THREE from "three";

interface ClickableMeshProps {
  onPointSelected: (point: THREE.Vector3) => void;
  active: boolean;
}

export function ClickableMesh({ onPointSelected, active }: ClickableMeshProps) {
  const handleClick = useCallback(
    (event: { point: THREE.Vector3; stopPropagation: () => void }) => {
      if (!active) return;
      event.stopPropagation();
      onPointSelected(event.point.clone());
    },
    [active, onPointSelected]
  );

  return (
    <mesh
      visible={false}
      position={[0, 0, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}
