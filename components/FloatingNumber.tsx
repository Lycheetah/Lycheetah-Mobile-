import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';

interface Props {
  value: string;       // e.g. "-14", "+HP", "✧CHAOS×2.1"
  color: string;
  x: number;           // left position in parent
  y: number;           // top position in parent (floats upward from here)
  fontSize?: number;
  onDone?: () => void;
}

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export function FloatingNumber({ value, color, x, y, fontSize = 15, onDone }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -44,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 780, useNativeDriver: true }),
      ]),
    ]).start(() => onDone?.());
  }, []);

  return (
    <Animated.Text
      style={[
        styles.base,
        {
          color,
          fontSize,
          left: x,
          top: y,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      {value}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    fontFamily: mono,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: '#00000088',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
