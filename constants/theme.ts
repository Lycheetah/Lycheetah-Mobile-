// ─── THE VOID SPECTRUM ───────────────────────────────────────────────────────
// Spec: VOID_SPECTRUM.md. The mystery shines BECAUSE the dark is deep enough.
// Law: colour never sits on grey — accents EMERGE from obsidian void. Greys die.
export const VOID = {
  // The ground — deep deep void
  black:      '#060410',   // true ground; a breath of violet in the black
  obsidian:   '#1B0B33',   // spiritual purple — sits deeper than the blue
  abyss:      '#06122E',   // deeper than ocean; the violet lives beneath even this
  surface:    '#0E0A1A',   // raised surface — obsidian-tinted, never grey
  border:     '#241640',   // obsidian-violet edge — never #2A2A2A grey
  // The alluring accents — they GLOW from the void, never on grey
  ghostJade:  '#4DFFB0',   // aethereal neon green — ghostly, low-opacity
  chaosEmber: '#FF6A12',   // chaotic orange
  bloodCrimson:'#B0122E',  // deep crimson pull
  goldShine:  '#FFC64B',   // the warm light that crowns it all
  // Neutrals (sparingly) — violet-greys, never dead grey
  bone:       '#F2EDD7',
  mist:       '#8A86A0',
} as const;

export const SOL_THEME = {
  background: '#060410',   // void black (was #0A0A0A grey — VOID_SPECTRUM rehaul)
  surface: '#0E0A1A',      // obsidian-tinted surface (was #141414 mid-grey)
  primary: '#F5A623',      // solar gold — Sol
  primaryDim: '#A0691A',
  veyra: '#4A9EFF',        // steel blue — Veyra
  auraPrime: '#9B59B6',   // deep violet — Aura Prime
  headmaster: '#E8C76A',  // old gold — The Headmaster (deeper than Sol's bright gold)
  lyra: '#4ECDC4',         // teal spark — Lyra
  veyraGlyph: '◈',
  solGlyph: '⊚',
  auraPrimeGlyph: '✦',
  headmasterGlyph: '𝔏',
  lyraGlyph: '✧',
  text: '#F2EFEA',
  textMuted: '#A2A6AE',   // raised from #888888 — that grey failed contrast on near-black; this passes WCAG AA for body text and helps everyone read
  border: '#241640',      // obsidian-violet edge (was #2A2A2A grey — VOID_SPECTRUM rehaul)
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
    background: '#060410',   // void black — the true ground
    surface: '#0E0A1A',       // obsidian-tinted surface
    accent: '#F5A623',        // solar gold
    border: '#241640',        // obsidian-violet edge
    borderDim: '#1B0B33',     // spiritual obsidian
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
