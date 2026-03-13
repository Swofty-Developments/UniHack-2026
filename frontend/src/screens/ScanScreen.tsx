import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { useTerritoryStore } from '../stores/useTerritoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { Territory } from '../types/territory';
import { CompleteScanResponse, ScanCaptureDraft, ScanMeasurement } from '../types/scan';
import { completeScan } from '../services/scan';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import { coerceToMonashShowcaseLocation } from '../constants/showcase';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScanStep = 'setup' | 'camera' | 'analyzing' | 'complete';
type BuildingType = Territory['buildingType'];

interface MotionTelemetry {
  sweepDegrees: number;
  depthConfidence: number;
  motionEnergy: number;
}

const BUILDING_TYPES: Array<{ value: BuildingType; label: string }> = [
  { value: 'public', label: 'Public' },
  { value: 'university', label: 'University' },
  { value: 'office', label: 'Office' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'other', label: 'Other' },
];

const EMPTY_MOTION: MotionTelemetry = {
  sweepDegrees: 0,
  depthConfidence: 0.35,
  motionEnergy: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function summarizeMotion(samples: DeviceMotionMeasurement[]): MotionTelemetry {
  if (samples.length === 0) {
    return EMPTY_MOTION;
  }

  const betas = samples.map((sample) => sample.rotation.beta || 0);
  const gammas = samples.map((sample) => sample.rotation.gamma || 0);
  const sweepDegrees = clamp(
    Math.max(...betas) - Math.min(...betas) + (Math.max(...gammas) - Math.min(...gammas)),
    0,
    70
  );

  const motionEnergy =
    samples.reduce((sum, sample) => {
      const acceleration = sample.accelerationIncludingGravity;
      return (
        sum +
        Math.sqrt(
          acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
        )
      );
    }, 0) / samples.length;

  const depthConfidence = clamp(0.32 + sweepDegrees / 42 + motionEnergy / 30, 0.32, 0.96);

  return {
    sweepDegrees: round(sweepDegrees),
    depthConfidence: round(depthConfidence, 2),
    motionEnergy: round(motionEnergy, 2),
  };
}

function buildMeasurement(captureCount: number, telemetry: MotionTelemetry): ScanMeasurement {
  const widthMeters = clamp(3.4 + captureCount * 1.4 + telemetry.sweepDegrees * 0.08, 3, 24);
  const depthMeters = clamp(
    2.8 + captureCount * 1.1 + telemetry.motionEnergy * 0.22 + telemetry.sweepDegrees * 0.05,
    2.5,
    20
  );

  return {
    widthMeters: round(widthMeters),
    depthMeters: round(depthMeters),
    estimatedAreaSqMeters: Math.round(widthMeters * depthMeters),
    depthConfidence: telemetry.depthConfidence,
    captureCount,
    sweepDegrees: telemetry.sweepDegrees,
  };
}

function formatLocationLabel(location: Location.LocationObject | null) {
  if (!location) {
    return 'Location unavailable';
  }

  const accuracy = location.coords.accuracy ? `${Math.round(location.coords.accuracy)}m` : 'approx';
  return `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)} (${accuracy})`;
}

export default function ScanScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const motionSamplesRef = useRef<DeviceMotionMeasurement[]>([]);
  const { fetchTerritories } = useTerritoryStore();
  const { userId, displayName, setUser } = useAuthStore();
  const { selectedProfile, selectedProfiles } = useProfileStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [step, setStep] = useState<ScanStep>('setup');
  const [scanName, setScanName] = useState('');
  const [notes, setNotes] = useState('');
  const [buildingType, setBuildingType] = useState<BuildingType>('public');
  const [captures, setCaptures] = useState<ScanCaptureDraft[]>([]);
  const [motionTelemetry, setMotionTelemetry] = useState<MotionTelemetry>(EMPTY_MOTION);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanResult, setScanResult] = useState<CompleteScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'camera') {
      return;
    }

    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    DeviceMotion.setUpdateInterval(250);
    void DeviceMotion.isAvailableAsync().then((available) => {
      if (!available || !isMounted) {
        return;
      }

      subscription = DeviceMotion.addListener((measurement) => {
        motionSamplesRef.current = [...motionSamplesRef.current.slice(-59), measurement];
        setMotionTelemetry(summarizeMotion(motionSamplesRef.current));
      });
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [step]);

  const measurement = useMemo(
    () => buildMeasurement(captures.length, motionTelemetry),
    [captures.length, motionTelemetry]
  );

  const prepareScan = async () => {
    if (!scanName.trim()) {
      Alert.alert('Name required', 'Please name the space before starting the scan.');
      return;
    }

    setIsPreparing(true);
    setErrorMessage(null);

    try {
      const permission = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

      if (!permission.granted) {
        setErrorMessage('Camera access is required to capture the space.');
        return;
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.granted) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        setLocationDenied(false);
      } else {
        setLocation(null);
        setLocationDenied(true);
      }

      motionSamplesRef.current = [];
      setMotionTelemetry(EMPTY_MOTION);
      setCaptures([]);
      setScanResult(null);
      setStep('camera');
    } catch {
      setErrorMessage('Unable to initialize the camera scan right now.');
    } finally {
      setIsPreparing(false);
    }
  };

  const captureFrame = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const picture = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        skipProcessing: true,
      });

      if (!picture.base64) {
        throw new Error('Capture returned without base64 data.');
      }

      const latestMotion = motionSamplesRef.current[motionSamplesRef.current.length - 1];
      const nextCapture: ScanCaptureDraft = {
        base64: picture.base64,
        mimeType: 'image/jpeg',
        width: picture.width,
        height: picture.height,
        capturedAt: new Date().toISOString(),
        orientation: latestMotion
          ? {
              alpha: round(latestMotion.rotation.alpha || 0),
              beta: round(latestMotion.rotation.beta || 0),
              gamma: round(latestMotion.rotation.gamma || 0),
            }
          : undefined,
      };

      setCaptures((currentCaptures) => [...currentCaptures, nextCapture]);
      void Haptics.selectionAsync();
    } catch {
      setErrorMessage('Capture failed. Try keeping the phone steady and retry.');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetScan = () => {
    setStep('setup');
    setCaptures([]);
    setMotionTelemetry(EMPTY_MOTION);
    setScanResult(null);
    setErrorMessage(null);
  };

  const submitScan = async () => {
    if (captures.length === 0) {
      Alert.alert('No captures yet', 'Capture at least one frame before analysis.');
      return;
    }

    setStep('analyzing');
    setErrorMessage(null);

    try {
      const resolvedLocation = coerceToMonashShowcaseLocation(
        location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              heading: location.coords.heading,
            }
          : null
      );

      const result = await completeScan({
        userId,
        displayName,
        selectedProfile,
        name: scanName.trim(),
        description: notes.trim() || undefined,
        buildingType,
        captures,
        measurement,
        location: resolvedLocation,
      });

      if ((!userId || userId === 'local-user') && result.scanner) {
        setUser(result.scanner.id, result.scanner.displayName);
      }

      setScanResult(result);
      await fetchTerritories();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('complete');
    } catch {
      setErrorMessage('Scan analysis failed. Check the backend connection and try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('camera');
    }
  };

  const renderSetup = () => (
    <ScrollView contentContainerStyle={[styles.setupScrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 24 }]}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Capture a real accessibility scan</Text>
        <Text style={styles.heroBody}>
          We will guide you through a short multi-angle camera sweep, estimate spatial depth from motion, and send the captured frames to the backend for hazard analysis.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Scan setup</Text>
      <TextInput
        style={styles.input}
        placeholder="Space name"
        placeholderTextColor={Colors.textMuted}
        value={scanName}
        onChangeText={setScanName}
      />
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Optional notes about the entrance, room, or floor"
        placeholderTextColor={Colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Text style={styles.sectionTitle}>Building type</Text>
      <View style={styles.typeGrid}>
        {BUILDING_TYPES.map((option) => {
          const isSelected = option.value === buildingType;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.typeChip, isSelected && styles.typeChipActive]}
              onPress={() => setBuildingType(option.value)}
            >
              <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Depth-aware scan checklist</Text>
        <Text style={styles.infoBullet}>1. Stand where the full path or entrance is visible.</Text>
        <Text style={styles.infoBullet}>2. Capture at least 3 frames while moving slightly sideways.</Text>
        <Text style={styles.infoBullet}>3. Let AccessAtlas estimate width, depth, and route risk from the sweep.</Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isPreparing && styles.primaryButtonDisabled]}
        onPress={() => void prepareScan()}
        disabled={isPreparing}
      >
        {isPreparing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Open camera scanner</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCamera = () => (
    <View style={styles.cameraStage}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={[styles.cameraOverlay, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 6 }]}>
        <View style={styles.cameraTopCard}>
          <Text style={styles.cameraTopTitle}>{scanName}</Text>
          <Text style={styles.cameraTopSubtitle}>
            Capture from multiple angles so the scan can infer depth and coverage.
          </Text>
        </View>

        <View style={styles.cameraFrame}>
          <View style={styles.frameCornerTopLeft} />
          <View style={styles.frameCornerTopRight} />
          <View style={styles.frameCornerBottomLeft} />
          <View style={styles.frameCornerBottomRight} />
        </View>

        <View style={styles.cameraMetricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Captures</Text>
            <Text style={styles.metricValue}>{captures.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Depth confidence</Text>
            <Text style={styles.metricValue}>{Math.round(measurement.depthConfidence * 100)}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Estimated area</Text>
            <Text style={styles.metricValue}>{measurement.estimatedAreaSqMeters} m2</Text>
          </View>
        </View>

        <View style={styles.cameraBottomCard}>
          <Text style={styles.cameraInstruction}>
            Move slightly between captures. Sweep tracked: {measurement.sweepDegrees || 0} degrees.
          </Text>
          <Text style={styles.locationText}>
            {locationDenied ? 'Location denied - map placement will use a fallback position.' : formatLocationLabel(location)}
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.captureDots}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[styles.captureDot, index < captures.length && styles.captureDotActive]}
              />
            ))}
          </View>

          <View style={styles.cameraActionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>

            <Pressable
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={() => void captureFrame()}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </Pressable>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                captures.length > 0 && styles.secondaryButtonActive,
              ]}
              onPress={() => void submitScan()}
              disabled={captures.length === 0}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  captures.length > 0 && styles.secondaryButtonTextActive,
                ]}
              >
                Analyze
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAnalyzing = () => (
    <View style={[styles.analysisContainer, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 20 }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.analysisTitle}>Analyzing camera sweep</Text>
      <Text style={styles.analysisBody}>
        AccessAtlas is processing {captures.length} capture{captures.length !== 1 ? 's' : ''}, estimating spatial depth, and sending the scan to the hazard analysis pipeline.
      </Text>
      <View style={styles.analysisStatsRow}>
        <View style={styles.analysisStatCard}>
          <Text style={styles.analysisStatValue}>{measurement.estimatedAreaSqMeters}</Text>
          <Text style={styles.analysisStatLabel}>m2</Text>
        </View>
        <View style={styles.analysisStatCard}>
          <Text style={styles.analysisStatValue}>{Math.round(measurement.depthConfidence * 100)}%</Text>
          <Text style={styles.analysisStatLabel}>depth</Text>
        </View>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={[styles.completeContainer, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + FLOATING_TAB_BAR_HEIGHT + 12 }]}>
      <View style={styles.completeBadge}>
        <Text style={styles.completeBadgeText}>Scan ready</Text>
      </View>
      <Text style={styles.completeTitle}>{scanResult?.territory.name}</Text>
      <Text style={styles.completeBody}>
        Added {scanResult?.summary.total ?? 0} hazard{scanResult?.summary.total === 1 ? '' : 's'} across an estimated {scanResult?.measurement.estimatedAreaSqMeters ?? 0} m2 footprint.
      </Text>

      <View style={styles.completeStatsRow}>
        <View style={styles.completeStatCard}>
          <Text style={styles.completeStatValue}>{scanResult?.summary.total ?? 0}</Text>
          <Text style={styles.completeStatLabel}>Hazards</Text>
        </View>
        <View style={styles.completeStatCard}>
          <Text style={styles.completeStatValue}>{Math.round((scanResult?.measurement.depthConfidence ?? 0) * 100)}%</Text>
          <Text style={styles.completeStatLabel}>Depth confidence</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          const territoryId = scanResult?.territory.id;
          resetScan();
          if (territoryId) {
            navigation.navigate('TerritoryDetail', { territoryId });
          }
        }}
      >
        <Text style={styles.primaryButtonText}>Open territory</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryActionButton, { marginTop: 12 }]}
        onPress={() => {
          resetScan();
          (navigation as any).navigate('MainTabs', { screen: 'Map' });
        }}
      >
        <Text style={styles.secondaryActionText}>Back to map</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 'setup' && renderSetup()}
      {step === 'camera' && renderCamera()}
      {step === 'analyzing' && renderAnalyzing()}
      {step === 'complete' && renderComplete()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  setupScrollContent: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTitle: { color: Colors.text, fontSize: 24, fontWeight: '700', marginBottom: 10 },
  heroBody: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  typeChip: {
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: Colors.white },
  infoCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
  },
  infoTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  infoBullet: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  errorText: { color: Colors.hazardHigh, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  cameraStage: { flex: 1, backgroundColor: Colors.black },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cameraTopCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  cameraTopTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cameraTopSubtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  cameraFrame: {
    alignSelf: 'center',
    width: '82%',
    aspectRatio: 0.78,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  frameCornerTopLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  frameCornerTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  cameraMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  metricLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  metricValue: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  cameraBottomCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  cameraInstruction: { color: Colors.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  locationText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  captureDots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  captureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(148, 163, 184, 0.32)',
  },
  captureDotActive: { backgroundColor: Colors.primary },
  cameraActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    minWidth: 94,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.86)',
  },
  secondaryButtonActive: {
    backgroundColor: Colors.accent,
  },
  secondaryButtonText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  secondaryButtonTextActive: { color: Colors.white },
  captureButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  captureButtonDisabled: { opacity: 0.6 },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  analysisTitle: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  analysisBody: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  analysisStatsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  analysisStatCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 110,
  },
  analysisStatValue: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  analysisStatLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  completeBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  completeBadgeText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  completeTitle: { color: Colors.text, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  completeBody: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  completeStatsRow: { flexDirection: 'row', gap: 12 },
  completeStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  completeStatValue: { color: Colors.text, fontSize: 26, fontWeight: '700' },
  completeStatLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  secondaryActionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryActionText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
});
