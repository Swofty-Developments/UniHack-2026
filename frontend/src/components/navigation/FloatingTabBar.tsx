import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export const FLOATING_TAB_BAR_HEIGHT = 78;

const TAB_META = {
  Map: {
    label: 'Map',
    icon: 'map-outline',
    activeIcon: 'map',
  },
  Discover: {
    label: 'Discover',
    icon: 'compass-outline',
    activeIcon: 'compass',
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

function TabItem({
  route,
  isFocused,
  label,
  onPress,
  onLongPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  }, [isFocused]);

  const meta = TAB_META[route.name as keyof typeof TAB_META];
  const iconName = (isFocused ? meta?.activeIcon : meta?.icon) || 'ellipse-outline';

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const bgOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handlePressIn = useCallback(() => {
    Animated.timing(pressScale, {
      toValue: 0.9,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.activeBackground,
          { opacity: bgOpacity },
        ]}
      />
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: Animated.multiply(iconScale, pressScale) }] }]}>
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={20}
          color={isFocused ? Colors.primary : Colors.textMuted}
        />
      </Animated.View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>
        {label}
      </Text>
      {isFocused ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.shell}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name as keyof typeof TAB_META];
          const isFocused = state.index === index;
          const tabLabel = descriptors[route.key].options.title || meta?.label || route.name;

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
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              label={tabLabel}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
  },
  shell: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: 24,
    backgroundColor: Colors.overlayHeavy,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  item: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    minHeight: 54,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glowPrimary,
    borderRadius: 20,
  },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
