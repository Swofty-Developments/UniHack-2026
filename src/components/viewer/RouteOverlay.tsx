"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { RouteData } from "~/lib/types";

interface RouteOverlayProps {
  route: RouteData;
}

export function RouteOverlay({ route }: RouteOverlayProps) {
  const curve = useMemo(() => {
    if (route.waypoints.length < 2) return null;
    const points = route.waypoints.map(
      (wp) => new THREE.Vector3(wp.x, wp.y + 0.05, wp.z)
    );
    return new THREE.CatmullRomCurve3(points);
  }, [route.waypoints]);

  const tubeGeometry = useMemo(() => {
    if (!curve) return null;
    return new THREE.TubeGeometry(curve, 64, 0.03, 8, false);
  }, [curve]);

  if (!tubeGeometry) return null;

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Start marker */}
      {route.waypoints.length > 0 && (
        <mesh position={[route.waypoints[0]!.x, route.waypoints[0]!.y + 0.1, route.waypoints[0]!.z]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* End marker */}
      {route.waypoints.length > 1 && (
        <mesh
          position={[
            route.waypoints[route.waypoints.length - 1]!.x,
            route.waypoints[route.waypoints.length - 1]!.y + 0.1,
            route.waypoints[route.waypoints.length - 1]!.z,
          ]}
        >
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
