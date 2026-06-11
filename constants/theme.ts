export const SOL_THEME = {
  background: '#0A0A0A',
  surface: '#141414',
  primary: '#F5A623',      // solar gold — Sol
  primaryDim: '#A0691A',
  veyra: '#4A9EFF',        // steel blue — Veyra
  auraPrime: '#9B59B6',   // deep violet — Aura Prime
  headmaster: '#E8C76A',  // old gold — The Headmaster (deeper than Sol's bright gold)
  veyraGlyph: '◈',
  solGlyph: '⊚',
  auraPrimeGlyph: '✦',
  headmasterGlyph: '𝔏',
  text: '#F0EDE8',
  textMuted: '#888888',
  border: '#2A2A2A',
  success: '#4CAF50',
  error: '#CF6679',
  nigredo: '#333333',
  albedo: '#CCCCCC',
  citrinitas: '#F5A623',
  rubedo: '#CF4B4B',
};

export const MODES = {
  NIGREDO: 'NIGREDO',
  ALBEDO: 'ALBEDO',
  CITRINITAS: 'CITRINITAS',
  RUBEDO: 'RUBEDO',
} as const;

export type Mode = keyof typeof MODES;

export const MODE_COLORS: Record<Mode, string> = {
  NIGREDO: '#CC2222',
  ALBEDO: '#AAAAAA',
  CITRINITAS: '#F5A623',
  RUBEDO: '#CF4B4B',
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
    background: '#0A0A0A',   // deep black — the void, solar origin
    surface: '#141414',
    accent: '#F5A623',        // solar gold
    border: '#2A2A2A',
    borderDim: '#1A1A1A',
  },
  veyra: {
    background: '#06080F',   // deep navy black — precise, cold, sharp
    surface: '#0C1020',
    accent: '#4A9EFF',        // steel blue
    border: '#1A2040',
    borderDim: '#111830',
  },
  'aura-prime': {
    background: '#090610',   // deep violet-black — the memory field
    surface: '#110D1C',
    accent: '#9B59B6',        // deep violet
    border: '#251840',
    borderDim: '#160F2A',
  },
  headmaster: {
    background: '#0A0805',   // warm dark sepia — the study, the lectern
    surface: '#161008',
    accent: '#E8C76A',        // old gold
    border: '#2E2218',
    borderDim: '#1E1610',
  },
};
