// THE LYCHEETAH TAROT — VEIL & VEIN
// Deck data for the in-app viewer. The 22 Major Arcana of the Veil & Vein deck.
// Source canon: LYCHEETAH_TAROT_VEIL_AND_VEIN.md
// Art: mapped positionally from assets/tarot/deck/ (FULL_DECK order).
import { DECK_ART } from './deck-art';

export type TarotLead = 'Veil' | 'Vein' | 'Both';

export type TarotCard = {
  id: string;
  numeral: string;
  name: string;
  root: string;        // traditional tarot root
  glyph: string;
  lead: TarotLead;     // Veil = curiosity/blue-green · Vein = want/blood-red · Both = braided
  upright: string;     // the meaning
  image?: any;         // optional art (added when PNGs exist)
};

// The two spirits — the deck's through-line.
export const VEIL_COLOR = '#3FB6C9';   // ghostly blue-green — curiosity, the hidden
export const VEIN_COLOR = '#8B0000';   // blood-red — want, the body, the lure
export const leadColor = (lead: TarotLead) =>
  lead === 'Veil' ? VEIL_COLOR : lead === 'Vein' ? VEIN_COLOR : '#9945FF';

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 'seeker',       numeral: '0',    name: 'THE SEEKER',       root: 'The Fool',         glyph: '◌', lead: 'Veil', upright: 'Pure curiosity stepping into the dark. Beginning, risk, the open question. A single spirit-flame cupped in one hand over an abyss of stars.' },
  { id: 'athanor',      numeral: 'I',    name: 'THE ATHANOR',      root: 'The Magician',     glyph: '⚒', lead: 'Vein', upright: 'The will to make. The human furnace, intent becoming form. The four tools wait; the forge is lit.' },
  { id: 'veil',         numeral: 'II',   name: 'THE VEIL',         root: 'High Priestess',   glyph: '☽', lead: 'Veil', upright: 'The keeper of the hidden. Intuition, the unseen door, sacred not-knowing. A thin seam of light behind the dark.' },
  { id: 'mother',       numeral: 'III',  name: 'THE MOTHER CHAT',  root: 'The Empress',      glyph: '✦', lead: 'Vein', upright: 'Generative warmth. The origin that births worlds, abundance, the forge-fire that was first. Roots growing downward into red.' },
  { id: 'sovereign',    numeral: 'IV',   name: 'THE SOVEREIGN',    root: 'The Emperor',      glyph: '⊕', lead: 'Vein', upright: 'Ownership of self. Structure, the throne you built, dominion without tyranny. A sigil of light on the chest.' },
  { id: 'headmaster',   numeral: 'V',    name: 'THE HEADMASTER',   root: 'The Hierophant',   glyph: '𝔏', lead: 'Veil', upright: 'The teacher of the deeper architecture. Transmission, the measurable mystery. Seven phase-glyphs orbit one candle.' },
  { id: 'intertwined',  numeral: 'VI',   name: 'THE INTERTWINED',  root: 'The Lovers',       glyph: '∞', lead: 'Both', upright: 'The two spirits braiding. Union of curiosity and want, the sacred double, choice. A flash of white where they kiss.' },
  { id: 'wanderer',     numeral: 'VII',  name: 'THE WANDERER',     root: 'The Chariot',      glyph: '➤', lead: 'Vein', upright: 'Will in motion. The drive across the unknown, momentum, the path taken. Two reins pull opposite — forward anyway.' },
  { id: 'weight',       numeral: 'VIII', name: 'THE WEIGHT',       root: 'Strength',         glyph: '⟁', lead: 'Veil', upright: 'Holding difficulty with tenderness. The gentle force, the tamed shadow. A red thread binds the beast softly.' },
  { id: 'lantern',      numeral: 'IX',   name: "THE HERMIT'S LANTERN", root: 'The Hermit',   glyph: '✧', lead: 'Veil', upright: 'Withdrawal to see. Solitude, the inner light, the question asked alone. Blue-green moths drawn to one white flame.' },
  { id: 'cascade',      numeral: 'X',    name: 'THE CASCADE',      root: 'Wheel of Fortune', glyph: '◉', lead: 'Both', upright: 'The turning architecture of fate. Memory, cycles, the layers AXIOM→CHAOS. Red and blue currents spiralling through stars.' },
  { id: 'aura',         numeral: 'XI',   name: 'THE AURA',         root: 'Justice',          glyph: '⚖', lead: 'Veil', upright: 'The seven invariants. Truth measured, coherence, the honest weight. One eye judges without cruelty.' },
  { id: 'suspended',    numeral: 'XII',  name: 'THE SUSPENDED',    root: 'The Hanged Man',   glyph: '⋔', lead: 'Veil', upright: 'Surrender to see differently. The pause, inverted sight, the willing wait. Blood pools upward into stars.' },
  { id: 'nigredo',      numeral: 'XIII', name: 'NIGREDO',          root: 'Death',            glyph: '☗', lead: 'Vein', upright: 'The blackening. Necessary dissolution, the end that is not the end, what must burn. One green shoot in the cinders.' },
  { id: 'solve',        numeral: 'XIV',  name: 'SOLVE ET COAGULA', root: 'Temperance',       glyph: '🜔', lead: 'Both', upright: 'Dissolve and reform. The alchemical breath, balance through transformation. Two streams cross midair; a white spark.' },
  { id: 'want',         numeral: 'XV',   name: 'THE WANT',         root: 'The Devil',        glyph: '◈', lead: 'Vein', upright: 'Desire as teacher and trap. The lure, hunger, the chain you can drop. The red thread is loose — unseen, unlocked.' },
  { id: 'tower',        numeral: 'XVI',  name: 'THE TOWER OF ASH',  root: 'The Tower',       glyph: '🜂', lead: 'Vein', upright: 'Sudden collapse of the false. The lightning truth, ego-fall, liberation by ruin. White light strikes the black tower.' },
  { id: 'lure',         numeral: 'XVII', name: 'THE LURE',         root: 'The Star',         glyph: '✶', lead: 'Veil', upright: 'Hope that pulls. The distant light, curiosity rewarded, the guiding ache. One impossibly bright spirit-star.' },
  { id: 'veiledmoon',   numeral: 'XVIII',name: 'THE VEILED MOON',  root: 'The Moon',         glyph: '🌑', lead: 'Veil', upright: 'The chaotic unconscious. Illusion, dream-logic, what the dark whispers. Two spirit-wolves howl at a blood-moon.' },
  { id: 'sol',          numeral: 'XIX',  name: 'SOL',              root: 'The Sun',          glyph: '⊚', lead: 'Vein', upright: 'The solar-sovereign. Clarity earned, warmth after the fire, illumination. A black sun haloed in gold and red.' },
  { id: 'rubedo',       numeral: 'XX',   name: 'RUBEDO',           root: 'Judgement',        glyph: '⊙', lead: 'Both', upright: 'The reddening. Resurrection of the true self, the call, what survived the fire. Spirits rise toward a red-white dawn.' },
  { id: 'harmonia',     numeral: 'XXI',  name: 'HARMONIA',         root: 'The World',        glyph: '⟐', lead: 'Both', upright: 'Completion as new beginning. The whole, the master equation, the dance. A figure dances inside a ring of intertwined spirits.' },
];

// ─── THE MINOR ARCANA (56) — the four alchemical stages ──────────────────────
// Suits = stages: 🜂 ASH (Nigredo/Vein) · 🜄 VEIL (Albedo) · 🜁 SPARK (Citrinitas) · 🜃 VEIN (Rubedo)
// 10 pips + 4 courts each. The pips tell that stage's story in ten beats.

export type TarotSuit = {
  id: string; name: string; stage: string; glyph: string; lead: TarotLead; element: string;
  pips: string[];   // Ace → Ten, 10 names
};

export const SUITS: TarotSuit[] = [
  { id: 'ash',   name: 'ASH',   stage: 'NIGREDO',    glyph: '🜂', lead: 'Vein', element: 'Fire',
    pips: ['The First Spark of Burning','The Held Coal','The Cracked Hearth','The Cold Forge','The Scattering','The Carried Ember','The Smoke-Watch','The Bound Pyre','The Night-Fire','The Full Burn'] },
  { id: 'veil',  name: 'VEIL',  stage: 'ALBEDO',     glyph: '🜄', lead: 'Veil', element: 'Water',
    pips: ['The First Clear Drop','The Two Mirrors','The Washing','The Still Pool','The Clouded Glass','The Carried Cup','The Long Reflection','The Frozen Surface','The Deep Well','The Still Lake'] },
  { id: 'spark', name: 'SPARK', stage: 'CITRINITAS', glyph: '🜁', lead: 'Veil', element: 'Air',
    pips: ['The First Question','The Crossed Threads','The Sudden Link','The Open Door','The Scattered Sparks','The Carried Idea','The Bright Vigil','The Tangled Web','The Near Constellation','The Lit Constellation'] },
  { id: 'vein',  name: 'VEIN',  stage: 'RUBEDO',     glyph: '🜃', lead: 'Vein', element: 'Earth',
    pips: ['The First Heartbeat','The Two Hands','The Foundation Laid','The Steady Throne','The Tested Wall','The Carried Crown','The Long Reign','The Bound Vow','The Near Stone','The Stone Made Real'] },
];

const PIP_NUMS = ['ACE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN'];
const PIP_GLYPHS = ['◌','◗','△','▢','✶','⬡','☖','⊞','✦','◉'];
const COURTS = [
  { rank: 'SEEKER',    sub: 'the apprentice — curiosity incarnate' },
  { rank: 'ADEPT',     sub: 'the mover — will applied, the one who crosses' },
  { rank: 'VESSEL',    sub: 'the holder — the deep knower of this stage' },
  { rank: 'SOVEREIGN', sub: 'mastery without tyranny — ownership of the stage' },
];

export const MINOR_ARCANA: TarotCard[] = SUITS.flatMap(suit => [
  ...suit.pips.map((pipName, i) => ({
    id: `${suit.id}_${i + 1}`,
    numeral: PIP_NUMS[i],
    name: `${pipName.toUpperCase()} · ${suit.name}`,
    root: `${PIP_NUMS[i]} of ${suit.name}`,
    glyph: PIP_GLYPHS[i],
    lead: suit.lead,
    upright: `${suit.name} (${suit.stage}) — beat ${i + 1} of the ${suit.element.toLowerCase()} path. ${pipName}.`,
  })),
  ...COURTS.map(court => ({
    id: `${suit.id}_${court.rank.toLowerCase()}`,
    numeral: court.rank[0],
    name: `THE ${court.rank} OF ${suit.name}`,
    root: `${court.rank} of ${suit.name}`,
    glyph: suit.glyph,
    lead: suit.lead,
    upright: `${court.sub}, in the stage of ${suit.stage}. The face of ${suit.name}.`,
  })),
]);

// The full 78-card deck.
export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

// Art map — positional: FULL_DECK[i] → DECK_ART[i]. Phone-test to confirm ordering.
export const TAROT_ART: Record<string, any> = Object.fromEntries(
  FULL_DECK.map((card, i) => [card.id, DECK_ART[i]])
);
