import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface RadarPulseProps {
  size?: number;
  color?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Expanding ring pulse animation behind content (like a radar ping).
 */
export function RadarPulse({
  size = 80,
  color = Colors.primary,
  children,
  style,
}: RadarPulseProps) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = createPulse(ring1, 0);
    const a2 = createPulse(ring2, 800);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.2, 0],
    }),
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.2],
      }),
    }],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
