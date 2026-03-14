import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { ACCESSIBILITY_PROFILES } from '../../constants/profiles';
import { HAZARD_TYPE_LABELS, label } from '../../constants/labels';
import { Hazard } from '../../types/hazard';
import { useFadeIn } from '../../hooks/useAnimations';

const SEVERITY_COLORS: Record<string, string> = {
  high: Colors.hazardHigh,
  medium: Colors.hazardMedium,
  low: Colors.hazardLow,
};

export const HazardCard = React.memo(function HazardCard({ hazard, index = 0 }: { hazard: Hazard; index?: number }) {
  const fadeStyle = useFadeIn(index * 60 + 100);

  return (
    <Animated.View style={fadeStyle}>
      <View style={styles.hazardCard}>
        <View
          style={[styles.severityAccent, { backgroundColor: SEVERITY_COLORS[hazard.severity] }]}
        />
        <View style={styles.hazardContent}>
          <View style={styles.hazardHeader}>
            <Text style={styles.hazardTitle}>{label(HAZARD_TYPE_LABELS, hazard.type)}</Text>
            <View
              style={[
                styles.severityPill,
                { backgroundColor: `${SEVERITY_COLORS[hazard.severity]}18` },
              ]}
            >
              <Text
                style={[styles.severityPillText, { color: SEVERITY_COLORS[hazard.severity] }]}
              >
                {hazard.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.hazardDescription}>{hazard.description}</Text>
          <View style={styles.hazardMetaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.hazardMetaText}>
                {Math.round(hazard.confidence * 100)}% confidence
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.hazardMetaText}>{hazard.detectedBy.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.affectedProfilesRow}>
            {hazard.affectsProfiles.map((profileId) => {
              const color = Colors.profileColors[profileId] || Colors.primary;
              return (
                <Text
                  key={profileId}
                  style={[styles.affectedChip, { backgroundColor: `${color}18`, color }]}
                >
                  {ACCESSIBILITY_PROFILES.find((p) => p.id === profileId)?.label || profileId}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  hazardCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  severityAccent: { width: 5, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  hazardContent: { flex: 1, padding: 16, gap: 10 },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hazardTitle: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700' },
  severityPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  severityPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  hazardDescription: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  hazardMetaRow: { flexDirection: 'row', gap: 8 },
  metaPill: {
    backgroundColor: Colors.overlaySubtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hazardMetaText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  affectedProfilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  affectedChip: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
});
