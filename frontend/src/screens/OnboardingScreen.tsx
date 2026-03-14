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
import { useProfileStore } from '../stores/useProfileStore';
import { trpcClient } from '../utils/trpcClient';
import { useFadeIn, useStaggeredEntrance } from '../hooks/useAnimations';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { setUser } = useAuthStore();
  const { selectedProfiles } = useProfileStore();
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const heroFade = useFadeIn(0);
  const cardAnims = useStaggeredEntrance(3, 100);

  const handleCreate = async () => {
    if (!nameInput.trim()) {
      setErrorMessage('Enter a display name first.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await trpcClient.auth.register.mutate({
        displayName: nameInput.trim(),
        email: `${nameInput.trim().toLowerCase().replace(/\s+/g, '.')}@accessatlas.local`,
        password: 'default-hackathon-pass',
        selectedProfiles,
      });
      setUser({
        userId: result.user.id,
        displayName: result.user.displayName,
        email: result.user.email ?? '',
        token: result.token,
      });
      navigation.goBack();
    } catch {
      setUser({ userId: 'local-user', displayName: nameInput.trim(), email: '', token: '' });
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, heroFade]}>
          <Ionicons name="person-add-outline" size={32} color={Colors.primary} />
        </Animated.View>

        <Animated.View style={[styles.textBlock, heroFade]}>
          <Text style={styles.title}>Create your scanner identity</Text>
          <Text style={styles.body}>
            Your name appears on scanned territories and the community leaderboard.
            This is optional for browsing but required for credited scans.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.formCard, cardAnims[0]]}>
          <Text style={styles.formLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            placeholder="How should we call you?"
            placeholderTextColor={Colors.textMuted}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            accessibilityLabel="Display name"
            maxLength={50}
          />
        </Animated.View>

        <Animated.View style={[styles.infoCard, cardAnims[1]]}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.hazardLow} />
            <Text style={styles.infoText}>No email or password required</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={16} color={Colors.info} />
            <Text style={styles.infoText}>Scans will be credited to your name</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={16} color={Colors.medalGold} />
            <Text style={styles.infoText}>Appear on the community leaderboard</Text>
          </View>
        </Animated.View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Animated.View style={[styles.actions, cardAnims[2]]}>
          <TouchableOpacity
            style={[styles.createButton, isSaving && styles.createButtonDisabled]}
            onPress={() => void handleCreate()}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Create profile"
            accessibilityState={{ disabled: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Text style={styles.createButtonText}>Create profile</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.background} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Skip onboarding">
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.glowPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  textBlock: { alignItems: 'center', gap: 10 },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 10,
  },
  formLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  errorText: {
    color: Colors.hazardHigh,
    fontSize: 13,
    textAlign: 'center',
  },
  actions: { gap: 10 },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: Colors.background, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
});
