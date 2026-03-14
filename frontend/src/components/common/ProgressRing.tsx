import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Animated progress indicator using rotating half-circles.
 * Simulates a circular progress ring without SVG.
 */
export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 4,
  color = Colors.primary,
  children,
  style,
}: ProgressRingProps) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animProgress, {
      toValue: progress,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  const halfSize = size / 2;

  // Right half rotation (0-180 degrees for 0-50% progress)
  const rightRotation = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Left half rotation (0-180 degrees for 50-100% progress)
  const leftRotation = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: `${color}22`,
          },
        ]}
      />

      {/* Right half */}
      <View style={[styles.halfClip, { width: halfSize, height: size, left: halfSize }]}>
        <Animated.View
          style={[
            styles.halfRing,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              left: -halfSize,
              transform: [{ rotate: rightRotation }],
            },
          ]}
        />
      </View>

      {/* Left half */}
      <View style={[styles.halfClip, { width: halfSize, height: size, left: 0 }]}>
        <Animated.View
          style={[
            styles.halfRing,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: leftRotation }],
            },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  halfClip: {
    position: 'absolute',
    overflow: 'hidden',
  },
  halfRing: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
