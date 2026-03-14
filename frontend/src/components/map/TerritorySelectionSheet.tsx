import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { BUILDING_TYPE_LABELS, TERRITORY_STATUS_LABELS, label } from '../../constants/labels';
import { Territory } from '../../types/territory';
import { RootStackParamList } from '../../types/navigation';
import { formatArea } from '../../utils/formatArea';

interface TerritorySelectionSheetProps {
  territory: Territory;
  userDistance: number | null;
  onClose: () => void;
  style?: object;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const WAYFINDING_RANGE_METERS = 200;

export function TerritorySelectionSheet({ territory, userDistance, onClose, style }: TerritorySelectionSheetProps) {
  const navigation = useNavigation<NavProp>();
  const hazardTotal = territory.hazardSummary?.total ?? 0;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isWithinRange = userDistance !== null && userDistance <= WAYFINDING_RANGE_METERS;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStartWayfinding = () => {
    if (!isWithinRange) return;
    onClose();
    navigation.navigate('Wayfinding', { territoryId: territory.id });
  };

  return (
    <Animated.View
      style={[
        styles.selectionSheet,
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.selectionHeader}>
        <View style={styles.selectionTitleBlock}>
          <Text style={styles.selectionTitle}>{territory.name}</Text>
          <Text style={styles.selectionSubtitle}>
            {label(BUILDING_TYPE_LABELS, territory.buildingType)} | {formatArea(territory.areaSqMeters)}
          </Text>
        </View>
        <View style={styles.selectionHeaderRight}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{label(TERRITORY_STATUS_LABELS, territory.status)}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel="Close territory details" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {territory.description ? (
        <Text style={styles.selectionDescription} numberOfLines={2}>
          {territory.description}
        </Text>
      ) : null}

      <View style={styles.selectionMetaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="warning-outline" size={14} color={Colors.primary} />
          <Text style={styles.metaText}>
            {hazardTotal === 1 ? '1 barrier' : `${hazardTotal} barriers`}
          </Text>
        </View>
        {territory.claimedBy ? (
          <View style={styles.metaPill}>
            <Ionicons name="person-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>{territory.claimedBy.displayName}</Text>
          </View>
        ) : null}
        {userDistance !== null ? (
          <View style={styles.metaPill}>
            <Ionicons name="location-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>
              {userDistance < 1000
                ? `${Math.round(userDistance)}m away`
                : `${(userDistance / 1000).toFixed(1)}km away`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Wayfinding button */}
      <TouchableOpacity
        style={[
          styles.wayfindingButton,
          !isWithinRange && styles.wayfindingButtonDisabled,
        ]}
        onPress={handleStartWayfinding}
        activeOpacity={isWithinRange ? 0.88 : 1}
        disabled={!isWithinRange}
        accessibilityRole="button"
        accessibilityLabel={isWithinRange ? 'Start wayfinding navigation' : 'Get closer to start wayfinding'}
        accessibilityState={{ disabled: !isWithinRange }}
      >
        <Ionicons
          name="navigate-outline"
          size={18}
          color={isWithinRange ? Colors.background : Colors.textMuted}
        />
        <Text
          style={[
            styles.wayfindingButtonText,
            !isWithinRange && styles.wayfindingButtonTextDisabled,
          ]}
        >
          {isWithinRange ? 'Start Wayfinding' : 'Get closer to start wayfinding'}
        </Text>
      </TouchableOpacity>

      {/* View details secondary button */}
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => {
          onClose();
          navigation.navigate('TerritoryDetail', { territoryId: territory.id });
        }}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${territory.name}`}
      >
        <Text style={styles.viewButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  selectionSheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: Colors.overlayHeavy,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primaryDark + '26',
    padding: 18,
    gap: 12,
  },
  selectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  selectionTitleBlock: { flex: 1, gap: 4 },
  selectionTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  selectionSubtitle: { color: Colors.textSecondary, fontSize: 13 },
  selectionHeaderRight: { alignItems: 'flex-end', gap: 8 },
  statusPill: {
    borderRadius: 8,
    backgroundColor: Colors.glowPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDescription: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  selectionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.overlayMedium,
  },
  metaText: { color: Colors.text, fontSize: 12, fontWeight: '600' },

  // Wayfinding button
  wayfindingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  wayfindingButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wayfindingButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  wayfindingButtonTextDisabled: {
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // View details secondary
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  viewButtonText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
});
