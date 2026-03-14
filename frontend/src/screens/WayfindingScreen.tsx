import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api').replace(/\/api$/, '');

const SEVERITY_COLORS_CSS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

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

  const viewerUrl = useMemo(() => {
    if (!selectedTerritory?.modelUrl) return null;
    const filename = selectedTerritory.modelUrl.split('/').pop() || '';
    const hazardPins = filteredHazards
      .filter((h: Hazard) => h.position3D)
      .map((h: Hazard) => ({
        x: h.position3D!.x,
        z: h.position3D!.z,
        color: SEVERITY_COLORS_CSS[h.severity] ?? '#f59e0b',
        type: h.type,
        severity: h.severity,
        description: h.description,
      }));
    const hazardsParam = encodeURIComponent(JSON.stringify(hazardPins));
    const panelHeight = 180 + Math.max(insets.bottom, 16);
    return `${BASE_URL}/api/viewer/${filename}?hazards=${hazardsParam}&panelHeight=${panelHeight}`;
  }, [selectedTerritory?.modelUrl, filteredHazards, insets.bottom]);

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (userId) {
      try {
        await trpcClient.user.updateProfile.mutate({ selectedProfiles: nextProfiles });
      } catch {}
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
      {viewerUrl ? (
        <WebView
          style={styles.webview}
          source={{ uri: viewerUrl }}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'debug') {
                console.log('[Viewer] Model bounds:', msg.bounds);
                console.log('[Viewer] Pin coords:', JSON.stringify(msg.pinCoords));
                console.log('[Viewer] Pins placed:', msg.pinCount);
              }
            } catch {}
          }}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading wayfinding...</Text>
        </View>
      )}

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
  webview: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

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
  topBarTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  profileChipsRow: { gap: 8, paddingRight: 8 },
  profileChipSmall: {
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  profileChipSmallText: { fontSize: 11, fontWeight: '700' },

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
    minHeight: 180,
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
  hazardBadgeText: { color: Colors.hazardHigh, fontSize: 12, fontWeight: '700' },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskText: { fontSize: 12, fontWeight: '700' },
  profileSummaryText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  concernsSection: { gap: 8 },
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
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  concernText: { flex: 1, color: Colors.text, fontSize: 13, fontWeight: '600' },
  noConcernsText: { color: Colors.hazardLow, fontSize: 13, fontWeight: '600' },
});
