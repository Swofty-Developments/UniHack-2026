import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ACCESSIBILITY_PROFILES } from '../constants/profiles';
import { Colors } from '../constants/colors';
import { createUser, updateUserProfile } from '../services/users';
import { AccessibilityProfileId } from '../types/hazard';
import {
  getSelectedProfilesSummary,
  toggleSelectedProfile,
} from '../utils/profileSelection';
import { FLOATING_TAB_BAR_HEIGHT } from '../components/navigation/FloatingTabBar';

const PROFILE_ICONS: Record<AccessibilityProfileId, keyof typeof Ionicons.glyphMap> = {
  wheelchair: 'accessibility-outline',
  low_vision: 'eye-outline',
  limited_mobility: 'walk-outline',
  hearing_impaired: 'volume-mute-outline',
  neurodivergent: 'shapes-outline',
  elderly: 'heart-outline',
  parents_with_prams: 'people-outline',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { selectedProfiles, setProfiles } = useProfileStore();
  const { displayName, isOnboarded, setUser, userId } = useAuthStore();
  const [nameInput, setNameInput] = useState(displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activeProfiles = useMemo(
    () => ACCESSIBILITY_PROFILES.filter((profile) => selectedProfiles.includes(profile.id)),
    [selectedProfiles]
  );

  const activeSummary = useMemo(
    () => getSelectedProfilesSummary(selectedProfiles),
    [selectedProfiles]
  );

  const handleOnboard = async () => {
    if (!nameInput.trim()) {
      setSaveMessage('Enter a display name to claim territories.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const user = await createUser(nameInput.trim(), selectedProfiles);
      setUser(user.id, user.displayName);
      setSaveMessage('Scanner profile created.');
    } catch {
      setUser('local-user', nameInput.trim());
      setSaveMessage('Saved locally. The backend profile sync can happen later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileToggle = async (profileId: AccessibilityProfileId) => {
    const nextProfiles = toggleSelectedProfile(selectedProfiles, profileId);
    setProfiles(nextProfiles);
    setSaveMessage(null);

    if (!userId) {
      return;
    }

    try {
      await updateUserProfile(userId, nextProfiles);
      setSaveMessage('Accessibility modes updated.');
    } catch {
      setSaveMessage('Modes changed locally, but remote sync failed.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 14,
            paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom + 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Accessibility profile</Text>
          <Text style={styles.heroTitle}>Stack the modes that actually match real life</Text>
          <Text style={styles.heroBody}>
            AccessAtlas now supports multiple active accessibility modes at the same time, so hazard filtering and route planning can reflect overlapping needs instead of forcing a single label.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active modes</Text>
            <Text style={styles.summaryValue}>{selectedProfiles.length}</Text>
            <Text style={styles.summaryMeta}>{activeSummary}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scanner identity</Text>
            <Text style={styles.summaryValue}>{displayName ?? 'Guest explorer'}</Text>
            <Text style={styles.summaryMeta}>Used for map claims and leaderboard credit</Text>
          </View>
        </View>

        <View style={styles.activeModesCard}>
          <Text style={styles.cardTitle}>Currently shaping routes</Text>
          <View style={styles.modeChipRow}>
            {activeProfiles.map((profile) => (
              <View key={profile.id} style={styles.modeChip}>
                <Text style={styles.modeChipText}>{profile.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {isOnboarded && displayName ? (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{displayName[0]}</Text>
            </View>
            <View style={styles.userCardCopy}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userCaption}>
                Your scans will be credited publicly, and your active accessibility modes stay synced into routing.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.onboardingCard}>
            <Text style={styles.cardTitle}>Create your scanner identity</Text>
            <Text style={styles.cardBody}>
              Optional for browsing, but required if you want your scans credited publicly.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Your display name"
              placeholderTextColor={Colors.textMuted}
              value={nameInput}
              onChangeText={setNameInput}
            />
            <TouchableOpacity
              style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
              onPress={() => void handleOnboard()}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create scanner profile</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Accessibility modes</Text>
        <Text style={styles.sectionDescription}>
          Toggle every mode that should influence hazard filtering and safe-route generation. We always keep at least one active.
        </Text>

        {ACCESSIBILITY_PROFILES.map((profile) => {
          const isSelected = selectedProfiles.includes(profile.id);
          const profileColor = Colors.profileColors[profile.id] || Colors.primary;

          return (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCard,
                isSelected && {
                  borderColor: profileColor,
                  backgroundColor: `${profileColor}18`,
                },
              ]}
              onPress={() => void handleProfileToggle(profile.id)}
              activeOpacity={0.92}
            >
              <View style={styles.profileHeader}>
                <View style={[styles.profileIcon, { backgroundColor: `${profileColor}22` }]}>
                  <Ionicons name={PROFILE_ICONS[profile.id]} size={22} color={profileColor} />
                </View>
                <View style={styles.profileCopy}>
                  <Text style={styles.profileLabel}>{profile.label}</Text>
                  <Text style={styles.profileDescription}>{profile.description}</Text>
                </View>
                <View style={[styles.profileToggle, isSelected && { backgroundColor: profileColor }]}>
                  <Ionicons
                    name={isSelected ? 'checkmark' : 'add'}
                    size={16}
                    color={isSelected ? Colors.white : Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.profileHazardRow}>
                {profile.flaggedHazards.slice(0, 3).map((hazard) => (
                  <Text key={hazard} style={styles.hazardChip}>
                    {hazard.replace(/_/g, ' ')}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  heroEyebrow: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: { color: Colors.text, fontSize: 30, fontWeight: '700', marginBottom: 10 },
  heroBody: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  summaryValue: { color: Colors.text, fontSize: 21, fontWeight: '700', marginBottom: 6 },
  summaryMeta: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  activeModesCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.24)',
    marginBottom: 16,
  },
  cardTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 10 },
  modeChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  modeChipText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: { color: Colors.white, fontSize: 24, fontWeight: '700' },
  userCardCopy: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  userCaption: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  onboardingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  sectionDescription: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    gap: 12,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileCopy: { flex: 1 },
  profileLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  profileDescription: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  profileToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(51, 65, 85, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHazardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hazardChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'capitalize',
  },
  saveMessage: { color: Colors.textSecondary, fontSize: 13, marginTop: 12, textAlign: 'center' },
});
