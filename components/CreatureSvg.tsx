import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect, Polygon, G, Line } from 'react-native-svg';

type ArchetypeId    = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah';
type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type EvoPath        = 'A' | 'B' | 'C';

const W = 100;
const H = 150;

interface Props {
  archId: ArchetypeId;
  stage: EvolutionStage;
  color: string;
  path?: EvoPath | null;
}

export function CreatureSvg({ archId, stage, color, path }: Props) {
  const f  = color + 'AA';
  const f2 = color + 'DD';
  const f3 = color + 'FF';
  const sw = 2.5;
  const p  = { fill: f,  stroke: color, strokeWidth: sw } as const;
  const p2 = { fill: f2, stroke: color, strokeWidth: sw } as const;
  const p3 = { fill: color, stroke: 'none' } as const;
  const line     = { stroke: color, strokeWidth: sw,  fill: 'none' } as const;
  const lineThin = { stroke: color, strokeWidth: 1.5, fill: 'none' } as const;
  const epath = path ?? 'A';

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* dark contrast base so creature pops on any background */}
      <Rect x={10} y={10} width={80} height={130} rx={14} fill="#000000CC" stroke="none" />
      {/* ambient glow rings */}
      <Circle cx={50} cy={80} r={52} fill={color + '18'} stroke="none" />
      <Circle cx={50} cy={80} r={38} fill={color + '28'} stroke="none" />
      <G opacity={0.96}>
        {archId === 'lycheetah' && renderCat(stage, p, p2, p3, line, lineThin, color, f3, epath)}
        {archId === 'archivist' && renderTower(stage, p, p2, p3, line, color, epath)}
        {archId === 'alchemist' && renderFlask(stage, p, p2, p3, line, color, epath)}
        {archId === 'oracle'    && renderOracle(stage, p, p2, p3, line, color, epath)}
        {archId === 'sentinel'  && renderFortress(stage, p, p2, p3, line, color, epath)}
        {archId === 'wanderer'  && renderCloak(stage, p, p2, p3, line, lineThin, color, epath)}
      </G>
    </Svg>
  );
}

// ── LYCHEETAH — Cat silhouette ────────────────────────────────────────────────

function renderCat(
  stage: EvolutionStage,
  p: object, p2: object, p3: object, line: object, lineThin: object,
  color: string, f3: string, path: EvoPath,
) {
  switch (stage === 1 ? 5 : stage) {
    case 0: return ( // tiny curled kitten
      <G>
        <Circle cx={50} cy={82} r={13} {...p} />
        <Polygon points="40,72 36,61 49,71" {...p2} />
        <Polygon points="60,72 64,61 51,71" {...p2} />
        <Ellipse cx={50} cy={108} rx={13} ry={15} {...p} />
        <Path d="M 59,118 Q 74,112 72,96" strokeLinecap="round" {...line} />
      </G>
    );
    case 1: return ( // chaos kitten — alert, bigger ears
      <G>
        <Circle cx={50} cy={76} r={17} {...p} />
        <Polygon points="36,64 30,48 48,63" {...p2} />
        <Polygon points="64,64 70,48 52,63" {...p2} />
        <Ellipse cx={50} cy={111} rx={17} ry={22} {...p} />
        <Line x1={40} y1={126} x2={38} y2={142} strokeLinecap="round" {...lineThin} />
        <Line x1={52} y1={129} x2={52} y2={145} strokeLinecap="round" {...lineThin} />
        <Path d="M 63,122 Q 84,114 82,92" strokeLinecap="round" {...line} />
        {/* chaos sparks */}
        <Circle cx={28} cy={72} r={1.5} {...p3} />
        <Circle cx={72} cy={70} r={1.5} {...p3} />
      </G>
    );
    case 2: return ( // Lykitty — proper cat shape
      <G>
        <Circle cx={50} cy={68} r={21} {...p} />
        <Polygon points="32,56 25,38 47,55" {...p2} />
        <Polygon points="68,56 75,38 53,55" {...p2} />
        {/* inner ear */}
        <Polygon points="35,54 30,43 45,53" fill={f3} stroke="none" />
        <Polygon points="65,54 70,43 55,53" fill={f3} stroke="none" />
        {/* body */}
        <Path d="M 28,92 Q 26,118 38,132 L 62,132 Q 74,118 72,92 Q 62,82 50,82 Q 38,82 28,92 Z" {...p} />
        <Line x1={38} y1={132} x2={36} y2={147} strokeLinecap="round" {...line} />
        <Line x1={48} y1={134} x2={48} y2={148} strokeLinecap="round" {...line} />
        <Line x1={56} y1={132} x2={58} y2={147} strokeLinecap="round" {...line} />
        <Path d="M 68,128 Q 90,118 88,94 Q 86,82 80,78" strokeLinecap="round" {...line} />
        {/* nose dot */}
        <Circle cx={50} cy={73} r={2} {...p3} />
      </G>
    );
    case 3: {
      // A=Lykitty (round, playful), B=Chaos Kitten (angular, electric), C=Void Cat (sleek, minimal)
      if (path === 'B') return (
        <G>
          {/* angular sparks everywhere */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
            const rad = a * Math.PI / 180;
            return <Line key={i} x1={50+26*Math.cos(rad)} y1={60+26*Math.sin(rad)} x2={50+34*Math.cos(rad)} y2={60+34*Math.sin(rad)} stroke={color} strokeWidth={1.2} fill="none" />;
          })}
          {/* angular head — more triangular */}
          <Polygon points="50,38 76,72 24,72" {...p2} />
          <Polygon points="28,50 18,26 46,46" {...p2} />
          <Polygon points="72,50 82,26 54,46" {...p2} />
          <Path d="M 26,86 L 22,120 L 38,138 L 62,138 L 78,120 L 74,86 L 60,74 L 40,74 Z" {...p} />
          <Line x1={34} y1={138} x2={30} y2={148} strokeLinecap="round" {...line} />
          <Line x1={50} y1={140} x2={50} y2={149} strokeLinecap="round" {...line} />
          <Line x1={66} y1={138} x2={70} y2={148} strokeLinecap="round" {...line} />
          <Path d="M 74,134 Q 98,120 96,88 Q 94,70 86,62" strokeLinecap="round" {...line} />
          <Circle cx={50} cy={66} r={3} {...p3} />
        </G>
      );
      if (path === 'C') return (
        <G>
          {/* void cat — elongated, minimal, sleek */}
          <Ellipse cx={50} cy={58} rx={22} ry={20} {...p} />
          <Polygon points="32,44 26,28 46,44" {...p} />
          <Polygon points="68,44 74,28 54,44" {...p} />
          <Path d="M 30,76 Q 28,120 40,140 L 60,140 Q 72,120 70,76 Q 62,66 50,66 Q 38,66 30,76 Z" {...p} />
          <Line x1={40} y1={140} x2={38} y2={148} strokeLinecap="round" {...lineThin} />
          <Line x1={60} y1={140} x2={62} y2={148} strokeLinecap="round" {...lineThin} />
          <Path d="M 66,138 Q 96,124 94,88 Q 92,68 84,58" strokeLinecap="round" strokeWidth={1.8} stroke={color} fill="none" />
          <Circle cx={50} cy={64} r={2} {...p3} />
        </G>
      );
      return ( // path A — Lykitty, round and playful
        <G>
          <Line x1={22} y1={60} x2={16} y2={54} strokeLinecap="round" {...lineThin} />
          <Line x1={78} y1={60} x2={84} y2={54} strokeLinecap="round" {...lineThin} />
          <Line x1={50} y1={30} x2={50} y2={22} strokeLinecap="round" {...lineThin} />
          <Line x1={18} y1={90} x2={10} y2={88} strokeLinecap="round" {...lineThin} />
          <Line x1={82} y1={90} x2={90} y2={88} strokeLinecap="round" {...lineThin} />
          <Circle cx={50} cy={62} r={24} {...p} />
          <Polygon points="28,48 20,28 46,46" {...p2} />
          <Polygon points="72,48 80,28 54,46" {...p2} />
          <Polygon points="31,46 25,34 44,44" fill={color + '44'} stroke="none" />
          <Polygon points="69,46 75,34 56,44" fill={color + '44'} stroke="none" />
          <Path d="M 22,88 Q 20,118 34,134 L 66,134 Q 80,118 78,88 Q 66,76 50,76 Q 34,76 22,88 Z" {...p} />
          <Line x1={34} y1={134} x2={32} y2={148} strokeLinecap="round" {...line} />
          <Line x1={48} y1={136} x2={47} y2={149} strokeLinecap="round" {...line} />
          <Line x1={62} y1={134} x2={64} y2={148} strokeLinecap="round" {...line} />
          <Path d="M 74,130 Q 96,118 94,90 Q 92,74 84,68" strokeLinecap="round" {...line} />
          <Circle cx={50} cy={68} r={2.5} {...p3} />
          <Path d="M 42,100 Q 50,97 58,100" fill="none" stroke={color} strokeWidth={0.8} />
        </G>
      );
    }
    case 4: {
      if (path === 'B') return (
        <G>
          <Circle cx={50} cy={56} r={30} fill="none" stroke={color} strokeWidth={0.5} opacity={0.4} />
          {[0,36,72,108,144,180,216,252,288,324].map((a,i) => {
            const rad = a * Math.PI / 180;
            return <Line key={i} x1={50+28*Math.cos(rad)} y1={56+28*Math.sin(rad)} x2={50+36*Math.cos(rad)} y2={56+36*Math.sin(rad)} stroke={color} strokeWidth={1.5} fill="none" />;
          })}
          <Polygon points="50,34 80,72 20,72" {...p2} />
          <Polygon points="22,42 12,14 44,38" {...p2} />
          <Polygon points="78,42 88,14 56,38" {...p2} />
          <Path d="M 20,84 L 14,124 L 30,142 L 70,142 L 86,124 L 80,84 L 64,70 L 36,70 Z" {...p} />
          <Rect x={24} y={142} width={10} height={8} rx={2} {...p3} />
          <Rect x={40} y={142} width={10} height={8} rx={2} {...p3} />
          <Rect x={56} y={142} width={10} height={8} rx={2} {...p3} />
          <Rect x={70} y={142} width={10} height={8} rx={2} {...p3} />
          <Path d="M 82,138 Q 108,120 106,84 Q 104,62 94,52" strokeLinecap="round" strokeWidth={2} stroke={color} fill="none" />
          <Circle cx={50} cy={62} r={3.5} {...p3} />
        </G>
      );
      if (path === 'C') return (
        <G>
          <Circle cx={50} cy={54} r={35} fill="none" stroke={color} strokeWidth={0.3} opacity={0.2} />
          <Ellipse cx={50} cy={52} rx={24} ry={22} {...p} />
          <Polygon points="30,38 24,18 46,38" {...p} />
          <Polygon points="70,38 76,18 54,38" {...p} />
          <Path d="M 28,72 Q 24,120 36,140 L 64,140 Q 76,120 72,72 Q 63,62 50,62 Q 37,62 28,72 Z" {...p} />
          <Line x1={36} y1={140} x2={34} y2={148} strokeLinecap="round" {...lineThin} />
          <Line x1={52} y1={141} x2={52} y2={149} strokeLinecap="round" {...lineThin} />
          <Line x1={64} y1={140} x2={66} y2={148} strokeLinecap="round" {...lineThin} />
          <Path d="M 68,138 Q 100,120 98,82 Q 96,60 86,50" strokeLinecap="round" strokeWidth={2} stroke={color} fill="none" />
          <Circle cx={50} cy={58} r={2.5} {...p3} />
        </G>
      );
      return ( // path A — lean panther
        <G>
          <Circle cx={50} cy={58} r={40} fill="none" stroke={color} strokeWidth={0.4} opacity={0.3} />
          <Line x1={19} y1={50} x2={10} y2={44} strokeLinecap="round" stroke={color} strokeWidth={1} fill="none" />
          <Line x1={81} y1={50} x2={90} y2={44} strokeLinecap="round" stroke={color} strokeWidth={1} fill="none" />
          <Line x1={50} y1={20} x2={50} y2={10} strokeLinecap="round" stroke={color} strokeWidth={1} fill="none" />
          <Line x1={14} y1={78} x2={4}  y2={76} strokeLinecap="round" stroke={color} strokeWidth={0.8} fill="none" />
          <Line x1={86} y1={78} x2={96} y2={76} strokeLinecap="round" stroke={color} strokeWidth={0.8} fill="none" />
          <Circle cx={50} cy={56} r={27} {...p2} />
          <Polygon points="25,42 15,18 45,40" {...p2} />
          <Polygon points="75,42 85,18 55,40" {...p2} />
          <Polygon points="28,40 22,26 43,38" fill={color + '55'} stroke="none" />
          <Polygon points="72,40 78,26 57,38" fill={color + '55'} stroke="none" />
          <Path d="M 18,84 Q 14,118 28,136 L 72,136 Q 86,118 82,84 Q 70,70 50,70 Q 30,70 18,84 Z" {...p2} />
          <Rect x={30} y={136} width={8} height={14} rx={3} {...p} />
          <Rect x={44} y={137} width={8} height={13} rx={3} {...p} />
          <Rect x={58} y={137} width={8} height={13} rx={3} {...p} />
          <Rect x={64} y={134} width={8} height={15} rx={3} {...p} />
          <Path d="M 78,132 Q 102,115 100,82 Q 98,64 90,56" strokeLinecap="round" {...line} />
          <Circle cx={50} cy={62} r={3} {...p3} />
          <Path d="M 40,92 Q 50,88 60,92" fill="none" stroke={color} strokeWidth={1} />
          <Path d="M 36,98 Q 50,94 64,98" fill="none" stroke={color} strokeWidth={0.7} />
        </G>
      );
    }
    default: {
      if (path === 'B') return ( // chaos sovereign — storm form
        <G>
          {[0,22,45,67,90,112,135,157,180,202,225,247,270,292,315,337].map((a,i) => {
            const rad = a * Math.PI / 180;
            const r1 = 44, r2 = 54;
            return <Line key={i} x1={50+r1*Math.cos(rad)} y1={52+r1*Math.sin(rad)} x2={50+r2*Math.cos(rad)} y2={52+r2*Math.sin(rad)} stroke={color} strokeWidth={1} fill="none" opacity={0.6} />;
          })}
          <Polygon points="50,22 84,68 16,68" {...p2} />
          <Polygon points="18,32 6,4 42,30" {...p2} />
          <Polygon points="82,32 94,4 58,30" {...p2} />
          <Path d="M 10,78 L 4,128 L 24,144 L 76,144 L 96,128 L 90,78 L 70,62 L 30,62 Z" {...p} />
          <Rect x={16} y={144} width={12} height={6} rx={2} {...p3} />
          <Rect x={36} y={144} width={12} height={6} rx={2} {...p3} />
          <Rect x={52} y={144} width={12} height={6} rx={2} {...p3} />
          <Rect x={72} y={144} width={12} height={6} rx={2} {...p3} />
          <Path d="M 88,140 Q 114,120 112,78 Q 110,54 100,44" strokeLinecap="round" strokeWidth={2.5} stroke={color} fill="none" />
          <Circle cx={50} cy={56} r={5} {...p3} />
          <Path d="M 28,80 L 72,80" stroke={color} strokeWidth={0.8} fill="none" />
          <Path d="M 20,92 Q 50,85 80,92" fill="none" stroke={color} strokeWidth={1} />
        </G>
      );
      if (path === 'C') return ( // void sovereign — shadow form, minimal
        <G>
          <Circle cx={50} cy={50} r={48} fill="none" stroke={color} strokeWidth={0.2} opacity={0.15} />
          <Circle cx={50} cy={50} r={38} fill="none" stroke={color} strokeWidth={0.3} opacity={0.2} />
          <Ellipse cx={50} cy={48} rx={32} ry={30} {...p} />
          <Polygon points="22,30 16,8 46,30" {...p} />
          <Polygon points="78,30 84,8 54,30" {...p} />
          <Path d="M 16,74 Q 12,124 28,144 L 72,144 Q 88,124 84,74 Q 72,60 50,60 Q 28,60 16,74 Z" {...p} />
          <Line x1={28} y1={144} x2={26} y2={150} strokeLinecap="round" {...lineThin} />
          <Line x1={44} y1={145} x2={44} y2={150} strokeLinecap="round" {...lineThin} />
          <Line x1={56} y1={145} x2={56} y2={150} strokeLinecap="round" {...lineThin} />
          <Line x1={72} y1={144} x2={74} y2={150} strokeLinecap="round" {...lineThin} />
          <Path d="M 80,142 Q 110,124 108,82 Q 106,56 96,46" strokeLinecap="round" strokeWidth={2.5} stroke={color} fill="none" />
          <Circle cx={50} cy={56} r={4} {...p3} />
        </G>
      );
      return ( // CHAOS / LYCHEETAH — Fire Sovereign
        <G>
          {/* Flame legs */}
          <Path d="M38 118 Q32 128 34 145 L42 145 Q44 132 42 118 Z" fill="#FF4500" opacity="0.9" />
          <Path d="M58 118 Q62 130 60 145 L68 145 Q72 130 66 118 Z" fill="#FF4500" opacity="0.9" />
          <Path d="M38 122 Q30 132 32 148 L44 145 Q44 128 40 120 Z" fill="#FF6A00" opacity="0.5" />
          <Path d="M62 122 Q70 132 68 148 L56 145 Q56 128 60 120 Z" fill="#FF6A00" opacity="0.5" />
          {/* Fire torso */}
          <Path d="M34 70 Q30 96 34 120 L66 120 Q70 96 66 70 Q58 60 50 58 Q42 60 34 70 Z" fill="#CC2200" stroke="#FF4500" strokeWidth="0.7" />
          <Path d="M38 72 Q35 96 38 116 L62 116 Q65 96 62 72 Q56 64 50 62 Q44 64 38 72 Z" fill="#991800" />
          {/* Flame torso detail */}
          <Path d="M50 68 Q44 78 46 88 Q50 82 54 88 Q56 78 50 68 Z" fill="#FF6A00" opacity="0.7" />
          <Path d="M42 82 Q38 90 40 100 Q44 94 50 96 Q44 90 42 82 Z" fill="#FF4500" opacity="0.4" />
          {/* Arms */}
          <Path d="M34 75 Q20 82 16 98" stroke="#CC2200" strokeWidth="7" strokeLinecap="round" fill="none" />
          <Path d="M66 75 Q80 82 84 98" stroke="#CC2200" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Hand fire */}
          <Circle cx="15" cy="99" r="7" fill="#FF4500" opacity="0.15" />
          <Circle cx="15" cy="99" r="4.5" fill="#FF4500" opacity="0.4" />
          <Circle cx="15" cy="99" r="2.5" fill="#FF8C00" />
          <Circle cx="85" cy="99" r="7" fill="#FF4500" opacity="0.15" />
          <Circle cx="85" cy="99" r="4.5" fill="#FF4500" opacity="0.4" />
          <Circle cx="85" cy="99" r="2.5" fill="#FF8C00" />
          {/* Cat head */}
          <Circle cx="50" cy="44" r="20" fill="#1a0500" stroke="#CC2200" strokeWidth="0.8" />
          {/* Ears — angular cat */}
          <Polygon points="30,30 24,12 44,28" fill="#CC2200" />
          <Polygon points="70,30 76,12 56,28" fill="#CC2200" />
          <Polygon points="32,28 28,18 42,27" fill="#FF4500" opacity="0.5" />
          <Polygon points="68,28 72,18 58,27" fill="#FF4500" opacity="0.5" />
          {/* Mischievous eyes */}
          <Circle cx="42" cy="44" r="6" fill="#FF4500" opacity="0.2" />
          <Circle cx="42" cy="44" r="4" fill="#FF4500" opacity="0.6" />
          <Circle cx="42" cy="44" r="2" fill="#FFB300" />
          <Circle cx="58" cy="44" r="6" fill="#FF4500" opacity="0.2" />
          <Circle cx="58" cy="44" r="4" fill="#FF4500" opacity="0.6" />
          <Circle cx="58" cy="44" r="2" fill="#FFB300" />
          {/* Smirk */}
          <Path d="M44 54 Q50 58 56 54" stroke="#FF4500" strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <Line x1="30" y1="48" x2="42" y2="50" stroke="#FF6A00" strokeWidth="0.6" fill="none" opacity="0.7" />
          <Line x1="30" y1="52" x2="42" y2="52" stroke="#FF6A00" strokeWidth="0.6" fill="none" opacity="0.5" />
          <Line x1="70" y1="48" x2="58" y2="50" stroke="#FF6A00" strokeWidth="0.6" fill="none" opacity="0.7" />
          <Line x1="70" y1="52" x2="58" y2="52" stroke="#FF6A00" strokeWidth="0.6" fill="none" opacity="0.5" />
          {/* Spark bursts */}
          <Circle cx="22" cy="65" r="2" fill="#FF8C00" opacity="0.9" />
          <Circle cx="18" cy="72" r="1.5" fill="#FFB300" opacity="0.8" />
          <Circle cx="78" cy="65" r="2" fill="#FF8C00" opacity="0.9" />
          <Circle cx="82" cy="72" r="1.5" fill="#FFB300" opacity="0.8" />
          <Circle cx="50" cy="16" r="2" fill="#FF4500" opacity="0.8" />
          <Circle cx="44" cy="12" r="1.2" fill="#FF8C00" opacity="0.7" />
          <Circle cx="56" cy="12" r="1.2" fill="#FF8C00" opacity="0.7" />
          {/* Floor fire glow */}
          <Circle cx="50" cy="143" r="16" fill="#FF4500" opacity="0.07" />
          <Circle cx="50" cy="143" r="10" fill="#FF4500" opacity="0.12" />
        </G>
      );
    }
  }
}

// ── ARCHIVIST / SOLFORM — Golden Scholar-Golem (Gemini art) ──────────────────

function renderTower(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage === 1 ? 5 : stage) {
    case 0: return ( // scholar seed — one floating book, single eye glow
      <G>
        {/* floating book */}
        <Polygon points="32,70 50,60 68,70 50,80" fill={color+'77'} stroke={color} strokeWidth={1.2} />
        <Line x1={50} y1={60} x2={50} y2={80} stroke={color} strokeWidth={0.8} fill="none" />
        <Line x1={32} y1={70} x2={68} y2={70} stroke={color} strokeWidth={0.8} fill="none" />
        {/* spine lines suggesting pages */}
        <Line x1={42} y1={64} x2={42} y2={76} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
        <Line x1={58} y1={64} x2={58} y2={76} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
        {/* single eye above */}
        <Circle cx={50} cy={46} r={10} fill={color+'55'} stroke={color} strokeWidth={0.8} />
        <Circle cx={50} cy={46} r={4}  fill={color+'99'} stroke="none" />
        <Circle cx={50} cy={46} r={2}  fill={color} stroke="none" />
        {/* connect eye to book */}
        <Line x1={50} y1={56} x2={50} y2={60} stroke={color} strokeWidth={0.6} fill="none" opacity={0.4} />
        {/* faint sigil diamond */}
        <Polygon points="50,92 54,98 50,104 46,98" fill={color+'77'} stroke={color} strokeWidth={0.6} />
      </G>
    );
    case 1: return ( // unused — mapped to stage 5
      <G><Circle cx={50} cy={75} r={20} fill={color+'77'} stroke={color} strokeWidth={1} /></G>
    );
    case 2: return ( // scholar embryo — small robed body, head in hood, one book orbiting
      <G>
        {/* robe body — tiny */}
        <Path d="M40 78 Q36 104 38 132 L62 132 Q64 104 60 78 Q56 72 50 70 Q44 72 40 78 Z" fill={color+'66'} stroke={color} strokeWidth={0.9} />
        {/* head — hooded, barely visible */}
        <Circle cx={50} cy={58} r={12} fill={color+'66'} stroke={color} strokeWidth={0.9} />
        <Path d="M38 58 Q40 46 50 44 Q60 46 62 58" fill={color+'55'} stroke={color} strokeWidth={0.6} />
        {/* single eye glow */}
        <Circle cx={50} cy={58} r={4} fill={color+'55'} stroke="none" />
        <Circle cx={50} cy={58} r={2} fill={color} stroke="none" />
        {/* one floating book — to the right */}
        <Polygon points="68,52 80,46 86,52 74,58" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Line x1={74} y1={46} x2={74} y2={58} stroke={color} strokeWidth={0.5} fill="none" />
        {/* faint connect line */}
        <Line x1={62} y1={58} x2={68} y2={52} stroke={color} strokeWidth={0.4} fill="none" opacity={0.4} />
        {/* sigil at feet */}
        <Polygon points="50,128 55,134 50,140 45,134" fill={color+'88'} stroke={color} strokeWidth={0.6} />
        <Polygon points="50,126 56,136 50,144 44,136" fill="none" stroke={color} strokeWidth={0.4} />
      </G>
    );
    case 3: return ( // scholar youth — robed figure, crown fragments forming, two books
      <G>
        {/* robe */}
        <Path d="M36 70 Q30 98 32 138 L68 138 Q70 98 64 70 Q57 62 50 60 Q43 62 36 70 Z" fill={color+'66'} stroke={color} strokeWidth={0.9} />
        <Path d="M39 72 Q34 100 36 134 L64 134 Q66 100 61 72 Z" fill={color+'55'} />
        {/* chest sigil */}
        <Polygon points="50,78 56,86 50,94 44,86" fill={color+'88'} stroke={color} strokeWidth={0.7} />
        {/* head */}
        <Circle cx={50} cy={46} r={13} fill={color+'66'} stroke={color} strokeWidth={1} />
        {/* partial crown — two spires */}
        <Polygon points="42,34 44,22 46,34" fill={color+'66'} stroke={color} strokeWidth={0.7} />
        <Polygon points="54,34 56,22 58,34" fill={color+'66'} stroke={color} strokeWidth={0.7} />
        {/* eyes */}
        <Circle cx={44} cy={46} r={3.5} fill={color+'55'} stroke="none" />
        <Circle cx={44} cy={46} r={1.8} fill={color} stroke="none" />
        <Circle cx={56} cy={46} r={3.5} fill={color+'55'} stroke="none" />
        <Circle cx={56} cy={46} r={1.8} fill={color} stroke="none" />
        {/* two floating books */}
        <Polygon points="72,44 84,38 90,44 78,50" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Line x1={78} y1={38} x2={78} y2={50} stroke={color} strokeWidth={0.5} fill="none" />
        <Polygon points="10,62 22,56 28,62 16,68" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Line x1={16} y1={56} x2={16} y2={68} stroke={color} strokeWidth={0.5} fill="none" />
        {/* arms suggested */}
        <Path d="M36 74 Q22 82 16 70" stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d="M64 74 Q78 82 84 70" stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        {/* floating sigil */}
        <Polygon points="50,134 54,140 50,146 46,140" fill={color+'88'} stroke={color} strokeWidth={0.6} />
      </G>
    );
    case 4: return ( // scholar near-ascended — full robe, crown almost complete, books + staff embryo
      <G>
        {/* robe */}
        <Path d="M34 66 Q28 96 30 140 L70 140 Q72 96 66 66 Q58 58 50 56 Q42 58 34 66 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        <Path d="M37 68 Q32 98 34 136 L66 136 Q68 98 63 68 Z" fill={color+'55'} />
        {/* lapels */}
        <Path d="M50 62 L40 74 L50 80 L60 74 Z" fill={color+'77'} stroke={color} strokeWidth={0.6} />
        {/* head */}
        <Circle cx={50} cy={42} r={14} fill={color+'66'} stroke={color} strokeWidth={1} />
        {/* crown — nearly complete, missing center spire */}
        <Polygon points="32,32 35,16 38,32" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Polygon points="44,30 50,12 56,30" fill={color+'99'} stroke={color} strokeWidth={0.7} />
        <Polygon points="62,32 65,16 68,32" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        {/* eyes */}
        <Circle cx={44} cy={42} r={4} fill={color+'55'} stroke="none" />
        <Circle cx={44} cy={42} r={2} fill={color} stroke="none" />
        <Circle cx={56} cy={42} r={4} fill={color+'55'} stroke="none" />
        <Circle cx={56} cy={42} r={2} fill={color} stroke="none" />
        {/* belt */}
        <Rect x={37} y={86} width={26} height={4} rx={1} fill={color+'88'} stroke={color} strokeWidth={0.5} />
        {/* proto-staff left */}
        <Line x1={18} y1={40} x2={14} y2={140} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        <Circle cx={18} cy={40} r={5} fill={color+'88'} stroke={color} strokeWidth={0.7} />
        <Circle cx={18} cy={40} r={2.5} fill={color} stroke="none" />
        {/* three floating books */}
        <Polygon points="74,34 86,28 92,34 80,40" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Line x1={80} y1={28} x2={80} y2={40} stroke={color} strokeWidth={0.5} fill="none" />
        <Polygon points="76,58 88,52 94,58 82,64" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        <Line x1={82} y1={52} x2={82} y2={64} stroke={color} strokeWidth={0.5} fill="none" />
        <Polygon points="72,80 82,74 88,80 78,86" fill={color+'77'} stroke={color} strokeWidth={0.8} />
        {/* arms */}
        <Path d="M34 70 Q20 78 16 68" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M66 70 Q80 78 84 68" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
        {/* floating sigils */}
        <Polygon points="50,136 54,142 50,148 46,142" fill={color+'99'} stroke={color} strokeWidth={0.7} />
        <Polygon points="50,134 56,144 50,152 44,144" fill="none" stroke={color} strokeWidth={0.4} opacity={0.5} />
      </G>
    );
    default: return (
      <G>
        {/* Robe body */}
        <Path d="M35 55 Q28 80 30 140 L70 140 Q72 80 65 55 Z" fill="#1a1200" stroke="#C49A3C" strokeWidth="0.8" />
        <Path d="M38 58 Q33 82 35 135 L65 135 Q67 82 62 58 Z" fill="#0d0900" />
        {/* Crown spires */}
        <Polygon points="30,25 35,10 40,25" fill="#F2D16B" />
        <Polygon points="42,25 50,5 58,25" fill="#FFB300" />
        <Polygon points="60,25 65,10 70,25" fill="#F2D16B" />
        {/* Head */}
        <Circle cx="50" cy="36" r="14" fill="#1a1200" stroke="#C49A3C" strokeWidth="1" />
        {/* Eyes */}
        <Circle cx="44" cy="35" r="5" fill="#FFB300" opacity="0.2" />
        <Circle cx="44" cy="35" r="3" fill="#FFB300" opacity="0.6" />
        <Circle cx="44" cy="35" r="1.5" fill="#F2D16B" />
        <Circle cx="56" cy="35" r="5" fill="#FFB300" opacity="0.2" />
        <Circle cx="56" cy="35" r="3" fill="#FFB300" opacity="0.6" />
        <Circle cx="56" cy="35" r="1.5" fill="#F2D16B" />
        {/* Staff — stacked books */}
        <Polygon points="8,45 32,40 34,48 10,53" fill="#C49A3C" stroke="#4A3511" strokeWidth="1" />
        <Polygon points="6,55 28,52 28,60 6,63" fill="#F2D16B" stroke="#4A3511" strokeWidth="1" />
        <Polygon points="12,65 36,68 34,75 10,72" fill="#C49A3C" stroke="#4A3511" strokeWidth="1" />
        <Polygon points="14,78 30,76 32,84 16,86" fill="#FFB300" stroke="#8C651A" strokeWidth="1" />
        <Polygon points="8,88 34,85 34,92 8,95" fill="#C49A3C" stroke="#4A3511" strokeWidth="1" />
        <Circle cx="20" cy="100" r="6" fill="#C49A3C" />
        <Polygon points="15,98 25,98 23,104 17,104" fill="#F2D16B" />
        {/* Staff orb top */}
        <Polygon points="20,15 25,25 20,35 15,25" fill="#F2D16B" />
        <Circle cx="20" cy="25" r="10" fill="#FFB300" opacity="0.1" />
        <Circle cx="20" cy="25" r="6" fill="#FFB300" opacity="0.4" />
        <Circle cx="20" cy="25" r="3" fill="#FFFFFF" opacity="1" />
        {/* Floating sigil diamonds */}
        <Polygon points="75,65 80,60 85,65 80,70" fill="#F2D16B" opacity="0.9" />
        <Polygon points="82,90 85,86 88,90 85,94" fill="#C49A3C" opacity="0.8" />
        <Polygon points="28,65 32,62 34,66 30,69" fill="#F2D16B" opacity="0.7" />
      </G>
    );
  }
}

// ── ALCHEMIST / CRIMSON — Fire Flask Bearer (Gemini art) ──────────────────────

function renderFlask(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage === 1 ? 5 : stage) {
    case 0: return ( // ember child — coat silhouette, single red eye glow
      <G>
        <Path d="M38 72 Q34 100 36 140 L64 140 Q66 100 62 72 Q56 64 50 62 Q44 64 38 72 Z" fill="#1a0000" stroke="#660000" strokeWidth="0.8" />
        <Circle cx="50" cy="50" r="11" fill="#0d0000" stroke="#660000" strokeWidth="0.7" />
        <Circle cx="50" cy="49" r="3" fill="#CC0000" opacity="0.5" />
        <Circle cx="50" cy="49" r="1.5" fill="#FF2020" opacity="0.9" />
      </G>
    );
    case 1: return ( // crimson pup — both eyes, coat outline
      <G>
        <Path d="M36 68 Q30 98 32 140 L68 140 Q70 98 64 68 Q57 60 50 58 Q43 60 36 68 Z" fill="#1a0000" stroke="#7a0000" strokeWidth="0.8" />
        <Circle cx="50" cy="46" r="12" fill="#0d0000" stroke="#7a0000" strokeWidth="0.7" />
        <Circle cx="44" cy="45" r="2.5" fill="#CC0000" opacity="0.7" />
        <Circle cx="44" cy="45" r="1.2" fill="#FF2020" />
        <Circle cx="56" cy="45" r="2.5" fill="#CC0000" opacity="0.7" />
        <Circle cx="56" cy="45" r="1.2" fill="#FF2020" />
        <Rect x="38" y="84" width="6" height="10" rx="1" fill="#2a0000" stroke="#660000" strokeWidth="0.5" />
      </G>
    );
    case 2: return ( // alchemist apprentice — coat + belt + one vial
      <G>
        <Path d="M34 65 Q28 96 30 140 L70 140 Q72 96 66 65 Q58 56 50 54 Q42 56 34 65 Z" fill="#1a0000" stroke="#8B0000" strokeWidth="0.8" />
        <Circle cx="50" cy="42" r="13" fill="#0d0000" stroke="#8B0000" strokeWidth="0.7" />
        <Circle cx="44" cy="41" r="3" fill="#CC0000" opacity="0.6" />
        <Circle cx="44" cy="41" r="1.5" fill="#FF2020" />
        <Circle cx="56" cy="41" r="3" fill="#CC0000" opacity="0.6" />
        <Circle cx="56" cy="41" r="1.5" fill="#FF2020" />
        <Rect x="36" y="83" width="28" height="4" rx="1" fill="#3a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="38" y="86" width="7" height="9" rx="1" fill="#2a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="45" y="84" width="4" height="13" rx="2" fill="#FF4040" opacity="0.6" />
        <Path d="M33 68 Q20 77 18 90" stroke="#8B0000" strokeWidth="4" strokeLinecap="round" fill="none" />
        <Path d="M67 68 Q80 77 82 90" stroke="#8B0000" strokeWidth="4" strokeLinecap="round" fill="none" />
      </G>
    );
    case 3: return ( // blood chemist — coat + pouches + two vials + flask embryo
      <G>
        <Path d="M33 62 Q26 94 28 140 L72 140 Q74 94 67 62 Q59 54 50 52 Q41 54 33 62 Z" fill="#1a0000" stroke="#8B0000" strokeWidth="0.8" />
        <Path d="M50 56 L38 70 L50 78 L62 70 Z" fill="#2a0000" stroke="#CC0000" strokeWidth="0.5" />
        <Circle cx="50" cy="40" r="13" fill="#0d0000" stroke="#8B0000" strokeWidth="0.8" />
        <Circle cx="44" cy="39" r="4" fill="#CC0000" opacity="0.6" />
        <Circle cx="44" cy="39" r="1.8" fill="#FF2020" />
        <Circle cx="56" cy="39" r="4" fill="#CC0000" opacity="0.6" />
        <Circle cx="56" cy="39" r="1.8" fill="#FF2020" />
        <Rect x="36" y="82" width="28" height="5" rx="1" fill="#3a0000" stroke="#8B0000" strokeWidth="0.5" />
        <Rect x="38" y="86" width="8" height="10" rx="1" fill="#2a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="54" y="86" width="8" height="10" rx="1" fill="#2a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="45" y="84" width="4" height="14" rx="2" fill="#FF4040" opacity="0.7" />
        <Rect x="51" y="84" width="4" height="14" rx="2" fill="#FF2020" opacity="0.6" />
        <G>
          <Rect x="14" y="84" width="8" height="18" rx="2" fill="#8B0000" stroke="#CC0000" strokeWidth="0.6" />
          <Circle cx="18" cy="106" r="7" fill="#CC0000" opacity="0.25" />
          <Circle cx="18" cy="106" r="4" fill="#FF4040" opacity="0.7" />
        </G>
        <Path d="M33 66 Q20 76 16 92" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M67 66 Q80 76 84 92" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
      </G>
    );
    case 4: return ( // crimson master — full coat + all pouches + both vials + flask
      <G>
        <Path d="M33 60 Q26 92 28 142 L72 142 Q74 92 67 60 Q59 52 50 50 Q41 52 33 60 Z" fill="#1a0000" stroke="#8B0000" strokeWidth="0.8" />
        <Path d="M36 62 Q30 92 32 138 L68 138 Q70 92 64 62 Z" fill="#0d0000" />
        <Path d="M50 54 L38 68 L50 76 L62 68 Z" fill="#2a0000" stroke="#CC0000" strokeWidth="0.6" />
        <Circle cx="50" cy="38" r="14" fill="#0d0000" stroke="#8B0000" strokeWidth="0.8" />
        <Circle cx="44" cy="37" r="4.5" fill="#CC0000" opacity="0.6" />
        <Circle cx="44" cy="37" r="2" fill="#FF2020" />
        <Circle cx="56" cy="37" r="4.5" fill="#CC0000" opacity="0.6" />
        <Circle cx="56" cy="37" r="2" fill="#FF2020" />
        <Rect x="36" y="82" width="28" height="5" rx="1" fill="#4a0000" stroke="#8B0000" strokeWidth="0.6" />
        <Rect x="38" y="86" width="8" height="10" rx="2" fill="#3a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="54" y="86" width="8" height="10" rx="2" fill="#3a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="44" y="84" width="4" height="14" rx="2" fill="#FF4040" opacity="0.7" />
        <Rect x="50" y="84" width="4" height="14" rx="2" fill="#FF2020" opacity="0.6" />
        <G>
          <Rect x="13" y="82" width="9" height="20" rx="2" fill="#8B0000" stroke="#CC0000" strokeWidth="0.7" />
          <Circle cx="17.5" cy="108" r="9" fill="#CC0000" opacity="0.25" />
          <Circle cx="17.5" cy="108" r="6" fill="#CC0000" opacity="0.5" />
          <Circle cx="17.5" cy="108" r="3.5" fill="#FF4040" opacity="0.9" />
        </G>
        <Path d="M33 64 Q19 75 16 92" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M67 64 Q81 75 84 92" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Circle cx="50" cy="138" r="10" fill="#CC0000" opacity="0.08" />
      </G>
    );
    default: return (
      <G>
        {/* Long coat — deep crimson */}
        <Path d="M33 58 Q26 90 28 142 L72 142 Q74 90 67 58 Z" fill="#1a0000" stroke="#8B0000" strokeWidth="0.8" />
        <Path d="M36 60 Q30 92 32 138 L68 138 Q70 92 64 60 Z" fill="#0d0000" />
        {/* Coat lapels */}
        <Path d="M50 58 L38 72 L50 80 L62 72 Z" fill="#2a0000" stroke="#CC0000" strokeWidth="0.6" />
        {/* Head */}
        <Circle cx="50" cy="38" r="14" fill="#1a0000" stroke="#8B0000" strokeWidth="1" />
        {/* Red eyes */}
        <Circle cx="44" cy="37" r="5" fill="#CC0000" opacity="0.15" />
        <Circle cx="44" cy="37" r="3" fill="#CC0000" opacity="0.6" />
        <Circle cx="44" cy="37" r="1.5" fill="#FF2020" />
        <Circle cx="56" cy="37" r="5" fill="#CC0000" opacity="0.15" />
        <Circle cx="56" cy="37" r="3" fill="#CC0000" opacity="0.6" />
        <Circle cx="56" cy="37" r="1.5" fill="#FF2020" />
        {/* Flask held in left hand */}
        <G>
          <Rect x="14" y="80" width="10" height="22" rx="2" fill="#8B0000" stroke="#CC0000" strokeWidth="0.8" />
          <Circle cx="19" cy="110" r="10" fill="#CC0000" opacity="0.3" />
          <Circle cx="19" cy="110" r="7" fill="#CC0000" opacity="0.5" />
          <Circle cx="19" cy="110" r="4" fill="#FF4040" opacity="0.9" />
        </G>
        {/* Belt + pouches */}
        <Rect x="36" y="85" width="28" height="5" rx="1" fill="#4a0000" stroke="#8B0000" strokeWidth="0.6" />
        <Rect x="38" y="88" width="8" height="10" rx="2" fill="#3a0000" stroke="#660000" strokeWidth="0.5" />
        <Rect x="54" y="88" width="8" height="10" rx="2" fill="#3a0000" stroke="#660000" strokeWidth="0.5" />
        {/* Vials in belt */}
        <G>
          <Rect x="44" y="86" width="4" height="14" rx="2" fill="#FF4040" opacity="0.7" />
          <Circle cx="46" cy="85" r="2" fill="#CC0000" />
        </G>
        <G>
          <Rect x="50" y="86" width="4" height="14" rx="2" fill="#FF2020" opacity="0.6" />
          <Circle cx="52" cy="85" r="2" fill="#8B0000" />
        </G>
        {/* Arms */}
        <Path d="M33 62 Q18 75 16 90" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M67 62 Q82 75 84 90" stroke="#8B0000" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Ember glow at feet */}
        <Circle cx="50" cy="138" r="12" fill="#CC0000" opacity="0.06" />
        <Circle cx="50" cy="138" r="7" fill="#CC0000" opacity="0.10" />
      </G>
    );
  }
}

// ── ORACLE / VOID — Dark Oracle (Gemini art, all stages) ─────────────────────

function voidOrb(cx: number, cy: number, r: number, c = '#a237f8') {
  return <G key={`${cx}${cy}`}>
    <Circle cx={cx} cy={cy} r={r * 2}   fill={c} opacity={0.08} />
    <Circle cx={cx} cy={cy} r={r * 1.4} fill={c} opacity={0.18} />
    <Circle cx={cx} cy={cy} r={r}       fill={c} opacity={0.95} />
  </G>;
}

function renderOracle(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  // Shared body — scales with stage via cloakOpacity and orbCount
  const orbCount = [1, 2, 3, 4, 5][Math.min(stage, 4)];
  const orbPositions: [number, number, string][] = [
    [18, 35,  '#a237f8'],
    [82, 40,  '#a237f8'],
    [88, 85,  '#8e32d9'],
    [70, 125, '#a237f8'],
    [28, 120, '#8e32d9'],
  ];
  const eyeRx = 4 + stage * 0.6;
  const bodyOpacity = 0.6 + stage * 0.08;
  switch (stage === 1 ? 5 : stage) {
    case 0: return (
      <G>
        <Path d="M50 30 C38 30, 32 42, 35 55 C40 62, 60 62, 65 55 C68 42, 62 30, 50 30 Z" fill="#010101" />
        <Path d="M50 22 C34 22, 26 36, 30 55 C26 75, 22 105, 28 130 C36 142, 64 142, 72 130 C78 105, 74 75, 70 55 C74 36, 66 22, 50 22 Z" fill="#111111" opacity={0.85} />
        <Ellipse cx={50} cy={44} rx={eyeRx} ry={3} fill="#a237f8" opacity={0.5} />
        {voidOrb(18, 35, 3.5)}
      </G>
    );
    case 1: return (
      <G>
        <Path d="M50 20 C34 20, 26 34, 30 52 C26 72, 22 102, 28 128 C36 141, 64 141, 72 128 C78 102, 74 72, 70 52 C74 34, 66 20, 50 20 Z" fill="#111111" />
        <Path d="M50 22 C38 22, 33 34, 36 50 C40 57, 60 57, 64 50 C67 34, 62 22, 50 22 Z" fill="#010101" />
        <Ellipse cx={50} cy={38} rx={eyeRx} ry={3} fill="#a237f8" opacity={0.55} />
        {orbPositions.slice(0, 2).map(([cx, cy, c]) => voidOrb(cx, cy, 3.5, c))}
      </G>
    );
    case 2: return (
      <G>
        <Path d="M50 15 C32 15, 23 30, 27 50 C22 70, 18 100, 24 128 C33 142, 67 142, 76 128 C82 100, 78 70, 73 50 C77 30, 68 15, 50 15 Z" fill="#111111" />
        <Path d="M50 18 C38 18, 33 30, 36 48 C40 56, 60 56, 64 48 C67 30, 62 18, 50 18 Z" fill="#010101" />
        <Path d="M50 22 C43 22, 39 33, 41 44 Q50 50, 59 44 C61 33, 57 22, 50 22 Z" fill="#000000" />
        <Ellipse cx={50} cy={37} rx={eyeRx} ry={3.2} fill="#a237f8" opacity={0.60} />
        <Circle cx={49} cy={37} r={1.3} fill="#ca95ff" opacity={0.8} />
        <Circle cx={51} cy={35} r={1.0} fill="#ca95ff" opacity={0.7} />
        {orbPositions.slice(0, 3).map(([cx, cy, c]) => voidOrb(cx, cy, 4, c))}
      </G>
    );
    case 3: return (
      <G>
        <Path d="M50 12 C30 12, 21 28, 26 50 C20 72, 16 102, 22 130 C32 144, 68 144, 78 130 C84 102, 80 72, 74 50 C79 28, 70 12, 50 12 Z" fill="#0d0d0d" />
        <Path d="M50 15 C36 15, 30 28, 34 48 C38 57, 62 57, 66 48 C70 28, 64 15, 50 15 Z" fill="#010101" />
        <Path d="M50 20 C42 20, 38 32, 40 44 Q50 50, 60 44 C62 32, 58 20, 50 20 Z" fill="#000000" />
        <Ellipse cx={50} cy={38} rx={eyeRx} ry={3.5} fill="#a237f8" opacity={0.62} />
        <Circle cx={48} cy={38} r={1.4} fill="#ca95ff" opacity={0.82} />
        <Circle cx={52} cy={36} r={1.1} fill="#ca95ff" opacity={0.72} />
        <Path d="M36 68 L40 95 M64 68 L60 95" stroke="#222222" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {orbPositions.slice(0, 4).map(([cx, cy, c]) => voidOrb(cx, cy, 4, c))}
      </G>
    );
    case 4: return (
      <G>
        <Path d="M50 10 C28 10, 19 27, 24 50 C18 72, 14 103, 21 130 C31 145, 69 145, 79 130 C86 103, 82 72, 76 50 C81 27, 72 10, 50 10 Z" fill="#0d0d0d" />
        <Path d="M50 13 C35 13, 29 26, 33 48 C37 57, 63 57, 67 48 C71 26, 65 13, 50 13 Z" fill="#010101" />
        <Path d="M50 18 C41 18, 37 30, 39 44 Q50 50, 61 44 C63 30, 59 18, 50 18 Z" fill="#000000" />
        <Ellipse cx={50} cy={37} rx={eyeRx} ry={3.8} fill="#a237f8" opacity={0.65} />
        <Circle cx={48} cy={37} r={1.5} fill="#ca95ff" opacity={0.85} />
        <Circle cx={52} cy={35} r={1.2} fill="#ca95ff" opacity={0.75} />
        <Circle cx={50} cy={39} r={1.0} fill="#ca95ff" opacity={0.65} />
        <Path d="M36 65 L40 95 M64 65 L60 95" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Path d="M28 112 C34 122, 44 127, 50 127 C56 127, 66 122, 72 112" stroke="#1e1e1e" strokeWidth={1} fill="none" strokeDasharray="3,4" />
        {orbPositions.slice(0, 5).map(([cx, cy, c]) => voidOrb(cx, cy, 4.2, c))}
      </G>
    );
    default: return (
      <G>
        <Path d="M50 10 C30 10, 20 30, 25 50 C20 70, 15 100, 20 130 C30 145, 70 145, 80 130 C85 100, 80 70, 75 50 C80 30, 70 10, 50 10 Z" fill="#0d0d0d" />
        <Path d="M50 12 C32 12, 23 32, 28 50 C23 70, 18 100, 23 128 C33 140, 67 140, 77 128 C82 100, 77 70, 72 50 C77 32, 68 12, 50 12 Z" fill="#151515" />
        <Path d="M50 20 C38 20, 32 32, 35 48 C40 55, 60 55, 65 48 C68 32, 62 20, 50 20 Z" fill="#010101" />
        <Path d="M50 25 C42 25, 38 35, 40 45 Q50 50, 60 45 C62 35, 58 25, 50 25 Z" fill="#000000" />
        <Ellipse cx={50} cy={38} rx={10} ry={5} fill="#a237f8" opacity={0.12} />
        <Ellipse cx={50} cy={38} rx={7}  ry={4} fill="#a237f8" opacity={0.25} />
        <Ellipse cx={50} cy={38} rx={6}  ry={3} fill="#a237f8" opacity={0.6} />
        <Path d="M38 65 L42 95 M62 65 L58 95" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Path d="M30 110 C35 120, 45 125, 50 125 C55 125, 65 120, 70 110" stroke="#202020" strokeWidth={1} fill="none" strokeDasharray="3,4" />
        <Circle cx={18} cy={35}  r={9}   fill="#a237f8" opacity={0.10} />
        <Circle cx={18} cy={35}  r={6}   fill="#a237f8" opacity={0.20} />
        <Circle cx={18} cy={35}  r={4.5} fill="#a237f8" />
        <Circle cx={82} cy={40}  r={9}   fill="#a237f8" opacity={0.10} />
        <Circle cx={82} cy={40}  r={6}   fill="#a237f8" opacity={0.20} />
        <Circle cx={82} cy={40}  r={4.5} fill="#a237f8" />
        <Circle cx={88} cy={85}  r={9}   fill="#8e32d9" opacity={0.10} />
        <Circle cx={88} cy={85}  r={6}   fill="#8e32d9" opacity={0.20} />
        <Circle cx={88} cy={85}  r={4.5} fill="#8e32d9" />
        <Circle cx={70} cy={125} r={9}   fill="#a237f8" opacity={0.10} />
        <Circle cx={70} cy={125} r={6}   fill="#a237f8" opacity={0.20} />
        <Circle cx={70} cy={125} r={4.5} fill="#a237f8" />
        <Circle cx={28} cy={120} r={9}   fill="#8e32d9" opacity={0.10} />
        <Circle cx={28} cy={120} r={6}   fill="#8e32d9" opacity={0.20} />
        <Circle cx={28} cy={120} r={4.5} fill="#8e32d9" />
        <Circle cx={48} cy={38} r={1.5} fill="#ca95ff" opacity={0.8} />
        <Circle cx={52} cy={36} r={1.2} fill="#ca95ff" opacity={0.7} />
        <Circle cx={50} cy={40} r={1}   fill="#ca95ff" opacity={0.6} />
      </G>
    );
  }
}

// ── SENTINEL — Fortress ───────────────────────────────────────────────────────

function renderFortress(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage === 1 ? 5 : stage) {
    case 0: return ( // crystal helm seed — floating helm, visor glow
      <G>
        {/* helm */}
        <Path d="M36 56 L38 40 L50 36 L62 40 L64 56 L58 62 L50 64 L42 62 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        {/* crest blade */}
        <Polygon points="50,22 53,36 50,38 47,36" fill={color+'66'} stroke={color} strokeWidth={0.7} />
        {/* visor glow */}
        <Rect x={40} y={51} width={20} height={6} rx={1} fill={color+'88'} stroke={color} strokeWidth={0.5} />
        <Rect x={42} y={52} width={16} height={4} rx={1} fill={color+'77'} stroke="none" />
        {/* small crystal shards orbiting */}
        <Polygon points="24,48 28,44 30,50 26,52" fill={color+'99'} stroke={color} strokeWidth={0.6} />
        <Polygon points="70,48 74,44 76,50 72,52" fill={color+'99'} stroke={color} strokeWidth={0.6} />
        {/* shadow under */}
        <Ellipse cx={50} cy={120} rx={18} ry={4} fill={color+'55'} stroke="none" />
      </G>
    );
    case 1: return ( // unused — mapped to stage 5
      <G><Circle cx={50} cy={75} r={20} fill={color+'77'} stroke={color} strokeWidth={1} /></G>
    );
    case 2: return ( // crystal knight torso assembling — helm + breastplate, no legs
      <G>
        {/* breastplate */}
        <Path d="M34 72 L30 106 L50 112 L70 106 L66 72 Q58 64 50 62 Q42 64 34 72 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        {/* breastplate facet */}
        <Path d="M50 72 L42 84 L50 90 L58 84 Z" fill={color+'77'} stroke={color} strokeWidth={0.6} />
        {/* frost cracks */}
        <Path d="M44 76 L48 82 M56 76 L52 82" stroke={color} strokeWidth={0.4} fill="none" opacity={0.6} />
        {/* pauldrons */}
        <Path d="M30 70 L22 66 L20 78 L32 82 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        <Path d="M70 70 L78 66 L80 78 L68 82 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        {/* helm */}
        <Path d="M36 52 L38 36 L50 32 L62 36 L64 52 L58 60 L50 62 L42 60 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        <Polygon points="50,18 53,32 50,34 47,32" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        <Rect x={41} y={47} width={18} height={5} rx={1} fill={color+'88'} stroke={color} strokeWidth={0.5} />
        <Rect x={43} y={48} width={14} height={3} rx={1} fill={color+'88'} stroke="none" />
        {/* crystal fragment orbiting */}
        <Polygon points="84,56 90,50 94,58 88,62" fill={color+'99'} stroke={color} strokeWidth={0.7} />
        <Polygon points="6,56 12,50 16,58 10,62" fill={color+'99'} stroke={color} strokeWidth={0.7} />
        {/* glow pool */}
        <Ellipse cx={50} cy={108} rx={22} ry={5} fill={color+'55'} stroke="none" />
      </G>
    );
    case 3: return ( // crystal knight assembling — upper body + shield emerging, no greaves
      <G>
        {/* body armour */}
        <Path d="M32 70 L26 108 L50 116 L74 108 L68 70 Q60 60 50 58 Q40 60 32 70 Z" fill={color+'66'} stroke={color} strokeWidth={0.9} />
        <Path d="M35 73 L30 106 L50 112 L70 106 L65 73 Z" fill={color+'55'} />
        {/* breastplate facets */}
        <Path d="M50 70 L40 82 L50 90 L60 82 Z" fill={color+'77'} stroke={color} strokeWidth={0.6} />
        <Path d="M50 90 L38 100 L50 108 L62 100 Z" fill={color+'66'} stroke={color} strokeWidth={0.5} />
        {/* frost crack detail */}
        <Path d="M42 74 L46 80 M58 74 L54 80 M40 92 L46 96 M60 92 L54 96" stroke={color} strokeWidth={0.4} fill="none" opacity={0.6} />
        {/* pauldrons */}
        <Path d="M28 66 L18 62 L16 76 L30 80 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        <Path d="M72 66 L82 62 L84 76 L70 80 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        {/* fauld plates starting */}
        <Path d="M36 108 L32 124 L50 128 L68 124 L64 108 Z" fill={color+'66'} stroke={color} strokeWidth={0.8} />
        {/* helm */}
        <Path d="M34 48 L36 30 L50 26 L64 30 L66 48 L60 56 L50 58 L40 56 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        <Polygon points="50,12 54,26 50,28 46,26" fill={color+'88'} stroke={color} strokeWidth={0.8} />
        <Rect x={41} y={43} width={18} height={5} rx={1} fill={color+'88'} stroke={color} strokeWidth={0.5} />
        <Rect x={43} y={44} width={14} height={3} rx={1} fill={color+'99'} stroke="none" />
        {/* shield embryo — forming left side */}
        <Path d="M10 72 L6 84 L8 100 L18 106 L20 84 L18 70 Z" fill={color+'66'} stroke={color} strokeWidth={0.8} />
        <Circle cx={14} cy={89} r={3} fill={color+'99'} stroke="none" />
        {/* crystal shards orbiting */}
        <Polygon points="86,44 92,38 96,46 90,50" fill={color+'99'} stroke={color} strokeWidth={0.7} />
        <Polygon points="86,70 92,64 96,72 90,76" fill={color+'88'} stroke={color} strokeWidth={0.6} />
        {/* glow pool */}
        <Ellipse cx={50} cy={125} rx={26} ry={6} fill={color+'55'} stroke="none" />
      </G>
    );
    case 4: return ( // crystal knight near-complete — full armour, shield solid, greaves starting
      <G>
        {/* body armour */}
        <Path d="M30 66 L24 106 L50 116 L76 106 L70 66 Q60 56 50 54 Q40 56 30 66 Z" fill={color+'66'} stroke={color} strokeWidth={0.9} />
        <Path d="M33 69 L28 104 L50 112 L72 104 L67 69 Z" fill={color+'55'} />
        {/* breastplate facets */}
        <Path d="M50 66 L38 80 L50 88 L62 80 Z" fill={color+'77'} stroke={color} strokeWidth={0.6} />
        <Path d="M50 88 L36 100 L50 110 L64 100 Z" fill={color+'66'} stroke={color} strokeWidth={0.5} />
        <Path d="M42 70 L46 78 M58 70 L54 78 M40 90 L46 94 M60 90 L54 94" stroke={color} strokeWidth={0.4} fill="none" opacity={0.7} />
        {/* pauldrons */}
        <Path d="M26 64 L16 60 L14 76 L28 80 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        <Path d="M74 64 L84 60 L86 76 L72 80 Z" fill={color+'77'} stroke={color} strokeWidth={0.7} />
        {/* fauld plates */}
        <Path d="M34 106 L28 126 L50 130 L72 126 L66 106 Z" fill={color+'66'} stroke={color} strokeWidth={0.8} />
        <Path d="M34 110 L28 126 M50 112 L50 130 M66 110 L72 126" stroke={color} strokeWidth={0.3} fill="none" opacity={0.5} />
        {/* greaves forming */}
        <Rect x={37} y={130} width={10} height={14} rx={2} fill={color+'66'} stroke={color} strokeWidth={0.7} />
        <Rect x={53} y={130} width={10} height={14} rx={2} fill={color+'66'} stroke={color} strokeWidth={0.7} />
        {/* helm */}
        <Path d="M32 46 L34 26 L50 22 L66 26 L68 46 L62 54 L50 56 L38 54 Z" fill={color+'66'} stroke={color} strokeWidth={1} />
        <Polygon points="50,8 54,22 50,24 46,22" fill={color+'99'} stroke={color} strokeWidth={0.8} />
        <Rect x={41} y={40} width={18} height={5} rx={1} fill={color+'99'} stroke={color} strokeWidth={0.5} />
        <Rect x={43} y={41} width={14} height={3} rx={1} fill={color+'AA'} stroke="none" />
        {/* shield — solid now */}
        <Path d="M10 68 L6 82 L8 102 L18 108 L22 82 L20 66 Z" fill={color+'66'} stroke={color} strokeWidth={0.8} />
        <Path d="M10 68 L20 66 L22 82 L16 98" stroke={color} strokeWidth={0.4} fill="none" opacity={0.6} />
        <Circle cx={15} cy={88} r={4} fill={color+'88'} stroke="none" />
        <Circle cx={15} cy={88} r={2} fill={color+'88'} stroke="none" />
        {/* crystal shards */}
        <Polygon points="86,40 92,34 96,42 90,46" fill={color+'55'} stroke={color} strokeWidth={0.7} />
        <Polygon points="88,66 94,60 98,68 92,72" fill={color+'99'} stroke={color} strokeWidth={0.6} />
        <Polygon points="86,88 92,82 96,90 90,94" fill={color+'88'} stroke={color} strokeWidth={0.6} />
        {/* ambient frost glow */}
        <Circle cx={50} cy={88} r={42} fill={color+'05'} stroke="none" />
        <Ellipse cx={50} cy={130} rx={28} ry={7} fill={color+'55'} stroke="none" />
      </G>
    );
    default: return (
      <G>
        {/* AURORA / SENTINEL — Crystal Knight */}
        {/* Armour body — breastplate with crystalline facets */}
        <Path d="M32 65 L28 100 Q30 140 50 142 Q70 140 72 100 L68 65 Q60 55 50 53 Q40 55 32 65 Z" fill="#0a1525" stroke="#4da6ff" strokeWidth="0.8" />
        {/* Breastplate facets — frost crystal pattern */}
        <Path d="M50 65 L40 78 L50 85 L60 78 Z" fill="#1a3050" stroke="#7ec8ff" strokeWidth="0.6" />
        <Path d="M50 85 L38 95 L50 105 L62 95 Z" fill="#152840" stroke="#4da6ff" strokeWidth="0.5" />
        {/* Frost cracks across chest */}
        <Path d="M42 70 L46 76 M54 70 L50 78 M40 88 L46 92 M60 88 L54 92" stroke="#aaddff" strokeWidth="0.4" fill="none" opacity="0.7" />
        {/* Pauldrons — shoulder plates */}
        <Path d="M28 62 L20 58 L18 72 L30 76 Z" fill="#1a3050" stroke="#4da6ff" strokeWidth="0.6" />
        <Path d="M72 62 L80 58 L82 72 L70 76 Z" fill="#1a3050" stroke="#4da6ff" strokeWidth="0.6" />
        {/* Faulds — lower waist armour */}
        <Path d="M35 102 L30 120 L50 124 L70 120 L65 102 Z" fill="#0f2035" stroke="#4da6ff" strokeWidth="0.6" />
        <Path d="M35 105 L30 120 M50 106 L50 124 M65 105 L70 120" stroke="#4da6ff" strokeWidth="0.3" fill="none" opacity="0.5" />
        {/* Greaves */}
        <Rect x="38" y="124" width="10" height="18" rx="2" fill="#0a1525" stroke="#4da6ff" strokeWidth="0.5" />
        <Rect x="52" y="124" width="10" height="18" rx="2" fill="#0a1525" stroke="#4da6ff" strokeWidth="0.5" />
        {/* Helm — angular, crystalline */}
        <Path d="M34 42 L38 26 L50 22 L62 26 L66 42 L60 50 L50 52 L40 50 Z" fill="#0a1525" stroke="#4da6ff" strokeWidth="0.8" />
        {/* Visor slit — ice blue glow */}
        <Rect x="41" y="38" width="18" height="5" rx="1" fill="#4da6ff" opacity="0.3" />
        <Rect x="43" y="39" width="14" height="3" rx="1" fill="#7ec8ff" opacity="0.7" />
        {/* Crest / blade top */}
        <Polygon points="50,8 54,22 50,24 46,22" fill="#4da6ff" opacity="0.8" />
        {/* Crystal shield — held on left arm */}
        <Path d="M12 68 L8 80 L10 98 L20 104 L22 80 L20 66 Z" fill="#0d1e33" stroke="#7ec8ff" strokeWidth="0.7" />
        <Path d="M12 68 L20 66 L22 80 L16 96" stroke="#4da6ff" strokeWidth="0.4" fill="none" opacity="0.6" />
        <Circle cx="16" cy="85" r="4" fill="#4da6ff" opacity="0.2" />
        <Circle cx="16" cy="85" r="2" fill="#aaddff" opacity="0.8" />
        {/* Ambient frost glow */}
        <Circle cx="50" cy="80" r="36" fill="#4da6ff" opacity="0.03" />
        <Circle cx="50" cy="80" r="24" fill="#4da6ff" opacity="0.04" />
      </G>
    );
  }
}

// ── WANDERER — Cloaked Figure ─────────────────────────────────────────────────

function renderCloak(
  stage: EvolutionStage,
  p: object, p2: object, p3: object, line: object, lineThin: object,
  color: string, path: EvoPath,
) {
  switch (stage === 1 ? 5 : stage) {
    case 0: return ( // hooded dot + body
      <G>
        <Circle cx={50} cy={58} r={14} {...p} />
        <Polygon points="50,44 64,58 36,58" {...p2} />
        <Rect x={44} y={72} width={12} height={62} rx={4} {...p} />
      </G>
    );
    case 1: return (
      <G>
        <Circle cx={50} cy={55} r={18} {...p} />
        <Polygon points="50,38 66,55 34,55" {...p2} />
        <Path d="M 38,73 Q 28,100 32,138 L 68,138 Q 72,100 62,73 Z" {...p} />
      </G>
    );
    case 2: return (
      <G>
        <Circle cx={50} cy={50} r={21} {...p} />
        <Polygon points="50,30 68,50 32,50" {...p2} />
        <Path d="M 34,70 Q 16,104 18,138 L 82,138 Q 84,104 66,70 Z" {...p} />
        {/* staff */}
        <Line x1={74} y1={65} x2={80} y2={138} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Circle cx={74} cy={63} r={4} {...p2} />
      </G>
    );
    case 3: return (
      <G>
        <Circle cx={50} cy={46} r={24} {...p2} />
        <Polygon points="50,22 70,46 30,46" {...p2} />
        <Path d="M 28,66 Q 6,104 8,138 L 92,138 Q 94,104 72,66 Z" {...p} />
        {/* flowing cloak tails */}
        <Path d="M 18,100 Q 4,118 8,138" fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Path d="M 82,100 Q 96,118 92,138" fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Line x1={78} y1={60} x2={86} y2={138} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Circle cx={78} cy={58} r={5} {...p2} />
        <Circle cx={50} cy={46} r={7} {...p3} />
      </G>
    );
    case 4: return (
      <G>
        {/* floating orb */}
        <Circle cx={50} cy={24} r={8} {...p2} />
        <Circle cx={50} cy={24} r={4} {...p3} />
        <Line x1={50} y1={32} x2={50} y2={46} {...lineThin} />
        <Circle cx={50} cy={42} r={26} {...p2} />
        <Polygon points="50,16 74,42 26,42" {...p2} />
        <Path d="M 20,62 Q -4,104 2,138 L 98,138 Q 104,104 80,62 Z" {...p} />
        <Path d="M 10,96 Q -6,118 2,138" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        <Path d="M 90,96 Q 106,118 98,138" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        <Line x1={82} y1={56} x2={92} y2={138} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={82} cy={54} r={6} {...p2} />
        <Circle cx={50} cy={42} r={8} {...p3} />
      </G>
    );
    default: return (
      <G>
        {/* OBSIDIAN / WANDERER — Shadow Traveller */}
        {/* Wide dark cloak — volcanic obsidian tones */}
        <Path d="M22 55 Q8 100 10 145 L90 145 Q92 100 78 55 Q66 44 50 42 Q34 44 22 55 Z" fill="#0d0d0d" stroke="#4a3322" strokeWidth="0.7" />
        <Path d="M26 58 Q14 102 16 142 L84 142 Q86 102 74 58 Q63 48 50 46 Q37 48 26 58 Z" fill="#0a0a0a" />
        {/* Hood shadow */}
        <Path d="M30 45 Q32 32 50 28 Q68 32 70 45 Q62 52 50 52 Q38 52 30 45 Z" fill="#050505" stroke="#4a3322" strokeWidth="0.6" />
        {/* Face — barely visible in shadow */}
        <Circle cx="50" cy="38" r="12" fill="#0a0a0a" />
        {/* Amber gemstone eyes */}
        <Circle cx="44" cy="38" r="4" fill="#B8621A" opacity="0.15" />
        <Circle cx="44" cy="38" r="2.5" fill="#B8621A" opacity="0.55" />
        <Circle cx="44" cy="38" r="1.2" fill="#E88030" />
        <Circle cx="56" cy="38" r="4" fill="#B8621A" opacity="0.15" />
        <Circle cx="56" cy="38" r="2.5" fill="#B8621A" opacity="0.55" />
        <Circle cx="56" cy="38" r="1.2" fill="#E88030" />
        {/* Compass orb — held at right side */}
        <Circle cx="78" cy="60" r="10" fill="#1a1200" stroke="#B8621A" strokeWidth="0.8" />
        <Circle cx="78" cy="60" r="6" fill="#B8621A" opacity="0.15" />
        <Circle cx="78" cy="60" r="3.5" fill="#B8621A" opacity="0.4" />
        <Circle cx="78" cy="60" r="1.5" fill="#E88030" />
        {/* Compass crosshairs */}
        <Line x1="78" y1="51" x2="78" y2="55" stroke="#B8621A" strokeWidth="0.6" fill="none" />
        <Line x1="78" y1="65" x2="78" y2="69" stroke="#B8621A" strokeWidth="0.6" fill="none" />
        <Line x1="69" y1="60" x2="73" y2="60" stroke="#B8621A" strokeWidth="0.6" fill="none" />
        <Line x1="83" y1="60" x2="87" y2="60" stroke="#B8621A" strokeWidth="0.6" fill="none" />
        {/* Travelling staff — left side */}
        <Line x1="20" y1="50" x2="14" y2="148" stroke="#3a2510" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Circle cx="20" cy="50" r="5" fill="#1a1200" stroke="#B8621A" strokeWidth="0.6" />
        <Circle cx="20" cy="50" r="2.5" fill="#B8621A" opacity="0.5" />
        {/* Rune marks along cloak edge */}
        <Path d="M18 90 L22 86 L26 90 M18 108 L22 104 L26 108" stroke="#4a3322" strokeWidth="0.5" fill="none" opacity="0.6" />
        {/* Amber glow pool at feet */}
        <Circle cx="50" cy="142" r="14" fill="#B8621A" opacity="0.04" />
        <Circle cx="50" cy="142" r="8" fill="#B8621A" opacity="0.07" />
      </G>
    );
  }
}
