import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export const FLOATING_TAB_BAR_HEIGHT = 88;

const TAB_META = {
  Map: {
    label: 'Map',
    icon: 'map-outline',
    activeIcon: 'map',
  },
  Scan: {
    label: 'Scan',
    icon: 'scan-outline',
    activeIcon: 'scan',
  },
  Leaderboard: {
    label: 'Ranks',
    icon: 'trophy-outline',
    activeIcon: 'trophy',
  },
  Profile: {
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
} as const;

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.shell}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name as keyof typeof TAB_META];
          const isFocused = state.index === index;
          const label = descriptors[route.key].options.title || meta?.label || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = (isFocused ? meta?.activeIcon : meta?.icon) || 'ellipse-outline';
          const color = isFocused ? Colors.white : Colors.textSecondary;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.item,
                isFocused && styles.itemActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={20} color={color} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
  },
  shell: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: 28,
    backgroundColor: 'rgba(2, 6, 23, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  item: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    minHeight: 58,
  },
  itemActive: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  pressed: {
    opacity: 0.86,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.white,
  },
});
