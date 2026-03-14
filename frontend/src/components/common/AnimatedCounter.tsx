import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  duration?: number;
}

/**
 * Animates a number counting up from 0 to value using requestAnimationFrame.
 * Runs entirely on the JS thread but avoids the Animated API overhead
 * of useNativeDriver: false and deprecated setNativeProps.
 */
export function AnimatedCounter({ value, style, duration = 600 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startValueRef.current = 0;
    startTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValueRef.current + (value - startValueRef.current) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <Text style={style}>{String(displayValue)}</Text>;
}
