import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { trpc } from '../utils/trpc';
import { useProfileStore } from '../stores/useProfileStore';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { Hazard } from '../types/hazard';
import { formatArea } from '../utils/formatArea';
import { BUILDING_TYPE_LABELS, label } from '../constants/labels';
import { hazardMatchesSelectedProfiles, getSelectedProfilesSummary } from '../utils/profileSelection';
import { useFadeIn, useStaggeredEntrance } from '../hooks/useAnimations';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type TerritoryDetailRoute = RouteProp<RootStackParamList, 'TerritoryDetail'>;

function formatScanDate(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently scanned';
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
  const { data: selectedTerritory, isLoading } = trpc.territory.getById.useQuery(
    { id: territoryId },
    { enabled: !!territoryId },
  );
  const { selectedProfiles } = useProfileStore();

  const heroFade = useFadeIn(0);
  const cardAnims = useStaggeredEntrance(4, 80);

  const profileSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles],
  );

  if (isLoading || !selectedTerritory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filteredHazards = selectedTerritory.hazards.filter((h: Hazard) =>
    hazardMatchesSelectedProfiles(h, selectedProfiles),
  );

  const highCount = selectedTerritory.hazards.filter((h: Hazard) => h.severity === 'high').length;
  const medCount = selectedTerritory.hazards.filter((h: Hazard) => h.severity === 'medium').length;
  const lowCount = selectedTerritory.hazards.filter((h: Hazard) => h.severity === 'low').length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 16, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[styles.heroCard, heroFade]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.heroTitle}>{selectedTerritory.name}</Text>
              <Text style={styles.heroSubtitle}>
                {label(BUILDING_TYPE_LABELS, selectedTerritory.buildingType)} territory
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{selectedTerritory.status}</Text>
            </View>
          </View>
          {selectedTerritory.description ? (
            <Text style={styles.heroDescription}>{selectedTerritory.description}</Text>
          ) : null}
          <View style={styles.factsRow}>
            <View style={styles.factPill}>
              <Ionicons name="person-outline" size={14} color={Colors.primary} />
              <Text style={styles.factPillText}>
                {selectedTerritory.claimedBy?.displayName ?? 'Unknown'}
              </Text>
            </View>
            <View style={styles.factPill}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.factPillText}>
                {formatScanDate(selectedTerritory.scanDate)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Metrics */}
        <View style={styles.metricsGrid}>
          {[
            { lbl: 'Coverage', val: formatArea(selectedTerritory.areaSqMeters), color: Colors.info, glow: Colors.glowInfo },
            { lbl: 'Hazards', val: String(selectedTerritory.hazardSummary?.total ?? 0), color: Colors.accent, glow: Colors.glowAccent },
            { lbl: 'Relevant', val: String(filteredHazards.length), color: Colors.primary, glow: Colors.glowPrimary },
          ].map((m, i) => (
            <Animated.View key={m.lbl} style={[styles.metricCard, { backgroundColor: m.glow }, cardAnims[i]]}>
              <Text style={styles.metricLabel}>{m.lbl}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.val}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Action cards - each navigates to a sub-page */}
        <Animated.View style={cardAnims[0]}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TerritoryHazards', { territoryId })}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`View ${filteredHazards.length} hazards, ${highCount} high severity`}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.glowHazardHigh }]}>
              <Ionicons name="warning-outline" size={22} color={Colors.hazardHigh} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionTitle}>View hazards</Text>
              <Text style={styles.actionBody}>
                {filteredHazards.length} relevant for {profileSummary.toLowerCase()}
              </Text>
            </View>
            {/* Severity mini-bar */}
            <View style={styles.miniSeverity}>
              {highCount > 0 ? (
                <View style={[styles.miniDot, { backgroundColor: Colors.hazardHigh }]}>
                  <Text style={styles.miniDotText}>{highCount}</Text>
                </View>
              ) : null}
              {medCount > 0 ? (
                <View style={[styles.miniDot, { backgroundColor: Colors.hazardMedium }]}>
                  <Text style={styles.miniDotText}>{medCount}</Text>
                </View>
              ) : null}
              {lowCount > 0 ? (
                <View style={[styles.miniDot, { backgroundColor: Colors.hazardLow }]}>
                  <Text style={styles.miniDotText}>{lowCount}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={cardAnims[1]}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              navigation.navigate('Wayfinding', {
                territoryId: selectedTerritory.id,
              })
            }
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Start 3D indoor wayfinding"
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.glowPrimary }]}>
              <Ionicons name="navigate-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionTitle}>Start Wayfinding</Text>
              <Text style={styles.actionBody}>
                3D indoor navigation with accessible routing
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={cardAnims[2]}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AccessibilityModes')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Change active accessibility modes, ${selectedProfiles.length} currently active`}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.glowAccent }]}>
              <Ionicons name="accessibility-outline" size={22} color={Colors.accent} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionTitle}>Change active modes</Text>
              <Text style={styles.actionBody}>
                {selectedProfiles.length} mode{selectedProfiles.length !== 1 ? 's' : ''} active
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
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
  scrollContent: { paddingHorizontal: 20, gap: 14 },

  // Hero
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroTitleBlock: { flex: 1, gap: 4 },
  heroTitle: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroSubtitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusPill: {
    backgroundColor: Colors.glowPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroDescription: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  factsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.overlaySubtle,
  },
  factPillText: { color: Colors.text, fontSize: 12, fontWeight: '600' },

  // Metrics
  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricValue: { fontSize: 26, fontWeight: '800' },

  // Action cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 14,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextBlock: { flex: 1 },
  actionTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  actionBody: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  miniSeverity: { flexDirection: 'row', gap: 4 },
  miniDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniDotText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
});
