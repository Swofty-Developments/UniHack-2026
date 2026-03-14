import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../stores/useAuthStore';
import { trpcClient } from '../utils/trpcClient';
import { useFadeIn, useStaggeredEntrance } from '../hooks/useAnimations';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { displayName, email, isOnboarded, setUser } = useAuthStore();
  const [nameInput, setNameInput] = useState(displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cardAnims = useStaggeredEntrance(3, 80);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    setMessage(null);
    const store = useAuthStore.getState();
    const patch = {
      userId: store.userId ?? 'local-user',
      displayName: nameInput.trim(),
      email: store.email ?? '',
      token: store.token ?? '',
    };
    try {
      await trpcClient.user.updateProfile.mutate({ displayName: nameInput.trim() });
      setUser(patch);
      setMessage('Display name updated.');
    } catch {
      setUser(patch);
      setMessage('Saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    useAuthStore.getState().clear();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      {/* Identity section */}
      <Animated.View style={[styles.section, cardAnims[0]]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Identity</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor={Colors.textMuted}
          value={nameInput}
          onChangeText={setNameInput}
          accessibilityLabel="Display name"
          maxLength={50}
        />
        {email ? <Text style={styles.emailLabel}>{email}</Text> : null}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={() => void handleSaveName()}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save display name"
          accessibilityState={{ disabled: isSaving }}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.background} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </Animated.View>

      {/* About */}
      <Animated.View style={[styles.section, cardAnims[1]]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>1.0.0</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Build</Text>
          <View style={styles.buildBadge}>
            <Text style={styles.buildBadgeText}>UniHack 2026</Text>
          </View>
        </View>
      </Animated.View>

      {/* Sign out */}
      <View style={styles.bottomSection}>
        {isOnboarded ? (
          <Animated.View style={cardAnims[2]}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} accessibilityRole="button" accessibilityLabel="Sign out of your account">
              <Ionicons name="log-out-outline" size={18} color={Colors.hazardHigh} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    gap: 14,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailLabel: { color: Colors.textMuted, fontSize: 13 },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: Colors.background, fontSize: 15, fontWeight: '700' },
  message: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { color: Colors.textSecondary, fontSize: 14 },
  versionBadge: {
    backgroundColor: Colors.glowPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  versionBadgeText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  buildBadge: {
    backgroundColor: Colors.glowAccent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  buildBadgeText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  bottomSection: { flex: 1, justifyContent: 'flex-end' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.glowHazardHigh,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.hazardHigh + '33',
  },
  signOutText: { color: Colors.hazardHigh, fontSize: 15, fontWeight: '700' },
});
