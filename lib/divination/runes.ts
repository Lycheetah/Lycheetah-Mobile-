// ─── RUNE ENGINE ──────────────────────────────────────────────────────────────
// Elder Futhark — 24 runes in three aettir. Compact meaning structure; Sol
// generates the prose reading. Date-seeded daily pull (same rune all day).
// Some runes are symmetrical and cannot physically reverse — they carry a
// merkstave (shadow) meaning instead.

export interface Rune {
  name: string;        // rune name
  symbol: string;      // glyph
  sound: string;       // phonetic value
  aett: string;        // which aett (family)
  up: string;          // upright meaning
  shadow: string;      // reversed / merkstave meaning
  canReverse: boolean; // false = symmetrical, never drawn reversed
}

export const RUNES: Rune[] = [
  // ── Freyr's Aett ──
  { name: 'Fehu',     symbol: 'ᚠ', sound: 'F',  aett: "Freyr",    up: 'wealth, abundance, earned prosperity, energy flowing',    shadow: 'loss, greed, hoarding, energy blocked',          canReverse: true },
  { name: 'Uruz',     symbol: 'ᚢ', sound: 'U',  aett: "Freyr",    up: 'raw strength, vitality, wild force, untamed potential',   shadow: 'weakness, misdirected force, sickness',          canReverse: true },
  { name: 'Thurisaz', symbol: 'ᚦ', sound: 'TH', aett: "Freyr",    up: 'a gateway, defence, reactive force, the thorn',           shadow: 'danger, compulsion, harm turned inward',         canReverse: true },
  { name: 'Ansuz',    symbol: 'ᚨ', sound: 'A',  aett: "Freyr",    up: 'the message, divine word, insight, communication',       shadow: 'misunderstanding, deception, blocked voice',     canReverse: true },
  { name: 'Raidho',   symbol: 'ᚱ', sound: 'R',  aett: "Freyr",    up: 'the journey, right action, rhythm, movement with purpose', shadow: 'disruption, wrong turn, stagnation',            canReverse: true },
  { name: 'Kenaz',    symbol: 'ᚲ', sound: 'K',  aett: "Freyr",    up: 'the torch, illumination, knowledge, creative fire',      shadow: 'darkness, lost vision, false hope',              canReverse: true },
  { name: 'Gebo',     symbol: 'ᚷ', sound: 'G',  aett: "Freyr",    up: 'the gift, exchange, partnership, generosity, balance',    shadow: 'imbalance in giving, dependency, obligation',    canReverse: false },
  { name: 'Wunjo',    symbol: 'ᚹ', sound: 'W',  aett: "Freyr",    up: 'joy, harmony, fellowship, fulfilment',                    shadow: 'sorrow, alienation, frenzy',                     canReverse: true },

  // ── Heimdall's Aett ──
  { name: 'Hagalaz',  symbol: 'ᚺ', sound: 'H',  aett: "Heimdall", up: 'disruption, the hail, destructive force that clears',     shadow: 'crisis, catastrophe, uncontrolled change',       canReverse: false },
  { name: 'Nauthiz',  symbol: 'ᚾ', sound: 'N',  aett: "Heimdall", up: 'need, constraint, the lesson in lack, resistance',        shadow: 'deprivation, want, despair, overwhelm',          canReverse: true },
  { name: 'Isa',      symbol: 'ᛁ', sound: 'I',  aett: "Heimdall", up: 'ice, stillness, pause, the frozen moment, patience',      shadow: 'blockage, isolation, the freeze that does not thaw', canReverse: false },
  { name: 'Jera',     symbol: 'ᛃ', sound: 'J/Y', aett: "Heimdall", up: 'harvest, cycles, reward for patient work, the turning year', shadow: 'bad timing, no reward yet, the cycle delayed',  canReverse: false },
  { name: 'Eihwaz',   symbol: 'ᛇ', sound: 'EI', aett: "Heimdall", up: 'the world tree, endurance, the axis, life and death',      shadow: 'confusion, weakness, dissatisfaction',           canReverse: false },
  { name: 'Perthro',  symbol: 'ᛈ', sound: 'P',  aett: "Heimdall", up: 'mystery, fate, the dice cup, hidden things, chance',      shadow: 'secrets kept, addiction, stagnation, loneliness', canReverse: true },
  { name: 'Algiz',    symbol: 'ᛉ', sound: 'Z',  aett: "Heimdall", up: 'protection, the shield, higher connection, sanctuary',    shadow: 'vulnerability, warning ignored, hidden danger',  canReverse: true },
  { name: 'Sowilo',   symbol: 'ᛊ', sound: 'S',  aett: "Heimdall", up: 'the sun, wholeness, success, life force, victory',         shadow: 'false success, burnout, misguided will',         canReverse: false },

  // ── Tyr's Aett ──
  { name: 'Tiwaz',    symbol: 'ᛏ', sound: 'T',  aett: "Tyr",      up: 'the warrior, justice, honour, sacrifice for principle',   shadow: 'injustice, imbalance, failed courage',           canReverse: true },
  { name: 'Berkano',  symbol: 'ᛒ', sound: 'B',  aett: "Tyr",      up: 'birth, growth, the birch, new beginnings, nurture',       shadow: 'stagnation, anxiety, sterility, family trouble', canReverse: true },
  { name: 'Ehwaz',    symbol: 'ᛖ', sound: 'E',  aett: "Tyr",      up: 'the horse, movement, trust, partnership, progress',       shadow: 'restlessness, mistrust, betrayal, stuck',        canReverse: true },
  { name: 'Mannaz',   symbol: 'ᛗ', sound: 'M',  aett: "Tyr",      up: 'the self, humanity, community, the individual in the whole', shadow: 'isolation, self-deception, the mask',          canReverse: true },
  { name: 'Laguz',    symbol: 'ᛚ', sound: 'L',  aett: "Tyr",      up: 'water, intuition, flow, the unconscious, the tide',        shadow: 'fear, avoidance, what drowns, blocked feeling',  canReverse: true },
  { name: 'Ingwaz',   symbol: 'ᛜ', sound: 'NG', aett: "Tyr",      up: 'fertility, the seed, gestation, potential within',        shadow: 'impotence, scattering, nothing to show yet',     canReverse: false },
  { name: 'Othala',   symbol: 'ᛟ', sound: 'O',  aett: "Tyr",      up: 'heritage, home, inheritance, what is truly yours',        shadow: 'rootlessness, clinging to the past, lost legacy', canReverse: true },
  { name: 'Dagaz',    symbol: 'ᛞ', sound: 'D',  aett: "Tyr",      up: 'breakthrough, dawn, awakening, the turning point',         shadow: 'the threshold not crossed, ending before beginning', canReverse: false },
];

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export interface DrawnRune { rune: Rune; reversed: boolean }

/** Daily rune — deterministic per (date, salt). Symmetrical runes never reverse. */
export function drawDailyRune(salt = ''): DrawnRune {
  const seed = hashStr(todayKey() + '|rune|' + salt);
  const rune = RUNES[seed % RUNES.length];
  const reversed = rune.canReverse && (hashStr(String(seed) + 'rev') % 2 === 0);
  return { rune, reversed };
}

export function runeLine(d: DrawnRune): string {
  const meaning = d.reversed ? d.rune.shadow : d.rune.up;
  const tag = d.reversed ? ' (reversed)' : (!d.rune.canReverse ? ' (immovable)' : '');
  return `${d.rune.symbol} ${d.rune.name}${tag} — ${meaning}`;
}
