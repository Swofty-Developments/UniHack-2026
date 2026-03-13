import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTerritoryStore } from '../stores/useTerritoryStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { Colors } from '../constants/colors';
import { Hazard, AccessibilityProfileId } from '../types/hazard';
import { RootStackParamList } from '../types/navigation';
import { buildAccessibleRoute } from '../utils/buildAccessibleRoute';
import { updateUserProfile } from '../services/users';
import {
  getSelectedProfilesSummary,
  hazardMatchesSelectedProfiles,
  toggleSelectedProfile,
} from '../utils/profileSelection';

type ModelViewerRoute = RouteProp<RootStackParamList, 'ModelViewer'>;

export default function ModelViewerScreen() {
  const route = useRoute<ModelViewerRoute>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView | null>(null);
  const { selectedTerritory } = useTerritoryStore();
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { userId } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);

  const hazards = selectedTerritory?.hazards || [];
  const filteredHazards = useMemo(
    () => hazards.filter((hazard: Hazard) => hazardMatchesSelectedProfiles(hazard, selectedProfiles)),
    [hazards, selectedProfiles]
  );

  const profileSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles]
  );

  const sendViewerState = () => {
    if (!webViewRef.current) {
      return;
    }

    const viewerRoute = buildAccessibleRoute(hazards, selectedProfiles);

    if (route.params.modelUrl) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MODEL',
          url: route.params.modelUrl,
        })
      );
    }

    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'SET_HAZARDS',
        hazards: filteredHazards.map((hazard: Hazard) => ({
          id: hazard.id,
          type: hazard.type,
          severity: hazard.severity,
          description: hazard.description,
          position: hazard.position3D,
        })),
      })
    );

    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'SET_ROUTE',
        points: viewerRoute.points,
        color: viewerRoute.color,
      })
    );
  };

  useEffect(() => {
    if (isLoaded) {
      sendViewerState();
    }
  }, [filteredHazards, hazards, isLoaded, selectedProfiles, selectedTerritory]);

  const onWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOADED') {
        setIsLoaded(true);
        sendViewerState();
      }
    } catch {
      // Ignore malformed bridge messages.
    }
  };

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (userId) {
      try {
        await updateUserProfile(userId, nextProfiles);
      } catch {
        // Keep local profile selection even if remote sync fails.
      }
    }
  };

  const viewerHtml = require('../../assets/three-viewer.html');

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={viewerHtml}
        style={styles.webview}
        onMessage={onWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        originWhitelist={['*']}
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + 56 }]}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{selectedTerritory?.name ?? '3D viewer'}</Text>
          <Text style={styles.headerSubtitle}>
            Safe-path guidance updates for every active accessibility mode, not just one profile.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRail}>
          {ACCESSIBILITY_PROFILES.map((profile) => {
            const isSelected = selectedProfiles.includes(profile.id);
            return (
              <TouchableOpacity
                key={profile.id}
                style={[styles.profileChip, isSelected && styles.profileChipActive]}
                onPress={() => void handleProfileToggle(profile.id)}
              >
                <Text style={[styles.profileChipText, isSelected && styles.profileChipTextActive]}>
                  {profile.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.infoBar, { bottom: insets.bottom + 20 }]}>
        <Text style={styles.infoText}>
          {filteredHazards.length} relevant hazard{filteredHazards.length !== 1 ? 's' : ''} • {profileSummary}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  webview: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    gap: 10,
  },
  headerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  headerSubtitle: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  profileRail: {
    gap: 8,
    paddingRight: 8,
  },
  profileChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  profileChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  profileChipTextActive: { color: Colors.white },
  infoBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  infoText: { color: Colors.text, fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
});
