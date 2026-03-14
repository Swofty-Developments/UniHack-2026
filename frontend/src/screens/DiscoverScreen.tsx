import React, { useCallback, useMemo } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { trpc } from '../utils/trpc';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { Territory } from '../types/territory';
import { formatArea } from '../utils/formatArea';
import { BUILDING_TYPE_LABELS, label } from '../constants/labels';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import { territoryIsInMonashShowcase } from '../constants/showcase';
import { useFadeIn } from '../hooks/useAnimations';
import { AnimatedCounter } from '../components/common/AnimatedCounter';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SEVERITY_COLORS: Record<string, string> = {
  high: Colors.hazardHigh,
  medium: Colors.hazardMedium,
  low: Colors.hazardLow,
};

const TerritoryCard = React.memo(function TerritoryCard({ territory, index }: { territory: Territory; index: number }) {
  const navigation = useNavigation<NavProp>();
  const fadeStyle = useFadeIn(index * 80);
  const hazardTotal = territory.hazardSummary?.total ?? 0;
  const highCount = territory.hazardSummary?.bySeverity?.high ?? 0;
  const medCount = territory.hazardSummary?.bySeverity?.medium ?? 0;
  const lowCount = territory.hazardSummary?.bySeverity?.low ?? 0;

  return (
    <Animated.View style={fadeStyle}>
      <TouchableOpacity
        style={styles.territoryCard}
        onPress={() => navigation.navigate('TerritoryDetail', { territoryId: territory.id })}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${territory.name}, ${hazardTotal} hazards, ${formatArea(territory.areaSqMeters)}`}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="business-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>{territory.name}</Text>
            <Text style={styles.cardSubtitle}>
              {label(BUILDING_TYPE_LABELS, territory.buildingType)}
            </Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: territory.status === 'active' ? Colors.primary : Colors.accent },
          ]} />
        </View>

        {territory.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {territory.description}
          </Text>
        ) : null}

        <View style={styles.cardMetaRow}>
          <View style={styles.cardMetaPill}>
            <Ionicons name="resize-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.cardMetaText}>{formatArea(territory.areaSqMeters)}</Text>
          </View>
          <View style={styles.cardMetaPill}>
            <Ionicons name="warning-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.cardMetaText}>
              {hazardTotal} hazard{hazardTotal !== 1 ? 's' : ''}
            </Text>
          </View>
          {territory.claimedBy ? (
            <View style={styles.cardMetaPill}>
              <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.cardMetaText}>{territory.claimedBy.displayName}</Text>
            </View>
          ) : null}
        </View>

        {hazardTotal > 0 ? (
          <View style={styles.severityBar}>
            {highCount > 0 ? (
              <View style={[styles.severitySegment, {
                flex: highCount,
                backgroundColor: SEVERITY_COLORS.high,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              }]} />
            ) : null}
            {medCount > 0 ? (
              <View style={[styles.severitySegment, {
                flex: medCount,
                backgroundColor: SEVERITY_COLORS.medium,
              }]} />
            ) : null}
            {lowCount > 0 ? (
              <View style={[styles.severitySegment, {
                flex: lowCount,
                backgroundColor: SEVERITY_COLORS.low,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }]} />
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>View details</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { data: rawTerritories = [], isLoading, refetch } = trpc.territory.getAll.useQuery();
  const territories: Territory[] = rawTerritories as Territory[];
  const headerFade = useFadeIn(0);

  const showcaseTerritories = useMemo(
    () => territories.filter((t) => territoryIsInMonashShowcase(t)),
    [territories],
  );

  const totalHazards = useMemo(
    () => showcaseTerritories.reduce((sum, t) => sum + (t.hazardSummary?.total ?? 0), 0),
    [showcaseTerritories],
  );

  const totalArea = useMemo(
    () => showcaseTerritories.reduce((sum, t) => sum + t.areaSqMeters, 0),
    [showcaseTerritories],
  );

  return (
    <FlatList
      style={styles.container}
      data={showcaseTerritories}
      keyExtractor={(item) => item.id}
      renderItem={useCallback(({ item, index }: { item: Territory; index: number }) => <TerritoryCard territory={item} index={index} />, [])}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => void refetch()}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <Animated.View style={[styles.headerContainer, { paddingTop: insets.top + 14 }, headerFade]}>
          <Text style={styles.screenEyebrow}>Explore</Text>
          <Text style={styles.screenTitle}>Discover Territories</Text>
          <Text style={styles.screenBody}>
            Browse all scanned spaces. Each territory reveals accessibility barriers detected by the
            community.
          </Text>

          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <AnimatedCounter value={showcaseTerritories.length} style={styles.statNumber} />
              <Text style={styles.statCaption}>Territories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AnimatedCounter value={totalHazards} style={styles.statNumberAccent} />
              <Text style={styles.statCaption}>Hazards found</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumberInfo}>{formatArea(totalArea)}</Text>
              <Text style={styles.statCaption}>Mapped</Text>
            </View>
          </View>

          {showcaseTerritories.length > 0 ? (
            <Text style={styles.listLabel}>All territories</Text>
          ) : null}
        </Animated.View>
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="compass-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No territories yet</Text>
            <Text style={styles.emptyBody}>
              Scan your first space to start building the accessibility map.
            </Text>
          </View>
        ) : null
      }
      ListFooterComponent={<View style={{ height: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 20 }} />}
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
  listContent: { paddingHorizontal: 20 },
  headerContainer: { gap: 8, marginBottom: 20 },
  screenEyebrow: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  screenBody: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: Colors.primary, fontSize: 30, fontWeight: '800' },
  statNumberAccent: { color: Colors.accent, fontSize: 30, fontWeight: '800' },
  statNumberInfo: { color: Colors.info, fontSize: 30, fontWeight: '800' },
  statCaption: { color: Colors.textMuted, fontSize: 10, marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  listLabel: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  territoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.glowPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleBlock: { flex: 1 },
  cardTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  cardSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardDescription: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.overlaySubtle,
  },
  cardMetaText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  severityBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  severitySegment: { minWidth: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  cardFooterText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
