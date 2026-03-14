import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { AccessibilityProfileId } from '../../types/hazard';

const PROFILE_ICONS: Record<AccessibilityProfileId, keyof typeof Ionicons.glyphMap> = {
  wheelchair: 'accessibility-outline',
  low_vision: 'eye-outline',
  limited_mobility: 'walk-outline',
  hearing_impaired: 'volume-mute-outline',
  neurodivergent: 'shapes-outline',
  elderly: 'heart-outline',
  parents_with_prams: 'people-outline',
};

interface ProfileCardProps {
  profileId: AccessibilityProfileId;
  label: string;
  description: string;
  flaggedHazards: string[];
  isSelected: boolean;
  onToggle: () => void;
}

export function ProfileCard({
  profileId, label, description, flaggedHazards, isSelected, onToggle,
}: ProfileCardProps) {
  const profileColor = Colors.profileColors[profileId] || Colors.primary;
  const toggleScale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Quick pop on toggle change
    Animated.sequence([
      Animated.timing(toggleScale, {
        toValue: 0.75,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(toggleScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
    ]).start();
  }, [isSelected]);

  const handleToggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity
      style={[
        styles.profileCard,
        isSelected && { borderColor: `${profileColor}44`, backgroundColor: `${profileColor}0D` },
      ]}
      onPress={handleToggle}
      activeOpacity={0.92}
      accessibilityRole="switch"
      accessibilityLabel={`${label} accessibility mode`}
      accessibilityHint={description}
      accessibilityState={{ checked: isSelected }}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.profileIcon, { backgroundColor: `${profileColor}18` }]}>
          <Ionicons name={PROFILE_ICONS[profileId]} size={22} color={profileColor} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileLabel}>{label}</Text>
          <Text style={styles.profileDescription}>{description}</Text>
        </View>
        <Animated.View style={[
          styles.profileToggle,
          isSelected
            ? { backgroundColor: profileColor }
            : { backgroundColor: Colors.surfaceLight },
          { transform: [{ scale: toggleScale }] },
        ]}>
          <Ionicons
            name={isSelected ? 'checkmark' : 'add'}
            size={16}
            color={isSelected ? Colors.background : Colors.textMuted}
          />
        </Animated.View>
      </View>

      <View style={styles.profileHazardRow}>
        {flaggedHazards.slice(0, 3).map((hazard) => (
          <View key={hazard} style={[styles.hazardChipWrap, { backgroundColor: `${profileColor}0A` }]}>
            <Text style={[styles.hazardChip, { color: profileColor }]}>
              {hazard.replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 12,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileCopy: { flex: 1 },
  profileLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  profileDescription: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  profileToggle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHazardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hazardChipWrap: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hazardChip: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
