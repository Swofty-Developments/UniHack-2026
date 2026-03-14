import React, { useCallback, useMemo } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '../utils/trpc';
import { useAuthStore } from '../stores/useAuthStore';
import { Colors } from '../constants/colors';
import { LeaderboardEntry } from '../types/user';
import { formatArea } from '../utils/formatArea';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import { useFadeIn, useScaleIn, useStaggeredEntrance } from '../hooks/useAnimations';
import { AnimatedCounter } from '../components/common/AnimatedCounter';

const MEDAL_COLORS = [Colors.medalGold, Colors.medalSilver, Colors.medalBronze];
const MEDAL_GLOWS = [Colors.medalGoldGlow, Colors.medalSilverGlow, Colors.medalBronzeGlow];

const PodiumItem = React.memo(function PodiumItem({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const height = position === 0 ? 130 : position === 1 ? 100 : 80;
  const scaleStyle = useScaleIn(position === 0 ? 200 : position === 1 ? 100 : 300);

  return (
    <Animated.View style={[styles.podiumItem, scaleStyle]}>
      <View style={[styles.podiumAvatar, { borderColor: MEDAL_COLORS[position] }]}>
        <Text style={styles.podiumAvatarText}>{entry.displayName[0]}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.displayName}</Text>
      <Text style={styles.podiumArea}>{formatArea(entry.totalAreaScanned)}</Text>
      <View style={[styles.podiumBar, {
        height,
        backgroundColor: MEDAL_GLOWS[position],
        borderColor: `${MEDAL_COLORS[position]}44`,
      }]}>
        <Text style={[styles.podiumRank, { color: MEDAL_COLORS[position] }]}>{position + 1}</Text>
      </View>
    </Animated.View>
  );
});

const LeaderboardItem = React.memo(function LeaderboardItem({ entry, isCurrentUser, index }: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const fadeStyle = useFadeIn(index * 60);

  return (
    <Animated.View style={fadeStyle}>
      <View style={[styles.listItem, isCurrentUser && styles.listItemHighlight]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rank}>{entry.rank}</Text>
        </View>
        <View style={[styles.avatarSmall, isCurrentUser && styles.avatarSmallHighlight]}>
          <Text style={styles.avatarSmallText}>{entry.displayName[0]}</Text>
        </View>
        <View style={styles.listItemInfo}>
          <Text style={[styles.listItemName, isCurrentUser && styles.listItemNameHighlight]}>
            {entry.displayName}{isCurrentUser ? ' (You)' : ''}
          </Text>
          <Text style={styles.listItemStats}>
            {entry.territoriesCount} territor{entry.territoriesCount === 1 ? 'y' : 'ies'}
          </Text>
        </View>
        <Text style={styles.listItemArea}>{formatArea(entry.totalAreaScanned)}</Text>
      </View>
    </Animated.View>
  );
});

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: rawEntries = [], isLoading, refetch } = trpc.leaderboard.getAll.useQuery();
  const entries: LeaderboardEntry[] = rawEntries as LeaderboardEntry[];
  const { userId } = useAuthStore();

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);
  const currentUserEntry = useMemo(() => entries.find((entry) => entry.userId === userId) ?? null, [entries, userId]);

  const headerFade = useFadeIn(0);

  return (
    <FlatList
      style={styles.container}
      data={rest}
      keyExtractor={(item) => item.userId}
      renderItem={useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => (
        <LeaderboardItem entry={item} isCurrentUser={item.userId === userId} index={index} />
      ), [userId])}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => void refetch()}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={[styles.headerContainer, { paddingTop: insets.top + 14 }]}>
          <Animated.View style={headerFade}>
            <Text style={styles.heroEyebrow}>Community</Text>
            <Text style={styles.heroTitle}>Leaderboard</Text>
            <Text style={styles.heroBody}>
              Rankings reflect real scanned coverage. Keep scanning to climb.
            </Text>
          </Animated.View>

          {currentUserEntry ? (
            <Animated.View style={[styles.userSummaryCard, headerFade]}>
              <View style={styles.userSummaryTop}>
                <View style={styles.userSummaryAvatar}>
                  <Text style={styles.userSummaryAvatarText}>
                    {currentUserEntry.displayName[0]}
                  </Text>
                </View>
                <View style={styles.userSummaryInfo}>
                  <Text style={styles.userSummaryName}>{currentUserEntry.displayName}</Text>
                  <Text style={styles.userSummaryMeta}>
                    {currentUserEntry.territoriesCount} territories credited
                  </Text>
                </View>
              </View>
              <View style={styles.userSummaryStats}>
                <View style={styles.userStatBlock}>
                  <AnimatedCounter value={currentUserEntry.rank} style={styles.userStatValue} duration={800} />
                  <Text style={styles.userStatLabel}>Rank</Text>
                </View>
                <View style={styles.userStatDivider} />
                <View style={styles.userStatBlock}>
                  <Text style={styles.userStatValue}>
                    {formatArea(currentUserEntry.totalAreaScanned)}
                  </Text>
                  <Text style={styles.userStatLabel}>Area scanned</Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {topThree.length > 0 ? (
            <View style={styles.podiumSection}>
              <Text style={styles.sectionTitle}>Top scanners</Text>
              <View style={styles.podium}>
                {topThree[1] ? <PodiumItem entry={topThree[1]} position={1} /> : <View style={styles.podiumSpacer} />}
                {topThree[0] ? <PodiumItem entry={topThree[0]} position={0} /> : <View style={styles.podiumSpacer} />}
                {topThree[2] ? <PodiumItem entry={topThree[2]} position={2} /> : <View style={styles.podiumSpacer} />}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyBody}>
                Complete the first scan to populate the community leaderboard.
              </Text>
            </View>
          )}

          {rest.length > 0 ? <Text style={styles.sectionTitle}>All explorers</Text> : null}
        </View>
      }
      ListFooterComponent={<View style={{ height: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 20 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: 20 },
  headerContainer: { gap: 18, paddingBottom: 16 },
  heroEyebrow: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroBody: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
  userSummaryCard: {
    backgroundColor: Colors.glowPrimary,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.primaryDark + '33',
    gap: 16,
  },
  userSummaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  userSummaryAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSummaryAvatarText: { color: Colors.background, fontSize: 20, fontWeight: '800' },
  userSummaryInfo: { flex: 1 },
  userSummaryName: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  userSummaryMeta: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  userSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 14,
  },
  userStatBlock: { flex: 1, alignItems: 'center' },
  userStatValue: { color: Colors.primary, fontSize: 28, fontWeight: '800' },
  userStatLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  userStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  podiumSection: { gap: 14 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumSpacer: { flex: 1 },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
  },
  podiumAvatarText: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  podiumName: { fontSize: 11, color: Colors.text, fontWeight: '700', marginBottom: 3 },
  podiumArea: { fontSize: 10, color: Colors.textSecondary, marginBottom: 6 },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  podiumRank: { fontSize: 32, fontWeight: '800' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  listItemHighlight: {
    borderColor: Colors.primaryDark + '4D',
    backgroundColor: Colors.glowPrimary,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rank: { fontSize: 14, fontWeight: '800', color: Colors.text },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallHighlight: { backgroundColor: Colors.primary },
  avatarSmallText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  listItemNameHighlight: { color: Colors.primary },
  listItemStats: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  listItemArea: { fontSize: 14, fontWeight: '700', color: Colors.accent, letterSpacing: 0.2 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
