import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { trpc } from '../utils/trpc';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Colors } from '../constants/colors';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { RootStackParamList } from '../types/navigation';
import { AccessibilityProfileId, Hazard } from '../types/hazard';
import { trpcClient } from '../utils/trpcClient';
import {
  getSelectedProfilesSummary,
  hazardMatchesSelectedProfiles,
  toggleSelectedProfile,
} from '../utils/profileSelection';
import { HazardCard } from '../components/territory/HazardCard';
import { useFadeIn } from '../hooks/useAnimations';

type TerritoryHazardsRoute = RouteProp<RootStackParamList, 'TerritoryHazards'>;

export default function TerritoryHazardsScreen() {
  const route = useRoute<TerritoryHazardsRoute>();
  const insets = useSafeAreaInsets();
  const { territoryId } = route.params;
  const { data: territory, isLoading } = trpc.territory.getById.useQuery(
    { id: territoryId },
    { enabled: !!territoryId },
  );
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { userId } = useAuthStore();

  const headerFade = useFadeIn(0);

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (!userId) return;
    try {
      await trpcClient.user.updateProfile.mutate({ selectedProfiles: nextProfiles });
    } catch {
      // Keep local
    }
  };

  const profileSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles],
  );

  const filteredHazards = useMemo(() => {
    if (!territory) return [];
    return territory.hazards.filter((hazard: Hazard) =>
      hazardMatchesSelectedProfiles(hazard, selectedProfiles),
    );
  }, [territory, selectedProfiles]);

  const allHazards = territory?.hazards ?? [];

  if (isLoading || !territory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={filteredHazards}
      keyExtractor={useCallback((item: Hazard, index: number) => (item as any).id ?? `${item.type}-${item.severity}-${index}`, [])}
      renderItem={useCallback(({ item, index }: { item: Hazard; index: number }) => <HazardCard hazard={item} index={index} />, [])}
      ListHeaderComponent={
        <Animated.View style={[styles.header, headerFade]}>
          {/* Filter chips */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Filter by accessibility mode</Text>
            <Text style={styles.filterSummary}>
              Showing hazards for {profileSummary.toLowerCase()}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {ACCESSIBILITY_PROFILES.map((profile) => {
                const isSelected = selectedProfiles.includes(profile.id);
                const color = Colors.profileColors[profile.id] || Colors.primary;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => void handleProfileToggle(profile.id)}
                    activeOpacity={0.88}
                    accessibilityRole="switch"
                    accessibilityLabel={`Filter by ${profile.label}`}
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text style={[
                      styles.chipText,
                      isSelected && { color: Colors.background },
                    ]}>
                      {profile.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.glowAccent }]}>
              <Text style={[styles.statValue, { color: Colors.accent }]}>{allHazards.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.glowPrimary }]}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {filteredHazards.length}
              </Text>
              <Text style={styles.statLabel}>Matching</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.glowHazardHigh }]}>
              <Text style={[styles.statValue, { color: Colors.hazardHigh }]}>
                {filteredHazards.filter((h: Hazard) => h.severity === 'high').length}
              </Text>
              <Text style={styles.statLabel}>High</Text>
            </View>
          </View>

          {filteredHazards.length > 0 ? (
            <Text style={styles.listLabel}>
              {filteredHazards.length} hazard{filteredHazards.length !== 1 ? 's' : ''} found
            </Text>
          ) : null}
        </Animated.View>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={Colors.primary} />
          <Text style={styles.emptyTitle}>No hazards for active modes</Text>
          <Text style={styles.emptyBody}>
            Try toggling additional accessibility modes above to see more barrier types.
          </Text>
        </View>
      }
      ListFooterComponent={<View style={{ height: insets.bottom + 24 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={7}
    />
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
  listContent: { paddingHorizontal: 20 },
  header: { gap: 14, paddingTop: 8, paddingBottom: 14 },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 8,
  },
  filterLabel: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  filterSummary: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statValue: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  listLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
