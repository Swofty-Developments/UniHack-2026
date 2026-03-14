import React, { useMemo } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { Colors } from '../constants/colors';
import { trpcClient } from '../utils/trpcClient';
import { AccessibilityProfileId } from '../types/hazard';
import { getSelectedProfilesSummary, toggleSelectedProfile } from '../utils/profileSelection';
import { ProfileCard } from '../components/profile/ProfileCard';
import { useFadeIn } from '../hooks/useAnimations';

export default function AccessibilityModesScreen() {
  const insets = useSafeAreaInsets();
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { userId } = useAuthStore();

  const headerFade = useFadeIn(0);

  const activeSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles],
  );

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    if (!userId) return;
    try {
      await trpcClient.user.updateProfile.mutate({ selectedProfiles: nextProfiles });
    } catch {
      // Keep local
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={ACCESSIBILITY_PROFILES}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProfileCard
          profileId={item.id}
          label={item.label}
          description={item.description}
          flaggedHazards={item.flaggedHazards}
          isSelected={selectedProfiles.includes(item.id)}
          onToggle={() => void handleProfileToggle(item.id)}
        />
      )}
      ListHeaderComponent={
        <Animated.View style={[styles.header, headerFade]}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryNumber}>{selectedProfiles.length}</Text>
                <Text style={styles.summaryCaption}>active</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryBlock, { flex: 3 }]}>
                <Text style={styles.summaryText}>{activeSummary}</Text>
                <Text style={styles.summaryCaption}>shaping hazard filtering & routes</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      }
      ListFooterComponent={<View style={{ height: insets.bottom + 24 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: 20 },
  header: { gap: 12, paddingTop: 8, paddingBottom: 14 },
  summaryCard: {
    backgroundColor: Colors.glowPrimary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.primaryDark + '33',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryBlock: { alignItems: 'center' },
  summaryNumber: { color: Colors.primary, fontSize: 36, fontWeight: '800' },
  summaryText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  summaryCaption: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },
});
