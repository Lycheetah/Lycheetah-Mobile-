import React from 'react';
import { View, Text } from 'react-native';

// ─── Spec types ───────────────────────────────────────────────────────────────

type CircleLayer  = { type: 'circle';  cx: number; cy: number; r: number; color: string; opacity: number };
type RingLayer    = { type: 'ring';    cx: number; cy: number; r: number; stroke: string; strokeWidth: number; opacity: number };
type RectLayer    = { type: 'rect';    x: number; y: number; w: number; h: number; color: string; opacity: number; radius?: number };
type TextLayer    = { type: 'text';    x: number; y: number; content: string; size: number; color: string; opacity: number };
type DiamondLayer = { type: 'diamond'; cx: number; cy: number; size: number; color: string; opacity: number };

type CompanionLayer = CircleLayer | RingLayer | RectLayer | TextLayer | DiamondLayer;

export interface CompanionVisualSpec {
  name: string;
  layers: CompanionLayer[];
  resonance: string;
}

interface Props {
  spec: CompanionVisualSpec;
  width?: number;
  height?: number;
}

// Canvas defaults match the creature container in companion.tsx
const DEFAULT_W = 150;
const DEFAULT_H = 220;

export function CompanionRenderer({ spec, width = DEFAULT_W, height = DEFAULT_H }: Props) {
  const scaleX = width / DEFAULT_W;
  const scaleY = height / DEFAULT_H;
  const s = (v: number, axis: 'x' | 'y' = 'x') => Math.round(v * (axis === 'x' ? scaleX : scaleY));

  return (
    <View style={{ width, height, position: 'relative' }} pointerEvents="none">
      {spec.layers.map((layer, i) => {
        if (layer.type === 'circle') {
          const r = s(layer.r);
          return (
            <View key={i} style={{
              position: 'absolute',
              left:  s(layer.cx) - r,
              top:   s(layer.cy, 'y') - r,
              width: r * 2, height: r * 2,
              borderRadius: r,
              backgroundColor: layer.color,
              opacity: layer.opacity,
            }} />
          );
        }

        if (layer.type === 'ring') {
          const r = s(layer.r);
          return (
            <View key={i} style={{
              position: 'absolute',
              left:  s(layer.cx) - r,
              top:   s(layer.cy, 'y') - r,
              width: r * 2, height: r * 2,
              borderRadius: r,
              borderWidth: layer.strokeWidth,
              borderColor: layer.stroke,
              opacity: layer.opacity,
              backgroundColor: 'transparent',
            }} />
          );
        }

        if (layer.type === 'rect') {
          return (
            <View key={i} style={{
              position: 'absolute',
              left:   s(layer.x),
              top:    s(layer.y, 'y'),
              width:  s(layer.w),
              height: s(layer.h, 'y'),
              backgroundColor: layer.color,
              opacity: layer.opacity,
              borderRadius: layer.radius ? s(layer.radius) : 0,
            }} />
          );
        }

        if (layer.type === 'text') {
          const fs = Math.round(layer.size * Math.min(scaleX, scaleY));
          return (
            <Text key={i} style={{
              position: 'absolute',
              left: s(layer.x) - fs,
              top:  s(layer.y, 'y') - fs,
              fontSize: fs,
              color: layer.color,
              opacity: layer.opacity,
              fontFamily: 'monospace',
              width: fs * 2,
              textAlign: 'center',
            }}>
              {layer.content}
            </Text>
          );
        }

        if (layer.type === 'diamond') {
          const sz = s(layer.size);
          return (
            <View key={i} style={{
              position: 'absolute',
              left: s(layer.cx) - sz / 2,
              top:  s(layer.cy, 'y') - sz / 2,
              width: sz, height: sz,
              backgroundColor: layer.color,
              opacity: layer.opacity,
              transform: [{ rotate: '45deg' }],
            }} />
          );
        }

        return null;
      })}
    </View>
  );
}
