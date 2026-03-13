import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerritoryStore } from '../stores/useTerritoryStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Colors } from '../constants/colors';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { RootStackParamList } from '../types/navigation';
import { AccessibilityProfileId, Hazard } from '../types/hazard';
import { updateUserProfile } from '../services/users';
import { formatArea } from '../utils/formatArea';
import {
  getSelectedProfilesSummary,
  hazardMatchesSelectedProfiles,
  toggleSelectedProfile,
} from '../utils/profileSelection';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type TerritoryDetailRoute = RouteProp<RootStackParamList, 'TerritoryDetail'>;

const SEVERITY_COLORS = {
  high: Colors.hazardHigh,
  medium: Colors.hazardMedium,
  low: Colors.hazardLow,
};

function formatBuildingType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatHazardType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatScanDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently scanned';
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TerritoryDetailScreen() {
  const route = useRoute<TerritoryDetailRoute>();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { territoryId } = route.params;
  const { selectedTerritory, isLoading, selectTerritory } = useTerritoryStore();
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { userId } = useAuthStore();

  useEffect(() => {
    void selectTerritory(territoryId);
  }, [territoryId, selectTerritory]);

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (!userId) {
      return;
    }

    try {
      await updateUserProfile(userId, nextProfiles);
    } catch {
      // Keep the local profiles selected even if sync fails.
    }
  };

  const profileSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles]
  );

  if (isLoading || !selectedTerritory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filteredHazards = selectedTerritory.hazards.filter((hazard: Hazard) =>
    hazardMatchesSelectedProfiles(hazard, selectedProfiles)
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 20, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.heroTitle}>{selectedTerritory.name}</Text>
              <Text style={styles.heroSubtitle}>
                {formatBuildingType(selectedTerritory.buildingType)} territory
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{selectedTerritory.status}</Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>{selectedTerritory.description}</Text>

          <View style={styles.heroFactsRow}>
            <View style={styles.factPill}>
              <Ionicons name="person-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.factPillText}>{selectedTerritory.claimedBy.displayName}</Text>
            </View>
            <View style={styles.factPill}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.factPillText}>{formatScanDate(selectedTerritory.scanDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Coverage</Text>
            <Text style={styles.metricValue}>{formatArea(selectedTerritory.areaSqMeters)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>All hazards</Text>
            <Text style={styles.metricValue}>{selectedTerritory.hazardSummary.total}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Relevant now</Text>
            <Text style={styles.metricValue}>{filteredHazards.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewModelButton}
          onPress={() =>
            navigation.navigate('ModelViewer', {
              territoryId: selectedTerritory.id,
              modelUrl: selectedTerritory.modelUrl,
            })
          }
          activeOpacity={0.92}
        >
          <View>
            <Text style={styles.viewModelEyebrow}>Indoor 3D viewer</Text>
            <Text style={styles.viewModelTitle}>Open the model and safe-route guidance</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active accessibility modes</Text>
          <Text style={styles.sectionBody}>
            We are filtering this territory for {profileSummary.toLowerCase()}.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRail}>
            {ACCESSIBILITY_PROFILES.map((profile) => {
              const isSelected = selectedProfiles.includes(profile.id);
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={[styles.profileChip, isSelected && styles.profileChipActive]}
                  onPress={() => void handleProfileToggle(profile.id)}
                  activeOpacity={0.92}
                >
                  <Text style={[styles.profileChipText, isSelected && styles.profileChipTextActive]}>
                    {profile.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.hazardsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Relevant hazards</Text>
            <Text style={styles.sectionBody}>
              Showing the union of barriers across your currently active modes.
            </Text>
          </View>
          <View style={styles.hazardCountPill}>
            <Text style={styles.hazardCountText}>{filteredHazards.length}</Text>
          </View>
        </View>

        {filteredHazards.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={28} color={Colors.accent} />
            <Text style={styles.emptyTitle}>No hazards flagged for these active modes</Text>
            <Text style={styles.emptyBody}>
              Toggle additional modes if you want to inspect more route constraints and barrier types.
            </Text>
          </View>
        ) : (
          filteredHazards.map((hazard: Hazard) => (
            <View key={hazard.id} style={styles.hazardCard}>
              <View
                style={[
                  styles.severityAccent,
                  { backgroundColor: SEVERITY_COLORS[hazard.severity] },
                ]}
              />
              <View style={styles.hazardContent}>
                <View style={styles.hazardHeader}>
                  <Text style={styles.hazardTitle}>{formatHazardType(hazard.type)}</Text>
                  <View
                    style={[
                      styles.severityPill,
                      { backgroundColor: `${SEVERITY_COLORS[hazard.severity]}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityPillText,
                        { color: SEVERITY_COLORS[hazard.severity] },
                      ]}
                    >
                      {hazard.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.hazardDescription}>{hazard.description}</Text>
                <View style={styles.hazardMetaRow}>
                  <Text style={styles.hazardMetaText}>
                    Confidence {Math.round(hazard.confidence * 100)}%
                  </Text>
                  <Text style={styles.hazardMetaText}>{hazard.detectedBy.toUpperCase()}</Text>
                </View>
                <View style={styles.affectedProfilesRow}>
                  {hazard.affectsProfiles.map((profileId: AccessibilityProfileId) => (
                    <Text key={profileId} style={styles.affectedChip}>
                      {ACCESSIBILITY_PROFILES.find((profile) => profile.id === profileId)?.label || profileId}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitleBlock: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  heroFactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
  },
  factPillText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  viewModelButton: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewModelEyebrow: {
    color: 'rgba(219, 234, 254, 0.86)',
    fontSize: 12,
    marginBottom: 4,
  },
  viewModelTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    gap: 10,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  profileRail: {
    gap: 8,
    paddingRight: 8,
  },
  profileChip: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  profileChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileChipTextActive: {
    color: Colors.white,
  },
  hazardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hazardCountPill: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardCountText: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  hazardCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  severityAccent: {
    width: 6,
  },
  hazardContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hazardTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  severityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  severityPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hazardDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  hazardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  hazardMetaText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  affectedProfilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  affectedChip: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(51, 65, 85, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
