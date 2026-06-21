import React, { useRef, useEffect } from 'react';
import { Animated, View, Text, Easing, StyleSheet } from 'react-native';

// ─── Spec ────────────────────────────────────────────────────────────────────

export interface CompanionSpec {
  auraType: 'rings' | 'rays' | 'spiral' | 'pulse' | 'void';
  auraIntensity: number;   // 0.2 – 1.0
  glyphSet: string[];      // 3-5 unicode chars
  coreGlow: 'sharp' | 'soft' | 'crystal' | 'ember';
  orbitCount: number;      // 2-5
  trailStyle: 'none' | 'comet' | 'sparkle' | 'shadow';
  resonance: string;       // one word
}

// Default fallback — used before Kimi responds
export const DEFAULT_SPEC: CompanionSpec = {
  auraType: 'pulse',
  auraIntensity: 0.6,
  glyphSet: ['◈', '∴', '⊚'],
  coreGlow: 'soft',
  orbitCount: 3,
  trailStyle: 'none',
  resonance: 'latent',
};

interface Props {
  spec: CompanionSpec;
  color: string;
  stage: number; // 0-5
}

// Center of the 120×180 creature canvas
const CX = 60;
const CY = 90;
const BASE_ORBIT = 62;
const MAX_GLYPHS = 5;

export function CompanionSpecOverlay({ spec, color, stage }: Props) {
  const { auraType, auraIntensity: auraIntensityBase, glyphSet, coreGlow, orbitCount: orbitCountBase, resonance } = spec;
  // EVOLUTION (effect-based, universal — no per-stage art). Higher stage = brighter aura,
  // more orbiting glyphs, larger core. Makes all 19 companions visibly evolve from study.
  const s = Math.max(0, Math.min(5, stage));
  const stageBoost = 0.55 + (s / 5) * 0.75;                       // 0.55 (stage 0) → 1.30 (stage 5)
  const auraIntensity = Math.min(1.25, auraIntensityBase * stageBoost);
  const orbitCount = Math.min(MAX_GLYPHS, orbitCountBase + Math.floor(s / 2)); // +1 glyph every 2 stages

  // ── Orbit rotation ──────────────────────────────────────────────────────────
  const orbitAnim = useRef(new Animated.Value(0)).current;

  // ── Aura pulse/expand ───────────────────────────────────────────────────────
  const aura1 = useRef(new Animated.Value(0)).current;
  const aura2 = useRef(new Animated.Value(0)).current;
  const aura3 = useRef(new Animated.Value(0)).current;

  // ── Core glow ───────────────────────────────────────────────────────────────
  const coreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const speed = Math.max(7000, 13000 - stage * 1400);
    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: speed, useNativeDriver: true, easing: Easing.linear })
    ).start();

    if (auraType !== 'void') {
      const baseDur = auraType === 'pulse' ? 900 : 2200;
      Animated.loop(Animated.sequence([
        Animated.timing(aura1, { toValue: 1, duration: baseDur, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(aura1, { toValue: 0, duration: baseDur * 0.6, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.delay(baseDur * 0.5),
        Animated.timing(aura2, { toValue: 1, duration: baseDur * 1.3, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(aura2, { toValue: 0, duration: baseDur, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.delay(baseDur),
        Animated.timing(aura3, { toValue: 1, duration: baseDur * 1.7, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(aura3, { toValue: 0, duration: baseDur * 1.2, useNativeDriver: true }),
      ])).start();
    }

    Animated.loop(Animated.sequence([
      Animated.timing(coreAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(coreAnim, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ])).start();
  }, [stage, auraType]);

  const orbitDeg    = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counterDeg  = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // ── Aura ring params per type ───────────────────────────────────────────────
  const ringRadius   = auraType === 'pulse' ? 52 : 64;
  const ring2Radius  = auraType === 'rings' ? 82 : 72;
  const ring3Radius  = auraType === 'rings' ? 100 : 88;
  const ringBorder   = auraType === 'pulse' ? 2 : 1;

  const r1Op = aura1.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45 * auraIntensity] });
  const r1Sc = aura1.interpolate({ inputRange: [0, 1], outputRange: [auraType === 'pulse' ? 0.3 : 0.7, 1.4] });
  const r2Op = aura2.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28 * auraIntensity] });
  const r2Sc = aura2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const r3Op = aura3.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16 * auraIntensity] });
  const r3Sc = aura3.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.0] });

  const coreR    = (coreGlow === 'sharp' ? 5 : coreGlow === 'crystal' ? 9 : 14) + s * 2;  // core grows with evolution
  const coreOpLo = 0.25 * auraIntensity;
  const coreOpHi = 0.8 * auraIntensity;
  const coreOp   = coreAnim.interpolate({ inputRange: [0, 1], outputRange: [coreOpLo, coreOpHi] });

  // ── Orbit glyphs ────────────────────────────────────────────────────────────
  const glyphs = glyphSet.slice(0, Math.min(orbitCount, glyphSet.length, MAX_GLYPHS));
  const ANGLE_STEP = (2 * Math.PI) / Math.max(glyphs.length, 1);
  const orbitR = BASE_ORBIT + stage * 3;

  const isVoid = auraType === 'void';
  const ringColor = isVoid ? '#000000' : color;

  return (
    // Covers the 120×180 creature canvas. overflow:'visible' lets rings extend outward.
    <View style={[StyleSheet.absoluteFill, { overflow: 'visible' }]} pointerEvents="none">

      {/* ── Aura rings ──────────────────────────────────────────────────────── */}
      {auraType !== 'void' && (
        <>
          <Animated.View style={{
            position: 'absolute',
            left: CX - ringRadius, top: CY - ringRadius,
            width: ringRadius * 2, height: ringRadius * 2, borderRadius: ringRadius,
            borderWidth: ringBorder, borderColor: ringColor,
            opacity: r1Op,
            transform: [{ scale: r1Sc }],
          }} />
          <Animated.View style={{
            position: 'absolute',
            left: CX - ring2Radius, top: CY - ring2Radius,
            width: ring2Radius * 2, height: ring2Radius * 2, borderRadius: ring2Radius,
            borderWidth: 1, borderColor: ringColor,
            opacity: r2Op,
            transform: [{ scale: r2Sc }],
          }} />
          {auraType === 'rings' && (
            <Animated.View style={{
              position: 'absolute',
              left: CX - ring3Radius, top: CY - ring3Radius,
              width: ring3Radius * 2, height: ring3Radius * 2, borderRadius: ring3Radius,
              borderWidth: 0.5, borderColor: ringColor,
              opacity: r3Op,
              transform: [{ scale: r3Sc }],
            }} />
          )}
        </>
      )}

      {/* ── Void absorption field ───────────────────────────────────────────── */}
      {isVoid && (
        <Animated.View style={{
          position: 'absolute',
          left: CX - 50, top: CY - 50,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: '#000000',
          opacity: aura1.interpolate({ inputRange: [0, 1], outputRange: [0.1 * auraIntensity, 0.35 * auraIntensity] }),
          transform: [{ scale: aura1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) }],
        }} />
      )}

      {/* ── Core glow ───────────────────────────────────────────────────────── */}
      <Animated.View style={{
        position: 'absolute',
        left: CX - coreR, top: CY - coreR,
        width: coreR * 2, height: coreR * 2, borderRadius: coreR,
        backgroundColor: color,
        opacity: coreOp,
        zIndex: 0,
      }} />

      {/* ── Orbiting glyphs ─────────────────────────────────────────────────── */}
      {glyphs.length > 0 && (
        <Animated.View style={{
          position: 'absolute',
          left: CX, top: CY,
          width: 0, height: 0,
          transform: [{ rotate: orbitDeg }],
        }}>
          {glyphs.map((glyph, i) => {
            const angle = i * ANGLE_STEP;
            const gx = Math.cos(angle) * orbitR;
            const gy = Math.sin(angle) * orbitR;
            const glyphSize = 9 + stage;
            return (
              <Animated.Text
                key={`${glyph}-${i}`}
                style={{
                  position: 'absolute',
                  left: gx - glyphSize,
                  top: gy - glyphSize,
                  color,
                  fontSize: glyphSize,
                  opacity: 0.7 * auraIntensity,
                  fontFamily: 'monospace',
                  textShadowColor: color,
                  textShadowRadius: 4,
                  transform: [{ rotate: counterDeg }],
                  zIndex: 10,
                }}
              >
                {glyph}
              </Animated.Text>
            );
          })}
        </Animated.View>
      )}

      {/* ── Resonance word — very small, below creature ─────────────────────── */}
      {resonance ? (
        <Text style={{
          position: 'absolute',
          bottom: -14,
          left: 0, right: 0,
          textAlign: 'center',
          color,
          fontSize: 7,
          fontFamily: 'monospace',
          letterSpacing: 3,
          opacity: 0.38 * auraIntensity,
        }}>
          {resonance.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
