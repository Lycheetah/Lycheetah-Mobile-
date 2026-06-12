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
  const f  = color + '55';
  const f2 = color + '88';
  const f3 = color + 'CC';
  const sw = 2.0;
  const p  = { fill: f,  stroke: color, strokeWidth: sw } as const;
  const p2 = { fill: f2, stroke: color, strokeWidth: sw } as const;
  const p3 = { fill: color, stroke: 'none' } as const;
  const line     = { stroke: color, strokeWidth: sw,  fill: 'none' } as const;
  const lineThin = { stroke: color, strokeWidth: 1.2, fill: 'none' } as const;
  const epath = path ?? 'A';

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* dark contrast base so creature pops on any background */}
      <Rect x={10} y={10} width={80} height={130} rx={14} fill="#000000AA" stroke="none" />
      {/* ambient glow rings */}
      <Circle cx={50} cy={80} r={52} fill={color + '0A'} stroke="none" />
      <Circle cx={50} cy={80} r={38} fill={color + '14'} stroke="none" />
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
  switch (stage) {
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
      return ( // path A — Lykitty sovereign, playful chaos
        <G>
          <Circle cx={50} cy={55} r={48} fill="none" stroke={color} strokeWidth={0.3} opacity={0.2} />
          <Circle cx={50} cy={55} r={38} fill="none" stroke={color} strokeWidth={0.4} opacity={0.25} />
          {[0,45,90,135,180,225,270,315].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            const r1 = 42, r2 = 50;
            return <Line key={i} x1={50 + r1 * Math.cos(rad)} y1={55 + r1 * Math.sin(rad)} x2={50 + r2 * Math.cos(rad)} y2={55 + r2 * Math.sin(rad)} stroke={color} strokeWidth={0.8} fill="none" opacity={0.5} />;
          })}
          <Circle cx={50} cy={52} r={30} {...p2} />
          <Polygon points="22,36 10,10 44,34" {...p2} />
          <Polygon points="78,36 90,10 56,34" {...p2} />
          <Polygon points="25,34 16,16 42,32" fill={color + '66'} stroke="none" />
          <Polygon points="75,34 84,16 58,32" fill={color + '66'} stroke="none" />
          <Path d="M 12,80 Q 8,120 24,140 L 76,140 Q 92,120 88,80 Q 74,64 50,64 Q 26,64 12,80 Z" {...p2} />
          <Rect x={20} y={140} width={10} height={10} rx={4} {...p3} />
          <Rect x={36} y={140} width={10} height={10} rx={4} {...p3} />
          <Rect x={54} y={140} width={10} height={10} rx={4} {...p3} />
          <Rect x={70} y={140} width={10} height={10} rx={4} {...p3} />
          <Path d="M 84,136 Q 108,118 106,80 Q 104,58 94,48" strokeLinecap="round" strokeWidth={2} stroke={color} fill="none" />
          <Circle cx={50} cy={58} r={4} {...p3} />
          <Path d="M 36,86 Q 50,80 64,86" fill="none" stroke={color} strokeWidth={1.2} />
          <Path d="M 30,94 Q 50,88 70,94" fill="none" stroke={color} strokeWidth={0.8} />
          <Path d="M 32,34 L 38,22 L 50,28 L 62,22 L 68,34" fill="none" stroke={color} strokeWidth={1.5} />
          <Circle cx={38} cy={22} r={2.5} {...p3} />
          <Circle cx={50} cy={28} r={2.5} {...p3} />
          <Circle cx={62} cy={22} r={2.5} {...p3} />
        </G>
      );
    }
  }
}

// ── ARCHIVIST — Knowledge Tower ───────────────────────────────────────────────

function renderTower(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage) {
    case 0: return ( // tiny column
      <G>
        <Rect x={38} y={72} width={24} height={64} rx={1} {...p} />
        <Polygon points="50,52 62,72 38,72" {...p2} />
      </G>
    );
    case 1: return ( // column with bar
      <G>
        <Rect x={36} y={58} width={28} height={80} rx={1} {...p} />
        <Polygon points="50,38 64,58 36,58" {...p2} />
        <Line x1={36} y1={90} x2={64} y2={90} {...line} />
        <Rect x={42} y={84} width={16} height={12} rx={1} {...p2} />
      </G>
    );
    case 2: return ( // 3-section column with ornaments
      <G>
        <Rect x={34} y={44} width={32} height={94} rx={1} {...p} />
        <Polygon points="50,24 66,44 34,44" {...p2} />
        <Line x1={34} y1={74} x2={66} y2={74} {...line} />
        <Line x1={34} y1={104} x2={66} y2={104} {...line} />
        <Rect x={40} y={50} width={20} height={18} rx={1} {...p2} />
        <Rect x={40} y={80} width={20} height={18} rx={1} {...p2} />
        <Rect x={40} y={110} width={20} height={22} rx={1} {...p2} />
        {/* side brackets */}
        <Line x1={28} y1={60} x2={34} y2={60} {...line} />
        <Line x1={66} y1={60} x2={72} y2={60} {...line} />
        <Line x1={28} y1={60} x2={28} y2={80} stroke={color} strokeWidth={1.4} fill="none" />
        <Line x1={72} y1={60} x2={72} y2={80} stroke={color} strokeWidth={1.4} fill="none" />
      </G>
    );
    case 3: return ( // gothic tower with windows
      <G>
        <Rect x={32} y={34} width={36} height={104} rx={1} {...p} />
        <Polygon points="50,14 68,34 32,34" {...p2} />
        <Line x1={32} y1={64} x2={68} y2={64} {...line} />
        <Line x1={32} y1={94} x2={68} y2={94} {...line} />
        <Rect x={43} y={40} width={14} height={18} rx={2} {...p2} />
        <Rect x={43} y={70} width={14} height={18} rx={2} {...p2} />
        <Rect x={43} y={100} width={14} height={26} rx={2} {...p2} />
        {/* battlement notches */}
        {[32,40,48,56,64].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={26} width={6} height={10} rx={1} {...p3} />
        )}
        {/* flanking lines */}
        <Line x1={24} y1={50} x2={32} y2={50} {...line} />
        <Line x1={68} y1={50} x2={76} y2={50} {...line} />
        <Rect x={16} y={50} width={16} height={40} rx={1} {...p} />
        <Rect x={68} y={50} width={16} height={40} rx={1} {...p} />
      </G>
    );
    case 4: return ( // grand tower
      <G>
        <Rect x={28} y={24} width={44} height={114} rx={1} {...p2} />
        <Polygon points="50,6 72,24 28,24" {...p2} />
        <Circle cx={50} cy={16} r={5} {...p3} />
        {[55,82,109].map(y => <Line key={y} x1={28} y1={y} x2={72} y2={y} {...line} />)}
        {[35,55,75].map(y => <Rect key={y} x={42} y={y} width={16} height={14} rx={2} {...p2} />)}
        <Rect x={14} y={38} width={18} height={60} rx={1} {...p} />
        <Rect x={68} y={38} width={18} height={60} rx={1} {...p} />
        <Polygon points="23,28 32,38 14,38" {...p} />
        <Polygon points="77,28 86,38 68,38" {...p} />
        {[14,22,30,60,68,76].map((x, i) => i < 2 &&
          <Rect key={x} x={x} y={28} width={6} height={10} rx={1} {...p3} />
        )}
      </G>
    );
    default: return ( // sovereign spire
      <G>
        <Rect x={24} y={18} width={52} height={120} rx={1} {...p2} />
        <Polygon points="50,2 76,18 24,18" fill={color + '55'} stroke={color} strokeWidth={1.4} />
        <Circle cx={50} cy={10} r={6} {...p3} />
        {[42,66,90,114].map(y => <Line key={y} x1={24} y1={y} x2={76} y2={y} {...line} />)}
        {[24,46,68].map(y => <Rect key={y} x={40} y={y} width={20} height={16} rx={2} {...p2} />)}
        <Rect x={8} y={30} width={20} height={72} rx={1} {...p} />
        <Rect x={72} y={30} width={20} height={72} rx={1} {...p} />
        <Polygon points="18,20 28,30 8,30" {...p} />
        <Polygon points="82,20 92,30 72,30" {...p} />
        <Circle cx={50} cy={52} r={8} {...p3} />
        <Circle cx={50} cy={78} r={6} {...p3} />
        <Circle cx={50} cy={100} r={4} {...p3} />
      </G>
    );
  }
}

// ── ALCHEMIST — Alchemical Flask ──────────────────────────────────────────────

function renderFlask(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage) {
    case 0: return ( // tiny flask
      <G>
        <Circle cx={50} cy={104} r={20} {...p} />
        <Rect x={46} y={60} width={8} height={30} rx={2} {...p} />
        <Circle cx={50} cy={52} r={10} {...p2} />
      </G>
    );
    case 1: return ( // small flask with glow
      <G>
        <Circle cx={50} cy={108} r={26} {...p} />
        <Circle cx={50} cy={108} r={16} {...p2} />
        <Rect x={45} y={58} width={10} height={30} rx={2} {...p} />
        <Circle cx={50} cy={50} r={12} {...p2} />
        <Circle cx={50} cy={110} r={5} {...p3} />
      </G>
    );
    case 2: return ( // double-bubble flask
      <G>
        <Circle cx={50} cy={112} r={30} {...p} />
        <Circle cx={50} cy={112} r={18} {...p2} />
        <Rect x={44} y={56} width={12} height={32} rx={3} {...p} />
        <Circle cx={50} cy={47} r={16} {...p2} />
        <Circle cx={50} cy={47} r={8} {...p3} />
        <Circle cx={50} cy={114} r={7} {...p3} />
        {/* swirl */}
        <Path d="M 50,100 Q 58,106 50,112 Q 42,118 50,124" fill="none" stroke={color} strokeWidth={1} />
      </G>
    );
    case 3: return ( // retort with side arm
      <G>
        <Circle cx={50} cy={112} r={32} {...p} />
        <Circle cx={50} cy={112} r={20} {...p2} />
        <Rect x={44} y={52} width={12} height={36} rx={3} {...p} />
        <Circle cx={50} cy={44} r={18} {...p2} />
        <Circle cx={50} cy={44} r={10} {...p3} />
        <Circle cx={50} cy={112} r={8} {...p3} />
        {/* side arm */}
        <Path d="M 76,105 Q 90,100 88,85" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <Circle cx={88} cy={83} r={5} {...p2} />
        <Path d="M 50,98 Q 62,106 50,114 Q 38,122 50,130" fill="none" stroke={color} strokeWidth={1} />
      </G>
    );
    case 4: return ( // grand retort
      <G>
        <Circle cx={50} cy={112} r={34} {...p} />
        <Circle cx={50} cy={112} r={22} {...p2} />
        <Rect x={43} y={46} width={14} height={34} rx={3} {...p} />
        <Circle cx={50} cy={38} r={20} {...p2} />
        <Circle cx={50} cy={38} r={12} {...p3} />
        <Circle cx={50} cy={114} r={10} {...p3} />
        <Path d="M 78,104 Q 95,96 92,78 Q 90,68 82,64" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M 22,104 Q 5,96 8,78 Q 10,68 18,64" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <Circle cx={92} cy={76} r={6} {...p2} />
        <Circle cx={8} cy={76} r={6} {...p2} />
        <Path d="M 50,96 Q 64,106 50,116 Q 36,126 50,136" fill="none" stroke={color} strokeWidth={1.2} />
      </G>
    );
    default: return ( // philosopher's vessel
      <G>
        <Circle cx={50} cy={108} r={38} {...p} />
        <Circle cx={50} cy={108} r={26} {...p2} />
        <Circle cx={50} cy={108} r={14} {...p3} />
        <Rect x={42} y={38} width={16} height={36} rx={4} {...p2} />
        <Circle cx={50} cy={30} r={22} {...p2} />
        <Circle cx={50} cy={30} r={14} {...p3} />
        <Circle cx={50} cy={30} r={6} fill={color} stroke="none" />
        <Path d="M 82,98 Q 102,88 100,68 Q 98,54 88,48" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M 18,98 Q -2,88 0,68 Q 2,54 12,48" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Circle cx={100} cy={66} r={7} {...p2} />
        <Circle cx={0}   cy={66} r={7} {...p2} />
        {/* spiral */}
        <Path d="M 50,88 Q 66,96 60,108 Q 54,120 50,116 Q 42,112 46,104 Q 50,96 58,100" fill="none" stroke={color} strokeWidth={1.2} />
      </G>
    );
  }
}

// ── ORACLE — Wide Spreading Figure ────────────────────────────────────────────

function renderOracle(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  const orb = (cx: number, cy: number, r: number) => <Circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} {...p2} />;
  switch (stage) {
    case 0: return (
      <G>
        <Circle cx={50} cy={68} r={16} {...p} />
        <Polygon points="50,84 34,138 66,138" {...p} />
      </G>
    );
    case 1: return (
      <G>
        <Circle cx={50} cy={62} r={20} {...p} />
        <Path d="M 30,82 Q 16,120 20,138 L 80,138 Q 84,120 70,82 Z" {...p} />
        {orb(18, 84, 7)}{orb(82, 84, 7)}
      </G>
    );
    case 2: return (
      <G>
        <Circle cx={50} cy={56} r={24} {...p} />
        <Path d="M 24,80 Q 8,120 14,138 L 86,138 Q 92,120 76,80 Z" {...p} />
        {orb(12, 80, 9)}{orb(88, 80, 9)}{orb(50, 46, 6)}
        <Circle cx={12} cy={80} r={4} {...p3} />
        <Circle cx={88} cy={80} r={4} {...p3} />
      </G>
    );
    case 3: return (
      <G>
        <Circle cx={50} cy={50} r={27} {...p2} />
        <Path d="M 16,76 Q -2,118 6,138 L 94,138 Q 102,118 84,76 Z" {...p} />
        {orb(6, 74, 10)}{orb(94, 74, 10)}{orb(22, 50, 8)}{orb(78, 50, 8)}
        <Circle cx={6}  cy={74} r={5} {...p3} />
        <Circle cx={94} cy={74} r={5} {...p3} />
        <Circle cx={22} cy={50} r={3} {...p3} />
        <Circle cx={78} cy={50} r={3} {...p3} />
        <Circle cx={50} cy={50} r={8} {...p3} />
      </G>
    );
    case 4: return (
      <G>
        <Circle cx={50} cy={48} r={30} {...p2} />
        <Path d="M 8,74 Q -8,118 2,140 L 98,140 Q 108,118 92,74 Z" {...p} />
        {[6,22,50,78,94].map((cx, i) => {
          const cys = [74, 50, 26, 50, 74];
          const rs  = [11,  9,  7,  9, 11];
          return <G key={cx}>
            <Circle cx={cx} cy={cys[i]} r={rs[i]} {...p2} />
            <Circle cx={cx} cy={cys[i]} r={Math.floor(rs[i]/2)} {...p3} />
          </G>;
        })}
        <Circle cx={50} cy={48} r={10} {...p3} />
      </G>
    );
    default: return (
      <G>
        <Circle cx={50} cy={44} r={33} {...p2} />
        <Path d="M 2,72 Q -14,118 -2,140 L 102,140 Q 114,118 98,72 Z" {...p} />
        {[2,18,34,50,66,82,98].map((cx, i) => {
          const cys  = [74, 52, 34, 22, 34, 52, 74];
          const rs   = [12,  10,  8,  7,  8, 10, 12];
          return <G key={cx}>
            <Circle cx={cx} cy={cys[i]} r={rs[i]} {...p2} />
            <Circle cx={cx} cy={cys[i]} r={Math.floor(rs[i]*0.5)} {...p3} />
          </G>;
        })}
        <Circle cx={50} cy={44} r={12} {...p3} />
        <Circle cx={50} cy={44} r={5} fill={color} stroke="none" />
      </G>
    );
  }
}

// ── SENTINEL — Fortress ───────────────────────────────────────────────────────

function renderFortress(stage: EvolutionStage, p: object, p2: object, p3: object, line: object, color: string, path: EvoPath) {
  switch (stage) {
    case 0: return (
      <G>
        <Rect x={30} y={62} width={40} height={72} rx={2} {...p} />
        <Rect x={38} y={52} width={8}  height={12} rx={1} {...p2} />
        <Rect x={50} y={52} width={8}  height={12} rx={1} {...p2} />
        <Rect x={62} y={52} width={8}  height={12} rx={1} {...p2} />
      </G>
    );
    case 1: return (
      <G>
        <Rect x={26} y={52} width={48} height={84} rx={2} {...p} />
        {[26,34,42,50,58,66].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={42} width={8} height={12} rx={1} {...p2} />
        )}
        <Rect x={38} y={74} width={24} height={28} rx={2} {...p2} />
        <Line x1={26} y1={80} x2={74} y2={80} {...line} />
      </G>
    );
    case 2: return (
      <G>
        <Rect x={20} y={46} width={60} height={90} rx={2} {...p} />
        {/* battlements */}
        {[20,28,36,44,52,60,68].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={36} width={8} height={12} rx={1} {...p2} />
        )}
        {/* side towers */}
        <Rect x={8}  y={56} width={18} height={66} rx={2} {...p} />
        <Rect x={74} y={56} width={18} height={66} rx={2} {...p} />
        <Line x1={20} y1={78} x2={80} y2={78} {...line} />
        <Rect x={34} y={82} width={32} height={38} rx={2} {...p2} />
        <Line x1={34} y1={100} x2={66} y2={100} {...line} />
      </G>
    );
    case 3: return (
      <G>
        {/* outer walls */}
        <Rect x={6} y={64} width={88} height={72} rx={2} {...p} />
        {/* corner towers */}
        <Rect x={4}  y={42} width={22} height={94} rx={2} {...p2} />
        <Rect x={74} y={42} width={22} height={94} rx={2} {...p2} />
        {/* central keep */}
        <Rect x={24} y={30} width={52} height={106} rx={2} {...p2} />
        {/* battlements */}
        {[4,12,20,28,34,42,50,58,66,74,82,90].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={28} width={7} height={14} rx={1} {...p3} />
        )}
        <Rect x={38} y={38} width={24} height={30} rx={2} {...p3} />
        <Line x1={24} y1={80} x2={76} y2={80} {...line} />
        <Rect x={34} y={84} width={32} height={46} rx={2} {...p2} />
      </G>
    );
    case 4: return (
      <G>
        <Rect x={4}  y={60} width={92} height={78} rx={2} {...p} />
        <Rect x={2}  y={34} width={24} height={104} rx={2} {...p2} />
        <Rect x={74} y={34} width={24} height={104} rx={2} {...p2} />
        <Rect x={20} y={20} width={60} height={118} rx={2} {...p2} />
        {[2,10,18,26,34,42,50,58,66,74,82,90].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={16} width={8} height={16} rx={1} {...p3} />
        )}
        <Rect x={36} y={26} width={28} height={38} rx={2} fill={color + '44'} stroke={color} strokeWidth={1.4} />
        <Circle cx={50} cy={36} r={8} {...p3} />
        <Line x1={20} y1={72} x2={80} y2={72} {...line} />
        <Rect x={32} y={76} width={36} height={62} rx={2} {...p2} />
        <Line x1={32} y1={104} x2={68} y2={104} {...line} />
      </G>
    );
    default: return (
      <G>
        {/* legendary fortress */}
        <Rect x={2}  y={58} width={96} height={80} rx={2} {...p} />
        <Rect x={0}  y={28} width={28} height={110} rx={2} {...p2} />
        <Rect x={72} y={28} width={28} height={110} rx={2} {...p2} />
        <Rect x={18} y={14} width={64} height={124} rx={2} {...p2} />
        {[0,8,16,24,32,40,48,56,64,72,80,88,96].map((x, i) => i % 2 === 0 &&
          <Rect key={x} x={x} y={10} width={8} height={18} rx={1} {...p3} />
        )}
        <Rect x={34} y={18} width={32} height={44} rx={2} fill={color + '55'} stroke={color} strokeWidth={1.4} />
        <Circle cx={50} cy={28} r={10} {...p3} />
        <Circle cx={50} cy={28} r={5} fill={color} stroke="none" />
        <Line x1={18} y1={68} x2={82} y2={68} {...line} />
        <Rect x={30} y={72} width={40} height={66} rx={2} {...p2} />
        <Line x1={30} y1={100} x2={70} y2={100} {...line} />
        <Rect x={40} y={76} width={20} height={20} rx={2} {...p3} />
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
  switch (stage) {
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
        {/* crown of floating orbs */}
        {[30,40,50,60,70].map((cx, i) => {
          const cys = [30, 16, 10, 16, 30];
          return <G key={cx}>
            <Circle cx={cx} cy={cys[i]} r={6} {...p2} />
            <Circle cx={cx} cy={cys[i]} r={3} {...p3} />
          </G>;
        })}
        <Circle cx={50} cy={38} r={28} {...p2} />
        <Polygon points="50,10 78,38 22,38" {...p2} />
        <Path d="M 12,58 Q -16,104 -6,138 L 106,138 Q 116,104 88,58 Z" {...p} />
        <Path d="M 0,90 Q -16,120 -6,138" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M 100,90 Q 116,120 106,138" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <Line x1={88} y1={52} x2={100} y2={138} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={88} cy={50} r={7} {...p2} />
        <Circle cx={50} cy={38} r={10} {...p3} />
        <Circle cx={50} cy={38} r={4} fill={color} stroke="none" />
      </G>
    );
  }
}
