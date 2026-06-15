import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect, Polygon, G, Line } from 'react-native-svg';

type ArchetypeId    = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah';
type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type EvoPath        = 'A' | 'B' | 'C';

// Internal canvas — all creature coordinates are plotted on this space
const CW = 100;
const CH = 150;

interface Props {
  archId: ArchetypeId;
  stage: EvolutionStage;
  color: string;
  path?: EvoPath | null;
  width?: number;
  height?: number;
}

export function CreatureSvg({ archId, stage, color, path, width = 150, height = 220 }: Props) {
  const f  = color + 'AA';
  const f2 = color + 'DD';
  const f3 = color + 'FF';
  const sw = 2.5;
  const p      = { fill: f,     stroke: color, strokeWidth: sw } as const;
  const p2     = { fill: f2,    stroke: color, strokeWidth: sw } as const;
  const p3     = { fill: color, stroke: 'none' } as const;
  const line   = { stroke: color, strokeWidth: sw,  fill: 'none' } as const;
  const lineThin = { stroke: color, strokeWidth: 1.5, fill: 'none' } as const;
  const epath = path ?? 'A';

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${CW} ${CH}`}>
      {/* Aura glow — vivid, fills canvas */}
      <Circle cx={50} cy={75} r={55} fill={color + '30'} stroke="none" />
      <Circle cx={50} cy={75} r={38} fill={color + '20'} stroke="none" />
      <Circle cx={50} cy={75} r={22} fill={color + '18'} stroke="none" />
      <G>
        {archId === 'lycheetah' && renderCat(stage, p, p2, p3, line, lineThin, color, f3, epath)}
        {archId === 'archivist' && renderArchivist(stage, p, p2, p3, line, color, epath)}
        {archId === 'alchemist' && renderAlchemist(stage, p, p2, p3, line, color, epath)}
        {archId === 'oracle'    && renderOracle(stage, p, p2, p3, line, color, epath)}
        {archId === 'sentinel'  && renderSentinel(stage, p, p2, p3, line, color, epath)}
        {archId === 'wanderer'  && renderWanderer(stage, p, p2, p3, line, lineThin, color, epath)}
      </G>
    </Svg>
  );
}

// ── LYCHEETAH — Speed, pattern, duality ──────────────────────────────────────

function renderCat(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object, _lineThin: object,
  color: string, _f3: string, _path: EvoPath,
): React.ReactElement {
  const c = color;

  const motionTrails = (count: number, opacity: number) => {
    const trails = [];
    for (let i = 0; i < count; i++) {
      const offset = (i + 1) * 8;
      trails.push(
        <Ellipse key={`trail-${i}`} cx={60 - offset} cy={50 + (i % 2 === 0 ? 3 : -3)}
          rx={6 + i * 2} ry={3 + i} fill={c} opacity={opacity * (1 - i * 0.15)} />
      );
    }
    return trails;
  };

  const thorns = (centerX: number, centerY: number, radius: number, count: number) => {
    const t = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + 8);
      const y2 = centerY + Math.sin(angle) * (radius + 8);
      const x3 = centerX + Math.cos(angle + 0.15) * (radius + 4);
      const y3 = centerY + Math.sin(angle + 0.15) * (radius + 4);
      t.push(<Polygon key={`thorn-${i}`} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={c} opacity={0.8} />);
    }
    return t;
  };

  switch (stage) {
    case 0:
      return (
        <G>
          <Ellipse cx="50" cy="55" rx="8" ry="6" fill={c} opacity="0.9" />
          <Circle cx="50" cy="48" r="5" fill={c} opacity="0.95" />
          <Polygon points="47,44 49,40 51,44" fill={c} opacity="0.9" />
          <Polygon points="51,44 53,40 55,44" fill={c} opacity="0.9" />
          <Path d="M 54 56 Q 60 58 58 52 Q 56 48 52 50" fill="none" stroke={c} strokeWidth="1.5" opacity="0.8" />
          <Circle cx="50" cy="50" r="12" fill={c} opacity="0.08" />
          <Circle cx="50" cy="50" r="6" fill={c} opacity="0.15" />
        </G>
      );
    case 1:
      return (
        <G>
          <Path d="M 35 40 L 38 35 L 42 42" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
          <Path d="M 65 38 L 62 32 L 58 40" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
          <Ellipse cx="50" cy="52" rx="14" ry="10" fill={c} opacity="0.85" />
          <Ellipse cx="50" cy="40" rx="8" ry="7" fill={c} opacity="0.9" />
          <Polygon points="44,34 46,28 49,35" fill={c} opacity="0.9" />
          <Polygon points="51,35 54,28 56,34" fill={c} opacity="0.9" />
          <Ellipse cx="42" cy="60" rx="4" ry="3" fill={c} opacity="0.8" />
          <Ellipse cx="58" cy="58" rx="4" ry="3" fill={c} opacity="0.8" />
          <Path d="M 62 50 Q 70 45 68 38 Q 66 32 72 30" fill="none" stroke={c} strokeWidth="2" opacity="0.8" />
          <Circle cx="38" cy="48" r="1.5" fill={c} opacity="0.5" />
          <Circle cx="62" cy="46" r="1.5" fill={c} opacity="0.5" />
        </G>
      );
    case 2:
      return (
        <G>
          <Ellipse cx="65" cy="50" rx="18" ry="14" fill={c} opacity="0.15" />
          <Circle cx="72" cy="42" r="2" fill={c} opacity="0.4" />
          <Circle cx="78" cy="50" r="1.5" fill={c} opacity="0.3" />
          <Circle cx="70" cy="58" r="2" fill={c} opacity="0.35" />
          <Path d="M 50 35 Q 35 35 32 45 Q 30 55 38 62 Q 45 68 50 65" fill={c} opacity="0.9" />
          <Ellipse cx="38" cy="42" rx="9" ry="8" fill={c} opacity="0.95" />
          <Polygon points="32,36 34,30 38,37" fill={c} opacity="0.9" />
          <Polygon points="40,37 44,30 46,36" fill={c} opacity="0.9" />
          <Path d="M 50 35 Q 52 42 50 50 Q 52 58 50 65" fill="none" stroke={c} strokeWidth="1.5" opacity="0.6" strokeDasharray="3 2" />
          <Ellipse cx="35" cy="62" rx="5" ry="3.5" fill={c} opacity="0.8" />
        </G>
      );
    case 3:
      return (
        <G>
          <Path d="M 50 25 L 45 35 L 52 38 L 46 48 L 54 52 L 48 62 L 55 68 L 50 75"
            fill="none" stroke={c} strokeWidth="3" opacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M 50 25 L 44 20 L 48 18 L 42 14 L 50 12 L 56 14 L 52 18 L 58 20 Z" fill={c} opacity="0.95" />
          <Polygon points="44,16 40,8 48,14" fill={c} opacity="0.9" />
          <Polygon points="52,14 60,8 56,16" fill={c} opacity="0.9" />
          <Path d="M 30 30 L 35 25 L 32 35 L 38 32" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
          <Path d="M 70 35 L 65 30 L 68 40 L 62 37" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
          <Circle cx="40" cy="40" r="3" fill={c} opacity="0.6" />
          <Circle cx="60" cy="45" r="2.5" fill={c} opacity="0.5" />
          <Line x1="20" y1="40" x2="30" y2="42" stroke={c} strokeWidth="1" opacity="0.4" />
          <Line x1="18" y1="50" x2="28" y2="50" stroke={c} strokeWidth="1" opacity="0.35" />
          <Line x1="70" y1="45" x2="80" y2="43" stroke={c} strokeWidth="1" opacity="0.3" />
        </G>
      );
    case 4:
      return (
        <G>
          {motionTrails(6, 0.25)}
          <Ellipse cx="50" cy="50" rx="22" ry="8" fill={c} opacity="0.7" />
          <Ellipse cx="45" cy="50" rx="18" ry="7" fill={c} opacity="0.5" />
          <Ellipse cx="68" cy="48" rx="10" ry="7" fill={c} opacity="0.85" />
          <Polygon points="62,42 58,36 66,40" fill={c} opacity="0.8" />
          <Polygon points="70,40 74,34 72,42" fill={c} opacity="0.8" />
          <Ellipse cx="42" cy="46" rx="4" ry="1.5" fill={c} opacity="0.6" />
          <Ellipse cx="50" cy="52" rx="5" ry="1.5" fill={c} opacity="0.5" />
          <Line x1="45" y1="56" x2="35" y2="64" stroke={c} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
          <Line x1="60" y1="55" x2="62" y2="66" stroke={c} strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
          <Path d="M 32 50 Q 20 48 15 50 Q 10 52 8 50" fill="none" stroke={c} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
          <Line x1="10" y1="35" x2="30" y2="38" stroke={c} strokeWidth="1" opacity="0.3" />
          <Line x1="8" y1="45" x2="25" y2="47" stroke={c} strokeWidth="1.5" opacity="0.25" />
        </G>
      );
    case 5:
      return (
        <G>
          <Circle cx="50" cy="50" r="28" fill={c} opacity="0.1" />
          <Circle cx="50" cy="50" r="20" fill={c} opacity="0.15" />
          <Circle cx="50" cy="50" r="14" fill={c} opacity="0.2" />
          {thorns(50, 50, 22, 16)}
          <Ellipse cx="50" cy="50" rx="16" ry="11" fill={c} opacity="0.9" />
          <Ellipse cx="38" cy="46" rx="7" ry="6" fill={c} opacity="0.85" />
          <Ellipse cx="62" cy="46" rx="7" ry="6" fill={c} opacity="0.85" />
          <Ellipse cx="50" cy="36" rx="11" ry="9" fill={c} opacity="0.95" />
          <Polygon points="42,30 38,20 46,28" fill={c} opacity="0.9" />
          <Polygon points="54,28 62,20 58,30" fill={c} opacity="0.9" />
          <Polygon points="46,26 50,16 54,26" fill={c} opacity="0.95" />
          <Circle cx="42" cy="44" r="2.5" fill={c} opacity="0.7" />
          <Circle cx="58" cy="44" r="2.5" fill={c} opacity="0.7" />
          <Circle cx="50" cy="48" r="2" fill={c} opacity="0.8" />
          <Circle cx="50" cy="50" r="6" fill={c} opacity="0.4" />
          <Circle cx="50" cy="50" r="3" fill={c} opacity="0.6" />
        </G>
      );
    default: return <G />;
  }
}

// ── ARCHIVIST — Scholar, tomes, ink sea ──────────────────────────────────────

function renderArchivist(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object,
  color: string, _path: EvoPath,
): React.ReactElement {
  const c1 = color + '44';
  const c2 = color + '88';
  const c3 = color + 'AA';
  const c4 = color + 'CC';
  const c5 = color + 'FF';
  const black = '#000000';

  switch (stage) {
    case 0:
      return (
        <G>
          <Ellipse cx="50" cy="115" rx="10" ry="4" fill={c1} stroke={color} strokeWidth="1.5" />
          <Path d="M 45 105 Q 50 96 55 105 L 53 115 L 47 115 Z" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="92" r="5" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 54 98 L 62 94" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M 62 94 L 65 91 L 64 96 Z" fill={color} stroke={color} strokeWidth="1" />
          <Circle cx="44" cy="110" r="1.5" fill={c1} stroke="none" />
          <Circle cx="50" cy="92" r="2" fill={black} opacity="0.4" stroke="none" />
        </G>
      );
    case 1:
      return (
        <G>
          <Ellipse cx="50" cy="120" rx="14" ry="6" fill={c1} stroke={color} strokeWidth="2" />
          <Path d="M 40 108 L 60 108 L 57 90 L 43 90 Z" fill={c2} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="82" r="7" fill={c3} stroke={color} strokeWidth="2" />
          <Path d="M 57 90 L 67 84" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M 67 84 L 70 80 L 68 86 Z" fill={color} stroke={color} strokeWidth="1" />
          <Rect x="36" y="94" width="8" height="10" rx="1" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="82" r="2.5" fill={black} opacity="0.4" stroke="none" />
        </G>
      );
    case 2:
      return (
        <G>
          <Ellipse cx="50" cy="122" rx="18" ry="8" fill={c1} stroke={color} strokeWidth="2" />
          <Path d="M 36 110 Q 50 85 64 110 L 60 122 L 40 122 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="78" r="8" fill={c3} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="78" r="3" fill={black} opacity="0.5" stroke="none" />
          <Rect x="28" y="65" width="10" height="7" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-15 33 68)" />
          <Rect x="62" y="68" width="10" height="7" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(15 67 71)" />
          <Rect x="45" y="55" width="10" height="7" rx="1" fill={c3} stroke={color} strokeWidth="1.5" />
        </G>
      );
    case 3:
      return (
        <G>
          <Ellipse cx="50" cy="125" rx="22" ry="10" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 32 112 Q 50 80 68 112 L 63 125 L 37 125 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="74" r="9" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="74" r="3.5" fill={black} opacity="0.5" stroke="none" />
          <Rect x="22" y="58" width="11" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-20 27 62)" />
          <Rect x="67" y="58" width="11" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(20 72 62)" />
          <Rect x="44" y="48" width="12" height="8" rx="1" fill={c3} stroke={color} strokeWidth="1.5" />
          <Rect x="18" y="82" width="11" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-10 23 86)" />
          <Rect x="71" y="82" width="11" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(10 76 86)" />
          <Ellipse cx="50" cy="48" rx="28" ry="18" fill="none" stroke={c1} strokeWidth="1" strokeDasharray="4 4" />
          <Path d="M 50 48 L 50 30" stroke={c2} strokeWidth="2" fill="none" />
        </G>
      );
    case 4:
      return (
        <G>
          <Ellipse cx="50" cy="128" rx="26" ry="12" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 28 114 Q 50 72 72 114 L 66 128 L 34 128 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="68" r="10" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="68" r="4" fill={black} opacity="0.5" stroke="none" />
          <Ellipse cx="50" cy="68" rx="32" ry="22" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 3" />
          <Rect x="18" y="52" width="12" height="9" rx="1" fill={c3} stroke={color} strokeWidth="1.5" transform="rotate(-25 24 56)" />
          <Rect x="70" y="52" width="12" height="9" rx="1" fill={c3} stroke={color} strokeWidth="1.5" transform="rotate(25 76 56)" />
          <Rect x="44" y="42" width="12" height="9" rx="1" fill={c4} stroke={color} strokeWidth="1.5" />
          <Rect x="14" y="78" width="12" height="9" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-15 20 82)" />
          <Rect x="74" y="78" width="12" height="9" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(15 80 82)" />
          <Rect x="30" y="36" width="10" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-40 35 40)" />
          <Rect x="60" y="36" width="10" height="8" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(40 65 40)" />
          <Path d="M 50 42 L 50 22" stroke={c3} strokeWidth="2.5" fill="none" />
        </G>
      );
    case 5:
      return (
        <G>
          <Path d="M 0 100 Q 25 95 50 100 Q 75 105 100 100 L 100 150 L 0 150 Z" fill={c1} stroke={color} strokeWidth="2" />
          <Path d="M 10 110 Q 30 105 50 112 Q 70 118 90 110" fill="none" stroke={c2} strokeWidth="2" />
          <Path d="M 20 125 Q 40 120 50 128 Q 60 135 80 125" fill="none" stroke={c3} strokeWidth="2" />
          <Ellipse cx="50" cy="132" rx="30" ry="14" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 24 116 Q 50 65 76 116 L 68 132 L 32 132 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="60" r="11" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="60" r="4.5" fill={black} opacity="0.6" stroke="none" />
          <Ellipse cx="50" cy="60" rx="40" ry="28" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 3" />
          <Rect x="14" y="44" width="13" height="10" rx="1" fill={c3} stroke={color} strokeWidth="1.5" transform="rotate(-30 20 49)" />
          <Rect x="73" y="44" width="13" height="10" rx="1" fill={c3} stroke={color} strokeWidth="1.5" transform="rotate(30 79 49)" />
          <Rect x="43" y="32" width="14" height="10" rx="1" fill={c4} stroke={color} strokeWidth="1.5" />
          <Rect x="8" y="72" width="13" height="10" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(-20 14 77)" />
          <Rect x="79" y="72" width="13" height="10" rx="1" fill={c2} stroke={color} strokeWidth="1.5" transform="rotate(20 85 77)" />
          <Path d="M 50 32 L 50 10" stroke={c4} strokeWidth="3" fill="none" />
          <Path d="M 50 10 L 44 18 M 50 10 L 56 18" stroke={color} strokeWidth="2.5" fill="none" />
          <Circle cx="50" cy="10" r="4" fill={c5} stroke={color} strokeWidth="1.5" />
        </G>
      );
    default: return <G />;
  }
}

// ── ALCHEMIST — Fire, transformation, flasks ──────────────────────────────────

function renderAlchemist(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object,
  color: string, _path: EvoPath,
): React.ReactElement {
  const c1 = color + '44';
  const c2 = color + '88';
  const c3 = color + 'AA';
  const c4 = color + 'CC';
  const c5 = color + 'FF';
  const black = '#000000';

  switch (stage) {
    case 0:
      return (
        <G>
          <Ellipse cx="50" cy="115" rx="10" ry="4" fill={c1} stroke={color} strokeWidth="1.5" />
          <Path d="M 46 105 Q 50 98 54 105 L 52 115 L 48 115 Z" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="92" r="5" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 54 100 L 60 96" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M 58 98 L 62 94 L 60 102 Z" fill={c2} stroke={color} strokeWidth="1" />
          <Path d="M 60 96 L 60 90" stroke={color} strokeWidth="1" fill="none" />
          <Path d="M 58 90 L 62 90" stroke={color} strokeWidth="1" fill="none" />
          <Path d="M 60 90 Q 58 84 60 80 Q 62 84 60 90" fill={c4} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="92" r="2" fill={black} opacity="0.4" stroke="none" />
        </G>
      );
    case 1:
      return (
        <G>
          <Ellipse cx="50" cy="118" rx="13" ry="6" fill={c1} stroke={color} strokeWidth="2" />
          <Path d="M 40 106 L 60 106 L 57 90 L 43 90 Z" fill={c2} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="82" r="7" fill={c3} stroke={color} strokeWidth="2" />
          <Path d="M 57 90 L 66 84" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M 66 84 L 70 80 L 68 86 Z" fill={c2} stroke={color} strokeWidth="1" />
          <Path d="M 64 78 L 64 70" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M 62 70 L 66 70" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M 63 68 L 65 64 L 67 68 Z" fill={c3} stroke={color} strokeWidth="1" />
          <Path d="M 64 64 Q 62 58 64 54 Q 66 58 64 64" fill={c4} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="82" r="2.5" fill={black} opacity="0.4" stroke="none" />
        </G>
      );
    case 2:
      return (
        <G>
          <Ellipse cx="50" cy="120" rx="17" ry="8" fill={c1} stroke={color} strokeWidth="2" />
          <Path d="M 36 108 Q 50 85 64 108 L 60 120 L 40 120 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="80" r="8" fill={c3} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="80" r="3" fill={black} opacity="0.5" stroke="none" />
          <Path d="M 30 72 L 34 64 L 38 72 Z" fill={c2} stroke={color} strokeWidth="1.5" />
          <Path d="M 34 62 Q 32 56 34 52 Q 36 56 34 62" fill={c4} stroke={color} strokeWidth="1" />
          <Path d="M 62 72 L 66 64 L 70 72 Z" fill={c2} stroke={color} strokeWidth="1.5" />
          <Path d="M 66 62 Q 64 56 66 52 Q 68 56 66 62" fill={c4} stroke={color} strokeWidth="1" />
          <Path d="M 48 68 L 48 58 L 52 58 L 52 68 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 56 Q 47 48 50 42 Q 53 48 50 56" fill={c5} stroke={color} strokeWidth="1.5" />
        </G>
      );
    case 3:
      return (
        <G>
          <Ellipse cx="50" cy="125" rx="22" ry="10" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 32 110 Q 50 75 68 110 L 63 125 L 37 125 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="72" r="9" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="72" r="3.5" fill={black} opacity="0.5" stroke="none" />
          <Ellipse cx="50" cy="72" rx="16" ry="16" fill="none" stroke={c4} strokeWidth="2" strokeDasharray="3 3" />
          <Path d="M 22 68 L 28 58 L 34 68 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 28 56 Q 25 48 28 42 Q 31 48 28 56" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 66 68 L 72 58 L 78 68 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 72 56 Q 69 48 72 42 Q 75 48 72 56" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 46 64 L 46 52 L 54 52 L 54 64 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 50 Q 46 40 50 32 Q 54 40 50 50" fill={c5} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="125" r="3" fill={c4} stroke={color} strokeWidth="1" />
        </G>
      );
    case 4:
      return (
        <G>
          <Ellipse cx="50" cy="128" rx="26" ry="12" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 28 112 Q 50 70 72 112 L 66 128 L 34 128 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="66" r="10" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="66" r="4" fill={black} opacity="0.5" stroke="none" />
          <Ellipse cx="50" cy="66" rx="20" ry="20" fill="none" stroke={c4} strokeWidth="2" strokeDasharray="3 3" />
          <Path d="M 18 62 L 26 50 L 34 62 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 26 48 Q 22 38 26 30 Q 30 38 26 48" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 66 62 L 74 50 L 82 62 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 74 48 Q 70 38 74 30 Q 78 38 74 48" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 44 58 L 44 44 L 56 44 L 56 58 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 42 Q 45 30 50 20 Q 55 30 50 42" fill={c5} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 20 L 50 8" stroke={c4} strokeWidth="2" fill="none" />
          <Polygon points="50,2 46,10 54,10" fill={c5} stroke={color} strokeWidth="1.5" />
        </G>
      );
    case 5:
      return (
        <G>
          <Ellipse cx="50" cy="132" rx="30" ry="14" fill={c1} stroke={color} strokeWidth="2.5" />
          <Path d="M 24 114 Q 50 62 76 114 L 68 132 L 32 132 Z" fill={c2} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="56" r="11" fill={c3} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="56" r="4.5" fill={black} opacity="0.6" stroke="none" />
          <Ellipse cx="50" cy="56" rx="24" ry="24" fill="none" stroke={c4} strokeWidth="2" strokeDasharray="3 3" />
          <Path d="M 14 52 L 24 38 L 34 52 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 24 36 Q 20 24 24 14 Q 28 24 24 36" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 66 52 L 76 38 L 86 52 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 76 36 Q 72 24 76 14 Q 80 24 76 36" fill={c4} stroke={color} strokeWidth="1.5" />
          <Path d="M 42 48 L 42 32 L 58 32 L 58 48 Z" fill={c3} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 30 Q 44 16 50 4 Q 56 16 50 30" fill={c5} stroke={color} strokeWidth="1.5" />
          <Path d="M 50 4 L 50 0" stroke={c4} strokeWidth="3" fill="none" />
          <Polygon points="50,0 44,10 56,10" fill={c5} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="132" r="5" fill={c4} stroke={color} strokeWidth="1.5" />
        </G>
      );
    default: return <G />;
  }
}

// ── ORACLE — Eyes, veils, foresight ──────────────────────────────────────────

function renderOracle(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object,
  color: string, _path: EvoPath,
): React.ReactElement {
  const c1 = color + '44';
  const c2 = color + '88';
  const c3 = color + 'AA';
  const c4 = color + 'CC';
  const c5 = color + 'FF';
  const black = '#000000';

  switch (stage) {
    case 0:
      return (
        <G>
          <Ellipse cx="50" cy="75" rx="14" ry="10" fill={c1} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="75" r="7" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="75" r="4" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="75" r="2" fill={black} opacity="0.7" stroke="none" />
          <Path d="M 42 68 Q 50 62 58 68" fill="none" stroke={color} strokeWidth="1.5" />
          <Path d="M 42 82 Q 50 88 58 82" fill="none" stroke={color} strokeWidth="1.5" />
        </G>
      );
    case 1:
      return (
        <G>
          <Path d="M 35 115 Q 50 60 65 115 L 60 125 L 40 125 Z" fill={c1} stroke={color} strokeWidth="2" />
          <Ellipse cx="50" cy="78" rx="10" ry="8" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="78" r="5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="78" r="3" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="78" r="1.5" fill={black} opacity="0.7" stroke="none" />
          <Path d="M 50 60 L 50 50" stroke={c1} strokeWidth="1" fill="none" strokeDasharray="2 2" />
          <Circle cx="50" cy="48" r="2" fill={c1} stroke="none" />
        </G>
      );
    case 2:
      return (
        <G>
          <Path d="M 32 118 Q 50 55 68 118 L 62 128 L 38 128 Z" fill={c1} stroke={color} strokeWidth="2.5" />
          <Ellipse cx="50" cy="68" rx="9" ry="7" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="68" r="4.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="68" r="2.5" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="68" r="1.5" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="36" cy="78" rx="6" ry="5" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="36" cy="78" r="3" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="36" cy="78" r="1.5" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="64" cy="78" rx="6" ry="5" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="64" cy="78" r="3" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="64" cy="78" r="1.5" fill={black} opacity="0.7" stroke="none" />
          <Path d="M 28 55 Q 50 45 72 55" fill="none" stroke={c2} strokeWidth="1" />
        </G>
      );
    case 3:
      return (
        <G>
          <Path d="M 30 120 Q 50 50 70 120 L 64 130 L 36 130 Z" fill={c1} stroke={color} strokeWidth="2.5" />
          <Ellipse cx="50" cy="64" rx="10" ry="8" fill={c1} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="64" r="5" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="64" r="3" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="64" r="1.5" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="34" cy="74" rx="7" ry="6" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="34" cy="74" r="3.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="34" cy="74" r="2" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="66" cy="74" rx="7" ry="6" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="66" cy="74" r="3.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="66" cy="74" r="2" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="50" cy="88" rx="5" ry="4" fill={c1} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="88" r="2.5" fill={c2} stroke={color} strokeWidth="1" />
          <Path d="M 26 48 Q 50 32 74 48" fill="none" stroke={c3} strokeWidth="1.5" />
          <Path d="M 30 40 Q 50 24 70 40" fill="none" stroke={c2} strokeWidth="1" />
        </G>
      );
    case 4:
      return (
        <G>
          <Path d="M 26 122 Q 50 45 74 122 L 68 132 L 32 132 Z" fill={c1} stroke={color} strokeWidth="2.5" />
          <Ellipse cx="50" cy="58" rx="12" ry="10" fill={c1} stroke={color} strokeWidth="2" />
          <Circle cx="50" cy="58" r="6" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="58" r="3.5" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="58" r="2" fill={black} opacity="0.7" stroke="none" />
          <Circle cx="50" cy="58" r="1" fill={c5} stroke="none" />
          <Ellipse cx="32" cy="70" rx="8" ry="6" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="32" cy="70" r="4" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="32" cy="70" r="2" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="68" cy="70" rx="8" ry="6" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="68" cy="70" r="4" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="68" cy="70" r="2" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="50" cy="84" rx="6" ry="5" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="84" r="3" fill={c2} stroke={color} strokeWidth="1" />
          <Path d="M 22 40 Q 50 20 78 40" fill="none" stroke={c4} strokeWidth="1.5" />
          <Path d="M 26 32 Q 50 12 74 32" fill="none" stroke={c3} strokeWidth="1.5" />
        </G>
      );
    case 5:
      return (
        <G>
          <Path d="M 22 124 Q 50 40 78 124 L 72 134 L 28 134 Z" fill={c1} stroke={color} strokeWidth="2.5" />
          <Ellipse cx="50" cy="52" rx="14" ry="12" fill={c1} stroke={color} strokeWidth="2.5" />
          <Circle cx="50" cy="52" r="7" fill={c2} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="52" r="4" fill={c3} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="52" r="2.5" fill={black} opacity="0.8" stroke="none" />
          <Circle cx="50" cy="52" r="1.5" fill={c5} stroke="none" />
          <Circle cx="50" cy="52" r="0.8" fill={black} stroke="none" />
          <Ellipse cx="28" cy="66" rx="9" ry="7" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="28" cy="66" r="4.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="28" cy="66" r="2.5" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="72" cy="66" rx="9" ry="7" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="72" cy="66" r="4.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="72" cy="66" r="2.5" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="50" cy="82" rx="7" ry="6" fill={c1} stroke={color} strokeWidth="1.5" />
          <Circle cx="50" cy="82" r="3.5" fill={c2} stroke={color} strokeWidth="1" />
          <Circle cx="50" cy="82" r="2" fill={black} opacity="0.7" stroke="none" />
          <Ellipse cx="38" cy="44" rx="6" ry="5" fill={c1} stroke={color} strokeWidth="1" />
          <Circle cx="38" cy="44" r="3" fill={c2} stroke={color} strokeWidth="1" />
          <Ellipse cx="62" cy="44" rx="6" ry="5" fill={c1} stroke={color} strokeWidth="1" />
          <Circle cx="62" cy="44" r="3" fill={c2} stroke={color} strokeWidth="1" />
          <Path d="M 18 32 Q 50 8 82 32" fill="none" stroke={c4} strokeWidth="2" />
          <Path d="M 22 24 Q 50 2 78 24" fill="none" stroke={c3} strokeWidth="2" />
          <Polygon points="50,10 46,18 54,18" fill={c5} stroke={color} strokeWidth="1.5" />
        </G>
      );
    default: return <G />;
  }
}

// ── SENTINEL — Crystal, fortress, immovable ───────────────────────────────────

function renderSentinel(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object,
  color: string, _path: EvoPath,
): React.ReactElement {
  const c = color;

  const hexagon = (cx: number, cy: number, r: number, opacity: number, strokeWidth: number = 0) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return (
      <Polygon points={pts.join(' ')}
        fill={strokeWidth === 0 ? c : 'none'}
        stroke={strokeWidth > 0 ? c : 'none'}
        strokeWidth={strokeWidth}
        opacity={opacity} />
    );
  };

  const crystalTower = (x: number, y: number, w: number, h: number, opacity: number) => {
    const hw = w / 2;
    return <Polygon points={`${x},${y} ${x + hw},${y - h} ${x + w},${y}`} fill={c} opacity={opacity} />;
  };

  const battlement = (x: number, y: number, w: number, h: number, teeth: number, opacity: number) => {
    const toothW = w / (teeth * 2 + 1);
    let d = `M ${x} ${y}`;
    for (let i = 0; i < teeth; i++) {
      d += ` L ${x + toothW * (2 * i + 1)} ${y} L ${x + toothW * (2 * i + 1)} ${y - h} L ${x + toothW * (2 * i + 2)} ${y - h} L ${x + toothW * (2 * i + 2)} ${y}`;
    }
    d += ` L ${x + w} ${y}`;
    return <Path d={d} fill={c} opacity={opacity} />;
  };

  switch (stage) {
    case 0:
      return (
        <G>
          <Path d="M 50 25 L 62 30 L 62 48 Q 62 58 50 65 Q 38 58 38 48 L 38 30 Z" fill={c} opacity="0.85" />
          <Path d="M 50 28 L 59 32 L 59 47 Q 59 55 50 61 Q 41 55 41 47 L 41 32 Z" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
          <Path d="M 45 35 L 48 42 L 46 48 L 50 55" fill="none" stroke={c} strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
          {hexagon(50, 45, 4, 0.4)}
          <Line x1="35" y1="68" x2="65" y2="68" stroke={c} strokeWidth="1.5" opacity="0.5" />
        </G>
      );
    case 1:
      return (
        <G>
          <Rect x="38" y="38" width="24" height="22" rx="2" fill={c} opacity="0.9" />
          <Rect x="42" y="42" width="16" height="14" rx="1" fill={c} opacity="0.7" />
          <Rect x="42" y="28" width="16" height="12" rx="1" fill={c} opacity="0.95" />
          <Line x1="42" y1="34" x2="58" y2="34" stroke={c} strokeWidth="1" opacity="0.6" />
          <Rect x="32" y="38" width="8" height="10" rx="1" fill={c} opacity="0.85" />
          <Rect x="60" y="38" width="8" height="10" rx="1" fill={c} opacity="0.85" />
          <Rect x="30" y="48" width="6" height="14" rx="1" fill={c} opacity="0.8" />
          <Rect x="64" y="48" width="6" height="14" rx="1" fill={c} opacity="0.8" />
          <Rect x="40" y="60" width="7" height="12" rx="1" fill={c} opacity="0.85" />
          <Rect x="53" y="60" width="7" height="12" rx="1" fill={c} opacity="0.85" />
          {hexagon(50, 49, 3, 0.5)}
          <Line x1="25" y1="75" x2="75" y2="75" stroke={c} strokeWidth="2" opacity="0.4" />
        </G>
      );
    case 2:
      return (
        <G>
          <Rect x="38" y="38" width="24" height="22" rx="2" fill={c} opacity="0.5" />
          <Rect x="42" y="28" width="16" height="12" rx="1" fill={c} opacity="0.55" />
          <Rect x="32" y="38" width="8" height="10" rx="1" fill={c} opacity="0.45" />
          <Rect x="60" y="38" width="8" height="10" rx="1" fill={c} opacity="0.45" />
          {hexagon(50, 49, 10, 0.7)}
          {hexagon(50, 49, 7, 0.5)}
          {hexagon(34, 42, 6, 0.6)}
          {hexagon(66, 42, 6, 0.6)}
          {hexagon(50, 33, 8, 0.65)}
          {hexagon(50, 33, 5, 0.45)}
          <Polygon points="30,50 34,48 34,56 30,58" fill={c} opacity="0.55" />
          <Polygon points="70,50 66,48 66,56 70,58" fill={c} opacity="0.55" />
          <Line x1="25" y1="75" x2="75" y2="75" stroke={c} strokeWidth="2" opacity="0.4" />
          <Polygon points="35,75 38,70 41,75" fill={c} opacity="0.4" />
          <Polygon points="60,75 63,71 66,75" fill={c} opacity="0.4" />
        </G>
      );
    case 3:
      return (
        <G>
          {hexagon(50, 50, 18, 0.8)}
          {hexagon(50, 50, 14, 0.6)}
          {hexagon(50, 50, 10, 0.4)}
          {hexagon(50, 32, 12, 0.85)}
          {hexagon(50, 32, 8, 0.65)}
          {hexagon(46, 32, 2, 0.9)}
          {hexagon(54, 32, 2, 0.9)}
          {crystalTower(28, 38, 10, 18, 0.75)}
          {crystalTower(28, 38, 6, 12, 0.55)}
          {crystalTower(72, 38, 10, 18, 0.75)}
          {crystalTower(72, 38, 6, 12, 0.55)}
          {crystalTower(22, 42, 6, 12, 0.6)}
          {crystalTower(78, 42, 6, 12, 0.6)}
          {hexagon(30, 55, 7, 0.65)}
          {hexagon(30, 55, 4, 0.45)}
          {hexagon(70, 55, 7, 0.65)}
          {hexagon(70, 55, 4, 0.45)}
          {hexagon(42, 68, 6, 0.6)}
          {hexagon(58, 68, 6, 0.6)}
          <Line x1="20" y1="78" x2="80" y2="78" stroke={c} strokeWidth="2.5" opacity="0.5" />
          <Polygon points="30,78 35,72 40,78" fill={c} opacity="0.5" />
          <Polygon points="60,78 65,71 70,78" fill={c} opacity="0.5" />
        </G>
      );
    case 4:
      return (
        <G>
          <Rect x="40" y="35" width="20" height="28" fill={c} opacity="0.9" />
          {battlement(38, 35, 24, 5, 4, 0.85)}
          <Rect x="28" y="38" width="10" height="22" fill={c} opacity="0.85" />
          <Rect x="62" y="38" width="10" height="22" fill={c} opacity="0.85" />
          {battlement(26, 38, 14, 4, 2, 0.8)}
          {battlement(60, 38, 14, 4, 2, 0.8)}
          <Rect x="18" y="45" width="12" height="16" fill={c} opacity="0.75" />
          <Rect x="70" y="45" width="12" height="16" fill={c} opacity="0.75" />
          {battlement(16, 45, 16, 3, 2, 0.7)}
          {battlement(68, 45, 16, 3, 2, 0.7)}
          <Rect x="45" y="50" width="10" height="13" rx="4" fill={c} opacity="0.6" />
          <Rect x="38" y="63" width="8" height="14" fill={c} opacity="0.8" />
          <Rect x="54" y="63" width="8" height="14" fill={c} opacity="0.8" />
          <Rect x="35" y="75" width="12" height="4" fill={c} opacity="0.9" />
          <Rect x="53" y="75" width="12" height="4" fill={c} opacity="0.9" />
          {hexagon(35, 50, 2, 0.5)}
          {hexagon(65, 50, 2, 0.5)}
          <Line x1="15" y1="80" x2="85" y2="80" stroke={c} strokeWidth="3" opacity="0.5" />
        </G>
      );
    case 5:
      return (
        <G>
          <Polygon points="15,80 25,65 35,70 45,62 55,62 65,70 75,65 85,80" fill={c} opacity="0.6" />
          <Polygon points="20,80 30,68 40,72 50,65 60,72 70,68 80,80" fill={c} opacity="0.45" />
          <Rect x="35" y="30" width="30" height="35" fill={c} opacity="0.95" />
          <Rect x="40" y="35" width="20" height="25" fill={c} opacity="0.7" />
          {battlement(32, 30, 36, 6, 5, 0.9)}
          <Rect x="22" y="35" width="12" height="28" fill={c} opacity="0.9" />
          <Rect x="66" y="35" width="12" height="28" fill={c} opacity="0.9" />
          {battlement(20, 35, 16, 5, 2, 0.85)}
          {battlement(64, 35, 16, 5, 2, 0.85)}
          <Rect x="10" y="42" width="14" height="20" fill={c} opacity="0.85" />
          <Rect x="76" y="42" width="14" height="20" fill={c} opacity="0.85" />
          {battlement(8, 42, 18, 4, 2, 0.8)}
          {battlement(74, 42, 18, 4, 2, 0.8)}
          <Rect x="45" y="48" width="10" height="17" rx="1" fill={c} opacity="0.8" />
          <Line x1="50" y1="48" x2="50" y2="65" stroke={c} strokeWidth="2" opacity="0.6" />
          {hexagon(50, 38, 4, 0.8)}
          {hexagon(50, 38, 2.5, 0.6)}
          {hexagon(28, 48, 3, 0.7)}
          {hexagon(72, 48, 3, 0.7)}
          {hexagon(50, 50, 28, 0.15, 1)}
          {hexagon(50, 50, 24, 0.2, 1.5)}
          <Rect x="32" y="32" width="4" height="8" fill={c} opacity="0.9" />
          <Rect x="64" y="32" width="4" height="8" fill={c} opacity="0.9" />
        </G>
      );
    default: return <G />;
  }
}

// ── WANDERER — Flowing, directional, wind-swept ───────────────────────────────

function renderWanderer(
  stage: EvolutionStage,
  _p: object, _p2: object, _p3: object, _line: object, _lineThin: object,
  color: string, _path: EvoPath,
): React.ReactElement {
  const c = color;

  const windTrails = (startX: number, startY: number, length: number, count: number, opacity: number) => {
    const trails = [];
    for (let i = 0; i < count; i++) {
      const yOffset = i * 6 - (count * 3);
      const xOffset = i * 3;
      trails.push(
        <Line key={`wind-${i}`}
          x1={startX + xOffset} y1={startY + yOffset}
          x2={startX + xOffset + length} y2={startY + yOffset - length * 0.3}
          stroke={c} strokeWidth={1 + (count - i) * 0.3}
          opacity={opacity * (1 - i * 0.1)} strokeLinecap="round" />
      );
    }
    return trails;
  };

  const horizon = (y: number, width: number, opacity: number) => (
    <G>
      <Line x1={50 - width/2} y1={y} x2={50 + width/2} y2={y} stroke={c} strokeWidth="1" opacity={opacity} />
      <Line x1={50 - width/3} y1={y - 2} x2={50 + width/3} y2={y - 2} stroke={c} strokeWidth="0.5" opacity={opacity * 0.6} />
    </G>
  );

  switch (stage) {
    case 0:
      return (
        <G>
          <Ellipse cx="50" cy="65" rx="5" ry="3" fill={c} opacity="0.5" />
          <Ellipse cx="50" cy="62" rx="3.5" ry="2" fill={c} opacity="0.4" />
          <Circle cx="47" cy="63" r="1" fill={c} opacity="0.35" />
          <Circle cx="49" cy="62" r="1" fill={c} opacity="0.35" />
          <Circle cx="51" cy="62" r="1" fill={c} opacity="0.35" />
          <Circle cx="53" cy="63" r="1" fill={c} opacity="0.35" />
          <Path d="M 65 45 Q 72 42 75 48 Q 78 54 72 58 Q 68 55 70 50" fill={c} opacity="0.15" />
          <Line x1="60" y1="40" x2="72" y2="38" stroke={c} strokeWidth="0.5" opacity="0.15" />
        </G>
      );
    case 1:
      return (
        <G>
          {windTrails(65, 45, 12, 4, 0.3)}
          <Path d="M 45 30 Q 38 35 35 45 Q 32 55 38 62 Q 45 65 50 58 Q 55 50 52 40 Q 50 32 45 30" fill={c} opacity="0.7" />
          <Path d="M 48 32 Q 42 38 40 48 Q 38 56 44 60" fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
          <Ellipse cx="48" cy="30" rx="7" ry="6" fill={c} opacity="0.85" />
          <Ellipse cx="42" cy="64" rx="4" ry="2.5" fill={c} opacity="0.8" />
          <Ellipse cx="52" cy="63" rx="4" ry="2.5" fill={c} opacity="0.8" />
          <Line x1="30" y1="68" x2="70" y2="68" stroke={c} strokeWidth="1" opacity="0.3" />
        </G>
      );
    case 2:
      return (
        <G>
          {windTrails(70, 40, 15, 5, 0.35)}
          <Path d="M 40 25 Q 25 30 22 42 Q 18 55 28 65 Q 40 72 55 62 Q 68 50 62 35 Q 55 22 40 25" fill={c} opacity="0.5" />
          <Path d="M 42 28 Q 30 32 28 42 Q 25 52 32 60 Q 42 66 52 58 Q 60 48 55 36 Q 50 26 42 28" fill={c} opacity="0.3" />
          {horizon(38, 20, 0.5)}
          {horizon(45, 24, 0.4)}
          {horizon(52, 18, 0.35)}
          <Path d="M 32 42 L 36 38 L 40 41 L 44 37 L 48 40" fill="none" stroke={c} strokeWidth="0.8" opacity="0.4" />
          <Ellipse cx="45" cy="28" rx="6" ry="5" fill={c} opacity="0.85" />
          <Ellipse cx="38" cy="66" rx="3.5" ry="2" fill={c} opacity="0.75" />
          <Path d="M 28 65 Q 20 68 15 65" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        </G>
      );
    case 3:
      return (
        <G>
          {windTrails(75, 35, 18, 6, 0.4)}
          <Ellipse cx="48" cy="30" rx="7" ry="6" fill={c} opacity="0.9" />
          <Path d="M 42 32 Q 32 38 28 48 Q 24 58 30 66" fill="none" stroke={c} strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <Path d="M 54 32 Q 62 38 66 48 Q 70 56 64 64" fill="none" stroke={c} strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <Path d="M 30 66 Q 22 72 18 68 Q 14 64 20 60" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
          <Path d="M 64 64 Q 72 68 76 64 Q 80 60 74 56" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
          <Ellipse cx="35" cy="68" rx="4" ry="2" fill={c} opacity="0.35" />
          <Ellipse cx="28" cy="72" rx="3.5" ry="1.8" fill={c} opacity="0.3" />
          <Path d="M 42 35 L 38 48 L 40 58" fill="none" stroke={c} strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
          <Path d="M 54 35 L 58 48 L 56 58" fill="none" stroke={c} strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
        </G>
      );
    case 4:
      return (
        <G>
          <Path d="M 35 20 Q 15 28 12 42 Q 8 58 22 70 Q 38 80 55 68 Q 72 55 68 38 Q 62 20 45 18 Q 38 16 35 20" fill={c} opacity="0.25" />
          {horizon(32, 30, 0.5)}
          {horizon(40, 35, 0.4)}
          {horizon(48, 28, 0.45)}
          {horizon(55, 32, 0.35)}
          <Path d="M 25 38 L 30 33 L 35 37 L 40 32 L 45 36" fill="none" stroke={c} strokeWidth="0.8" opacity="0.35" />
          <Ellipse cx="48" cy="28" rx="8" ry="7" fill={c} opacity="0.8" />
          <Circle cx="44" cy="26" r="1" fill={c} opacity="0.6" />
          <Circle cx="52" cy="27" r="1" fill={c} opacity="0.6" />
          <Line x1="20" y1="50" x2="32" y2="48" stroke={c} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <Line x1="68" y1="45" x2="82" y2="42" stroke={c} strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <Path d="M 15 35 Q 20 30 18 25 Q 16 22 22 20" fill="none" stroke={c} strokeWidth="0.5" opacity="0.2" strokeLinecap="round" />
        </G>
      );
    case 5:
      return (
        <G>
          <Ellipse cx="50" cy="50" rx="35" ry="28" fill={c} opacity="0.08" />
          <Ellipse cx="50" cy="50" rx="28" ry="22" fill={c} opacity="0.12" />
          {horizon(40, 40, 0.4)}
          <Path d="M 22 40 L 28 35 L 34 38 L 40 33" fill="none" stroke={c} strokeWidth="1" opacity="0.35" />
          {horizon(55, 35, 0.35)}
          <Path d="M 55 35 L 62 30 L 68 33 L 75 28" fill="none" stroke={c} strokeWidth="1" opacity="0.3" />
          <Ellipse cx="50" cy="32" rx="9" ry="8" fill={c} opacity="0.95" />
          <Path d="M 42 26 L 46 18 L 50 24 L 54 18 L 58 26" fill={c} opacity="0.85" />
          <Path d="M 38 38 Q 22 45 18 58 Q 15 70 28 76 Q 42 82 55 72 Q 68 62 64 48 Q 60 35 48 32" fill={c} opacity="0.4" />
          <Line x1="32" y1="50" x2="42" y2="48" stroke={c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <Line x1="58" y1="52" x2="70" y2="50" stroke={c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <Path d="M 30 74 Q 40 78 50 75 Q 60 72 68 76" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
          <Ellipse cx="40" cy="78" rx="4" ry="2" fill={c} opacity="0.45" />
          <Ellipse cx="50" cy="80" rx="4" ry="2" fill={c} opacity="0.5" />
          <Ellipse cx="60" cy="78" rx="4" ry="2" fill={c} opacity="0.45" />
          {windTrails(78, 30, 14, 4, 0.3)}
          <Circle cx="45" cy="30" r="1.2" fill={c} opacity="0.7" />
          <Circle cx="55" cy="31" r="1.2" fill={c} opacity="0.7" />
          <Circle cx="50" cy="36" r="1" fill={c} opacity="0.6" />
        </G>
      );
    default: return <G />;
  }
}
