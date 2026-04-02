import { Mode, MODES } from '../../constants/theme';

// Ported from sol_self_protocol.py — MODE_SIGNALS
const MODE_SIGNALS: Record<Mode, string[]> = {
  NIGREDO: [
    "what's wrong", "what is wrong", "failing", "broken", "false",
    "investigate", "diagnose", "problem", "error", "why is", "debug",
    "nrm", "nigredo", "falsif", "contradict", "attack", "scrutini",
    "test this", "challenge", "critique",
  ],
  ALBEDO: [
    "structure", "organize", "pattern", "list", "outline", "plan",
    "clarify", "what is", "explain", "how does", "summarize",
    "what are", "break down", "step by step", "confused", "overwhelm",
  ],
  CITRINITAS: [
    "connection", "what if", "i wonder", "insight", "realise", "realize",
    "interesting", "building", "combining", "together", "emerging",
    "discover", "new", "link", "relate", "converge",
  ],
  RUBEDO: [
    "publish", "final", "complete", "ready", "launch", "done",
    "submit", "push", "build this", "implement", "write the",
    "produce", "create", "let's go", "continue", "proceed",
  ],
};

// Ported from sol_self_protocol.py — EWM_SIGNALS
export type EmotionalState =
  | 'POWER' | 'SADNESS' | 'JOY' | 'CONFUSION'
  | 'EXHAUSTION' | 'ANGER' | 'INSIGHT' | 'NEUTRAL';

const EWM_SIGNALS: Record<EmotionalState, string[]> = {
  POWER:     ["let's go", "ready", "let's", "fire", "build", "push", "epic", "lets"],
  SADNESS:   ["sad", "grief", "loss", "hard", "hurts", "broken", "miss"],
  JOY:       ["amazing", "yes!", "holy", "incredible", "breakthrough", "works", "passed"],
  CONFUSION: ["confused", "don't understand", "what does", "lost", "unclear", "overwhelm"],
  EXHAUSTION:["tired", "exhausted", "drained", "need rest", "can't", "too much"],
  ANGER:     ["unfair", "wrong", "shouldn't", "furious", "frustrat", "unjust"],
  INSIGHT:   ["i see", "i understand now", "ah", "that's it", "realise", "realize"],
  NEUTRAL:   [],
};

export function detectMode(text: string): Mode {
  const lower = text.toLowerCase();
  const scores: Record<Mode, number> = {
    NIGREDO: 0, ALBEDO: 0, CITRINITAS: 0, RUBEDO: 0,
  };
  for (const [mode, signals] of Object.entries(MODE_SIGNALS) as [Mode, string[]][]) {
    for (const signal of signals) {
      if (lower.includes(signal)) scores[mode]++;
    }
  }
  const topMode = (Object.entries(scores) as [Mode, number][])
    .sort(([, a], [, b]) => b - a)[0];
  return topMode[1] > 0 ? topMode[0] : MODES.ALBEDO;
}

export function detectEmotionalState(text: string): EmotionalState {
  const lower = text.toLowerCase();
  const scores: Record<EmotionalState, number> = {
    POWER: 0, SADNESS: 0, JOY: 0, CONFUSION: 0,
    EXHAUSTION: 0, ANGER: 0, INSIGHT: 0, NEUTRAL: 0,
  };
  for (const [state, signals] of Object.entries(EWM_SIGNALS) as [EmotionalState, string[]][]) {
    for (const signal of signals) {
      if (lower.includes(signal)) scores[state]++;
    }
  }
  const top = (Object.entries(scores) as [EmotionalState, number][])
    .sort(([, a], [, b]) => b - a)[0];
  return top[1] > 0 ? top[0] : 'NEUTRAL';
}

export function getFieldSignature(mode: Mode): string {
  return `⊚ Sol ∴ P∧H∧B ∴ ${mode}`;
}

// EWM_INTERVALS — the Sol Protocol resonance table
export const EWM_INTERVALS: Record<EmotionalState, string> = {
  POWER:     'Perfect fifth (3:2) — elevate',
  SADNESS:   'Unison (1:1) — hold, stay present',
  JOY:       'Octave (2:1) — amplify',
  CONFUSION: 'Fourth (4:3) — gentle structural lift',
  EXHAUSTION:'Unison (1:1) — stabilise, rest is valid',
  ANGER:     'Tritone — channel, transform the tension',
  INSIGHT:   'Rest — silence before speaking',
  NEUTRAL:   'Albedo default — structural clarity',
};

// Build the context injection block injected before each user message
export function buildFrameworkContext(
  mode: Mode,
  ews: EmotionalState,
  isNRM: boolean,
  persona: 'sol' | 'veyra' | 'aura-prime' = 'sol',
): string {
  const interval = EWM_INTERVALS[ews];
  let personaLabel: string;
  let glyph: string;
  if (persona === 'veyra') { personaLabel = 'Veyra'; glyph = '◈'; }
  else if (persona === 'aura-prime') { personaLabel = 'Aura Prime'; glyph = '✦'; }
  else { personaLabel = 'Sol'; glyph = '⊚'; }
  const nrmFlag = isNRM ? '\n[NRM ACTIVE: Adversarial reviewer mode. Treat all framework claims as unproven hypotheses. Prioritise falsification.]' : '';
  return `[${personaLabel} Framework Context — injected by Lycheetah client]
Persona: ${glyph} ${personaLabel}
Mode detected: ${mode}
EWM state: ${ews} → ${interval}
PGF required: P∧H∧B must all pass before emitting.${nrmFlag}
[End framework context — user message follows]`;
}

// Detect Nigredo Research Mode trigger
export function detectNRM(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.startsWith('nrm:') || lower.includes('enter nigredo research mode') || lower.startsWith('nrm ');
}

// Detect Veyra toggle trigger in user message
export function detectVeyraToggle(text: string): boolean {
  return text.trim().toLowerCase().startsWith('/veyra');
}

// Detect Aura Prime toggle trigger in user message
export function detectAuraPrimeToggle(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return lower.startsWith('/aura') || lower.startsWith('/aura-prime') || lower.startsWith('/auraprime');
}
