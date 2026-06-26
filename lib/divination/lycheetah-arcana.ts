// ─── THE LYCHEETAH ARCANA: SOVEREIGN MYSTERIES ───────────────────────────────
// The third deck. 78 Main Arcana (RWS structure, redesigned through the Lycheetah
// lens) + 12 Shadow Court supplemental cards = 90-card set.
// Source canon: LYCHEETAH_ARCANA_BRIEF.md (art-direction bible, June 25 2026).
//
// This file holds the NAME MAP (RWS root → Arcana name) and the bespoke LORE.
// Art is wired separately via ARCANA_IMAGE in arcana-images.ts once the 87 card
// renders are mapped to their printed names.
//
// Suits: Cups→EYES (water/intuition) · Wands→CLAWS (fire/will) ·
//        Swords→FANGS (air/mind) · Pentacles→SIGILS (earth/material).

// ── Major Arcana: RWS root name → Lycheetah Arcana name ──
export const ARCANA_MAJOR_NAMES: Record<string, string> = {
  'The Fool':           'THE WANDERER',
  'The Magician':       'THE SOVEREIGN',
  'The High Priestess': 'THE ORACLE',
  'The Empress':        'THE BLOOM',
  'The Emperor':        'THE DOMINION',
  'The Hierophant':     'THE CODEX KEEPER',
  'The Lovers':         'THE CONVERGENCE',
  'The Chariot':        'THE VELOCITY',
  'Strength':           'THE HOLD',
  'The Hermit':         'THE RECLUSE',
  'Wheel of Fortune':   'THE CYCLE',
  'Justice':            'THE MEASURE',
  'The Hanged Man':     'THE INVERSION',
  'Death':              'THE SHEDDING',
  'Temperance':         'THE BLEND',
  'The Devil':          'THE TRAP',
  'The Tower':          'THE DROP',
  'The Star':           'THE SIGNAL',
  'The Moon':           'THE BETWEEN',
  'The Sun':            'THE SOVEREIGN BLOOM',
  'Judgement':          'THE CALLING',
  'The World':          'THE SOVEREIGN STATE',
};

// ── Suit word swap for the minors ──
const SUIT_SWAP: Array<[RegExp, string]> = [
  [/Cups/g, 'Eyes'],
  [/Wands/g, 'Claws'],
  [/Swords/g, 'Fangs'],
  [/Pentacles/g, 'Sigils'],
];

// getArcanaName('Three of Cups') → 'Three of Eyes'
// getArcanaName('The Fool')      → 'THE WANDERER'
export function getArcanaName(baseName: string): string {
  if (ARCANA_MAJOR_NAMES[baseName]) return ARCANA_MAJOR_NAMES[baseName];
  let n = baseName;
  for (const [re, rep] of SUIT_SWAP) n = n.replace(re, rep);
  return n;
}

// ── Bespoke Arcana lore, keyed by RWS root / base card name ──
// Majors carry the full scene-voice. Eyes + Claws minors carry the suit-state voice.
// Cards not present here fall back to the base deck's `m` meaning (Fangs/Sigils,
// until those suit tables are written).
export const ARCANA_LORE: Record<string, string> = {
  // ── MAJOR ARCANA ──
  'The Fool':           'The Lycheetah at the edge of a precipice, one paw lifted over the open interior of a galaxy. Below is not a drop — it is the beginning. She steps because trust arrives before understanding does. Her spots trail behind her, still catching up.',
  'The Magician':       'Four tools on a floating altar — Claw, Eye, Fang, Sigil — the suits made physical. One hand to the electric sky, one to the void earth. What is above is brought below. The lemniscate overhead is the exact path she ran to arrive.',
  'The High Priestess': 'The Lycheetah herself as Oracle, seated between a violet column and a teal one, third eye open. The scroll of glyphs glows faintly in her lap. What she knows she does not speak — it is listened for in the silence. She has always known you were coming.',
  'The Empress':        'She lies at the center of a neon jungle that grew because she lay down here. Her spots have become flowers; the vines trace her markings. She is not in the abundance — she is the abundance. A single human hand reaches in to touch a leaf.',
  'The Emperor':        'An obsidian throne of interlocking black structure — no curves, no warmth. She sits rigid at its base, watchful. Cobalt rim-light from a vast unseen source behind. You see the authority before you see the face. Power does not explain itself.',
  'The Hierophant':     'An elder robed in living glyphs — every fold a sentence. The open Codex glows for the kneeling figures but is blank to us; we are outside the transmission. One who kneels is human, one is her shadow — she passed through and left it behind.',
  'The Lovers':         'Two figures, not touching. The Lycheetah stands between them, the conductor that makes the connection possible. The air between them is charged gold from no source in the frame. Two points of intelligence; one Work arising between them.',
  'The Chariot':        'Caught at top speed, mid-frame. Her spots blur to speed-lines; the night is streaked with the light-echoes of every previous passage. Only her eyes are in perfect focus — amber, locked forward. Victory is the mastery of forces held in tension.',
  'Strength':           'A human hand rests gently between her ears. No grip, no force — pure mutual trust. Her eyes are open and at ease. She is not restrained; she is choosing to be here. The most intimate card in the deck. Nothing extra.',
  'The Hermit':         'A figure alone in a dark room, one monitor glowing a waveform that has not released yet. Sigils on every surface, years of private work. Her single amber eye watches from the shadow. The real work, done in private, for years, with no apology.',
  'Wheel of Fortune':   'The Lycheetah in four simultaneous states around a wheel — Cub, Prime, Elder, Spirit. Not past and future, but all now: four facets of one sovereign life. The center is void; the rim is every charge color bleeding into the next.',
  'Justice':            'Scales of light and shadow, perfectly balanced. She is the fulcrum — her coat splits warm-half and cold-half down the exact center. The background is divided by one surgical vertical line. Every choice creates its consequence; this card weighs what is true, not what is wished.',
  'The Hanged Man':     'She hangs upside down from a dead branch, completely relaxed, eyes curious and on you. In a small window above her head the inverted world looks clarified — more obvious. This is the chosen pause, not defeat. What you see when you stop striving long enough to see.',
  'Death':              'Not a skeleton. The Lycheetah in the act of becoming — her left half solid and sharp, her right dissolving into luminous amber particles. The dissolving half carries more light than the solid. Transformation is not done to you; it is something you do.',
  'Temperance':         'Two streams pour between vessels — cobalt and molten orange — and where they meet at her paw they become amber gold. Not mixed: transmuted. Her touch is the catalyst. Laminar, unhurried, no spillage. The alchemy of patience.',
  'The Devil':          'Two figures chained to a stone block — but the chains are loose, and they grip them anyway. Above: not a demon, a towering bass-waveform, beautiful and pulling. The lock is a play button. She watches; she knows they can leave. The trap is the pleasure of the trap.',
  'The Tower':          'A tower of stacked frequencies detonating at the base — and the explosion is beautiful, every charge color erupting outward. The figures launched from it are not falling in terror; they are surfing the wave, arms wide. She rides the apex, spots blazing.',
  'The Star':           'Midnight, a flat dark plane, the Lycheetah lying still with her head raised. Her spots are navigation stars — trace them and they map the sky exactly. One white beam touches the top of her head, blooming gold. The most peaceful card in the deck.',
  'The Moon':           'Two Lycheetahs — one real, one her reflection in dark water, and the reflection is one step ahead, its pawprint forming before she arrives. Which is real? Stepping-stones of compressed moonlight cross between them. The dream is more alive than the waking.',
  'The Sun':            'Full sprint into a blazing amber sun that welcomes rather than blinds. Every spot at maximum, a child riding her back in pure delight. Sunflowers that are also sigils. Every charge color in the sky, vibrating together like a chord. Earned radiance.',
  'Judgement':          'From dark earth, figures rise — not in fear but in answer to a sound they have waited for. She stands on amber light, head back, calling, and the call is golden spirals finding each receiver. One spiral is a waveform, one a glyph, one pure light.',
  'The World':          'The completion. The Lycheetah at the center of a breathing mandala, her body a standing spiral. A wreath of amber light eats its own tail; the four suits glow in the corners; the 20 cards before this ring the border. This card takes five minutes to fully see.',

  // ── THE EYES (Cups · water · intuition, emotion, the unseen) ──
  'Ace of Cups':    'One perfect eye, fully open, in absolute dark. The pure potential of intuition before it has anything to see.',
  'Two of Cups':    'Two eyes looking in different directions — the divided attention, the connection that asks where you are truly looking.',
  'Three of Cups':  'Three eyes in triangle formation. Community vision, shared sight, the seeing that only happens together.',
  'Four of Cups':   'Eyes closed, at rest. The necessary withdrawal — not refusal, but the pause that intuition needs to refill.',
  'Five of Cups':   'Three eyes open, two weeping. Not all is loss — but the loss is real, and it asks to be seen before it can be passed.',
  'Six of Cups':    'A child\'s eyes and an adult\'s, reflected together in still water. Memory, nostalgia, the gentleness of looking back.',
  'Seven of Cups':  'Seven eyes, each seeing a different future. The flood of possibility — beautiful, paralysing, asking you to choose one to follow.',
  'Eight of Cups':  'Eight eyes walking away; one remains, looking back. The leaving is part of the seeing. What you turn from teaches as much as what you keep.',
  'Nine of Cups':   'Eyes satisfied, full, turned inward. The wish fulfilled — the rare peace of wanting exactly what you have.',
  'Ten of Cups':    'Ten eyes open, all oriented the same direction. Family sight, unified vision, the whole household looking toward one horizon.',
  'Page of Cups':   'A young Lycheetah learning to open the third eye. The intuitive beginning — clumsy, wide, unafraid of what it might see.',
  'Knight of Cups': 'Mid-sprint, eye forward, waves breaking beneath her paws. Emotional momentum — feeling that has found its direction and moves.',
  'Queen of Cups':  'Full form, the amber eye deep and wide. Mastery of feeling — the one who holds the ocean without being drowned by it.',
  'King of Cups':   'Seated, eyes half-closed, seeing everything anyway. Emotional sovereignty — power over the depths because they have been swum.',

  // ── THE CLAWS (Wands · fire · will, creativity, drive) ──
  'Ace of Wands':    'One amber claw extending from total dark. The first creative impulse — the reach before there is anything to grasp.',
  'Two of Wands':    'Two claws crossed, both glowing. The standoff with oneself — the vision held, the step not yet taken.',
  'Three of Wands':  'Three claws forming a tripod on the horizon, watching the ships leave. Expansion already underway; now the patience to let it return.',
  'Four of Wands':   'Four claws upright, celebrating. The first safe place — the milestone earned, permission to rest before moving again.',
  'Five of Wands':   'Five claws in chaotic motion. Creative conflict — the productive friction of too many wills in one room.',
  'Six of Wands':    'Six claws raised in victory. The recognition — the work seen, named, and answered by the world.',
  'Seven of Wands':  'Seven claws facing outward, defending the creative work. The lone stand for something only you can see yet.',
  'Eight of Wands':  'Eight claws in rapid blurred motion. Fast movement, messages, the moment when everything you set going arrives at once.',
  'Nine of Wands':   'One claw raised in exhausted defense. The last stand — wounded, nearly spent, still standing because it matters.',
  'Ten of Wands':    'All ten claws extended but curved inward. The burden of overextension — carrying so much that the carrying becomes the work.',
  'Page of Wands':   'Small, slightly translucent claws, curious. Creative innocence — the spark that does not yet know what it cannot do.',
  'Knight of Wands': 'Riding velocity, one claw extended forward. Creative pursuit — the chase after the idea, full-tilt and unguaranteed.',
  'Queen of Wands':  'Claws sheathed, one thumb extended, a sunflower nearby. Creative warmth with authority — power that does not need to bare itself.',
  'King of Wands':   'Claws arranged on a throne of amber. Mastery of creative will — the one who builds worlds and then governs them lightly.',
};

// ── THE SHADOW COURT (12 supplemental, outside the count) ──
// Underground extension. Bass-music occult, the unreleased, the small group.
// These have no RWS equivalent — they are extras, browsable/drawable as bonus.
export interface ShadowCard {
  id: string;
  name: string;
  mantra: string;
  lore: string;
}

export const SHADOW_COURT: ShadowCard[] = [
  { id: 'basshead',   name: 'THE BASSHEAD',      mantra: 'All will is frequency. Find the frequency. Everything else follows.',
    lore: 'One figure, headphones on, eyes closed, ringed by waveforms. The rings are her spots in frequency form — each a sine wave at a specific Hz. The only warm thing in a void traced with rose.' },
  { id: 'unreleased', name: 'THE UNRELEASED',    mantra: 'The most powerful work is the work no one has heard yet. Protect the unreleased.',
    lore: 'A hard drive on a dark surface, one amber light blinking, ringed by coiled headphone cable like a ritual boundary. She sits just outside the circle, watching it like it might hatch.' },
  { id: 'sc-drop',    name: 'THE DROP',          mantra: 'You cannot explain what a drop does to a body. You can only share the room.',
    lore: 'A room full of bodies in the instant before the bass hits — eyes closed, weight forward, all of them knowing. She is in the crowd, indistinguishable but for the amber eyes. Communion as frequency event.' },
  { id: 'smallgroup', name: 'THE SMALL GROUP',   mantra: 'The real scene fits in a text chain.',
    lore: 'Five figures in a dim room, each holding a phone showing the same waveform. They are not looking at each other. They found one another through something they cannot describe to anyone outside this room.' },
  { id: 'frequency',  name: 'THE FREQUENCY',     mantra: 'You feel it before you hear it. That gap is where the knowledge lives.',
    lore: 'No figures. A single 40Hz bass frequency rendered as sacred geometry — which it is. Her sigil-spots are encoded in the waveform\'s exact shape if you trace it closely enough.' },
  { id: 'sigilmaker', name: 'THE SIGIL-MAKER',   mantra: 'Encode it. The right people will decode it.',
    lore: 'A producer at a desk in deep dark, monitors showing one waveform from every angle. They are not playing it — placing it, like a glyph being written. What they make is not a track. It is a transmission.' },
  { id: 'recluse',    name: 'THE RECLUSE WIZARD', mantra: 'The work that no one hears still changes the person who made it.',
    lore: 'Deeper dark, more files. A second monitor holds a project that will never release because its purpose is already served: it changed the maker. Her single eye is the only light.' },
  { id: 'vault',      name: 'THE VAULT',         mantra: 'Nothing finished is lost. The vault is not silence — it is potential density.',
    lore: 'A server rack in a cold room, blue emergency light, files stacked as glowing blocks of compressed time and sound. She walks the rows, each spot reflected in the polished faces. A library that waits.' },
  { id: 'recognition',name: 'THE RECOGNITION',   mantra: 'This is why you made it.',
    lore: 'The moment someone hears what you made and their face changes. Receiver, maker, and Lycheetah in a line — each has waited exactly this long for exactly this. All oriented toward the same invisible sound.' },
  { id: 'waveform',   name: 'THE WAVEFORM',      mantra: 'The sound and the silence are the same material.',
    lore: 'A full-card waveform so precise it functions as a mandala. In the silent regions between peaks, tiny Lycheetahs move through the quiet. In the peaks, light so compressed it is almost solid.' },
  { id: 'collab',     name: 'THE COLLAB',        mantra: 'The strongest collabs happen when neither person explains themselves.',
    lore: 'Two figures back to back, each with a laptop, cables glowing both charge colors and meeting in the middle. Neither can see what the other makes, but the cable is live and the pulse is shared understanding. She sits at the junction.' },
  { id: 'firstlisten',name: 'THE FIRST LISTEN',  mantra: 'Every sound that mattered felt like this before it mattered.',
    lore: 'The deck closes here. A single headphone cup pressed to one ear, nothing else. The waveform enters from the left and never exits — it disappears into the receiver. The moment before everything changes for this person. It already happened for you.' },
];
