import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { RadarPulse } from '../components/common/RadarPulse';
import { useFadeIn, useScaleIn } from '../hooks/useAnimations';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScanStep = 'pick' | 'uploading';
type BuildingType = 'public' | 'residential' | 'commercial' | 'educational' | 'medical' | 'transport';

const BUILDING_TYPES: { key: BuildingType; label: string }[] = [
  { key: 'public', label: 'Public' },
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'educational', label: 'Educational' },
  { key: 'medical', label: 'Medical' },
  { key: 'transport', label: 'Transport' },
];

import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl?.replace('/api', '') ?? 'http://10.0.2.2:3001';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadResult {
  territoryName: string;
  territoryId: string;
  hazardCount: number;
}

export default function ScanScreen() {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const { userId, displayName, setUser } = useAuthStore();
  const { selectedProfiles } = useProfileStore();

  const [step, setStep] = useState<ScanStep>('pick');
  const [spaceName, setSpaceName] = useState('');
  const [buildingType, setBuildingType] = useState<BuildingType>('public');
  const [pickedFile, setPickedFile] = useState<{ name: string; uri: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const headerFade = useFadeIn(0);
  const contentFade = useFadeIn(150);
  const resultScale = useScaleIn(100);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      const fileSize = (fileInfo as any).size ?? 0;

      setPickedFile({
        name: asset.name,
        uri: asset.uri,
        size: fileSize,
      });
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to pick file. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) return;
    if (!spaceName.trim()) {
      setErrorMessage('Please name the space before uploading.');
      return;
    }

    setStep('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      let latitude = -37.9107;
      let longitude = 145.134;

      try {
        const locationPermission = await Location.requestForegroundPermissionsAsync();
        if (locationPermission.granted) {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      } catch {
        // Use default coordinates
      }

      setUploadProgress(0.2);

      const formData = new FormData();
      formData.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: 'application/octet-stream',
      } as any);
      formData.append('name', spaceName.trim());
      formData.append('buildingType', buildingType);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('userId', userId ?? 'local-user');
      formData.append('displayName', displayName ?? 'Anonymous');
      formData.append('selectedProfiles', JSON.stringify(selectedProfiles));

      setUploadProgress(0.4);

      const response = await fetch(`${API_URL}/api/upload-scan`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(0.8);

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.scanner && (!userId || userId === 'local-user')) {
        setUser({
          userId: data.scanner.id,
          displayName: data.scanner.displayName,
          email: '',
          token: '',
        });
      }

      setUploadResult({
        territoryName: data.territory?.name ?? spaceName.trim(),
        territoryId: data.territory?.id ?? '',
        hazardCount: data.summary?.total ?? data.hazards?.length ?? 0,
      });

      setUploadProgress(1);
      await queryClient.invalidateQueries();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErrorMessage('Upload failed. Check your connection and try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('pick');
    }
  };

  const handleViewTerritory = () => {
    if (uploadResult?.territoryId) {
      navigation.navigate('TerritoryDetail', { territoryId: uploadResult.territoryId });
    }
    resetState();
  };

  const handleBackToMap = () => {
    resetState();
    (navigation as any).navigate('MainTabs', { screen: 'Map' });
  };

  const resetState = () => {
    setStep('pick');
    setPickedFile(null);
    setSpaceName('');
    setBuildingType('public');
    setUploadProgress(0);
    setUploadResult(null);
    setErrorMessage(null);
  };

  if (step === 'uploading') {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          {uploadResult ? (
            <>
              <Animated.View style={[styles.resultSection, resultScale]}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={Colors.hazardLow} />
                </View>
                <Text style={styles.resultTitle}>{uploadResult.territoryName}</Text>
                <Text style={styles.resultSubtitle}>
                  {uploadResult.hazardCount} accessibility hazard{uploadResult.hazardCount !== 1 ? 's' : ''} detected
                </Text>
              </Animated.View>

              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleViewTerritory}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="View scanned territory"
                >
                  <Ionicons name="map-outline" size={18} color={Colors.background} />
                  <Text style={styles.primaryButtonText}>View Territory</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToMap}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Return to map"
                >
                  <Text style={styles.secondaryButtonText}>Back to Map</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <RadarPulse size={100} color={Colors.primary}>
                <Ionicons name="cloud-upload-outline" size={36} color={Colors.primary} />
              </RadarPulse>

              <View style={styles.uploadingTextBlock}>
                <Text style={styles.uploadingTitle}>
                  {uploadProgress < 0.5 ? 'Uploading scan...' : 'Analyzing your LiDAR scan...'}
                </Text>
                <Text style={styles.uploadingSubtitle}>
                  Analyzing your LiDAR scan for accessibility hazards...
                </Text>
                <Text style={styles.progressText}>{Math.round(uploadProgress * 100)}%</Text>
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.hazardHigh} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centeredContent}>
        <Animated.View style={[styles.headerSection, headerFade]}>
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-upload-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Upload LiDAR Scan</Text>
          <Text style={styles.subtitle}>Import a Polycam glTF export</Text>
        </Animated.View>

        <Animated.View style={[styles.formSection, contentFade]}>
          {!pickedFile ? (
            <TouchableOpacity
              style={styles.uploadZone}
              onPress={() => void handlePickFile()}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Select glTF or zip file to upload"
            >
              <Ionicons name="document-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.uploadZoneTitle}>Select Scan File</Text>
              <Text style={styles.uploadZoneSubtitle}>glTF, GLB, or ZIP from Polycam</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.fileInfoCard}>
                <View style={styles.fileInfoLeft}>
                  <Ionicons name="document-attach" size={22} color={Colors.primary} />
                  <View style={styles.fileInfoText}>
                    <Text style={styles.fileName} numberOfLines={1}>{pickedFile.name}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(pickedFile.size)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setPickedFile(null)}
                  style={styles.removeFileButton}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected file"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Space Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={spaceName}
                  onChangeText={setSpaceName}
                  placeholder="e.g. Engineering Building Lobby"
                  placeholderTextColor={Colors.textMuted}
                  accessibilityLabel="Space name"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Building Type</Text>
                <View style={styles.chipRow}>
                  {BUILDING_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt.key}
                      style={[
                        styles.chip,
                        buildingType === bt.key && styles.chipActive,
                      ]}
                      onPress={() => setBuildingType(bt.key)}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel={`${bt.label} building type`}
                      accessibilityState={{ selected: buildingType === bt.key }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          buildingType === bt.key && styles.chipTextActive,
                        ]}
                      >
                        {bt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => void handleUpload()}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Upload and analyze scan"
              >
                <Ionicons name="cloud-upload" size={18} color={Colors.background} />
                <Text style={styles.primaryButtonText}>Upload & Analyze</Text>
              </TouchableOpacity>
            </>
          )}

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.hazardHigh} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.glowPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Form
  formSection: {
    width: '100%',
    gap: 16,
  },
  uploadZone: {
    backgroundColor: Colors.glowPrimary,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primaryDark + '44',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  uploadZoneTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  uploadZoneSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // File info
  fileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  fileInfoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileInfoText: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fileSize: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  removeFileButton: {
    padding: 4,
  },

  // Inputs
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.background,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  // Uploading
  uploadingTextBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  uploadingTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  uploadingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressText: {
    color: Colors.primary,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 12,
  },

  // Result
  resultSection: {
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    marginBottom: 8,
  },
  resultTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resultSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  resultActions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.hazardHigh + '22',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.hazardHigh + '33',
  },
  errorText: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
