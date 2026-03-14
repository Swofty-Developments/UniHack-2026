import React, { useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';
import { getSelectedProfilesSummary } from '../utils/profileSelection';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';
import { useFadeIn, useStaggeredEntrance } from '../hooks/useAnimations';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { selectedProfiles } = useProfileStore();
  const { displayName, isOnboarded } = useAuthStore();

  const heroFade = useFadeIn(0);
  const cardAnims = useStaggeredEntrance(4, 80);

  const activeProfiles = useMemo(
    () => ACCESSIBILITY_PROFILES.filter((p) => selectedProfiles.includes(p.id)),
    [selectedProfiles],
  );

  const activeSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles],
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 14,
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 12,
        },
      ]}
    >
      {/* Header */}
      <Animated.View style={heroFade}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Your AccessAtlas</Text>
      </Animated.View>

      {/* Identity card */}
      <Animated.View style={cardAnims[0]}>
        {isOnboarded && displayName ? (
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName[0]}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{displayName}</Text>
              <Text style={styles.identityCaption}>Scans credited publicly</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile settings"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.onboardCta}
            onPress={() => navigation.navigate('Onboarding')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Create scanner identity for credited scans and leaderboard"
          >
            <View style={styles.onboardIconWrap}>
              <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.onboardTextBlock}>
              <Text style={styles.onboardTitle}>Create scanner identity</Text>
              <Text style={styles.onboardBody}>Required for credited scans & leaderboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Active modes summary */}
      <Animated.View style={[styles.modesCard, cardAnims[1]]}>
        <View style={styles.modesHeader}>
          <Text style={styles.modesLabel}>Active accessibility modes</Text>
          <Text style={styles.modesCount}>{selectedProfiles.length} active</Text>
        </View>
        <View style={styles.chipRow}>
          {activeProfiles.map((profile) => {
            const color = Colors.profileColors[profile.id] || Colors.primary;
            return (
              <View key={profile.id} style={[styles.modeChip, { backgroundColor: `${color}18` }]}>
                <View style={[styles.modeChipDot, { backgroundColor: color }]} />
                <Text style={[styles.modeChipText, { color }]}>{profile.label}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Navigation cards */}
      <View style={styles.navSection}>
        <Animated.View style={cardAnims[2]}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('AccessibilityModes')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Manage accessibility modes"
          >
            <View style={[styles.navIconWrap, { backgroundColor: Colors.glowPrimary }]}>
              <Ionicons name="accessibility-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.navCardText}>
              <Text style={styles.navCardTitle}>Manage accessibility modes</Text>
              <Text style={styles.navCardBody}>Toggle modes for hazard filtering</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={cardAnims[3]}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <View style={[styles.navIconWrap, { backgroundColor: Colors.glowAccent }]}>
              <Ionicons name="settings-outline" size={22} color={Colors.accent} />
            </View>
            <View style={styles.navCardText}>
              <Text style={styles.navCardTitle}>Settings</Text>
              <Text style={styles.navCardBody}>Edit name, app info, privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    gap: 16,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: { color: Colors.text, fontSize: 38, fontWeight: '800', letterSpacing: -1 },

  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.background, fontSize: 26, fontWeight: '800' },
  identityInfo: { flex: 1 },
  identityName: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  identityCaption: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  onboardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glowPrimary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primaryDark + '33',
    gap: 14,
  },
  onboardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.glowPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardTextBlock: { flex: 1 },
  onboardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  onboardBody: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },

  modesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 10,
  },
  modesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modesLabel: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  modesCount: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modeChipDot: { width: 6, height: 6, borderRadius: 3 },
  modeChipText: { fontSize: 12, fontWeight: '700' },

  navSection: { flex: 1, justifyContent: 'flex-end', gap: 10 },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 14,
  },
  navIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCardText: { flex: 1 },
  navCardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  navCardBody: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
});
