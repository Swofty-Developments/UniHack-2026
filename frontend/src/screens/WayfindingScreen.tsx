import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
// @ts-ignore - three.js examples don't have perfect type defs in RN
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../utils/trpc';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { Colors } from '../constants/colors';
import { Hazard, AccessibilityProfileId } from '../types/hazard';
import { RootStackParamList } from '../types/navigation';
import { buildAccessibleRoute } from '../utils/buildAccessibleRoute';
import { trpcClient } from '../utils/trpcClient';
import {
  getSelectedProfilesSummary,
  hazardMatchesSelectedProfiles,
  toggleSelectedProfile,
} from '../utils/profileSelection';

type WayfindingRoute = RouteProp<RootStackParamList, 'Wayfinding'>;

const SEVERITY_COLORS: Record<string, number> = {
  high: 0xef4444,
  medium: 0xf59e0b,
  low: 0x10b981,
};

function createHazardPin(
  position: { x: number; y: number; z: number },
  severity: string
) {
  const group = new THREE.Group();
  const color = SEVERITY_COLORS[severity] ?? 0xf59e0b;

  const coneMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 8), coneMat);
  cone.position.y = 0.5;
  group.add(cone);

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), coneMat);
  sphere.position.y = 0.8;
  group.add(sphere);

  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.35, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  group.position.set(position.x, position.y, position.z);
  return group;
}

function createDemoRoom() {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const wallGeo = new THREE.BoxGeometry(8, 3, 0.1);
  const backWall = new THREE.Mesh(wallGeo, wallMat);
  backWall.position.set(0, 1.5, -4);
  group.add(backWall);

  const leftWall = new THREE.Mesh(wallGeo, wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-4, 1.5, 0);
  group.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, wallMat);
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(4, 1.5, 0);
  group.add(rightWall);

  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.4, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  doorFrame.position.set(0, 1.2, 4);
  group.add(doorFrame);

  const stairMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.4), stairMat);
    step.position.set(-2.5, 0.1 + i * 0.2, -2 + i * 0.4);
    step.castShadow = true;
    group.add(step);
  }

  return group;
}

export default function WayfindingScreen() {
  const route = useRoute<WayfindingRoute>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: selectedTerritory } = trpc.territory.getById.useQuery(
    { id: route.params.territoryId },
    { enabled: !!route.params.territoryId }
  );
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { userId } = useAuthStore();

  const hazards = selectedTerritory?.hazards || [];
  const filteredHazards = useMemo(
    () => hazards.filter((h: Hazard) => hazardMatchesSelectedProfiles(h, selectedProfiles)),
    [hazards, selectedProfiles]
  );

  const profileSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles]
  );

  const highSeverityHazards = useMemo(
    () => filteredHazards.filter((h: Hazard) => h.severity === 'high'),
    [filteredHazards]
  );

  const accessibleRoute = useMemo(
    () => buildAccessibleRoute(hazards as Hazard[], selectedProfiles),
    [hazards, selectedProfiles]
  );

  const sceneRef = useRef<{
    scene: THREE.Scene;
    hazardGroup: THREE.Group;
    routeMesh: THREE.Mesh | null;
  } | null>(null);

  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    while (ctx.hazardGroup.children.length > 0) {
      ctx.hazardGroup.remove(ctx.hazardGroup.children[0]);
    }

    filteredHazards.forEach((h: Hazard) => {
      if (h.position3D) {
        const pin = createHazardPin(h.position3D, h.severity);
        ctx.hazardGroup.add(pin);
      }
    });

    if (ctx.routeMesh) {
      ctx.scene.remove(ctx.routeMesh);
      ctx.routeMesh = null;
    }

    const viewerRoute = buildAccessibleRoute(hazards as Hazard[], selectedProfiles);
    if (viewerRoute.points.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(
        viewerRoute.points.map((p) => new THREE.Vector3(p.x, p.y, p.z))
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: viewerRoute.color,
        emissive: viewerRoute.color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      ctx.routeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      ctx.scene.add(ctx.routeMesh);
    }
  }, [filteredHazards, hazards, selectedProfiles]);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 15, 30);

    const camera = new THREE.PerspectiveCamera(
      60,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    camera.position.set(5, 4, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.shadowMap.enabled = true;

    // Lighting
    scene.add(new THREE.AmbientLight(0x404060, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Grid + floor
    scene.add(new THREE.GridHelper(20, 40, 0x1e293b, 0x1e293b));
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x151b2e, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Try to load GLB model, fall back to demo room
    const modelUrl = selectedTerritory?.modelUrl;
    let modelLoaded = false;

    if (modelUrl) {
      try {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf: any) => {
            scene.add(gltf.scene);
            modelLoaded = true;
          },
          undefined,
          () => {
            // Load failed, add demo room
            if (!modelLoaded) {
              scene.add(createDemoRoom());
            }
          }
        );
      } catch {
        scene.add(createDemoRoom());
      }
    } else {
      scene.add(createDemoRoom());
    }

    // Hazard group
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);

    // Default route
    const defaultCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, 4),
      new THREE.Vector3(0, 0.1, 2),
      new THREE.Vector3(1, 0.1, 0),
      new THREE.Vector3(1, 0.1, -2),
      new THREE.Vector3(0, 0.1, -3),
    ]);
    const routeMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const routeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(defaultCurve, 64, 0.05, 8, false),
      routeMat
    );
    scene.add(routeMesh);

    sceneRef.current = { scene, hazardGroup, routeMesh };

    // Orbit animation
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      camera.position.x = 6 * Math.cos(t * 0.15);
      camera.position.z = 6 * Math.sin(t * 0.15);
      camera.position.y = 3.5 + Math.sin(t * 0.1) * 0.5;
      camera.lookAt(0, 0.5, 0);

      hazardGroup.children.forEach((pin, i) => {
        pin.children.forEach((child: any) => {
          if (child.geometry?.type === 'SphereGeometry') {
            child.position.y = 0.8 + Math.sin(t * 2 + i) * 0.05;
          }
        });
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  }, [selectedTerritory?.modelUrl]);

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (userId) {
      try {
        await trpcClient.user.updateProfile.mutate({ selectedProfiles: nextProfiles });
      } catch {
        // Keep local profile selection even if remote sync fails.
      }
    }
  };

  const riskLevel = accessibleRoute.riskCount === 0
    ? 'Low'
    : accessibleRoute.riskCount <= 2
    ? 'Medium'
    : 'High';

  const riskColor = accessibleRoute.riskCount === 0
    ? Colors.hazardLow
    : accessibleRoute.riskCount <= 2
    ? Colors.hazardMedium
    : Colors.hazardHigh;

  return (
    <View style={styles.container}>
      {/* Main 3D area */}
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {selectedTerritory?.name ?? 'Wayfinding'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.profileChipsRow}
        >
          {selectedProfiles.map((profileId) => {
            const profile = ACCESSIBILITY_PROFILES.find((p) => p.id === profileId);
            if (!profile) return null;
            const chipColor = Colors.profileColors[profileId] ?? Colors.primary;
            return (
              <TouchableOpacity
                key={profileId}
                style={[styles.profileChipSmall, { borderColor: chipColor }]}
                onPress={() => void handleProfileToggle(profileId)}
                activeOpacity={0.88}
                accessibilityRole="switch"
                accessibilityLabel={`${profile.label} mode`}
                accessibilityState={{ checked: true }}
              >
                <Text style={[styles.profileChipSmallText, { color: chipColor }]}>
                  {profile.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomPanelHeader}>
          <View style={styles.hazardBadge}>
            <Ionicons name="warning" size={14} color={Colors.white} />
            <Text style={styles.hazardBadgeText}>
              {filteredHazards.length} hazard{filteredHazards.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={[styles.riskIndicator, { borderColor: riskColor }]}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.riskText, { color: riskColor }]}>{riskLevel} risk</Text>
          </View>

          <Text style={styles.profileSummaryText}>{profileSummary}</Text>
        </View>

        {highSeverityHazards.length > 0 ? (
          <View style={styles.concernsSection}>
            <Text style={styles.concernsTitle}>Accessibility Concerns</Text>
            {highSeverityHazards.slice(0, 3).map((hazard: Hazard, index: number) => (
              <View key={hazard.id ?? index} style={styles.concernRow}>
                <View style={[styles.severityDot, { backgroundColor: Colors.hazardHigh }]} />
                <Text style={styles.concernText} numberOfLines={1}>
                  {hazard.description}
                </Text>
              </View>
            ))}
            {highSeverityHazards.length > 3 ? (
              <Text style={styles.moreText}>
                +{highSeverityHazards.length - 3} more concern{highSeverityHazards.length - 3 !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.concernsSection}>
            <Text style={styles.concernsTitle}>Accessibility Concerns</Text>
            <Text style={styles.noConcernsText}>No high-severity concerns detected</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glView: { flex: 1 },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: {
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  topBarTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  profileChipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  profileChipSmall: {
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  profileChipSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlayHeavy,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 18,
    minHeight: 200,
  },
  bottomPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  hazardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.glowHazardHigh,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hazardBadgeText: {
    color: Colors.hazardHigh,
    fontSize: 12,
    fontWeight: '700',
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileSummaryText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  // Concerns
  concernsSection: {
    gap: 8,
  },
  concernsTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.overlayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  concernText: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  moreText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 4,
  },
  noConcernsText: {
    color: Colors.hazardLow,
    fontSize: 13,
    fontWeight: '600',
  },
});
