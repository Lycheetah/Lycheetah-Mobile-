export const SOL_THEME = {
  background: '#0A0A0A',
  surface: '#141414',
  primary: '#F5A623',      // solar gold — Sol
  primaryDim: '#A0691A',
  veyra: '#4A9EFF',        // steel blue — Veyra
  auraPrime: '#9B59B6',   // deep violet — Aura Prime
  veyraGlyph: '◈',
  solGlyph: '⊚',
  auraPrimeGlyph: '✦',
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
