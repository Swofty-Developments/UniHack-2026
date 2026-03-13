import { Pathfinding } from "three-pathfinding";
import * as THREE from "three";
import type { HazardData, AccessibilityProfile } from "./types";

const pathfinding = new Pathfinding();
const ZONE = "accessscan";

export function buildNavMesh(scene: THREE.Group): THREE.BufferGeometry | null {
  let largestMesh: THREE.Mesh | null = null;
  let largestArea = 0;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const box = new THREE.Box3().setFromObject(child);
      const size = box.getSize(new THREE.Vector3());
      const area = size.x * size.z;
      if (area > largestArea) {
        largestArea = area;
        largestMesh = child;
      }
    }
  });

  if (!largestMesh) return null;

  const geometry = (largestMesh as THREE.Mesh).geometry.clone();
  geometry.applyMatrix4((largestMesh as THREE.Mesh).matrixWorld);

  return geometry;
}

export function initializePathfinding(navMeshGeometry: THREE.BufferGeometry) {
  const zone = Pathfinding.createZone(navMeshGeometry);
  pathfinding.setZoneData(ZONE, zone);
  return zone;
}

export function findPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  _hazards: HazardData[],
  _profile: AccessibilityProfile | null
): THREE.Vector3[] | null {
  try {
    const startGroup = pathfinding.getGroup(ZONE, start);
    const endGroup = pathfinding.getGroup(ZONE, end);

    const closestStart = pathfinding.getClosestNode(start, ZONE, startGroup);
    const closestEnd = pathfinding.getClosestNode(end, ZONE, endGroup);

    if (!closestStart || !closestEnd) return null;

    const path = pathfinding.findPath(
      closestStart.centroid,
      closestEnd.centroid,
      ZONE,
      startGroup
    );

    return path || null;
  } catch (err) {
    console.error("Pathfinding error:", err);
    return null;
  }
}

export { pathfinding, ZONE };
