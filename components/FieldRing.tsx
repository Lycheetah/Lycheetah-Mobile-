// SOL v4.0.0 — FieldRing
// Seven points of light circling the persona glyph, one per constitutional invariant.
// Brightness = current pass state for that invariant.
//
// This is the signature visual feature of Sol v4: the user watches the constitution
// operating in real time. No other AI app has this.
//
// Pure React Native — no SVG dependency.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

export type InvariantId =
  | 'humanPrimacy'
  | 'inspectability'
  | 'memoryContinuity'
  | 'honesty'
  | 'reversibility'
  | 'nonDeception'
  | 'careAsStructure';

export const INVARIANT_ORDER: readonly InvariantId[] = [
  'humanPrimacy',
  'inspectability',
  'memoryContinuity',
  'honesty',
  'reversibility',
  'nonDeception',
  'careAsStructure',
] as const;

export const INVARIANT_LABELS: Record<InvariantId, string> = {
  humanPrimacy: 'Human Primacy',
  inspectability: 'Inspectability',
  memoryContinuity: 'Memory Continuity',
  honesty: 'Honesty',
  reversibility: 'Reversibility',
  nonDeception: 'Non-Deception',
  careAsStructure: 'Care as Structure',
};

export type FieldRingProps = {
  // Scores in [0, 1] per invariant. Missing keys default to 1 (pass).
  scores?: Partial<Record<InvariantId, number>>;
  // Diameter of the glyph circle in pixels. The ring sits outside this.
  size?: number;
  // Gap between glyph edge and the points, in px.
  radiusOffset?: number;
  // Color for lit points. Tie to persona accent upstream.
  litColor?: string;
  // Color for dim points (invariant failing or untested).
  dimColor?: string;
  // When true, ring breathes — subtle pulse. Use while Sol is thinking.
  thinking?: boolean;
  // When false, ring is hidden entirely (e.g. user turned it off).
  visible?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function FieldRing({
  scores,
  size = 44,
  radiusOffset = 8,
  litColor = '#D4A03B',
  dimColor = '#3A3A42',
  thinking = false,
  visible = true,
  style,
  children,
}: FieldRingProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!thinking) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [thinking, pulse]);

  const ringDiameter = size + radiusOffset * 2;
  const radius = ringDiameter / 2;
  const dotSize = 4;

  if (!visible) {
    return <View style={[{ width: size, height: size }, style]}>{children}</View>;
  }

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: ringDiameter, height: ringDiameter, transform: [{ scale }] },
        style,
      ]}
    >
      {INVARIANT_ORDER.map((inv, i) => {
        const angle = (i / INVARIANT_ORDER.length) * Math.PI * 2 - Math.PI / 2;
        const x = radius + Math.cos(angle) * (radius - dotSize / 2) - dotSize / 2;
        const y = radius + Math.sin(angle) * (radius - dotSize / 2) - dotSize / 2;
        const score = scores?.[inv];
        const lit = score === undefined ? true : score >= 0.5;
        return (
          <View
            key={inv}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: lit ? litColor : dimColor,
                opacity: lit ? (score === undefined ? 0.8 : 0.4 + score * 0.6) : 0.35,
                left: x,
                top: y,
              },
            ]}
          />
        );
      })}
      <View style={[styles.inner, { width: size, height: size, borderRadius: size / 2 }]}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
