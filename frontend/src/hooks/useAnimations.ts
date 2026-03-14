import { useEffect, useRef, useCallback, useState } from 'react';
import { AccessibilityInfo, Animated, ViewStyle } from 'react-native';

type AnimatedStyle = Animated.WithAnimatedObject<ViewStyle>;

const STATIC_VISIBLE: AnimatedStyle = { opacity: 1 };

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}

/**
 * Staggered entrance animation for lists of cards/items.
 * Each item fades in and slides up with a delay.
 * Respects reduced motion preference.
 */
export function useStaggeredEntrance(
  itemCount: number,
  baseDelay = 60,
  duration = 480,
): AnimatedStyle[] {
  const reduced = useReducedMotion();
  const anims = useRef<Animated.Value[]>([]);

  if (anims.current.length !== itemCount) {
    anims.current = Array.from({ length: itemCount }, () => new Animated.Value(0));
  }

  useEffect(() => {
    if (reduced) {
      anims.current.forEach((a) => a.setValue(1));
      return;
    }

    anims.current.forEach((a) => a.setValue(0));

    const animations = anims.current.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay: i * baseDelay,
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animations).start();
  }, [itemCount, reduced]);

  if (reduced) {
    return anims.current.map(() => STATIC_VISIBLE);
  }

  return anims.current.map((anim) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.95, 0.98, 1],
        }),
      },
    ],
  }));
}

/**
 * Single fade-in with slide up animation.
 * Respects reduced motion preference.
 */
export function useFadeIn(delay = 0, duration = 520): AnimatedStyle {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      anim.setValue(1);
      return;
    }

    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [reduced]);

  if (reduced) return STATIC_VISIBLE;

  return {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [22, 0],
        }),
      },
    ],
  };
}

/**
 * Spring scale-in animation (great for badges, pills, avatars).
 * Respects reduced motion preference.
 */
export function useScaleIn(delay = 0): AnimatedStyle {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      anim.setValue(1);
      return;
    }

    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [reduced]);

  if (reduced) return STATIC_VISIBLE;

  return {
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        }),
      },
    ],
  };
}

/**
 * Pulse animation for drawing attention (e.g. active indicators).
 * Respects reduced motion preference - shows static element instead.
 */
export function usePulse(duration = 1800): AnimatedStyle {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) {
      anim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.5,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduced]);

  if (reduced) return STATIC_VISIBLE;

  return { opacity: anim };
}

/**
 * Hook for animating a value that can be triggered imperatively.
 */
export function useAnimatedValue(initialValue = 0) {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(initialValue)).current;

  const animateTo = useCallback(
    (toValue: number, duration = 300) => {
      if (reduced) {
        anim.setValue(toValue);
        return;
      }
      Animated.timing(anim, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    },
    [anim, reduced],
  );

  const springTo = useCallback(
    (toValue: number) => {
      if (reduced) {
        anim.setValue(toValue);
        return;
      }
      Animated.spring(anim, {
        toValue,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    },
    [anim, reduced],
  );

  return { value: anim, animateTo, springTo };
}
