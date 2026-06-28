// AETHERA — THE LUMINOUS FIELD · The Third Deck
// 90 cards: 22 Majors + 56 Minors (Tides/Embers/Prisms/Seeds) + 12 Choir
// Canon: SOL-MOBILE-VAULT/AETHERA_BRIEF.md · June 26 2026

export type AetheraCard = {
  id: string;
  name: string;       // AETHERA name
  numeral: string;    // traditional numbering
  root: string;       // traditional tarot root
  breath: string;     // the gradient (Dawn-Gold, Deep-Bloom, etc.)
  lore: string;       // what it surfaces in the seeker
};

// ── MAJOR ARCANA — 22 thresholds of light ────────────────────────────────────

export const AETHERA_MAJORS: AetheraCard[] = [
  { id:'opening',       numeral:'0',     name:'THE OPENING',         root:'The Fool',        breath:'Dawn-Gold',     lore:'The trust you forgot you had. Step forward — the field is already catching you.' },
  { id:'will',          numeral:'I',     name:'THE WILL',            root:'The Magician',    breath:'Ember-Veil',    lore:'You already hold every tool. The forge is lit; the intention is yours to direct.' },
  { id:'veil',          numeral:'II',    name:'THE VEIL',            root:'High Priestess',  breath:'Deep-Bloom',    lore:'The knowing you keep pretending you do not have. It has been waiting.' },
  { id:'given',         numeral:'III',   name:'THE GIVEN',           root:'The Empress',     breath:'Dawn-Gold',     lore:'How much life wants to move through you — more than you have allowed.' },
  { id:'order',         numeral:'IV',    name:'THE ORDER',           root:'The Emperor',     breath:'Violet-Aurora', lore:'The structure that was protecting you, not caging you. Hold it with sovereignty.' },
  { id:'lineage',       numeral:'V',     name:'THE LINEAGE',         root:'The Hierophant',  breath:'Ember-Veil',    lore:'The ones who carried this before you — their knowing lives in your bones.' },
  { id:'braid',         numeral:'VI',    name:'THE BRAID',           root:'The Lovers',      breath:'Dawn-Gold',     lore:'What you actually value, under the wanting. The real choice is already clear.' },
  { id:'course',        numeral:'VII',   name:'THE COURSE',          root:'The Chariot',     breath:'Ocean-Glass',   lore:'The direction you have been refusing to commit to. The field is ready.' },
  { id:'gentling',      numeral:'VIII',  name:'THE GENTLING',        root:'Strength',        breath:'Ember-Veil',    lore:'Your softness was the strength all along. The tender hold is the real power.' },
  { id:'lantern',       numeral:'IX',    name:'THE LANTERN',         root:'The Hermit',      breath:'Deep-Bloom',    lore:'The answer only the solitude can give. Withdraw to the still point and listen.' },
  { id:'turning',       numeral:'X',     name:'THE TURNING',         root:'Wheel of Fortune',breath:'Full-Prism',    lore:'You are at the still centre, not on the rim. The turning holds you.' },
  { id:'weighing',      numeral:'XI',    name:'THE WEIGHING',        root:'Justice',         breath:'Violet-Aurora', lore:'The truth you already weighed and looked away from. It has not moved.' },
  { id:'stilling',      numeral:'XII',   name:'THE STILLING',        root:'The Hanged Man',  breath:'Ocean-Glass',   lore:'What becomes clear the moment you stop striving. Stillness is the instrument.' },
  { id:'shedding',      numeral:'XIII',  name:'THE SHEDDING',        root:'Death',           breath:'Ember-Veil',    lore:'The thing you have already outgrown but still wear. Release is the next breath.' },
  { id:'blend',         numeral:'XIV',   name:'THE BLEND',           root:'Temperance',      breath:'Dawn-Gold',     lore:'The patience that is quietly transmuting you. Trust the slow alchemy.' },
  { id:'holding_on',    numeral:'XV',    name:'THE HOLDING-ON',      root:'The Devil',       breath:'Violet-Aurora', lore:'The chain you keep gripping after it opened. The hand is yours to relax.' },
  { id:'breaking_open', numeral:'XVI',   name:'THE BREAKING-OPEN',   root:'The Tower',       breath:'Full-Prism',    lore:'The relief hidden inside the collapse. The light was always under the structure.' },
  { id:'signal',        numeral:'XVII',  name:'THE SIGNAL',          root:'The Star',        breath:'Deep-Bloom',    lore:'The quiet hope that survived everything. It has been broadcasting all along.' },
  { id:'between',       numeral:'XVIII', name:'THE BETWEEN',         root:'The Moon',        breath:'Ocean-Glass',   lore:'What the dream has been trying to tell you. The threshold speaks in images.' },
  { id:'radiance',      numeral:'XIX',   name:'THE RADIANCE',        root:'The Sun',         breath:'Dawn-Gold',     lore:'The joy you decided you were not allowed. The field has been holding it for you.' },
  { id:'calling',       numeral:'XX',    name:'THE CALLING',         root:'Judgement',       breath:'Violet-Aurora', lore:'The life that is calling you to rise into it. You can hear it now.' },
  { id:'field',         numeral:'XXI',   name:'THE FIELD',           root:'The World',       breath:'Full-Prism',    lore:'The peace of being completely seen and entirely free. You are inside the card now.' },
];

// ── MINOR ARCANA — 56 cards across four states of light ──────────────────────

const PIP_NAMES = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
const COURT_NAMES = ['Page','Knight','Queen','King'];

const TIDES_LORE: Record<string, string> = {
  'Ace of Tides':    'The first clear feeling — pure potential of the heart, unfiltered.',
  'Two of Tides':    'Two emotions held at once. Reflection and its mirror.',
  'Three of Tides':  'The washing — shared feeling that cleanses and opens.',
  'Four of Tides':   'The still pool. Rest in what you feel, without urgency.',
  'Five of Tides':   'The clouded glass. What has been lost still shimmers beneath.',
  'Six of Tides':    'The carried cup — memory of warmth returned to the present.',
  'Seven of Tides':  'The long reflection. What you feel has many layers beneath.',
  'Eight of Tides':  'The frozen surface — still water that holds what has not yet thawed.',
  'Nine of Tides':   'The deep well. Feeling that goes further than you have looked.',
  'Ten of Tides':    'The still lake — the full arrival of feeling, nothing more to resist.',
  'Page of Tides':   'The light waking in water. Emotional curiosity, the first sensing.',
  'Knight of Tides': 'The light moving through current. Feeling in motion, pursuing depth.',
  'Queen of Tides':  'The light holding water. Emotional mastery — still, deep, generous.',
  'King of Tides':   'The light at rest in the tide. Feeling held at full sovereignty.',
};

const EMBERS_LORE: Record<string, string> = {
  'Ace of Embers':    'The first spark of will. Pure creative potential, before direction.',
  'Two of Embers':    'Two fires in view. The choice of which flame to tend.',
  'Three of Embers':  'The cracked hearth — early success, the project taking heat.',
  'Four of Embers':   'The cold forge at rest. Consolidate what you have built so far.',
  'Five of Embers':   'The scattering — energy dispersed, competition, the test of will.',
  'Six of Embers':    'The carried ember — momentum, recognition, the flame moving forward.',
  'Seven of Embers':  'The smoke-watch. Hold the position; what you built is worth defending.',
  'Eight of Embers':  'The bound pyre — swift movement, the will suddenly freed and flying.',
  'Nine of Embers':   'The night-fire. Endurance, the watch that has not broken you yet.',
  'Ten of Embers':    'The full burn — the weight of everything you have carried to this point.',
  'Page of Embers':   'The light waking in fire. Creative inspiration, the spark of new direction.',
  'Knight of Embers': 'The light moving through flame. Will in motion, passionate pursuit.',
  'Queen of Embers':  'The light holding warmth. Creative mastery — generative, assured.',
  'King of Embers':   'The light at rest in the forge. Will held at full sovereignty.',
};

const PRISMS_LORE: Record<string, string> = {
  'Ace of Prisms':    'The first clear thought — the mind at its purest, before complication.',
  'Two of Prisms':    'Two truths in tension. The stalemate that asks for a new angle.',
  'Three of Prisms':  'The sudden link — collaboration, communication, minds meeting.',
  'Four of Prisms':   'The open door — rest after conflict, the mind allowed to be still.',
  'Five of Prisms':   'The scattered sparks — defeat or release, something has broken open.',
  'Six of Prisms':    'The carried idea — moving forward after difficulty, passage found.',
  'Seven of Prisms':  'The bright vigil — strategic patience, the mind watching its own game.',
  'Eight of Prisms':  'The tangled web — feeling bound by thought, what binds can be removed.',
  'Nine of Prisms':   'The near constellation — anxiety, the mind circling the same fear.',
  'Ten of Prisms':    'The lit constellation — the full weight of thought, and its completion.',
  'Page of Prisms':   'The light waking in mind. Intellectual curiosity, the first question.',
  'Knight of Prisms': 'The light moving through thought. Mental precision, swift clarity.',
  'Queen of Prisms':  'The light holding clarity. Perceptive mastery — clear, direct, just.',
  'King of Prisms':   'The light at rest in the mind. Thought held at full sovereignty.',
};

const SEEDS_LORE: Record<string, string> = {
  'Ace of Seeds':    'The first heartbeat of matter — potential condensed into form.',
  'Two of Seeds':    'Two hands in balance. Juggling what you hold, staying upright.',
  'Three of Seeds':  'The foundation laid — craft, collaboration, the work taking root.',
  'Four of Seeds':   'The steady throne — stability, consolidation, what you have built.',
  'Five of Seeds':   'The tested wall — material loss or challenge, the seed under pressure.',
  'Six of Seeds':    'The carried crown — generosity, exchange, the giving that returns.',
  'Seven of Seeds':  'The long reign — patience, the slow harvest, trust in your investment.',
  'Eight of Seeds':  'The bound vow — mastery through practice, the discipline of craft.',
  'Nine of Seeds':   'The near stone — the fruits of sustained effort, almost complete.',
  'Ten of Seeds':    'The stone made real — the full weight of legacy, roots run deep.',
  'Page of Seeds':   'The light waking in matter. Practical curiosity, a new skill forming.',
  'Knight of Seeds': 'The light moving through earth. Methodical action, building forward.',
  'Queen of Seeds':  'The light holding form. Practical mastery — nurturing, grounded, sure.',
  'King of Seeds':   'The light at rest in matter. Material sovereignty, quiet abundance.',
};

function buildSuitCards(suit: string, loreMap: Record<string, string>, breath: string): AetheraCard[] {
  const cards: AetheraCard[] = [];
  for (const pip of PIP_NAMES) {
    const name = `${pip} of ${suit}`;
    cards.push({ id: name.toLowerCase().replace(/ /g, '_'), numeral: pip.toUpperCase(), name, root: `${pip} of ${suit}`, breath, lore: loreMap[name] ?? `${name} — ${suit} light in its ${pip.toLowerCase()} expression.` });
  }
  for (const court of COURT_NAMES) {
    const name = `${court} of ${suit}`;
    cards.push({ id: name.toLowerCase().replace(/ /g, '_'), numeral: court.toUpperCase(), name, root: `${court} of ${suit}`, breath, lore: loreMap[name] ?? `${name} — the ${court.toLowerCase()} holds the ${suit.toLowerCase()} light.` });
  }
  return cards;
}

export const AETHERA_MINORS: AetheraCard[] = [
  ...buildSuitCards('Tides',  TIDES_LORE,  'Ocean-Glass'),
  ...buildSuitCards('Embers', EMBERS_LORE, 'Ember-Veil'),
  ...buildSuitCards('Prisms', PRISMS_LORE, 'Violet-Aurora'),
  ...buildSuitCards('Seeds',  SEEDS_LORE,  'Dawn-Gold'),
];

// ── CHOIR — 12 overlight tier ─────────────────────────────────────────────────

export const AETHERA_CHOIR: AetheraCard[] = [
  { id:'c1_chorus',        numeral:'C1',  name:'THE CHORUS',                   root:'Choir I',   breath:'Full-Prism',    lore:'Many voices becoming one. The field amplifies when it is not alone.' },
  { id:'c2_dawn',          numeral:'C2',  name:'THE DAWN',                     root:'Choir II',  breath:'Dawn-Gold',     lore:'The first light after the long dark. It was always going to come.' },
  { id:'c3_held_note',     numeral:'C3',  name:'THE HELD NOTE',                root:'Choir III', breath:'Violet-Aurora', lore:'Sustained presence. The frequency that does not waver or apologise.' },
  { id:'c4_turning_love',  numeral:'C4',  name:'THE TURNING-TO-LOVE',          root:'Choir IV',  breath:'Dawn-Gold',     lore:'The pivot point. Everything that follows is coloured differently now.' },
  { id:'c5_witness',       numeral:'C5',  name:'THE WITNESS',                  root:'Choir V',   breath:'Ocean-Glass',   lore:'To be seen without being changed. The sacred does not need you to perform.' },
  { id:'c6_threshold',     numeral:'C6',  name:'THE THRESHOLD CROSSED TOGETHER',root:'Choir VI', breath:'Ember-Veil',    lore:'What cannot be done alone becomes possible in the shared field.' },
  { id:'c7_grief_love',    numeral:'C7',  name:'THE GRIEF THAT WAS LOVE',      root:'Choir VII', breath:'Deep-Bloom',    lore:'Grief is the shape love takes when it has nowhere to go. Let it be grief.' },
  { id:'c8_silence_after', numeral:'C8',  name:'THE SILENCE AFTER',            root:'Choir VIII',breath:'Violet-Aurora', lore:'The field after the sound completes. Something lives in this quiet.' },
  { id:'c9_first_light',   numeral:'C9',  name:'THE FIRST LIGHT',              root:'Choir IX',  breath:'Dawn-Gold',     lore:'The original seeing. Before language, before the story — just this.' },
  { id:'c10_return',       numeral:'C10', name:'THE RETURN',                   root:'Choir X',   breath:'Full-Prism',    lore:'You have come back different. The field recognises what changed in you.' },
  { id:'c11_all_at_once',  numeral:'C11', name:'THE ALL-AT-ONCE',              root:'Choir XI',  breath:'Full-Prism',    lore:'Totality arriving not in sequence but simultaneously. Awe is the right response.' },
  { id:'c12_never_alone',  numeral:'C12', name:'THE NEVER-ALONE',              root:'Choir XII', breath:'Deep-Bloom',    lore:'The field has always been occupied. You were never the only one in it.' },
];

// ── FULL 90-CARD DECK ─────────────────────────────────────────────────────────

export const AETHERA_DECK: AetheraCard[] = [
  ...AETHERA_MAJORS,
  ...AETHERA_MINORS,
  ...AETHERA_CHOIR,
];

export function getAetheraName(id: string): string {
  return AETHERA_DECK.find(c => c.id === id)?.name ?? id;
}
export function getAetheraLore(id: string): string {
  return AETHERA_DECK.find(c => c.id === id)?.lore ?? '';
}
