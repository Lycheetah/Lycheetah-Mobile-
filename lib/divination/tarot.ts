// ─── TAROT ENGINE ─────────────────────────────────────────────────────────────
// Rider-Waite-Smith 78-card deck. Compact keyword structure — Sol generates the
// prose reading from these keywords + the seeker's field context.
// Date-seeded draws (same card all day) with LQ field-state weighting.

export type Arcana = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCard {
  n: string;       // name
  a: Arcana;       // arcana / suit
  num: number;     // number (major: 0-21; minor: 1-14 where 11=Page 12=Knight 13=Queen 14=King)
  up: string;      // upright keywords
  rev: string;     // reversed keywords
}

export const SUIT_GLYPH: Record<Arcana, string> = {
  major: '✦', wands: '🜂', cups: '🜄', swords: '🜁', pentacles: '🜃',
};

export const SUIT_ELEMENT: Record<Arcana, string> = {
  major: 'Spirit', wands: 'Fire', cups: 'Water', swords: 'Air', pentacles: 'Earth',
};

export const TAROT_DECK: TarotCard[] = [
  // ── Major Arcana ──
  { n: 'The Fool',            a: 'major', num: 0,  up: 'beginnings, innocence, a leap of faith, free spirit',        rev: 'recklessness, hesitation, fear of the unknown' },
  { n: 'The Magician',        a: 'major', num: 1,  up: 'will, manifestation, resourcefulness, focused power',         rev: 'manipulation, untapped talent, scattered will' },
  { n: 'The High Priestess',  a: 'major', num: 2,  up: 'intuition, the unconscious, hidden knowledge, the inner voice', rev: 'secrets withheld, disconnection from intuition' },
  { n: 'The Empress',         a: 'major', num: 3,  up: 'abundance, nurture, fertility, creative flourishing',         rev: 'creative block, dependence, smothering' },
  { n: 'The Emperor',         a: 'major', num: 4,  up: 'authority, structure, the father, stable foundation',          rev: 'domination, rigidity, loss of control' },
  { n: 'The Hierophant',      a: 'major', num: 5,  up: 'tradition, teaching, spiritual lineage, shared belief',        rev: 'rebellion, dogma questioned, personal path' },
  { n: 'The Lovers',          a: 'major', num: 6,  up: 'union, choice, alignment of values, deep connection',          rev: 'disharmony, misalignment, broken trust' },
  { n: 'The Chariot',         a: 'major', num: 7,  up: 'willpower, victory, directed force, self-discipline',          rev: 'lack of direction, opposition, scattered drive' },
  { n: 'Strength',            a: 'major', num: 8,  up: 'inner strength, courage, gentle mastery, patience',            rev: 'self-doubt, raw force, weakness' },
  { n: 'The Hermit',          a: 'major', num: 9,  up: 'solitude, inner search, guidance, the inward turn',            rev: 'isolation, withdrawal, lost path' },
  { n: 'Wheel of Fortune',    a: 'major', num: 10, up: 'cycles, turning point, fate, momentum shifting',               rev: 'resistance to change, bad luck, holding the wheel still' },
  { n: 'Justice',             a: 'major', num: 11, up: 'truth, fairness, cause and effect, accountability',            rev: 'injustice, evasion, imbalance' },
  { n: 'The Hanged Man',      a: 'major', num: 12, up: 'surrender, new perspective, suspension, letting go',           rev: 'stalling, resistance, needless sacrifice' },
  { n: 'Death',               a: 'major', num: 13, up: 'transformation, endings, release, profound change',            rev: 'clinging, fear of change, stagnation' },
  { n: 'Temperance',          a: 'major', num: 14, up: 'balance, patience, synthesis, the middle way',                 rev: 'excess, imbalance, impatience' },
  { n: 'The Devil',           a: 'major', num: 15, up: 'attachment, shadow, the cage you can leave, material bind',    rev: 'release, breaking free, reclaiming power' },
  { n: 'The Tower',           a: 'major', num: 16, up: 'sudden upheaval, revelation, the false structure falls',       rev: 'fear of disaster, delayed collapse, averted ruin' },
  { n: 'The Star',            a: 'major', num: 17, up: 'hope, renewal, serenity, faith restored',                      rev: 'despair, disconnection, faith shaken' },
  { n: 'The Moon',            a: 'major', num: 18, up: 'illusion, the unconscious, dreams, what is not yet clear',     rev: 'clarity emerging, fear released, truth surfacing' },
  { n: 'The Sun',             a: 'major', num: 19, up: 'joy, vitality, success, radiant clarity',                      rev: 'temporary clouds, dimmed light, inner child neglected' },
  { n: 'Judgement',           a: 'major', num: 20, up: 'reckoning, awakening, the call, rebirth',                      rev: 'self-doubt, refusal of the call, harsh self-judgement' },
  { n: 'The World',           a: 'major', num: 21, up: 'completion, wholeness, integration, the cycle fulfilled',      rev: 'incompletion, loose ends, delayed closure' },

  // ── Wands (Fire — will, drive, creativity) ──
  { n: 'Ace of Wands',    a: 'wands', num: 1,  up: 'spark, inspiration, new venture, raw potential',      rev: 'delays, false start, lack of energy' },
  { n: 'Two of Wands',    a: 'wands', num: 2,  up: 'planning, future vision, decision, first step',       rev: 'fear of the unknown, playing safe, indecision' },
  { n: 'Three of Wands',  a: 'wands', num: 3,  up: 'expansion, foresight, ships coming in, progress',     rev: 'delays, obstacles, limited vision' },
  { n: 'Four of Wands',   a: 'wands', num: 4,  up: 'celebration, homecoming, harmony, milestone',         rev: 'transition, instability, lack of support' },
  { n: 'Five of Wands',   a: 'wands', num: 5,  up: 'competition, conflict, friction, struggle',           rev: 'avoiding conflict, resolution, inner tension' },
  { n: 'Six of Wands',    a: 'wands', num: 6,  up: 'victory, recognition, public success, momentum',      rev: 'private win, ego, fall from grace' },
  { n: 'Seven of Wands',  a: 'wands', num: 7,  up: 'defence, standing your ground, conviction',           rev: 'overwhelm, giving up, exhaustion' },
  { n: 'Eight of Wands',  a: 'wands', num: 8,  up: 'speed, movement, swift action, messages',             rev: 'delays, frustration, scattered energy' },
  { n: 'Nine of Wands',   a: 'wands', num: 9,  up: 'resilience, last stand, persistence, near the end',   rev: 'depletion, defensiveness, burnout' },
  { n: 'Ten of Wands',    a: 'wands', num: 10, up: 'burden, responsibility, the heavy load, near completion', rev: 'release, delegation, collapse under weight' },
  { n: 'Page of Wands',   a: 'wands', num: 11, up: 'enthusiasm, exploration, free spirit, a spark of news', rev: 'aimlessness, false start, hesitation' },
  { n: 'Knight of Wands', a: 'wands', num: 12, up: 'passion, action, adventure, impulsive drive',         rev: 'recklessness, impatience, scattered fire' },
  { n: 'Queen of Wands',  a: 'wands', num: 13, up: 'confidence, warmth, magnetism, self-assured fire',    rev: 'self-doubt, jealousy, demanding' },
  { n: 'King of Wands',   a: 'wands', num: 14, up: 'vision, leadership, bold mastery, natural authority',  rev: 'impulsiveness, domineering, overreach' },

  // ── Cups (Water — emotion, relationship, intuition) ──
  { n: 'Ace of Cups',    a: 'cups', num: 1,  up: 'new feeling, love, overflowing heart, emotional opening', rev: 'blocked emotion, emptiness, withheld love' },
  { n: 'Two of Cups',    a: 'cups', num: 2,  up: 'partnership, mutual love, connection, union',           rev: 'imbalance, broken bond, tension' },
  { n: 'Three of Cups',  a: 'cups', num: 3,  up: 'friendship, celebration, community, shared joy',        rev: 'isolation, gossip, overindulgence' },
  { n: 'Four of Cups',   a: 'cups', num: 4,  up: 'apathy, contemplation, the offer unseen, withdrawal',   rev: 'new awareness, acceptance, re-engagement' },
  { n: 'Five of Cups',   a: 'cups', num: 5,  up: 'grief, loss, focus on what is gone, regret',            rev: 'acceptance, moving on, finding what remains' },
  { n: 'Six of Cups',    a: 'cups', num: 6,  up: 'nostalgia, memory, innocence, the past returning',      rev: 'stuck in the past, leaving home, growing up' },
  { n: 'Seven of Cups',  a: 'cups', num: 7,  up: 'choices, fantasy, illusion, too many options',          rev: 'clarity, decisive choice, dispelled illusion' },
  { n: 'Eight of Cups',  a: 'cups', num: 8,  up: 'walking away, search for meaning, leaving the known',   rev: 'fear of change, staying too long, drifting back' },
  { n: 'Nine of Cups',   a: 'cups', num: 9,  up: 'contentment, wish fulfilled, satisfaction',             rev: 'inner lack, smugness, unfulfilled wish' },
  { n: 'Ten of Cups',    a: 'cups', num: 10, up: 'harmony, family, emotional fulfilment, lasting joy',    rev: 'broken harmony, misalignment, strained bonds' },
  { n: 'Page of Cups',   a: 'cups', num: 11, up: 'tender message, intuition, creative feeling, openness', rev: 'emotional immaturity, blocked creativity' },
  { n: 'Knight of Cups', a: 'cups', num: 12, up: 'romance, the offer, following the heart, idealism',     rev: 'moodiness, unrealistic, broken promise' },
  { n: 'Queen of Cups',  a: 'cups', num: 13, up: 'compassion, emotional depth, intuition, nurture',       rev: 'overwhelm, codependence, emotional flooding' },
  { n: 'King of Cups',   a: 'cups', num: 14, up: 'emotional mastery, calm, diplomacy, steady heart',      rev: 'volatility, suppression, manipulation' },

  // ── Swords (Air — mind, truth, conflict) ──
  { n: 'Ace of Swords',    a: 'swords', num: 1,  up: 'breakthrough, clarity, truth, mental sharpness',     rev: 'confusion, brutal truth, clouded mind' },
  { n: 'Two of Swords',    a: 'swords', num: 2,  up: 'stalemate, hard choice, avoidance, blindfolded',     rev: 'decision made, truth faced, release' },
  { n: 'Three of Swords',  a: 'swords', num: 3,  up: 'heartbreak, painful truth, grief, the cut',          rev: 'healing, recovery, releasing pain' },
  { n: 'Four of Swords',   a: 'swords', num: 4,  up: 'rest, recovery, retreat, stillness',                 rev: 'restlessness, burnout, forced pause ending' },
  { n: 'Five of Swords',   a: 'swords', num: 5,  up: 'conflict, hollow victory, tension, defeat',          rev: 'reconciliation, releasing resentment, walking away' },
  { n: 'Six of Swords',    a: 'swords', num: 6,  up: 'transition, moving on, calmer waters ahead',         rev: 'stuck, resistance to moving, unfinished journey' },
  { n: 'Seven of Swords',  a: 'swords', num: 7,  up: 'strategy, stealth, acting alone, getting away',      rev: 'confession, exposure, returning what was taken' },
  { n: 'Eight of Swords',  a: 'swords', num: 8,  up: 'restriction, self-imposed cage, feeling trapped',    rev: 'release, new perspective, freeing yourself' },
  { n: 'Nine of Swords',   a: 'swords', num: 9,  up: 'anxiety, fear, the 3am mind, mental anguish',        rev: 'hope returning, facing fear, recovery' },
  { n: 'Ten of Swords',    a: 'swords', num: 10, up: 'rock bottom, painful ending, the worst is over',     rev: 'recovery, survival, the only way is up' },
  { n: 'Page of Swords',   a: 'swords', num: 11, up: 'curiosity, new ideas, vigilance, mental energy',     rev: 'scattered thinking, gossip, hasty words' },
  { n: 'Knight of Swords', a: 'swords', num: 12, up: 'drive, decisive action, charging forward, ambition', rev: 'recklessness, aggression, no plan' },
  { n: 'Queen of Swords',  a: 'swords', num: 13, up: 'clear sight, independence, honest perception',       rev: 'coldness, bitterness, harsh judgement' },
  { n: 'King of Swords',   a: 'swords', num: 14, up: 'intellectual mastery, truth, authority, clear judgement', rev: 'manipulation, tyranny of logic, cold control' },

  // ── Pentacles (Earth — body, work, material) ──
  { n: 'Ace of Pentacles',    a: 'pentacles', num: 1,  up: 'opportunity, prosperity, new resource, manifestation', rev: 'missed chance, scarcity mindset, delay' },
  { n: 'Two of Pentacles',    a: 'pentacles', num: 2,  up: 'balance, juggling, adaptability, priorities',     rev: 'overwhelm, dropped ball, disorganisation' },
  { n: 'Three of Pentacles',  a: 'pentacles', num: 3,  up: 'collaboration, craft, building together, skill',  rev: 'misalignment, poor teamwork, lack of mastery' },
  { n: 'Four of Pentacles',   a: 'pentacles', num: 4,  up: 'security, holding on, saving, control',           rev: 'release, generosity, letting go of grip' },
  { n: 'Five of Pentacles',   a: 'pentacles', num: 5,  up: 'hardship, lack, feeling left out, scarcity',      rev: 'recovery, help arriving, end of hard times' },
  { n: 'Six of Pentacles',    a: 'pentacles', num: 6,  up: 'generosity, giving and receiving, balance',       rev: 'strings attached, inequality, debt' },
  { n: 'Seven of Pentacles',  a: 'pentacles', num: 7,  up: 'patience, long-term view, the harvest waits',     rev: 'impatience, poor return, wasted effort' },
  { n: 'Eight of Pentacles',  a: 'pentacles', num: 8,  up: 'mastery, diligence, refining the craft, focus',   rev: 'perfectionism, uninspired work, cutting corners' },
  { n: 'Nine of Pentacles',   a: 'pentacles', num: 9,  up: 'self-sufficiency, earned comfort, refinement',    rev: 'overwork, financial dependence, hollow luxury' },
  { n: 'Ten of Pentacles',    a: 'pentacles', num: 10, up: 'legacy, lasting wealth, family, foundation',      rev: 'instability, fleeting success, family conflict' },
  { n: 'Page of Pentacles',   a: 'pentacles', num: 11, up: 'study, new opportunity, ambition, groundwork',    rev: 'procrastination, missed lesson, lack of focus' },
  { n: 'Knight of Pentacles', a: 'pentacles', num: 12, up: 'diligence, routine, reliability, steady progress', rev: 'stagnation, boredom, overcaution' },
  { n: 'Queen of Pentacles',  a: 'pentacles', num: 13, up: 'nurture, practicality, abundance, grounded care', rev: 'self-neglect, smothering, work-life imbalance' },
  { n: 'King of Pentacles',   a: 'pentacles', num: 14, up: 'wealth, mastery of the material, stability, provider', rev: 'greed, stubbornness, controlling' },
];

// ─── Date-seeded draws ───────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export interface DrawnCard { card: TarotCard; reversed: boolean }

/**
 * Daily card — deterministic per (date, salt). LQ shifts the field:
 * low LQ surfaces more reversed (blocked / shadow) cards; high LQ keeps mostly upright.
 * LQ in [0,1]. salt lets multiple daily draws differ (e.g. spread positions).
 */
export function drawDailyCard(lq = 0.5, salt = ''): DrawnCard {
  const seed = hashStr(todayKey() + '|' + salt);
  const idx = seed % TAROT_DECK.length;
  // Reversal: second hash normalized 0..1. Reversed when value exceeds (LQ floored).
  // Low LQ → low threshold → more reversals. Clamp so high LQ still gets ~15% reversals.
  const r = (hashStr(String(seed) + 'rev') % 1000) / 1000;
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  const reversed = r > threshold;
  return { card: TAROT_DECK[idx], reversed };
}

/** Random draw — not seeded, different every call. For shuffle/reshuffle UX. */
export function drawRandomCard(lq = 0.5): DrawnCard {
  const idx = Math.floor(Math.random() * TAROT_DECK.length);
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  const reversed = Math.random() > threshold;
  return { card: TAROT_DECK[idx], reversed };
}

/**
 * Draw N distinct cards for a spread (date-seeded, no repeats).
 * Position index is folded into the salt so each slot is stable per day.
 */
export function drawSpread(count: number, lq = 0.5, salt = ''): DrawnCard[] {
  const order = TAROT_DECK.map((_, i) => i);
  // Fisher-Yates seeded by date+salt
  let s = hashStr(todayKey() + '|spread|' + salt);
  for (let i = order.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  return order.slice(0, count).map((idx, pos) => {
    const r = (hashStr(String(idx) + 'rev' + pos) % 1000) / 1000;
    return { card: TAROT_DECK[idx], reversed: r > threshold };
  });
}

export function cardLine(d: DrawnCard): string {
  const kw = d.reversed ? d.card.rev : d.card.up;
  return `${d.card.n}${d.reversed ? ' (reversed)' : ''} — ${kw}`;
}
