import React, { useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeaderboardStore } from '../stores/useLeaderboardStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Colors } from '../constants/colors';
import { LeaderboardEntry } from '../types/user';
import { formatArea } from '../utils/formatArea';

const MEDAL_COLORS = ['#FFD166', '#CBD5F5', '#F59E0B'];

function PodiumItem({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const height = position === 0 ? 126 : position === 1 ? 98 : 82;
  return (
    <View style={styles.podiumItem}>
      <View style={styles.podiumAvatar}>
        <Text style={styles.podiumAvatarText}>{entry.displayName[0]}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.displayName}</Text>
      <Text style={styles.podiumArea}>{formatArea(entry.totalAreaScanned)}</Text>
      <View style={[styles.podiumBar, { height, backgroundColor: MEDAL_COLORS[position] }]}>
        <Text style={styles.podiumRank}>{position + 1}</Text>
      </View>
    </View>
  );
}

function LeaderboardItem({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  return (
    <View style={[styles.listItem, isCurrentUser && styles.listItemHighlight]}>
      <View style={styles.rankBadge}>
        <Text style={styles.rank}>{entry.rank}</Text>
      </View>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarSmallText}>{entry.displayName[0]}</Text>
      </View>
      <View style={styles.listItemInfo}>
        <Text style={[styles.listItemName, isCurrentUser && styles.listItemNameHighlight]}>
          {entry.displayName}{isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text style={styles.listItemStats}>{entry.territoriesCount} territories captured</Text>
      </View>
      <Text style={styles.listItemArea}>{formatArea(entry.totalAreaScanned)}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { entries, isLoading, fetchLeaderboard } = useLeaderboardStore();
  const { userId } = useAuthStore();

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUserEntry = entries.find((entry) => entry.userId === userId) ?? null;

  return (
    <FlatList
      style={styles.container}
      data={rest}
      keyExtractor={(item) => item.userId}
      renderItem={({ item }) => (
        <LeaderboardItem entry={item} isCurrentUser={item.userId === userId} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={fetchLeaderboard}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={[styles.headerContainer, { paddingTop: insets.top + 14 }]}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Community leaderboard</Text>
            <Text style={styles.heroTitle}>Who is mapping the most accessible space?</Text>
            <Text style={styles.heroBody}>
              Rankings update as new scans are completed, so the board reflects actual captured coverage instead of static demo stats.
            </Text>
          </View>

          {currentUserEntry ? (
            <View style={styles.userSummaryCard}>
              <Text style={styles.userSummaryLabel}>Your standing</Text>
              <View style={styles.userSummaryRow}>
                <Text style={styles.userSummaryRank}>#{currentUserEntry.rank}</Text>
                <Text style={styles.userSummaryArea}>{formatArea(currentUserEntry.totalAreaScanned)}</Text>
              </View>
              <Text style={styles.userSummaryMeta}>{currentUserEntry.territoriesCount} territories credited to you</Text>
            </View>
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
              <Text style={styles.emptyBody}>Complete the first scan to populate the community leaderboard.</Text>
            </View>
          )}

          {rest.length > 0 ? <Text style={styles.sectionTitle}>More explorers</Text> : null}
        </View>
      }
      ListFooterComponent={<View style={styles.footerSpacer} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: 20 },
  headerContainer: { gap: 16, paddingBottom: 12 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroEyebrow: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: { color: Colors.text, fontSize: 28, fontWeight: '700', marginBottom: 10 },
  heroBody: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  userSummaryCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  userSummaryLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  userSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userSummaryRank: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  userSummaryArea: { color: Colors.primaryLight, fontSize: 18, fontWeight: '700' },
  userSummaryMeta: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  podiumSection: { gap: 14 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 12 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumSpacer: { flex: 1 },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  podiumName: { fontSize: 12, color: Colors.text, fontWeight: '700', marginBottom: 4 },
  podiumArea: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: { fontSize: 24, fontWeight: '700', color: Colors.background },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
  },
  listItemHighlight: {
    borderColor: 'rgba(37, 99, 235, 0.45)',
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rank: { fontSize: 15, fontWeight: '700', color: Colors.text },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  listItemNameHighlight: { color: Colors.white },
  listItemStats: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  listItemArea: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  footerSpacer: { height: 120 },
});
