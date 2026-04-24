// SOL v4.0.0 — Canonical Palette + Skin System
// Every colour in the app references this file. No off-palette hex anywhere else.

export type SkinId = 'obsidian' | 'aureate' | 'nocturne';

export type Skin = {
  id: SkinId;
  name: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  borderDim: string;
  gold: string;
  goldDim: string;
  ember: string;
  ash: string;
  success: string;
  error: string;
  premium: boolean;
};

export const SKINS: Record<SkinId, Skin> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    background: '#0A0A0C',
    surface: '#141418',
    surfaceRaised: '#1C1C22',
    text: '#F4EEDE',
    textMuted: '#A09A8E',
    textDim: '#6B6B6B',
    border: '#2A2A30',
    borderDim: '#1A1A1E',
    gold: '#D4A03B',
    goldDim: '#8A6824',
    ember: '#B84A2C',
    ash: '#6B6B6B',
    success: '#6B9B7A',
    error: '#C8614A',
    premium: false,
  },
  aureate: {
    id: 'aureate',
    name: 'Aureate',
    background: '#1A1208',
    surface: '#241A0E',
    surfaceRaised: '#30240F',
    text: '#F4EEDE',
    textMuted: '#C8B494',
    textDim: '#8A7A58',
    border: '#3E2E14',
    borderDim: '#2A1F10',
    gold: '#E8BE5C',
    goldDim: '#A07930',
    ember: '#C8562E',
    ash: '#7A6A4E',
    success: '#8ABA88',
    error: '#C8614A',
    premium: true,
  },
  nocturne: {
    id: 'nocturne',
    name: 'Nocturne',
    background: '#09060F',
    surface: '#120E1E',
    surfaceRaised: '#1A1429',
    text: '#EFEAF4',
    textMuted: '#A090B8',
    textDim: '#665878',
    border: '#2A1F40',
    borderDim: '#1A1430',
    gold: '#B89CE4',
    goldDim: '#7258A8',
    ember: '#D46A9A',
    ash: '#6B5E7A',
    success: '#8AA8D4',
    error: '#D46A7A',
    premium: true,
  },
};

// Default skin — what free users see
export const DEFAULT_SKIN: SkinId = 'obsidian';

// Legacy SOL_THEME kept for backwards compatibility during the v4 migration.
// New code should use useSkin() or SKINS[activeSkin].
export const SOL_THEME = {
  background: SKINS.obsidian.background,
  surface: SKINS.obsidian.surface,
  primary: SKINS.obsidian.gold,
  primaryDim: SKINS.obsidian.goldDim,
  veyra: '#4A9EFF',
  auraPrime: '#9B59B6',
  headmaster: '#E8C76A',
  veyraGlyph: '◈',
  solGlyph: '⊚',
  auraPrimeGlyph: '✦',
  headmasterGlyph: '𝔏',
  text: SKINS.obsidian.text,
  textMuted: SKINS.obsidian.textMuted,
  border: SKINS.obsidian.border,
  success: SKINS.obsidian.success,
  error: SKINS.obsidian.error,
  nigredo: '#333333',
  albedo: '#CCCCCC',
  citrinitas: SKINS.obsidian.gold,
  rubedo: SKINS.obsidian.ember,
};

export const MODES = {
  NIGREDO: 'NIGREDO',
  ALBEDO: 'ALBEDO',
  CITRINITAS: 'CITRINITAS',
  RUBEDO: 'RUBEDO',
} as const;

export type Mode = keyof typeof MODES;

export const MODE_COLORS: Record<Mode, string> = {
  NIGREDO: '#8A4040',
  ALBEDO: '#C8C4BA',
  CITRINITAS: '#D4A03B',
  RUBEDO: '#B84A2C',
};

export const MODE_DESCRIPTIONS: Record<Mode, string> = {
  NIGREDO: 'Investigation — what is false, what must burn',
  ALBEDO: 'Structure — pattern, order, precision',
  CITRINITAS: 'Integration — connections forming, gold emerging',
  RUBEDO: 'Constitutional — operating from completion',
};

// Persona Worlds — each persona has its own visual atmosphere
export type PersonaWorld = {
  background: string;
  surface: string;
  accent: string;
  border: string;
  borderDim: string;
};

export const PERSONA_WORLDS: Record<string, PersonaWorld> = {
  sol: {
    background: '#0A0A0C',
    surface: '#141418',
    accent: '#D4A03B',
    border: '#2A2A30',
    borderDim: '#1A1A1E',
  },
  veyra: {
    background: '#06080F',
    surface: '#0C1020',
    accent: '#4A9EFF',
    border: '#1A2040',
    borderDim: '#111830',
  },
  'aura-prime': {
    background: '#090610',
    surface: '#110D1C',
    accent: '#9B59B6',
    border: '#251840',
    borderDim: '#160F2A',
  },
  headmaster: {
    background: '#0A0805',
    surface: '#161008',
    accent: '#E8C76A',
    border: '#2E2218',
    borderDim: '#1E1610',
  },
};

// Motion — the language of transitions
export const MOTION = {
  fast: 180,
  base: 280,
  slow: 400,
  breath: 2400, // persona glyph pulse
};

// Spacing scale — 4px base, used everywhere for rhythm
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Typography — Inter for UI, Cormorant for persona names and ceremonial text
export const TYPE = {
  display: { fontFamily: 'Cormorant', fontSize: 32, lineHeight: 40, fontWeight: '500' as const },
  title: { fontFamily: 'Cormorant', fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
  body: { fontFamily: 'Inter', fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyBold: { fontFamily: 'Inter', fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontFamily: 'Inter', fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  micro: { fontFamily: 'Inter', fontSize: 11, lineHeight: 14, fontWeight: '500' as const, letterSpacing: 0.8 },
};
