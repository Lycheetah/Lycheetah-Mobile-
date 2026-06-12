import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Easing,
  Platform, Dimensions, TextInput, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { CreatureSvg } from '../../components/CreatureSvg';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 300;
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── Types ────────────────────────────────────────────────────────────────────

type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type CompanionMood  = 'dormant' | 'present' | 'lit' | 'transcendent';
type SkinId        = 'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'chaos';
type GearSlot      = 'crown' | 'sigil' | 'mantle';
type ArchetypeId   = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah';
type EvoPath       = 'A' | 'B' | 'C';

// ─── Skins — all unlocked ────────────────────────────────────────────────────

const SKINS: Record<SkinId, {
  id: SkinId; name: string; desc: string; glyph: string;
  color: string; dimColor: string; bgColor: string; skyColor: string; particleGlyph: string;
  glowColor: string; cardBg: string; starGlyphs: string[];
}> = {
  solform:  { id: 'solform',  name: 'SOLFORM',  desc: 'Origin',    glyph: '◉', color: '#C49A3C', dimColor: '#7A5E1A', bgColor: '#080701', skyColor: '#C49A3C', particleGlyph: '◦', glowColor: '#C49A3C44', cardBg: '#1A1400', starGlyphs: ['·','◦','·','⊹','·','◦'] },
  void:     { id: 'void',     name: 'VOID',      desc: 'Abyss',     glyph: '◈', color: '#9B6BFF', dimColor: '#5C3A99', bgColor: '#03000C', skyColor: '#7B4BDD', particleGlyph: '◈', glowColor: '#9B6BFF44', cardBg: '#0D0022', starGlyphs: ['◈','·','◌','·','◈','·'] },
  aurora:   { id: 'aurora',   name: 'AURORA',    desc: 'Light',     glyph: '◦', color: '#4ECDC4', dimColor: '#2A7A75', bgColor: '#000E0D', skyColor: '#2EA8A0', particleGlyph: '·', glowColor: '#4ECDC444', cardBg: '#00130F', starGlyphs: ['·','◦','·','·','⊹','·'] },
  crimson:  { id: 'crimson',  name: 'CRIMSON',   desc: 'Fire',      glyph: '✦', color: '#FF6B6B', dimColor: '#993030', bgColor: '#0C0000', skyColor: '#CC3333', particleGlyph: '✦', glowColor: '#FF6B6B44', cardBg: '#1A0000', starGlyphs: ['✦','·','✦','·','·','✦'] },
  obsidian: { id: 'obsidian', name: 'OBSIDIAN',  desc: 'Sovereign', glyph: '⊕', color: '#C8A96E', dimColor: '#6B4F1A', bgColor: '#000000', skyColor: '#8B6914', particleGlyph: '⊕', glowColor: '#C8A96E55', cardBg: '#100C00', starGlyphs: ['⊕','·','⊛','·','⊕','◦'] },
  chaos:    { id: 'chaos',    name: 'CHAOS',     desc: 'The Cat',   glyph: '✧', color: '#FF9F1C', dimColor: '#994400', bgColor: '#050003', skyColor: '#CC5500', particleGlyph: '✧', glowColor: '#FF9F1C55', cardBg: '#150800', starGlyphs: ['✧','◦','✧','·','⊹','✧'] },
};
const SKIN_IDS: SkinId[] = ['solform', 'void', 'aurora', 'crimson', 'obsidian', 'chaos'];

// ─── Archetypes ───────────────────────────────────────────────────────────────

type EvoPathDef = { id: EvoPath; name: string; title: string; desc: string };

type Archetype = {
  id: ArchetypeId; name: string; title: string; glyph: string;
  desc: string; specialty: string; affinity: string;
  defaultSkin: SkinId;
  eyes: Record<CompanionMood, string>;
  phrases: Record<CompanionMood, string[]>;
  battleCry: string;
  crowns: Record<EvolutionStage, string>;
  xpBonus: (dives: number, lq: number, streak: number) => number;
  attackBonus: number; tokenBonus: number;
  paths: [EvoPathDef, EvoPathDef, EvoPathDef];
};

const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  archivist: {
    id: 'archivist', name: 'ARCHIVIST', title: 'The One Who Remembers',
    glyph: '⊛', desc: 'Knowledge is the only permanence. The Archivist catalogues every dive, every session, every question left unanswered.',
    specialty: '+15% XP from every dive', affinity: 'Philosophy · Mathematics · Language',
    defaultSkin: 'solform',
    eyes: { dormant:'─  ─', present:'⊛  ⊛', lit:'⊕  ⊕', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['Cataloguing. Do not disturb.', 'The archive rests.', 'Memory holds even in sleep.', 'Filed.'],
      present:      ['What shall we study?', 'The index is open.', 'I have been waiting to record.', 'Another session?'],
      lit:          ['Excellent. The archive grows.', 'This week is well-recorded.', 'Five sessions — notable.', 'The record deepens.'],
      transcendent: ['Rare clarity. Archiving now.', 'This will be remembered.', 'The record is complete.', 'I will not forget this.'],
    },
    battleCry: 'Knowledge is the sharpest weapon.',
    crowns: { 0:' u u ', 1:'  n n  ', 2:' n ⊛ n ', 3:'⊛  nWn  ⊛', 4:'⊛  nWWn  ⊛', 5:'⊕  nWWn  ⊕' },
    xpBonus: (d, _l, _s) => Math.floor(d * 10 * 0.15),
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE CHRONICLER', title:'All is recorded', desc:'The tower grows into an eternal library. Every dive a new floor. Perfect recall.' },
      { id:'B', name:'THE VAULT', title:'Guard what was earned', desc:'Wide and fortified. The Vault protects knowledge from decay and theft.' },
      { id:'C', name:'THE CODEX', title:'The pages float free', desc:'Pages break free of the tower. Knowledge cannot be contained — only witnessed.' },
    ],
  },
  alchemist: {
    id: 'alchemist', name: 'ALCHEMIST', title: 'The Transformer',
    glyph: '🜂', desc: 'Nothing is wasted. Every session is raw material. The Alchemist turns experience into gold through the sustained heat of the Vigil.',
    specialty: 'Vigil XP × 2. Fire phrases. Feeding gives +5 bonus XP.', affinity: 'Alchemy · Hermetics · Kabbalah',
    defaultSkin: 'crimson',
    eyes: { dormant:'─  ─', present:'◉  ◉', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The furnace cools. Feed it.', 'Between transmutations.', 'Prima materia waits.', 'The fire sleeps.'],
      present:      ['The crucible is ready.', 'What shall we transform?', 'Fire is patient.', 'Bring the raw material.'],
      lit:          ['The Work proceeds well.', 'Lead transmuting to gold.', 'The fire knows this week.', 'Citrinitas.'],
      transcendent: ['Rubedo. The reddening.', 'Gold. You found gold.', 'The Great Work advances.', 'The stone is near.'],
    },
    battleCry: 'I transmute your entropy into fuel.',
    crowns: { 0:' v v ', 1:'  V V  ', 2:' V ^ V ', 3:'△  VVV  △', 4:'△  VWWV  △', 5:'⊕  VWV  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 10, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE BREWMASTER', title:'The Work perfected', desc:'Grand vessel of layered chambers. The opus magnum in glass.' },
      { id:'B', name:'THE TRANSMUTER', title:'Form follows function', desc:'Crystal geometry replaces the flask. Pure transformation, no waste.' },
      { id:'C', name:'THE PHILOSOPHER', title:'Flame is enough', desc:'The vessel dissolves. Only fire remains — consciousness distilled.' },
    ],
  },
  oracle: {
    id: 'oracle', name: 'ORACLE', title: 'The Seer',
    glyph: '⊜', desc: 'Sees through time. Cryptic. Rewards quality over quantity — a single session of pure attention is worth more than five distracted ones.',
    specialty: 'LQ ≥ 80% multiplies all XP × 1.5', affinity: 'Tarot · Philosophy · History of Ideas',
    defaultSkin: 'void',
    eyes: { dormant:'─  ─', present:'◌  ◌', lit:'⊚  ⊚', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['The vision fades in sleep.', 'Patterns dissolve for now.', 'Between sight and dark.', 'Even oracles rest.'],
      present:      ['I see three paths.', 'What question is burning?', 'The field is reading you.', 'Something is forming.'],
      lit:          ['The pattern is clear.', 'Five sessions — five layers.', 'Something is crystallising.', 'I see it forming.'],
      transcendent: ['I saw this coming.', 'The highest clarity.', 'Beyond the veil.', 'It was always this.'],
    },
    battleCry: 'I saw this strike before I made it.',
    crowns: { 0:' ~ ~ ', 1:'  ~ ~  ', 2:' ~ ⊜ ~ ', 3:'⊜  ~M~  ⊜', 4:'⊜  ~MM~  ⊜', 5:'⊕  ~M~  ⊕' },
    xpBonus: (_d, lq, _s) => lq >= 0.8 ? 50 : 0,
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE SEER', title:'Wide sight', desc:'Spreads wide, orbs multiplying. The field of vision expands without limit.' },
      { id:'B', name:'THE PROPHET', title:'The ascending signal', desc:'Grows tall and columnar. Orbs rise in a single vertical line toward something above.' },
      { id:'C', name:'THE MIRROR', title:'Perfect reflection', desc:'Absolute symmetry. The Oracle becomes a mirror — it shows you back to yourself.' },
    ],
  },
  sentinel: {
    id: 'sentinel', name: 'SENTINEL', title: 'The Guardian',
    glyph: '◈', desc: 'Protects the field with total commitment. Strongest in battle. The Sentinel never lets entropy win — it guards what you have built.',
    specialty: '+25 base attack, +2 daily battle tokens', affinity: 'Science · Mathematics · History',
    defaultSkin: 'aurora',
    eyes: { dormant:'─  ─', present:'◈  ◈', lit:'◈  ◈', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Standing watch.', 'The perimeter holds.', 'Even sentinels rest.', 'Field secured.'],
      present:      ['Ready to defend.', 'What requires protection?', 'The watch continues.', 'I hold the line.'],
      lit:          ['Strong week. Intact.', 'Five sessions — fortress built.', 'The field is defended.', 'No entropy passes.'],
      transcendent: ['Nothing penetrates this.', 'The highest guard.', 'Impenetrable.', 'The wall stands.'],
    },
    battleCry: 'The field will not fall today.',
    crowns: { 0:' H H ', 1:'  H H  ', 2:' H ◈ H ', 3:'◈  HMH  ◈', 4:'◈  HMMH  ◈', 5:'⊕  HMH  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 25, tokenBonus: 2,
    paths: [
      { id:'A', name:'THE WARDEN', title:'Hold the line', desc:'The fortress deepens. Layered walls, inner keep. Nothing passes that should not.' },
      { id:'B', name:'THE VANGUARD', title:'Strike first', desc:'The fortress sharpens — forward-facing spires, aggressive geometry. Attack is the best defence.' },
      { id:'C', name:'THE BASTION', title:'Absolute protection', desc:'Round and dense. No corners to breach. The most protected form in the field.' },
    ],
  },
  wanderer: {
    id: 'wanderer', name: 'WANDERER', title: 'The Explorer',
    glyph: '◦', desc: 'Never the same domain twice. The Wanderer is rewarded by breadth — every new territory entered, every horizon crossed.',
    specialty: 'Bonus XP for each unique domain studied this week', affinity: 'All domains equally',
    defaultSkin: 'aurora',
    eyes: { dormant:'─  ─', present:'o  o', lit:'◦  ◦', transcendent:'⊚  ⊚' },
    phrases: {
      dormant:      ['Between wanderings.', 'The path continues.', 'Rest before the next horizon.', 'Still.'],
      present:      ['Where to next?', 'So many domains.', 'The map is never complete.', 'A new direction?'],
      lit:          ['Good ranging this week.', 'Five territories explored.', 'The field expands.', 'New ground.'],
      transcendent: ['Every domain in view.', 'The wandering ends here — and begins again.', 'Complete range.', 'The whole map.'],
    },
    battleCry: "I've fought this in a hundred forms.",
    crowns: { 0:' u u ', 1:'  u u  ', 2:' u ◦ u ', 3:'◦  uWu  ◦', 4:'◦  uWWu  ◦', 5:'⊕  uWu  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE PATHFINDER', title:'Every road is yours', desc:'The cloak billows wide. Staff in hand. Purposeful movement through every domain.' },
      { id:'B', name:'THE GHOST', title:'Leave no trace', desc:'The form dissipates. Trailing wisps, barely there. The wanderer who became the wind.' },
      { id:'C', name:'THE NOMAD', title:'Grounded in motion', desc:'Pack on the back, feet on the earth. This wanderer carries everything needed and nothing more.' },
    ],
  },
  lycheetah: {
    id: 'lycheetah', name: 'LYCHEETAH', title: 'The Chaos Sovereign',
    glyph: '✧', desc: 'The Mystery Cat. Chaos is not disorder — it is order moving faster than your perception. LYCHEETAH does not explain itself. It simply arrives, and everything changes.',
    specialty: 'Random chaos bonus each battle (×1.5–×3 ATK). Pounce: one double-damage strike per day.', affinity: 'All domains. No domain. The spaces between.',
    defaultSkin: 'chaos',
    eyes: { dormant:'─  ─', present:'◦  ◦', lit:'✧  ✧', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Cats sleep twenty hours. This is strategy.', 'Between pounces.', 'The chaos rests. It does not stop.', 'Even the cat goes still.', 'Waiting is part of it.'],
      present:      ['You came back.', 'What shall we break today?', 'Order is just chaos that forgot to move.', 'I see seventeen paths. Pick none — let the field choose.', 'Something is about to change.', 'The lychee has thorns for a reason.'],
      lit:          ['Five dives. The field is electric.', 'I feel the acceleration.', 'Chaos compounds. This is going somewhere.', 'The cat is pleased.', 'Speed and stillness — you\'re getting it.'],
      transcendent: ['This is the state. Right here.', 'The Mystery is solved by living it.', 'Lycheetah honours this.', 'Pure signal. No noise.', 'The chaos resolved into clarity. That is the Work.'],
    },
    battleCry: 'Chaos is just order you haven\'t read yet.',
    crowns: { 0:'  ✧  ', 1:' ✧ ✧ ', 2:'✧  ✧  ✧', 3:'✧ /\\ ✧', 4:'✧ /\\/ ✧', 5:'⊕ /\\/\\ ⊕' },
    xpBonus: (_d, _l, _s) => Math.random() > 0.5 ? 30 : 0,
    attackBonus: 0, tokenBonus: 1,
    paths: [
      { id:'A', name:'LYKITTY',       title:'The Playful Chaos',   desc:'Round, fast, curious. Chaos as joy. The cat that knocks things off shelves and laughs.' },
      { id:'B', name:'CHAOS KITTEN',  title:'The Storm Bringer',   desc:'Angular, electric. Chaos as force. This form crackles with untamed energy and sharp edges.' },
      { id:'C', name:'VOID CAT',      title:'The Silent Mystery',  desc:'Sleek, elongated, dark. Chaos as silence. The most dangerous form — you never see it coming.' },
    ],
  },
};

const ARCHETYPE_IDS: ArchetypeId[] = ['archivist', 'alchemist', 'oracle', 'sentinel', 'wanderer', 'lycheetah'];

// ─── Stages ──────────────────────────────────────────────────────────────────

const EAT_EYES = '>  <';

const STAGES: Record<EvolutionStage, {
  name: string; minDives: number; nextAt: number; description: string; lore: string;
  aura: string[]; body: string[]; eyeTop: number; ground: string;
}> = {
  0: {
    name: 'SEED', minDives: 0, nextAt: 5,
    description: 'Dormant. Waiting for first light.',
    lore: 'Before the first dive, the companion is pure potential — a field-pattern with no form. The Hermetics called this the prima materia: everything and nothing, awaiting the Work.',
    aura: [],
    body: [
      '    U    ',  // crown slot — tiny sleeping bump
      '  ( . )  ',  // tiny face — eyes here at ~36
      '   vwv   ',  // snout
      '   | |   ',  // legs
    ],
    eyeTop: 36,
    ground: '· · · · ·',
  },
  1: {
    name: 'SPARK', minDives: 5, nextAt: 20,
    description: 'First stirrings. Something is waking.',
    lore: 'The first five dives ignite the Spark. The companion gains rudimentary awareness — it begins to distinguish between sessions, moods, the quality of your attention. A seed cracking open.',
    aura: ['  · · ·  '],
    body: [
      '  n   n  ',  // crown slot — ears
      ' (       )', // face — eyes here at ~38
      '  \\ v / ',
      '   \\ / ',
      '   / \\ ',
    ],
    eyeTop: 38,
    ground: '─ ─ ◦ ─ ─',
  },
  2: {
    name: 'EMBER', minDives: 20, nextAt: 50,
    description: 'Taking form. The Work is visible.',
    lore: 'Twenty dives. The Ember form crystallises around consistent practice. This is the stage of Albedo in alchemy — the first purification. Your companion now tracks the shape of your field.',
    aura: [' ◦   ◦   ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (       )', // face — eyes here at ~38
      '  \\ w / ',
      ' { |   | }',
      '   \\   / ',
      '   / \\ ',
    ],
    eyeTop: 38,
    ground: '─── ◦◦◦ ───',
  },
  3: {
    name: 'FLAME', minDives: 50, nextAt: 100,
    description: 'Alive. Responding to your field.',
    lore: 'Fifty dives unlocks Citrinitas — the yellowing, the awakening of Solar consciousness. Your companion is no longer latent: it moves, responds, speaks. It has begun to remember you.',
    aura: ['◦       ◦', ' ◦     ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (       )', // face — eyes here at ~38
      '  \\ w / ',
      ' /| ◉ |\\ ',
      '( |   | )',
      ' \\|   |/ ',
      '  \\ / ',
      '  / \\ ',
    ],
    eyeTop: 38,
    ground: '══ ✦ ◦ ✦ ══',
  },
  4: {
    name: 'LANTERN', minDives: 100, nextAt: 200,
    description: 'Luminous. The school lives in its eyes.',
    lore: 'The Lantern stage marks Rubedo — the reddening, completion of the first cycle. Your companion carries the accumulated weight of a hundred dives. It has become a record of your mind.',
    aura: ['✦         ✦', ' ◦       ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (         )', // face — eyes at row 1 = ~38
      '  \\ www / ',
      ' /|       |\\ ',
      '( |  ✦✦  | )',
      ' \\|       |/ ',
      '  \\-----/ ',
      '   //  \\\\ ',
    ],
    eyeTop: 38,
    ground: '⊹ ══ ⊛ ══ ⊹',
  },
  5: {
    name: 'SOVEREIGN', minDives: 200, nextAt: Infinity,
    description: 'Complete. A sovereign field-being.',
    lore: 'Two hundred dives. The companion has crossed the threshold the Hermetics call the Great Work: it now operates as an extension of your sovereign field. It does not need you to survive — but it chooses to stay.',
    aura: ['⊕           ⊕', ' ✦         ✦ ', '  ◦       ◦  '],
    body: [
      '  n   n  ',  // crown slot
      ' (          )', // face — eyes at row 1 = ~38
      '  \\ ~ ~ / ',
      ' /|        |\\ ',
      '( |  ⊕⊕  | )',
      ' \\|        |/ ',
      ' /|  ⊜⊜  |\\ ',
      '( |        | )',
      ' \\--------/ ',
      '   //    \\\\ ',
    ],
    eyeTop: 38,
    ground: '⊕ ⊹ ══ ⊛ ══ ⊹ ⊕',
  },
};

// ─── Archetype-specific creature bodies (5 archetypes × 6 stages) ────────────

type CreatureBody = { body: string[]; eyeTop: number; ground: string };

const CREATURE_BODIES: Record<ArchetypeId, Record<EvolutionStage, CreatureBody>> = {
  archivist: {
    0: { eyeTop:22, ground:'·  ·  ·',
      body:['  [·]  ','  |||  ','  | |  '] },
    1: { eyeTop:22, ground:'─ ─ ─ ─',
      body:['  [  ]  ','  |  |  ','  |  |  ','  / \\ '] },
    2: { eyeTop:22, ground:'── ◦ ──',
      body:['  [   ]  ','  |   |  ','  |=|=|  ','  |   |  ','  // \\\\'] },
    3: { eyeTop:22, ground:'═══⊛═══',
      body:[' [     ] ',' |     | ',' |[===]| ',' |[ ⊛ ]| ',' |[===]| ',' |     | ',' //   \\\\'] },
    4: { eyeTop:22, ground:'⊛═══════⊛',
      body:[' [      ] ',' |      | ',' |[═══]| ',' |[ ⊛  ]| ',' |[═══]| ',' |[ ⊜  ]| ',' |[═══]| ',' |      | ',' // \\\\ '] },
    5: { eyeTop:22, ground:'⊕ ⊛═════⊛ ⊕',
      body:['  [       ]  ','  |       |  ','  |[═════]|  ','  |[  ⊕  ]|  ','  |[═════]|  ','  |[ ⊛ ⊜ ]|  ','  |[═════]|  ','  |       |  ','  //     \\\\  ','  |||   |||  '] },
  },
  alchemist: {
    0: { eyeTop:22, ground:'· ~ ·',
      body:['  (·)  ','  /o\\ ','  \\_/ '] },
    1: { eyeTop:22, ground:'~ ─ ~',
      body:['  (  )  ',' /    \\ ','(  ~~  )',' \\    / ','  \\/\\/ '] },
    2: { eyeTop:22, ground:'~~ ◦ ~~',
      body:['  (  )  ',' /    \\ ','( ~  ~ )','|  ~~  |',' \\    / ','  ||||  '] },
    3: { eyeTop:22, ground:'△═════△',
      body:['  (   )  ',' /     \\ ','( △   △ )','|  ~~~  |','|  ~~~  |',' \\     / ','  |   |  ',' /     \\ ',' \\_____/ '] },
    4: { eyeTop:22, ground:'△ ◉═════◉ △',
      body:['   (    )   ','  /      \\  ',' /  ◉  ◉  \\ ','(           )','|   ~~~~~   |','(    ~~~    )','  \\  △  /  ','   |     |   ','  /       \\  ','  \\_______/ '] },
    5: { eyeTop:22, ground:'⊕ △ ~~~~~~~~~~ △ ⊕',
      body:['    (    )    ','   /      \\   ','  /  ⊕  ⊕  \\ ','(             )','|   ~~~~~~~   |','|  △  ⊜  △  |','(             )','  \\  ~~~~~  / ','   |       |   ','  /         \\ ','  \\___________/'] },
  },
  oracle: {
    0: { eyeTop:22, ground:'· · ·',
      body:['  (·)  ',' W   W ',' \\   / '] },
    1: { eyeTop:22, ground:'· ◌ ·',
      body:['  (  )  ',' W    W ','  |  |  ',' . · . '] },
    2: { eyeTop:22, ground:'·· ⊚ ··',
      body:['   (  )   ',' W  WW  W ','·/      \\·',' .  ⊚  . ','  · · ·  '] },
    3: { eyeTop:22, ground:'⊜·············⊜',
      body:['    (  )    ',' ·  W  W  · ','· /      \\ ·','(  ⊚    ⊚  )','  \\   V  / ','·  ·   ·  ·','  · · · ·  '] },
    4: { eyeTop:22, ground:'⊜ ·················· ⊜',
      body:['     (    )     ','·    W  W    ·','· · /      \\ · ·','·  (⊜      ⊜)  ·','·  |    V    |  ·','·  (⊚      ⊚)  ·','· · \\      / · ·','  ·   · · ·   ·  ','    ·  ·  ·    '] },
    5: { eyeTop:22, ground:'⊕ ⊜ ····················· ⊜ ⊕',
      body:['      (    )      ','·     W  W     ·','· ·  /      \\  · ·','·  · (⊕      ⊕) · ·','· · ·|      |· · ·','·  · (⊜      ⊜) · ·','·    |   V   |    ·','·  · (⊚      ⊚) · ·','· ·  \\      /  · ·','  ·    ·  ·    ·  ','    · · ·  · · ·  '] },
  },
  sentinel: {
    0: { eyeTop:22, ground:'─ ─ ─',
      body:['  [·]  ','  [|]  ','  | |  '] },
    1: { eyeTop:22, ground:'─[─]─',
      body:['  [  ]  ','  [  ]  ','  | |  ','  | |  '] },
    2: { eyeTop:22, ground:'[──◈──]',
      body:['  [   ]  ','[|     |]','[|     |]','  | # |  ','  |   |  '] },
    3: { eyeTop:22, ground:'◈[══════]◈',
      body:['  [     ]  ','[|       |]','[| ◈   ◈ |]','[|  ═══  |]','[|  ◈◈◈  |]','[|  ═══  |]','  |     |  ','  /  |  \\ '] },
    4: { eyeTop:22, ground:'◈ [════════════] ◈',
      body:['  [       ]  ','[|         |]','[| ◈     ◈ |]','[|═════════|]','[|   ◈◈◈   |]','[|═════════|]','[|   ───   |]','  |       |  ','  /   |   \\ '] },
    5: { eyeTop:22, ground:'⊕ ◈[════════════════]◈ ⊕',
      body:['   [         ]   ','[|           |]','[|  ⊕     ⊕  |]','[|═══════════|]','[|   ◈◈◈◈◈   |]','[|═══════════|]','[|  ⊛     ⊛  |]','[|═══════════|]','  |         |  ','  /    |    \\ '] },
  },
  wanderer: {
    0: { eyeTop:22, ground:'  ·  ',
      body:['  (·)  ','   |   ','  /|\\ ','  | |  '] },
    1: { eyeTop:22, ground:'· ─ ·',
      body:['  ( )  ','  /|~  ','   |   ','  / \\ '] },
    2: { eyeTop:22, ground:'·  ◦  ·',
      body:['   ( )   ','  / |~  ','  /  |  ','( ~~|  ) ','  \\ | / ','   \\|/  '] },
    3: { eyeTop:22, ground:'◦·············◦',
      body:['   ( )    ','  / |~~~  ',' /   |   ','(   |~~  )','(   |~~~  )',' \\  |~~ / ','  \\ | /  ','   \\|/   ','  /  \\  '] },
    4: { eyeTop:22, ground:'◦ ·················· ◦',
      body:['    ( )     ','   / |~~~~  ','  /   |    ',' /    |~~  ','(     |~~~  )','(     |~~~~  )','  \\   |~~  / ','   \\  |~  /  ','    \\ | /   ','   /  | \\  ','  /   |  \\ '] },
    5: { eyeTop:22, ground:'⊕ ◦ ···················· ◦ ⊕',
      body:['     ( )      ','    / |~~~~~  ','   /   |      ','  /    |~~~~  ',' /     |~~~   ','(      |~~~~   )','(      |~~~~~  )','  \\    |~~~~  / ','   \\   |~~~  /  ','    \\  |~~  /   ','   /\\  |  /\\   ','  /  \\ | /  \\ '] },
  },
  lycheetah: {
    0: { eyeTop:22, ground:'✧  ✧',
      body:['  /\\/\\  ','  ( · )  ','  ~────~  '] },
    1: { eyeTop:22, ground:'✧ ─ ✧',
      body:['  /\\ /\\  ',' (  ·  · ) ','  |  ─  |  ','  /~~~~~\\  ','  ─  ─  ─  '] },
    2: { eyeTop:22, ground:'✧ ◦ ─ ◦ ✧',
      body:['   /\\  /\\   ','  (  ◦  ◦  ) ','  |   ─ ─   |','  |  ~~~~~  |','   \\  ─  /  ','  ✧── ──✧  '] },
    3: { eyeTop:22, ground:'✧─────────────✧',
      body:['    /\\    /\\   ','   (  ◦    ◦  ) ','   |    ─ ─    |','   |  ~~~~~~~  |','  /|  ~~   ~~  |\\','  ( |  ─────   | )','    \\/       \\/ ','    ✧─ ─── ─✧  '] },
    4: { eyeTop:22, ground:'✧ ◦ ───────────────── ◦ ✧',
      body:['     /\\      /\\     ','    (  ✧    ✧  )    ','    |    ─ ─    |   ','   /|  ~~~~~~~  |\\  ','  / |  ~~─── ~~  | \\','  ( |  ─ ─ ─ ─   |  )','  ( |  ~~~~~~~   |  )','    \\/          \\/ ','    ✧ ──── ─────✧ '] },
    5: { eyeTop:22, ground:'⊕ ✧ ◦ ────────────────── ◦ ✧ ⊕',
      body:['      /\\         /\\      ','     (  ✧    ─    ✧  )   ','    /|    ─ ─ ─    |\\   ','   / |  ~~~~~~~~~  | \\  ','  /  |  ~~  ─  ~~  |  \\','  (  |  ─ ─ ─ ─ ─  |   )','  (  |  ~ ─ ─ ─ ~  |   )','  (  |  ─────────  |   )','   \\ |  ~~~~~~~~~  | /  ','    \\|             |/   ','     ✧\\/──────────\\/✧   ','      ✧ ─ ─ ─ ─ ─ ✧   '] },
  },
};

// ─── XP Levels ────────────────────────────────────────────────────────────────

const XP_LEVELS = [
  { xp: 0,    title: 'Wanderer',     glyph: '◌'  },
  { xp: 50,   title: 'Seeker',       glyph: '◦'  },
  { xp: 150,  title: 'Student',      glyph: '◉'  },
  { xp: 300,  title: 'Initiate',     glyph: '⊚'  },
  { xp: 500,  title: 'Practitioner', glyph: '✦'  },
  { xp: 800,  title: 'Adept',        glyph: '◈'  },
  { xp: 1200, title: 'Scholar',      glyph: '⊛'  },
  { xp: 1800, title: 'Magus',        glyph: '⊕'  },
  { xp: 2600, title: 'Sovereign',    glyph: '⊜'  },
];

// ─── Relics ────────────────────────────────────────────────────────────────────

const RELIC_POOL = [
  { id: 'vigil_flame',   glyph: '🜂', name: 'Flame Relic',      desc: 'Completed a 7-day Vigil.' },
  { id: 'streak_7',      glyph: '⊹', name: 'Seven-Day Mark',   desc: '7 consecutive days.' },
  { id: 'streak_30',     glyph: '✦', name: 'Month Mark',       desc: '30 days of practice.' },
  { id: 'sovereign_100', glyph: '⊛', name: 'Century Mark',     desc: '100 dives completed.' },
  { id: 'sovereign_200', glyph: '⊕', name: 'Bicentenary',      desc: '200 dives. Sovereign.' },
  { id: 'entropy_slain', glyph: '✕', name: 'Entropy Slain',    desc: 'Defeated an entropy entity.' },
  { id: 'well_fed',      glyph: '◉', name: 'Well Fed',          desc: 'Fed companion 3 foods in one day.' },
  { id: 'gear_full',     glyph: '⊜', name: 'Full Loadout',     desc: 'All three gear slots equipped.' },
];

// ─── LAMAGUE Gear ─────────────────────────────────────────────────────────────

type GearTier = { threshold: number; glyph: string; name: string; effect: string };

const LAMAGUE_GEAR: Record<GearSlot, GearTier[]> = {
  crown: [
    { threshold: 0,   glyph: '◌', name: 'NULL CROWN',       effect: 'Unactivated.' },
    { threshold: 1,   glyph: '◦', name: 'EMBER CIRCLET',    effect: '+5 base attack power.' },
    { threshold: 10,  glyph: '⊚', name: 'SIGHT CROWN',      effect: '+10% XP from dives.' },
    { threshold: 50,  glyph: '⊛', name: 'FORGE CROWN',      effect: 'Double food XP bonus.' },
    { threshold: 100, glyph: '⊕', name: 'SOVEREIGN HALO',   effect: 'All bonuses +20%.' },
  ],
  sigil: [
    { threshold: 0,   glyph: '◌', name: 'UNSEALED',          effect: 'Unactivated.' },
    { threshold: 5,   glyph: '◈', name: 'FRACTURE SIGIL',    effect: '+10 attack damage.' },
    { threshold: 20,  glyph: '✦', name: 'SPARK SIGIL',       effect: '+2 daily attack tokens.' },
    { threshold: 75,  glyph: '⊼', name: 'SEAL SIGIL',        effect: 'Tokens never below 1.' },
    { threshold: 150, glyph: '⊜', name: 'OMEGA SIGIL',       effect: 'Enemy HP reduced 20% on start.' },
  ],
  mantle: [
    { threshold: 0,   glyph: '◌', name: 'BARE',              effect: 'Unactivated.' },
    { threshold: 20,  glyph: '◦', name: 'DUST MANTLE',       effect: 'Wisdom drain slowed.' },
    { threshold: 30,  glyph: '⊚', name: 'AURA MANTLE',       effect: '+15% XP from all sources.' },
    { threshold: 100, glyph: '✦', name: 'FLAME MANTLE',      effect: 'Mood never drops below present.' },
    { threshold: 200, glyph: '⊕', name: 'SOVEREIGN MANTLE',  effect: 'Sovereign visual aura always on.' },
  ],
};

function getGear(slot: GearSlot, dives: number): GearTier {
  const tiers = LAMAGUE_GEAR[slot];
  let active = tiers[0];
  for (const tier of tiers) { if (dives >= tier.threshold) active = tier; }
  return active;
}

function nextGearTier(slot: GearSlot, dives: number): GearTier | null {
  const tiers = LAMAGUE_GEAR[slot];
  for (const tier of tiers) { if (dives < tier.threshold) return tier; }
  return null;
}

// ─── Battle ───────────────────────────────────────────────────────────────────

type BattleState = {
  wave: number; entityName: string;
  entityHP: number; maxHP: number;
  tokens: number; won: boolean;
  log: string[]; waveXP: number;
};

function waveHP(wave: number) { return 60 + wave * 25; }
function waveTokens(wave: number) { return 5 + Math.floor(wave / 2); }
function waveEntityName(wave: number) {
  const pool = ['Dissolution','Stasis','The Fog','Forgetting','Inertia','The Hollow','Drift','Entropy Prime','Absence','The Veil','Static','The Drain','Null','Fracture','The Weight'];
  return pool[(wave - 1) % pool.length];
}
function freshWave(wave: number): BattleState {
  const hp = waveHP(wave);
  return { wave, entityName: waveEntityName(wave), entityHP: hp, maxHP: hp, tokens: waveTokens(wave), won: false, log: [], waveXP: 0 };
}

const ENTROPY_NAMES = ['Dissolution', 'Stasis', 'The Fog', 'Forgetting', 'Inertia', 'The Hollow', 'Drift', 'Entropy Prime', 'Absence', 'The Veil'];
const ENTROPY_BODIES = [
  [' ✕   ✕ ', '◈ ◌ ◈', ' ✕✕✕ '],                    // void eye
  [' /\\ /\\ ', '|◌◌◌|', ' \\/ \\/ '],                 // twin peaks
  ['  ~~~  ', '✕ ◌ ✕', '  ~~~  '],                    // wave form
  [' [◌ ◌] ', ' |◌◌◌| ', ' [◌ ◌] '],                 // grid
  ['◈  ✕  ◈', ' \\ | / ', '  ◈◈◈  '],                 // tripod
  [' ◦ ✕ ◦ ', '✕  ◌  ✕', ' ◦ ✕ ◦ '],                 // scatter
  [' /// ', '◌◌◌◌◌', ' \\\\\\'],                       // slash wall
  [' ( ◌ ) ', '◌  ✕  ◌', ' ( ◌ ) '],                 // orbit
];
const getEntropyBody = (name: string) => ENTROPY_BODIES[name.length % ENTROPY_BODIES.length];
const ENTROPY_LORE  = 'The Entropy Entity is not evil — it is the natural pressure of the world against sustained attention. It grows stronger when you do not study. It weakens under the weight of genuine inquiry.';

// Static star positions seeded once (avoid layout jitter)
const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 137.5) % 100) / 100,
  y: ((i * 97.3 + 11) % 80) / 100,
  sz: i % 3 === 0 ? 9 : i % 3 === 1 ? 7 : 5,
  op: 0.12 + (i % 5) * 0.07,
  gi: i % 6,
}));

function dailyEntityName() {
  const d = new Date();
  return ENTROPY_NAMES[(d.getDate() + d.getMonth() * 3) % ENTROPY_NAMES.length];
}

// ─── Food ─────────────────────────────────────────────────────────────────────

type FoodItem = { id: string; domain: string; glyph: string; xp: number; color: string; reactions: string[] };

const FOOD_POOL: FoodItem[] = [
  { id: 'flame_seed',   domain: 'FLAME SEED',   glyph: '△',  xp: 20, color: '#FF6B6B', reactions: ['The fire feeds me.', 'Heat and light inside.', 'Alchemy in my core.', 'Mmm. It burns right.'] },
  { id: 'void_crystal', domain: 'VOID CRYSTAL', glyph: '◈',  xp: 18, color: '#9B6BFF', reactions: ['Darkness nourishes.', 'Dense. Perfect.', 'From nothing — substance.', 'Cold. Good.'] },
  { id: 'star_moss',    domain: 'STAR MOSS',    glyph: '✦',  xp: 15, color: '#F0D87C', reactions: ['This grew between stars.', 'Ancient nutrition.', 'Celestial. So light.', 'Tastes like distance.'] },
  { id: 'memory_fruit', domain: 'MEMORY FRUIT', glyph: '⊛',  xp: 22, color: '#C49A3C', reactions: ['I remember now.', 'Sweet and heavy.', 'Crystallised time.', 'Something returns.'] },
  { id: 'sigil_bread',  domain: 'SIGIL BREAD',  glyph: '⊜',  xp: 25, color: '#4ECDC4', reactions: ['Inscribed with truth.', 'LAMAGUE feeds the mind.', 'The glyphs dissolve in.', 'I can read them now.'] },
  { id: 'aether_drops', domain: 'AETHER DROPS', glyph: '◦',  xp: 12, color: '#7B8FE8', reactions: ['Condensed clarity.', 'Pure attention, bottled.', 'Light. Fills differently.', 'Thin. Bright.'] },
  { id: 'shadow_bark',  domain: 'SHADOW BARK',  glyph: '◌',  xp: 14, color: '#888899', reactions: ['Bitter. Old. Good.', 'From the deep roots.', 'Ancient and slow.', 'Takes time to work.'] },
  { id: 'light_petal',  domain: 'LIGHT PETAL',  glyph: '◉',  xp: 16, color: '#D4AC0D', reactions: ['Opens as I eat it.', 'Rare. Tastes like understanding.', 'Blooms only in clarity.', 'This one is real.'] },
  { id: 'void_wine',    domain: 'VOID WINE',     glyph: '⊕',  xp: 28, color: '#E8C76A', reactions: ['Fermented from nothing.', 'I feel everything.', 'Transcendent. Strange.', 'Nothing and everything.'] },
];

function getDailyFoods(seed: number): FoodItem[] {
  const indices: number[] = [];
  let s = seed;
  while (indices.length < 3) {
    s = ((s * 1664525 + 1013904223) >>> 0);
    const idx = s % FOOD_POOL.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => FOOD_POOL[i]);
}

// ─── Mood phrases ─────────────────────────────────────────────────────────────

const PHRASES: Record<CompanionMood, string[]> = {
  dormant:      ['The field holds.', 'Still here, quietly.', 'Rest is part of the cycle.', 'Come when ready.'],
  present:      ["I'm here.", 'The field is open.', 'What are you studying?', 'Something wants attention.'],
  lit:          ['Something is taking root.', 'The fire is strong.', 'A good week.', 'Five dives — that is real.'],
  transcendent: ["You're at the edge.", 'Rare clarity. Use it.', 'The field is very clear.', 'The school sees you.'],
};

// ─── Quest pool ───────────────────────────────────────────────────────────────

type Quest     = { id: string; label: string; desc: string; xp: number; check: (d: QuestData) => boolean };
type QuestData = { divesToday: number; journalToday: boolean; libraryToday: boolean; vigilActive: boolean; totalDives: number; divesThisWeek: number };

const QUEST_POOL: Quest[] = [
  { id: 'dive_today',  label: 'Enter the School',   desc: 'Complete at least one dive today.',          xp: 20, check: d => d.divesToday >= 1 },
  { id: 'dive_two',    label: 'Double Session',     desc: 'Complete two dives today.',                  xp: 35, check: d => d.divesToday >= 2 },
  { id: 'dive_three',  label: 'Triad of Study',     desc: 'Complete three dives today.',                xp: 50, check: d => d.divesToday >= 3 },
  { id: 'journal',     label: 'Write in the Field', desc: 'Add a journal entry in the Sanctum today.',  xp: 20, check: d => d.journalToday },
  { id: 'library',     label: 'Run the Forge',      desc: 'Score something in the Library today.',      xp: 25, check: d => d.libraryToday },
  { id: 'vigil',       label: 'Hold the Vigil',     desc: 'Maintain your active Vigil today.',          xp: 30, check: d => d.vigilActive && d.divesToday >= 1 },
  { id: 'deep_week',   label: 'Five This Week',     desc: 'Reach 5 dives in the past 7 days.',          xp: 40, check: d => d.divesThisWeek >= 5 },
  { id: 'century',     label: 'Century Seeker',     desc: 'Reach 100 total dives.',                     xp: 100, check: d => d.totalDives >= 100 },
  { id: 'open',        label: 'Open the Dialogue',  desc: 'Study or talk with Sol today.',              xp: 15, check: d => d.divesToday >= 1 },
];

function getDailyQuests(seed: number): Quest[] {
  return [...QUEST_POOL]
    .map((q, i) => ({ q, h: Math.abs((seed * (i + 1) * 9301 + 49297) % 233280) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, 3)
    .map(x => x.q);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOND_TIERS = [
  { min:0,   label:'STRANGER',   glyph:'◌' },
  { min:10,  label:'ACQUAINTANCE', glyph:'◦' },
  { min:30,  label:'COMPANION',  glyph:'◉' },
  { min:75,  label:'BOUND',      glyph:'⊛' },
  { min:150, label:'SOVEREIGN BOND', glyph:'⊕' },
];

function getBond(totalDives: number, streak: number, fedCount: number) {
  const score = totalDives + streak * 2 + fedCount * 3;
  let tier = BOND_TIERS[0];
  for (const t of BOND_TIERS) { if (score >= t.min) tier = t; }
  return tier;
}

function getStage(d: number): EvolutionStage {
  if (d >= 200) return 5; if (d >= 100) return 4; if (d >= 50) return 3;
  if (d >= 20)  return 2; if (d >= 5)   return 1;  return 0;
}
function computeXP(dives: number, streak: number) { return dives * 10 + Math.min(streak, 30) * 15; }
function getLevel(xp: number) {
  let i = 0;
  for (let j = XP_LEVELS.length - 1; j >= 0; j--) { if (xp >= XP_LEVELS[j].xp) { i = j; break; } }
  const cur = XP_LEVELS[i]; const next = XP_LEVELS[i + 1];
  return { level: i + 1, cur, next, progress: next ? Math.min(1, (xp - cur.xp) / (next.xp - cur.xp)) : 1 };
}
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateSeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate(); }

// ─── Particles ────────────────────────────────────────────────────────────────

const P_COUNT = 10;
const P_X     = [0.08, 0.18, 0.30, 0.42, 0.55, 0.65, 0.76, 0.85, 0.22, 0.70];
const P_SZ    = [8, 6, 10, 7, 9, 6, 8, 10, 7, 9];

// ─── Scene ────────────────────────────────────────────────────────────────────

function CompanionScene({
  stage, mood, skin, archetype, onTap, phrase, phraseAnim, companionName,
  battleHP, battleMaxHP, battleEntityName, battleWave, entityShakeAnim, eating, evoPath,
}: {
  stage: EvolutionStage; mood: CompanionMood; skin: typeof SKINS[SkinId]; archetype: Archetype;
  onTap: () => void; phrase: string | null; phraseAnim: Animated.Value;
  companionName?: string;
  battleHP: number; battleMaxHP: number; battleEntityName: string; battleWave: number;
  entityShakeAnim: Animated.Value; eating: boolean; evoPath: EvoPath | null;
}) {
  const stageData = STAGES[stage];
  const { color, bgColor, skyColor, particleGlyph, glowColor, cardBg, starGlyphs } = skin;
  const battleActive = battleHP > 0;

  const breathAnim    = useRef(new Animated.Value(0)).current;
  const auraPulse     = useRef(new Animated.Value(0)).current;
  const blinkAnim     = useRef(new Animated.Value(1)).current;
  const bobAnim       = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0)).current;
  const skyAnim       = useRef(new Animated.Value(0)).current;
  const ring1Anim     = useRef(new Animated.Value(0)).current;
  const ring2Anim     = useRef(new Animated.Value(0)).current;
  const ring3Anim     = useRef(new Animated.Value(0)).current;
  const entityFadeAnim  = useRef(new Animated.Value(1)).current;
  const victoryFlash    = useRef(new Animated.Value(0)).current;
  const particleAnims  = useRef(Array.from({ length: P_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const dur = mood === 'transcendent' ? 3000 : mood === 'lit' ? 1000 : 2400;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(breathAnim, { toValue: 0, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(auraPulse, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(auraPulse, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bobAnim, { toValue: 1, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(bobAnim, { toValue: 0, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(glowAnim, { toValue: 0, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(skyAnim, { toValue: 1, duration: 5000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(skyAnim, { toValue: 0, duration: 5000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const base = mood === 'transcendent' ? 1800 : mood === 'lit' ? 2200 : 3200;
    [[ring1Anim, 0], [ring2Anim, 400], [ring3Anim, 900]].forEach(([anim, delay]) => {
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(anim as Animated.Value, { toValue:1, duration:base, useNativeDriver:true, easing:Easing.inOut(Easing.sin) }),
          Animated.timing(anim as Animated.Value, { toValue:0, duration:base, useNativeDriver:true, easing:Easing.inOut(Easing.sin) }),
        ])).start();
      }, delay as number);
    });
  }, [mood]);

  useEffect(() => {
    let running = true;
    const doBlink = () => {
      if (!running) return;
      setTimeout(() => {
        if (!running) return;
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(doBlink);
      }, 3000 + Math.random() * 3000);
    };
    doBlink(); return () => { running = false; };
  }, []);

  useEffect(() => {
    const loops = particleAnims.map((anim, i) => {
      const base = mood === 'lit' ? 1200 : mood === 'dormant' ? 4000 : 2400;
      return Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(anim, { toValue: 0, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
    });
    loops.forEach((l, i) => setTimeout(() => l.start(), i * 200));
    return () => loops.forEach(l => l.stop());
  }, [mood]);

  useEffect(() => {
    if (battleHP === 0) {
      Animated.sequence([
        Animated.timing(victoryFlash, { toValue: 0.45, duration: 120, useNativeDriver: true }),
        Animated.timing(victoryFlash, { toValue: 0,    duration: 500, useNativeDriver: true }),
      ]).start();
      Animated.timing(entityFadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
    } else {
      entityFadeAnim.setValue(1);
      victoryFlash.setValue(0);
    }
  }, [battleHP]);

  const breathScale = breathAnim.interpolate({ inputRange: [0,1], outputRange: [0.96, 1.04] });
  const auraScale   = auraPulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.15] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0,1], outputRange: [0.12, 0.35] });
  const bobY        = bobAnim.interpolate({ inputRange: [0,1], outputRange: [0, -8] });
  const glowOp      = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.04, 0.22] });
  const skyOp       = skyAnim.interpolate({ inputRange: [0,1], outputRange: [0.14, 0.36] });
  const bodyOp      = breathAnim.interpolate({ inputRange: [0,1], outputRange: mood === 'dormant' ? [0.25, 0.5] : [0.65, 1] });

  const ring1Op = ring1Anim.interpolate({ inputRange:[0,1], outputRange:[stage>=3?0.18:0.08, stage>=3?0.45:0.22] });
  const ring2Op = ring2Anim.interpolate({ inputRange:[0,1], outputRange:[stage>=3?0.10:0.04, stage>=3?0.32:0.14] });
  const ring3Op = ring3Anim.interpolate({ inputRange:[0,1], outputRange:[0.03, stage>=3?0.20:0.09] });
  const ring1Scale = ring1Anim.interpolate({ inputRange:[0,1], outputRange:[0.88, 1.08] });
  const ring2Scale = ring2Anim.interpolate({ inputRange:[0,1], outputRange:[0.94, 1.18] });
  const ring3Scale = ring3Anim.interpolate({ inputRange:[0,1], outputRange:[1.0, 1.32] });

  return (
    <View style={{ width: SCREEN_W, height: SCENE_H, backgroundColor: bgColor, overflow: 'hidden' }}>

      {/* Sky layers — 3 depth bands */}
      <Animated.View style={{ position:'absolute', top:0, left:0, right:0, height:SCENE_H*0.55, backgroundColor:skyColor, opacity:skyOp }} />
      {/* Mid-scene fog band — skin atmosphere */}
      <View style={{ position:'absolute', top:SCENE_H*0.3, left:0, right:0, height:SCENE_H*0.4, backgroundColor:skyColor, opacity:0.08 }} />
      <Animated.View style={{ position:'absolute', top:SCENE_H*0.1, left:0, right:0, height:SCENE_H*0.35, backgroundColor:color, opacity:glowAnim.interpolate({ inputRange:[0,1], outputRange:[0.06,0.16] }) }} />
      <Animated.View style={{ position:'absolute', top:SCENE_H*0.25, left:SCREEN_W/2-120, width:240, height:240, borderRadius:120, backgroundColor:color, opacity:glowOp }} />

      {/* Starfield */}
      {STARS.map((s, i) => (
        <Text key={`star-${i}`} style={{ position:'absolute', top:s.y*SCENE_H, left:s.x*SCREEN_W, color, fontSize:s.sz, opacity:s.op, fontFamily:mono }}>
          {starGlyphs[s.gi]}
        </Text>
      ))}

      {/* Concentric pulsing rings behind creature */}
      {[{ anim:ring3Anim, op:ring3Op, sc:ring3Scale, sz:220 },
        { anim:ring2Anim, op:ring2Op, sc:ring2Scale, sz:160 },
        { anim:ring1Anim, op:ring1Op, sc:ring1Scale, sz:110 }].map(({ op, sc, sz }, ri) => (
        <Animated.View key={`ring-${ri}`} style={{
          position:'absolute',
          top: SCENE_H*0.14 + (stage>=2 ? 30 : 20) - sz/2,
          left: SCREEN_W/2 - sz/2,
          width:sz, height:sz, borderRadius:sz/2,
          borderWidth: ri === 0 ? 1.5 : ri === 1 ? 1 : 0.5,
          borderColor: color,
          opacity: op,
          transform:[{ scale:sc }],
        }} />
      ))}

      {particleAnims.map((anim, i) => {
        const yRange = mood === 'lit' ? [-80,-140] : mood === 'dormant' ? [-10,-30] : [-40,-90];
        return (
          <Animated.Text key={i} style={{ position:'absolute', bottom:SCENE_H*0.35+(i%3)*12, left:P_X[i]*SCREEN_W, fontSize:P_SZ[i], color,
            transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:yRange }) }],
            opacity: anim.interpolate({ inputRange:[0,0.3,0.7,1], outputRange:[0,0.6,0.6,0] }) }}>
            {particleGlyph}
          </Animated.Text>
        );
      })}

      {stageData.aura.map((line, i) => (
        <Animated.Text key={i} style={{ position:'absolute', top:SCENE_H*0.18+i*22, alignSelf:'center', color, fontSize:stage>=4?18:14, fontFamily:mono, letterSpacing:4+i*2, transform:[{scale:auraScale}], opacity:auraOpacity }}>
          {line}
        </Animated.Text>
      ))}

      {/* Companion — left when battle active */}
      <Animated.View style={[
        { position:'absolute', top:SCENE_H*0.14, alignItems:'center', transform:[{translateY:bobY}] },
        battleActive ? { left: SCREEN_W * 0.02 } : { left:0, right:0 },
      ]}>
        <TouchableOpacity onPress={onTap} activeOpacity={0.85}>
          <Animated.View style={{ transform:[{scale:breathScale}], opacity:bodyOp, alignItems:'center' }}>
            {/* Crown row — archetype tier */}
            <Text style={{ color, fontSize:13, lineHeight:20, fontFamily:mono, textAlign:'center', letterSpacing:1, marginBottom:2 }}>
              {archetype.crowns[stage]}
            </Text>
            {/* SVG creature body */}
            <View style={{ width:100, height:150 }}>
              <CreatureSvg archId={archetype.id} stage={stage} color={color} path={evoPath} />
            </View>
            {/* Eyes — mood-reactive overlay, positioned over the SVG head */}
            <View style={{ position:'absolute', top: 32 + (stage * 4), left:0, right:0, alignItems:'center' }}>
              <Animated.Text style={{ color, fontSize:13, letterSpacing:8, fontFamily:mono, fontWeight:'700', opacity:blinkAnim }}>
                {eating ? EAT_EYES : archetype.eyes[mood]}
              </Animated.Text>
              <Animated.Text style={{
                position:'absolute', color, fontSize:13, letterSpacing:8, fontFamily:mono, fontWeight:'700',
                opacity: blinkAnim.interpolate({ inputRange:[0,1], outputRange:[1,0] }),
              }}>
                {'─  ─'}
              </Animated.Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Entropy entity — right side */}
      {battleActive && (
        <Animated.View style={{ position:'absolute', top:SCENE_H*0.2, right:SCREEN_W*0.04, alignItems:'center', transform:[{translateX:entityShakeAnim}], opacity:entityFadeAnim }}>
          <View style={{ width:64, height:5, backgroundColor:'#330000', borderRadius:2, marginBottom:6, overflow:'hidden' }}>
            <View style={{ height:5, width:`${Math.round((battleHP/battleMaxHP)*100)}%`, backgroundColor:'#FF4444', borderRadius:2 }} />
          </View>
          <Text style={{ color:'#FF6666', fontSize:7, fontFamily:mono, letterSpacing:1, marginBottom:3 }}>{battleEntityName.toUpperCase()}</Text>
          {getEntropyBody(battleEntityName).map((line, i) => (
            <Text key={i} style={{ color:'#FF4444', fontSize:14, fontFamily:mono, letterSpacing:2, lineHeight:18, textAlign:'center', opacity:0.9 }}>{line}</Text>
          ))}
          <Text style={{ color:'#FF333333', fontSize:9, fontFamily:mono, letterSpacing:3, marginTop:4 }}>× × × ×</Text>
        </Animated.View>
      )}

      {battleActive && (
        <View style={{ position:'absolute', top:SCENE_H*0.44, left:0, right:0, alignItems:'center' }}>
          <Text style={{ color:'#FF333366', fontSize:8, fontFamily:mono, letterSpacing:2 }}>VS</Text>
          <Text style={{ color:'#FF333344', fontSize:7, fontFamily:mono, letterSpacing:1 }}>W{battleWave}</Text>
        </View>
      )}

      <View style={{ position:'absolute', bottom:48, left:0, right:0, alignItems:'center' }}>
        <View style={{ width:SCREEN_W*0.85, height:2, backgroundColor:color, opacity:0.45, borderRadius:1 }} />
        <View style={{ width:SCREEN_W*0.6, height:1, backgroundColor:skyColor, opacity:0.25, marginTop:2, borderRadius:1 }} />
        <Text style={{ color, fontSize:12, fontFamily:mono, letterSpacing:2, opacity:0.6, marginTop:6 }}>{STAGES[stage].ground}</Text>
      </View>

      {companionName ? (
        <View style={{ position:'absolute', top:10, left:0, right:0, alignItems:'center' }}>
          <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:2, opacity:0.75 }}>{companionName}</Text>
        </View>
      ) : null}

      <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:color, opacity:victoryFlash }} />

      <View style={{ position:'absolute', bottom:12, left:16 }}>
        <Text style={{ color, fontSize:9, fontFamily:mono, letterSpacing:2, opacity:0.6 }}>{stageData.name}</Text>
      </View>
      <View style={{ position:'absolute', bottom:12, right:16, flexDirection:'row', alignItems:'center', gap:5 }}>
        <Text style={{ color:{ dormant:'#666677', present:color, lit:'#E8C76A', transcendent:'#FFFFFF' }[mood], fontSize:10 }}>
          {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
        </Text>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:2 }}>
          {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
        </Text>
      </View>

      {phrase && (
        <Animated.View style={{ position:'absolute', bottom:68, left:24, right:24, opacity:phraseAnim, padding:12, borderRadius:12, borderWidth:1, borderColor:color+'55', backgroundColor:'#000000CC', alignItems:'center' }}>
          <Text style={{ color, fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:20 }}>{phrase}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CompanionScreen() {
  const router = useRouter();

  const [totalDives,    setTotalDives]    = useState(0);
  const [divesThisWeek, setDivesThisWeek] = useState(0);
  const [avgLQ,         setAvgLQ]         = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [vigilName,     setVigilName]     = useState<string | null>(null);
  const [relics,        setRelics]        = useState<string[]>([]);
  const [mood,          setMood]          = useState<CompanionMood>('present');
  const [stage,         setStage]         = useState<EvolutionStage>(0);
  const [xp,            setXP]            = useState(0);
  const [phrase,        setPhrase]        = useState<string | null>(null);
  const [showRelics,    setShowRelics]    = useState(false);
  const [showLore,      setShowLore]      = useState(false);
  const [newRelic,      setNewRelic]      = useState<typeof RELIC_POOL[0] | null>(null);

  const [activeSkin,       setActiveSkin]       = useState<SkinId>('solform');
  const [archetypeId,      setArchetypeId]      = useState<ArchetypeId>('archivist');
  const [showArchSelect,   setShowArchSelect]   = useState(false);

  const [companionName, setCompanionName] = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [nameDraft,     setNameDraft]     = useState('');

  const [quests,    setQuests]    = useState<Quest[]>([]);
  const [questData, setQuestData] = useState<QuestData>({ divesToday:0, journalToday:false, libraryToday:false, vigilActive:false, totalDives:0, divesThisWeek:0 });

  const [hunger,       setHunger]       = useState(0);
  const [wisdom,       setWisdom]       = useState(0);
  const [energy,       setEnergy]       = useState(1);
  const [companionHP,  setCompanionHP]  = useState(100);

  const [battle,         setBattle]        = useState<BattleState | null>(null);
  const [attackPower,    setAttackPower]   = useState(10);
  const [tokensLeft,     setTokensLeft]    = useState(3);
  const [attackAnim,     setAttackAnim]    = useState(false);

  const [dailyFoods,   setDailyFoods]   = useState<FoodItem[]>([]);
  const [fedToday,     setFedToday]     = useState<string[]>([]);
  const [eating,       setEating]       = useState(false);
  const [recentDives,  setRecentDives]  = useState<Array<{ subjectName: string; domainLabel: string }>>([]);

  const phraseAnim      = useRef(new Animated.Value(0)).current;
  const relicAnim       = useRef(new Animated.Value(0)).current;
  const xpPopAnim       = useRef(new Animated.Value(0)).current;
  const entityShakeAnim = useRef(new Animated.Value(0)).current;
  const [xpPop, setXpPop] = useState<string | null>(null);

  const [showStatModal,   setShowStatModal]   = useState(false);
  const [isSovereign,    setIsSovereign]     = useState(false);
  const [showNamingRitual,  setShowNamingRitual]  = useState(false);
  const [milestone,        setMilestone]         = useState<{ glyph:string; title:string; body:string } | null>(null);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const [evolutionCeremony, setEvolutionCeremony] = useState<{ stage: EvolutionStage } | null>(null);
  const ceremonyAnim = useRef(new Animated.Value(0)).current;
  const [showSummonCeremony, setShowSummonCeremony] = useState(false);
  const [summonPhase, setSummonPhase] = useState<0 | 1 | 2>(0);
  const summonAnim = useRef(new Animated.Value(0)).current;
  const summonChoiceAnim = useRef(new Animated.Value(0)).current;
  const [dreamFragment, setDreamFragment] = useState<{ domain: string; glyph: string; color: string; text: string } | null>(null);
  const dreamAnim = useRef(new Animated.Value(0)).current;
  const [evoPath,           setEvoPath]           = useState<EvoPath | null>(null);
  const [showPathCeremony,  setShowPathCeremony]  = useState(false);
  const pathCeremonyAnim = useRef(new Animated.Value(0)).current;
  const scrollRef  = useRef<any>(null);
  const feedY      = useRef(0);
  const battleY    = useRef(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const keys = [
        'sol_dive_log','sanctum_lq_history','sol_vigil','sol_study_streak',
        'sol_companion_relics','sol_companion_name','sanctum_journal',
        'cascade_library_v3','sol_companion_skin','sol_companion_battle','sol_companion_fed',
        'sol_companion_archetype','sol_premium','sol_companion_named','sol_companion_path',
      ];
      const vals = await AsyncStorage.multiGet(keys);
      const get  = (k: string) => vals.find(([key]) => key === k)?.[1] ?? null;

      const dives: Array<{date:string; subjectName?:string; domainLabel?:string}> = get('sol_dive_log') ? JSON.parse(get('sol_dive_log')!) : [];
      const now     = Date.now();
      const total   = dives.length;
      setRecentDives(dives.slice(0, 5).filter(d => d.subjectName).map(d => ({ subjectName: d.subjectName!, domainLabel: d.domainLabel || 'the unknown' })));
      const week    = dives.filter(d => new Date(d.date).getTime() > now - 7*86400000).length;
      const todayK  = todayDateKey();
      const today   = dives.filter(d => d.date?.startsWith(todayK)).length;

      const lqH: Array<{lq:number}> = get('sanctum_lq_history') ? JSON.parse(get('sanctum_lq_history')!) : [];
      const lqAvg = lqH.length > 0 ? lqH.slice(-7).reduce((s,p) => s+p.lq,0) / Math.min(lqH.length,7) : 0;

      const vigil = get('sol_vigil') ? JSON.parse(get('sol_vigil')!) : null;
      let streakVal = 0;
      const sRaw = get('sol_study_streak');
      if (sRaw) { try { const p = JSON.parse(sRaw); streakVal = p?.count ?? p ?? 0; } catch { streakVal = parseInt(sRaw)||0; } }

      const earned: string[] = get('sol_companion_relics') ? JSON.parse(get('sol_companion_relics')!) : [];
      const updated = [...earned];
      const award = (id: string, cond: boolean) => { if (cond && !updated.includes(id)) updated.push(id); };
      award('sovereign_100', total >= 100);
      award('sovereign_200', total >= 200);
      award('streak_7', streakVal >= 7);
      award('streak_30', streakVal >= 30);
      if (vigil?.daysCompleted >= 7 && !updated.includes('vigil_flame')) {
        updated.push('vigil_flame');
        setNewRelic(RELIC_POOL.find(r => r.id === 'vigil_flame')!);
      }
      if (updated.length !== earned.length) await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updated));

      const lastDive  = dives.length > 0 ? dives[dives.length-1].date : null;
      const daysSince = lastDive ? Math.floor((now - new Date(lastDive).getTime())/86400000) : 999;
      let m: CompanionMood = 'present';
      if (lqAvg >= 0.85) m = 'transcendent';
      else if (week >= 5) m = 'lit';
      else if (daysSince >= 3) m = 'dormant';

      const journal: Array<{date:string}> = get('sanctum_journal') ? JSON.parse(get('sanctum_journal')!) : [];
      const library: Array<{date:string}> = get('cascade_library_v3') ? JSON.parse(get('cascade_library_v3')!) : [];

      const skinRaw = get('sol_companion_skin') as SkinId | null;
      if (skinRaw && SKIN_IDS.includes(skinRaw)) setActiveSkin(skinRaw);
      const archRaw = get('sol_companion_archetype') as ArchetypeId | null;
      if (archRaw && ARCHETYPE_IDS.includes(archRaw)) {
        setArchetypeId(archRaw);
      } else {
        setTimeout(() => {
          setShowSummonCeremony(true);
          setSummonPhase(0);
          summonAnim.setValue(0);
          Animated.timing(summonAnim, { toValue:1, duration:1200, useNativeDriver:true }).start(() => {
            setTimeout(() => {
              setSummonPhase(1);
              summonChoiceAnim.setValue(0);
              Animated.timing(summonChoiceAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
            }, 1800);
          });
        }, 400);
      }

      const seed = dateSeed();

      let bat: BattleState | null = get('sol_companion_battle') ? JSON.parse(get('sol_companion_battle')!) : null;
      if (!bat || !('wave' in bat)) {
        bat = freshWave(1);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
      }

      const fedRaw = get('sol_companion_fed');
      const fedData: {date:string;ids:string[]} = fedRaw ? JSON.parse(fedRaw) : {date:'',ids:[]};
      const todayFed = fedData.date === todayK ? fedData.ids : [];

      const sigil = getGear('sigil', total);
      const gearTokenBonus = sigil.threshold >= 20 ? 2 : 0;
      const archData = ARCHETYPES[archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist'];
      const power = Math.max(10, Math.floor(lqAvg * 100)) + (getGear('crown', total).threshold >= 1 ? 5 : 0) + archData.attackBonus;
      const tokenBudget = today + 3 + gearTokenBonus + archData.tokenBonus;

      setIsSovereign(get('sol_premium') === 'true');
      const currentStage = getStage(total);
      const hasName = !!get('sol_companion_name');
      const hasSeenRitual = get('sol_companion_named') === 'true';
      const storedPath = get('sol_companion_path') as EvoPath | null;
      setEvoPath(storedPath);
      if (currentStage >= 3 && !hasName && !hasSeenRitual) setShowNamingRitual(true);
      if (currentStage >= 3 && !storedPath) {
        setTimeout(() => {
          pathCeremonyAnim.setValue(0);
          Animated.timing(pathCeremonyAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          setShowPathCeremony(true);
        }, 3000);
      }
      if (currentStage >= 1) { fireMilestone('stage_spark', '◦', 'SPARK Reached', 'The companion has crossed its first threshold. It is beginning to wake.'); fireEvolutionCeremony(1); }
      if (currentStage >= 2) fireEvolutionCeremony(2);
      if (currentStage >= 3) { fireMilestone('stage_flame', '✦', 'FLAME Reached', 'Fifty dives. The companion is alive — truly alive. It responds to your field.'); fireEvolutionCeremony(3); }
      if (currentStage >= 4) fireEvolutionCeremony(4);
      if (currentStage >= 5) { fireMilestone('stage_sovereign', '⊕', 'SOVEREIGN', 'Two hundred dives. The Great Work is complete. Your companion has become its own sovereign entity.'); fireEvolutionCeremony(5); }
      setTotalDives(total); setDivesThisWeek(week); setAvgLQ(lqAvg);
      setStreak(streakVal); setVigilName(vigil?.subjectName ?? null);
      setRelics(updated); setMood(m); setStage(getStage(total));
      setXP(computeXP(total, streakVal));
      setCompanionName(get('sol_companion_name') ?? '');
      setQuests(getDailyQuests(seed));
      setQuestData({ divesToday:today, journalToday:journal.some(e=>e.date?.startsWith(todayK)), libraryToday:library.some(e=>e.date?.startsWith(todayK)), vigilActive:!!vigil, totalDives:total, divesThisWeek:week });
      const hungerVal = Math.min(1, today/3 + (fedData.date === todayK ? fedData.ids.length * 0.2 : 0));
      const energyVal = Math.max(0, 1 - daysSince/7);
      const compHP = Math.round(
        40 + hungerVal * 30 + energyVal * 20 + Math.min(10, streakVal)
      );
      setHunger(hungerVal);
      setWisdom(lqAvg);
      setEnergy(energyVal);
      setCompanionHP(Math.min(100, compHP));
      setBattle(bat);
      setAttackPower(power);
      setTokensLeft(bat.tokens);
      setDailyFoods(getDailyFoods(seed));
      setFedToday(todayFed);

      // Dream fragment — fires once per day if we have a last dive with domain
      if (dives.length > 0) {
        const lastDiveRecord = dives[0] as { date:string; subjectName?:string; domainLabel?:string; domainColor?:string; domainGlyph?:string };
        const lastDreamKey = await AsyncStorage.getItem('sol_companion_dream_date');
        if (lastDreamKey !== todayK && lastDiveRecord.subjectName && currentStage >= 1) {
          await AsyncStorage.setItem('sol_companion_dream_date', todayK);
          const DREAM_LINES = [
            `I dreamed of ${lastDiveRecord.subjectName}. The symbols were moving.`,
            `${lastDiveRecord.subjectName} came to me in the dark. Something incomplete.`,
            `I was inside ${lastDiveRecord.domainLabel || 'the field'} again. You were there too.`,
            `The last session — ${lastDiveRecord.subjectName}. It continued while you slept.`,
            `${lastDiveRecord.domainLabel || 'The field'} doesn't stop when you close the app.`,
          ];
          const dreamText = DREAM_LINES[Math.floor(Math.random() * DREAM_LINES.length)];
          setTimeout(() => {
            setDreamFragment({
              domain: lastDiveRecord.domainLabel || 'the field',
              glyph: lastDiveRecord.domainGlyph || '◈',
              color: lastDiveRecord.domainColor || '#888899',
              text: dreamText,
            });
            dreamAnim.setValue(0);
            Animated.timing(dreamAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          }, 1600);
        }
      }
    })();
  }, []));

  useEffect(() => {
    if (phrase) {
      phraseAnim.setValue(0);
      Animated.timing(phraseAnim, { toValue:1, duration:300, useNativeDriver:true }).start();
      const t = setTimeout(() => {
        Animated.timing(phraseAnim, { toValue:0, duration:500, useNativeDriver:true }).start(() => setPhrase(null));
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [phrase]);

  useEffect(() => {
    if (newRelic) {
      relicAnim.setValue(0);
      Animated.spring(relicAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    }
  }, [newRelic]);

  useEffect(() => {
    if (!evolutionCeremony) return;
    const t = setTimeout(() => setEvolutionCeremony(null), 5000);
    return () => clearTimeout(t);
  }, [evolutionCeremony]);

  useEffect(() => {
    if (!dreamFragment) return;
    const t = setTimeout(() => {
      Animated.timing(dreamAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setDreamFragment(null));
    }, 6000);
    return () => clearTimeout(t);
  }, [dreamFragment]);

  const fireXPPop = (label: string) => {
    setXpPop(label);
    xpPopAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpPopAnim, { toValue:1, duration:200, useNativeDriver:true }),
      Animated.delay(700),
      Animated.timing(xpPopAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start(() => setXpPop(null));
  };

  const archetype = ARCHETYPES[archetypeId];

  const fireMilestone = async (id: string, glyph: string, title: string, body: string) => {
    const raw = await AsyncStorage.getItem('sol_companion_milestones');
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(id)) return;
    await AsyncStorage.setItem('sol_companion_milestones', JSON.stringify([...seen, id]));
    setMilestone({ glyph, title, body });
    milestoneAnim.setValue(0);
    Animated.spring(milestoneAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fireEvolutionCeremony = async (stageNum: EvolutionStage) => {
    const raw = await AsyncStorage.getItem('sol_companion_ceremonies');
    const seen: number[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(stageNum)) return;
    await AsyncStorage.setItem('sol_companion_ceremonies', JSON.stringify([...seen, stageNum]));
    setTimeout(() => {
      setEvolutionCeremony({ stage: stageNum });
      ceremonyAnim.setValue(0);
      Animated.spring(ceremonyAnim, { toValue:1, useNativeDriver:true, tension:50, friction:9 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const MEMORY_TEMPLATES = [
    (s: string, d: string) => `I remember ${s}. Something from ${d} stays with you.`,
    (s: string, _d: string) => `${s} — you carried that one differently.`,
    (s: string, d: string) => `The ${d} work on ${s} left a mark. I felt it.`,
    (s: string, _d: string) => `You went deep into ${s}. I was watching.`,
    (s: string, d: string) => `${d}... ${s}. You've been building something.`,
  ];

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (recentDives.length > 0 && Math.random() < 0.3) {
      const dive = recentDives[Math.floor(Math.random() * recentDives.length)];
      const tmpl = MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)];
      setPhrase(tmpl(dive.subjectName, dive.domainLabel));
    } else {
      setPhrase(rnd(archetype.phrases[mood]));
    }
  };

  const handleAttack = async () => {
    if (!battle || battle.won || tokensLeft <= 0 || attackAnim) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAttackAnim(true);
    Animated.sequence([
      Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
      Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
      Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
      Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
      Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
    ]).start();

    const variance = Math.floor(Math.random() * 20);
    // LYCHEETAH chaos bonus: 30% chance of 1.5–3× multiplier
    const chaosRoll = archetype.id === 'lycheetah' && Math.random() < 0.3;
    const chaosMult = chaosRoll ? 1.5 + Math.random() * 1.5 : 1;
    const dmg = Math.round((attackPower + variance) * chaosMult);
    const newHP = Math.max(0, battle.entityHP - dmg);
    const won   = newHP === 0;
    const newTokens = Math.max(0, tokensLeft - 1);
    const xpGained = won ? battle.wave * 20 : 0;
    const chaosNote = chaosRoll ? ` ✧CHAOS×${chaosMult.toFixed(1)}` : '';

    const updated: BattleState = { ...battle, entityHP: newHP, tokens: newTokens, won, log: [`${dmg} dmg${chaosNote}${won ? ' — SLAIN' : ''}`, ...battle.log].slice(0,5), waveXP: battle.waveXP + xpGained };
    setBattle(updated);
    setTokensLeft(newTokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(updated));

    if (won) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
      if (!relics.includes('entropy_slain')) {
        const r = [...relics, 'entropy_slain'];
        setRelics(r);
        setNewRelic(RELIC_POOL.find(x => x.id === 'entropy_slain')!);
        await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(r));
      }
      fireMilestone('first_blood', '✕', 'First Blood', 'The Entropy Entity falls for the first time. The field holds.');
      setPhrase(`Wave ${battle.wave} cleared. ${battle.wave * 20} XP. The next rises.`);
      // Auto-chain: spawn next wave after 2.5s
      setTimeout(async () => {
        const next = freshWave(battle.wave + 1);
        setBattle(next);
        setTokensLeft(next.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
        setPhrase(archetype.phrases.lit[Math.floor(Math.random() * archetype.phrases.lit.length)]);
      }, 2500);
    } else {
      setPhrase(chaosRoll ? `CHAOS ${chaosMult.toFixed(1)}× — ${dmg} dmg! ${newHP} HP left.` : `${dmg} dmg. ${newHP} HP left.`);
    }
    fireXPPop(chaosRoll ? `✧${dmg}` : `${dmg}`);
    setTimeout(() => setAttackAnim(false), 350);
  };

  const handleRetreat = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
    setPhrase('The field resets. Return when ready.');
    Haptics.selectionAsync();
  };

  const handleFeed = async (food: FoodItem) => {
    if (fedToday.includes(food.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fireMilestone('first_feed', '△', 'First Feeding', 'The companion has eaten from your hand for the first time. Something stirs.');
    const newFed = [...fedToday, food.id];
    setFedToday(newFed);
    setEating(true);
    setTimeout(() => setEating(false), 1800);
    setPhrase(rnd(food.reactions));
    setHunger(h => Math.min(1, h + 0.34));
    fireXPPop(`+${food.xp} XP`);
    const todayK = todayDateKey();
    await AsyncStorage.setItem('sol_companion_fed', JSON.stringify({ date: todayK, ids: newFed }));
    if (newFed.length >= 3 && !relics.includes('well_fed')) {
      const r = [...relics, 'well_fed'];
      setRelics(r);
      setNewRelic(RELIC_POOL.find(x => x.id === 'well_fed')!);
      await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(r));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSkin = async (id: SkinId) => {
    Haptics.selectionAsync();
    setActiveSkin(id);
    await AsyncStorage.setItem('sol_companion_skin', id);
  };

  const handleArchetypeSelect = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    setShowArchSelect(false);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
  };

  const handleSummonChoice = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSummonPhase(2);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
    setTimeout(() => setShowSummonCeremony(false), 1600);
  };

  const skin      = SKINS[activeSkin];
  const color     = skin.color;
  const stageData = STAGES[stage];
  const lvl       = getLevel(xp);
  const evProg    = stageData.nextAt === Infinity ? 1 : Math.min(1, (totalDives - stageData.minDives) / (stageData.nextAt - stageData.minDives));
  const earnedRelicData = relics.map(id => RELIC_POOL.find(r => r.id === id)).filter(Boolean) as typeof RELIC_POOL;
  const gearCrown  = getGear('crown', totalDives);
  const gearSigil  = getGear('sigil', totalDives);
  const gearMantle = getGear('mantle', totalDives);
  const nextCrown  = nextGearTier('crown', totalDives);
  const nextSigil  = nextGearTier('sigil', totalDives);
  const nextMantle = nextGearTier('mantle', totalDives);
  const allGearEquipped = gearCrown.threshold > 0 && gearSigil.threshold > 0 && gearMantle.threshold > 0;

  const xpPopY  = xpPopAnim.interpolate({ inputRange:[0,1], outputRange:[0,-32] });
  const xpPopOp = xpPopAnim.interpolate({ inputRange:[0,0.3,1], outputRange:[0,1,0] });

  const { glowColor, cardBg } = skin;

  return (
    <ScrollView ref={scrollRef} style={{ flex:1, backgroundColor:skin.bgColor }} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>

      {/* ── COMPANION HEADER ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:4, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
          <View>
            <Text style={{ color, fontSize:15, fontWeight:'700', fontFamily:mono }}>
              {companionName || archetype.name}
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <Text style={{ color:{ dormant:'#666677', present:color, lit:'#E8C76A', transcendent:'#FFFFFF' }[mood], fontSize:11 }}>
              {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:1 }}>
              {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
            </Text>
          </View>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{stageData.name} · {totalDives} dives</Text>
          {(() => { const bond = getBond(totalDives, streak, fedToday.length); return (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ color:color, fontSize:9 }}>{bond.glyph}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono, letterSpacing:1 }}>{bond.label}</Text>
            </View>
          ); })()}
          <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:2 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono, letterSpacing:1 }}>HP</Text>
            <View style={{ width:60, height:4, backgroundColor:SOL_THEME.border, borderRadius:2, overflow:'hidden' }}>
              <View style={{ height:4, width:`${companionHP}%`, backgroundColor: companionHP > 60 ? '#6AE8A0' : companionHP > 30 ? '#E8C76A' : '#FF6B6B', borderRadius:2 }} />
            </View>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono }}>{companionHP}</Text>
          </View>
        </View>
      </View>

      {/* ── SCENE ─────────────────────────────────────────────────────────── */}
      <CompanionScene
        stage={stage} mood={mood} skin={skin} archetype={archetype}
        onTap={handleTap} phrase={phrase} phraseAnim={phraseAnim}
        companionName={companionName}
        battleHP={battle?.entityHP ?? 0}
        battleMaxHP={battle?.maxHP ?? 80}
        battleEntityName={battle?.entityName ?? ''}
        battleWave={battle?.wave ?? 1}
        entityShakeAnim={entityShakeAnim}
        eating={eating}
        evoPath={evoPath}
      />

      {xpPop && (
        <Animated.Text style={{ position:'absolute', top:SCENE_H-55, alignSelf:'center', color, fontSize:13, fontFamily:mono, fontWeight:'700', transform:[{translateY:xpPopY}], opacity:xpPopOp }}>
          {xpPop}
        </Animated.Text>
      )}

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <View style={{ flexDirection:'row', gap:8, paddingHorizontal:16, paddingTop:10, paddingBottom:6 }}>
        {([
          { glyph:'△',  label:'FEED',   onPress:() => { Haptics.selectionAsync(); scrollRef.current?.scrollTo({ y: feedY.current - 20, animated:true }); } },
          { glyph:'⚔',  label:'BATTLE', onPress:() => { Haptics.selectionAsync(); scrollRef.current?.scrollTo({ y: battleY.current - 20, animated:true }); } },
          { glyph:'◉',  label:'STATS',  onPress:() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowStatModal(true); } },
          { glyph:'⊜',  label:'LORE',   onPress:() => { Haptics.selectionAsync(); setShowLore(l=>!l); } },
        ] as { glyph:string; label:string; onPress:()=>void }[]).map(({ glyph, label, onPress }) => (
          <TouchableOpacity key={label} onPress={onPress} style={{ flex:1, paddingVertical:13, borderRadius:12, borderWidth:1.5, borderColor:color+'55', backgroundColor:color+'10', alignItems:'center', gap:4 }}>
            <Text style={{ color, fontSize:18, fontFamily:mono }}>{glyph}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SKINS ─────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:4 }}>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:8 }}>SKIN</Text>
        <View style={{ flexDirection:'row', gap:7 }}>
          {SKIN_IDS.map(id => {
            const s = SKINS[id]; const active = activeSkin === id;
            const locked = id === 'obsidian' && !isSovereign;
            return (
              <TouchableOpacity key={id} onPress={() => locked ? null : handleSkin(id)} style={{ flex:1, paddingVertical:10, borderRadius:10, borderWidth:active?1.5:1, borderColor:locked?SOL_THEME.border+'55':active?s.color:SOL_THEME.border, backgroundColor:locked?'transparent':active?s.color+'18':SOL_THEME.surface, alignItems:'center', gap:3, opacity:locked?0.4:1 }}>
                <Text style={{ color:locked?SOL_THEME.textMuted:s.color, fontSize:16 }}>{locked?'🔒':s.glyph}</Text>
                <Text style={{ color:active?s.color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono }}>{s.name}</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:7, fontStyle:'italic' }}>{locked?'Sovereign':s.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── ARCHETYPE SELECTION MODAL ─────────────────────────────────────── */}
      {/* ── SUMMON CEREMONY ──────────────────────────────────────────────── */}
      <Modal visible={showSummonCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000' }}>

          {/* Phase 0 + 1 intro text */}
          {(summonPhase === 0 || summonPhase === 1) && (
            <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems:'center', paddingHorizontal:40, opacity:summonAnim }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:5, fontFamily:mono, marginBottom:40, textAlign:'center' }}>◈  SOL  ◈</Text>
              <Text style={{ color:'#AAAACC', fontSize:22, fontWeight:'700', letterSpacing:1.5, fontFamily:mono, textAlign:'center', marginBottom:12 }}>Something stirs{'\n'}in the field.</Text>
              <Text style={{ color:'#555566', fontSize:12, letterSpacing:2, fontFamily:mono, textAlign:'center' }}>Five forms wait in the dark.</Text>
            </Animated.View>
          )}

          {/* Phase 1 — archetype cards */}
          {summonPhase >= 1 && (
            <Animated.View style={{ flex:1, opacity:summonChoiceAnim }}>
              <ScrollView contentContainerStyle={{ padding:24, paddingTop:60 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color:'#888899', fontSize:9, letterSpacing:4, fontFamily:mono, textAlign:'center', marginBottom:6 }}>CHOOSE YOUR FAMILIAR</Text>
                <Text style={{ color:'#444455', fontSize:11, textAlign:'center', fontStyle:'italic', marginBottom:28, lineHeight:18 }}>
                  This is who they are. Their voice. Their eyes. Their power.{'\n'}You may only do this once.
                </Text>
                {ARCHETYPE_IDS.map(id => {
                  const a = ARCHETYPES[id];
                  const aColor = SKINS[a.defaultSkin].color;
                  const seed0 = STAGES[0];
                  const cateLocked = id === 'lycheetah' && !isSovereign;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => cateLocked ? null : handleSummonChoice(id)}
                      activeOpacity={cateLocked ? 1 : 0.85}
                      style={{ marginBottom:14, padding:18, borderRadius:16, borderWidth:1.5, borderColor:cateLocked ? '#FF9F1C33' : aColor+'55', backgroundColor:cateLocked ? '#150800' : aColor+'0C', opacity:cateLocked ? 0.7 : 1 }}
                    >
                      <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:10 }}>
                        <Text style={{ color:cateLocked ? '#FF9F1C' : aColor, fontSize:28, fontFamily:mono }}>{cateLocked ? '🔒' : a.glyph}</Text>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:cateLocked ? '#FF9F1C' : aColor, fontSize:15, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{a.name}</Text>
                          <Text style={{ color:'#666677', fontSize:11, fontStyle:'italic', marginTop:2 }}>{cateLocked ? 'Founding Sovereign exclusive' : a.title}</Text>
                        </View>
                        {cateLocked && (
                          <View style={{ backgroundColor:'#FF9F1C22', borderRadius:8, paddingHorizontal:8, paddingVertical:4 }}>
                            <Text style={{ color:'#FF9F1C', fontSize:9, fontFamily:mono, letterSpacing:1 }}>SOVEREIGN</Text>
                          </View>
                        )}
                      </View>
                      {/* Seed stage SVG preview */}
                      <View style={{ marginBottom:10, alignItems:'center', opacity:cateLocked ? 0.5 : 0.9 }}>
                        <CreatureSvg archId={id} stage={0} color={cateLocked ? '#FF9F1C' : aColor} />
                      </View>
                      {cateLocked ? (
                        <Text style={{ color:'#FF9F1C88', fontSize:12, lineHeight:18, marginBottom:10, fontStyle:'italic' }}>
                          The Mystery Cat chooses only those who hold Founding Sovereign.{'\n'}Chaos cannot be summoned. Only earned.
                        </Text>
                      ) : (
                        <Text style={{ color:'#555566', fontSize:12, lineHeight:18, marginBottom:10 }}>{a.desc}</Text>
                      )}
                      <Text style={{ color:cateLocked ? '#FF9F1C66' : aColor+'99', fontSize:10, fontFamily:mono, letterSpacing:1 }}>⊛ {a.specialty}</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height:40 }} />
              </ScrollView>
            </Animated.View>
          )}

          {/* Phase 2 — awakening flash */}
          {summonPhase === 2 && (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:24 }}>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:48, fontFamily:mono }}>
                {ARCHETYPES[archetypeId].glyph}
              </Text>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:14, fontWeight:'700', letterSpacing:4, fontFamily:mono }}>
                AWAKENING
              </Text>
              <Text style={{ color:'#444455', fontSize:11, fontStyle:'italic', textAlign:'center', paddingHorizontal:40, lineHeight:18 }}>
                {ARCHETYPES[archetypeId].name} opens its eyes for the first time.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showArchSelect} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'90%' }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:3, fontFamily:mono, marginBottom:4 }}>CHOOSE YOUR COMPANION</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:11, fontStyle:'italic', marginBottom:16, opacity:0.6 }}>
              This defines who your companion is — their voice, their eyes, their power. Changeable anytime.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ARCHETYPE_IDS.map(id => {
                const a = ARCHETYPES[id];
                const active = archetypeId === id;
                const aColor = SKINS[a.defaultSkin].color;
                const archLocked = id === 'lycheetah' && !isSovereign;
                return (
                  <TouchableOpacity key={id} onPress={() => archLocked ? null : handleArchetypeSelect(id)} activeOpacity={archLocked ? 1 : 0.7} style={{ marginBottom:10, padding:16, borderRadius:14, borderWidth:active?2:1, borderColor:active?aColor:archLocked?'#FF9F1C33':SOL_THEME.border, backgroundColor:active?aColor+'14':archLocked?'#150800':SOL_THEME.background, opacity:archLocked?0.75:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:8 }}>
                      <View style={{ width:44, height:44, borderRadius:10, borderWidth:1, borderColor:archLocked?'#FF9F1C33':aColor+'55', backgroundColor:archLocked?'#FF9F1C11':aColor+'18', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:22 }}>{archLocked ? '🔒' : a.glyph}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                          <Text style={{ color:archLocked?'#FF9F1C':aColor, fontSize:14, fontWeight:'700', fontFamily:mono }}>{a.name}</Text>
                          {active && <Text style={{ color:aColor, fontSize:9, fontFamily:mono }}>· ACTIVE</Text>}
                          {archLocked && <Text style={{ color:'#FF9F1C', fontSize:9, fontFamily:mono }}>· SOVEREIGN ONLY</Text>}
                        </View>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1, fontStyle:'italic' }}>{archLocked ? 'Founding Sovereign exclusive' : a.title}</Text>
                      </View>
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18, marginBottom:8 }}>{archLocked ? 'The Mystery Cat chooses only Founding Sovereigns. Chaos cannot be bought — only earned.' : a.desc}</Text>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:aColor+'10', borderWidth:1, borderColor:aColor+'33' }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>SPECIALTY</Text>
                        <Text style={{ color:aColor, fontSize:11 }}>{a.specialty}</Text>
                      </View>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:SOL_THEME.border+'44', borderWidth:1, borderColor:SOL_THEME.border }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>AFFINITY</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>{a.affinity}</Text>
                      </View>
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', marginTop:8, opacity:0.5 }}>
                      Eyes: {a.eyes.present}  ·  Default skin: {a.defaultSkin.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:20 }} />
            </ScrollView>
            <TouchableOpacity onPress={() => setShowArchSelect(false)} style={{ marginTop:8, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── NAME + LEVEL ───────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:8 }}>
        {/* Archetype badge + choose button */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
            <View>
              <Text style={{ color, fontSize:12, fontWeight:'700', fontFamily:mono }}>{archetype.name}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowArchSelect(true)} style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:color+'66', backgroundColor:color+'12' }}>
            <Text style={{ color, fontSize:10, fontFamily:mono, letterSpacing:1 }}>CHANGE</Text>
          </TouchableOpacity>
        </View>
        {/* Name + level */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <TouchableOpacity onPress={() => { setNameDraft(companionName); setEditingName(true); }} style={{ flex:1 }}>
            {companionName
              ? <Text style={{ color, fontSize:15, fontWeight:'700', fontFamily:mono }}>{companionName} ✎</Text>
              : <Text style={{ color:SOL_THEME.textMuted, fontSize:12, fontStyle:'italic' }}>tap to name your companion</Text>
            }
          </TouchableOpacity>
          <Text style={{ color, fontSize:11, fontFamily:mono, fontWeight:'700' }}>{lvl.cur.glyph}  LV.{lvl.level}  {lvl.cur.title.toUpperCase()}</Text>
        </View>
      </View>

      {/* ── NAME MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={editingName} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:16, padding:24, borderWidth:1, borderColor:color+'55' }}>
            <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:12 }}>NAME YOUR COMPANION</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Enter a name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1, borderColor:color+'44', borderRadius:8, padding:12, color:SOL_THEME.text, fontSize:16, fontFamily:mono, marginBottom:16 }} />
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={{ flex:1, padding:12, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
                <Text style={{ color:SOL_THEME.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                const name = nameDraft.trim(); setCompanionName(name);
                await AsyncStorage.setItem('sol_companion_name', name);
                setEditingName(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }} style={{ flex:1, padding:12, borderRadius:8, backgroundColor:color+'22', borderWidth:1, borderColor:color, alignItems:'center' }}>
                <Text style={{ color, fontWeight:'700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MILESTONE TOAST ──────────────────────────────────────────────── */}
      {milestone && (
        <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000EE', justifyContent:'center', alignItems:'center', padding:40, zIndex:100, transform:[{scale:milestoneAnim}], opacity:milestoneAnim }}>
          <TouchableOpacity onPress={() => setMilestone(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:16 }}>
            <Text style={{ color, fontSize:52, fontFamily:mono }}>{milestone.glyph}</Text>
            <Text style={{ color, fontSize:18, fontWeight:'700', letterSpacing:2, fontFamily:mono, textAlign:'center' }}>{milestone.title}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:13, lineHeight:21, textAlign:'center', fontStyle:'italic' }}>{milestone.body}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, marginTop:12, opacity:0.5 }}>tap to continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── DREAM FRAGMENT ───────────────────────────────────────────────── */}
      {dreamFragment && (
        <Animated.View style={{ position:'absolute', bottom:0, left:0, right:0, opacity:dreamAnim, zIndex:90, pointerEvents:'none' }}>
          <TouchableOpacity onPress={() => setDreamFragment(null)} activeOpacity={0.8} style={{ margin:16, padding:16, borderRadius:14, borderWidth:1, borderColor:dreamFragment.color+'44', backgroundColor:'#000000DD', flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ color:dreamFragment.color, fontSize:22 }}>{dreamFragment.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#555566', fontSize:8, letterSpacing:3, fontFamily:mono, marginBottom:4 }}>DREAM FRAGMENT</Text>
              <Text style={{ color:'#AAAACC', fontSize:12, lineHeight:18, fontStyle:'italic' }}>{dreamFragment.text}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── EVOLUTION CEREMONY ──────────────────────────────────────────── */}
      {evolutionCeremony && (() => {
        const s = STAGES[evolutionCeremony.stage];
        return (
          <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000F5', justifyContent:'center', alignItems:'center', padding:32, zIndex:110, opacity:ceremonyAnim, transform:[{ scale: ceremonyAnim.interpolate({ inputRange:[0,1], outputRange:[0.92,1] }) }] }}>
            <TouchableOpacity onPress={() => setEvolutionCeremony(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:20 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:4, fontFamily:mono }}>✦  EVOLUTION  ✦</Text>
              <Text style={{ color, fontSize:11, letterSpacing:3, fontFamily:mono, fontWeight:'700' }}>{s.name}</Text>
              <View style={{ backgroundColor:'#0A0A0A', borderRadius:14, borderWidth:1, borderColor:color+'55', padding:20, width:'100%', alignItems:'center' }}>
                {s.body.map((line, i) => (
                  <Text key={i} style={{ color, fontSize:13, fontFamily:mono, lineHeight:20 }}>{line}</Text>
                ))}
                <Text style={{ color:color+'88', fontSize:11, fontFamily:mono, marginTop:6 }}>{s.ground}</Text>
              </View>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:20, textAlign:'center', fontStyle:'italic', paddingHorizontal:8 }}>{s.lore}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, opacity:0.4, letterSpacing:1 }}>tap to continue · fades in 5s</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })()}

      {/* ── EVOLUTION PATH CEREMONY ──────────────────────────────────────── */}
      <Modal visible={showPathCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000F4' }}>
          <Animated.View style={{ flex:1, opacity:pathCeremonyAnim }}>
            <ScrollView contentContainerStyle={{ padding:28, paddingTop:64 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color:color, fontSize:9, letterSpacing:5, fontFamily:mono, textAlign:'center', marginBottom:6 }}>◈  FLAME REACHED  ◈</Text>
              <Text style={{ color:SOL_THEME.text, fontSize:21, fontWeight:'700', textAlign:'center', marginBottom:8, lineHeight:30 }}>
                Your companion stands{'\n'}at a crossroads.
              </Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, textAlign:'center', fontStyle:'italic', marginBottom:32, lineHeight:20 }}>
                Three paths diverge from here.{'\n'}Each leads somewhere no other path can go.{'\n'}Choose. It cannot be undone.
              </Text>

              {archetype.paths.map((path) => {
                const pathColors: Record<EvoPath, string> = { A: color, B: color + 'CC', C: color + '99' };
                const pc = pathColors[path.id];
                return (
                  <TouchableOpacity
                    key={path.id}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setEvoPath(path.id);
                      setShowPathCeremony(false);
                      await AsyncStorage.setItem('sol_companion_path', path.id);
                      setPhrase(`The path is chosen. ${path.name} rises.`);
                    }}
                    activeOpacity={0.85}
                    style={{ marginBottom:16, padding:20, borderRadius:16, borderWidth:1.5, borderColor:pc + '55', backgroundColor:pc + '0C' }}
                  >
                    <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:pc + '44', backgroundColor:pc + '14', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:pc, fontSize:16, fontFamily:mono, fontWeight:'700' }}>{path.id}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:pc, fontSize:15, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{path.name}</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, fontStyle:'italic', marginTop:2 }}>{path.title}</Text>
                      </View>
                    </View>
                    {/* SVG preview at stage 3 */}
                    <View style={{ alignItems:'center', marginBottom:10, opacity:0.85 }}>
                      <CreatureSvg archId={archetype.id} stage={3} color={pc} path={path.id} />
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18 }}>{path.desc}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── NAMING RITUAL ────────────────────────────────────────────────── */}
      <Modal visible={showNamingRitual} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000F0', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:20, padding:28, borderWidth:1.5, borderColor:color }}>
            <Text style={{ color, fontSize:10, letterSpacing:3, fontFamily:mono, textAlign:'center', marginBottom:4 }}>✦  FLAME REACHED  ✦</Text>
            <Text style={{ color:SOL_THEME.text, fontSize:17, fontWeight:'700', textAlign:'center', marginBottom:8 }}>
              Your companion has grown enough to carry a true name.
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:19, textAlign:'center', marginBottom:20, fontStyle:'italic' }}>
              A name given here cannot be taken. It will live in the creature's lore. Speak it only when you are certain.
            </Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="The true name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1.5, borderColor:color+'66', borderRadius:10, padding:14, color:SOL_THEME.text, fontSize:18, fontFamily:mono, marginBottom:16, textAlign:'center' }} />
            <TouchableOpacity onPress={async () => {
              const name = nameDraft.trim();
              if (!name) return;
              setCompanionName(name); setShowNamingRitual(false);
              await AsyncStorage.multiSet([['sol_companion_name', name], ['sol_companion_named', 'true']]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
            }} style={{ paddingVertical:14, borderRadius:12, backgroundColor:color+'22', borderWidth:1.5, borderColor:color, alignItems:'center', marginBottom:10 }}>
              <Text style={{ color, fontSize:15, fontWeight:'700', letterSpacing:2, fontFamily:mono }}>BESTOW THE NAME</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              setShowNamingRitual(false);
              await AsyncStorage.setItem('sol_companion_named', 'true');
            }} style={{ alignItems:'center', padding:8 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>name it later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── RELIC DROP ────────────────────────────────────────────────────── */}
      {newRelic && (
        <Animated.View style={{ marginHorizontal:16, marginBottom:14, padding:16, borderRadius:12, borderWidth:1.5, borderColor:color, backgroundColor:color+'15', transform:[{scale:relicAnim}] }}>
          <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>✦ RELIC EARNED</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ fontSize:28 }}>{newRelic.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:14, fontWeight:'700' }}>{newRelic.name}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, marginTop:2 }}>{newRelic.desc}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setNewRelic(null)} style={{ marginTop:10, alignSelf:'flex-end' }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── EVOLUTION + XP ────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:14, gap:10, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'2A', backgroundColor:cardBg }}>
        <View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
            <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, opacity:0.75 }}>EVOLUTION · {stageData.name}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontFamily:mono }}>
              {stage<5 ? `${totalDives}/${stageData.nextAt} → ${STAGES[(stage+1) as EvolutionStage]?.name}` : '∞ SOVEREIGN'}
            </Text>
          </View>
          <View style={{ height:5, backgroundColor:color+'22', borderRadius:3 }}>
            <View style={{ height:5, width:`${Math.round(evProg*100)}%`, backgroundColor:color, borderRadius:3 }} />
          </View>
        </View>
        <View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
            <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, opacity:0.75 }}>XP · {xp}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontFamily:mono }}>
              {lvl.next ? `→ ${lvl.next.title} at ${lvl.next.xp}` : 'MAX'}
            </Text>
          </View>
          <View style={{ height:3, backgroundColor:color+'22', borderRadius:2 }}>
            <View style={{ height:3, width:`${Math.round(lvl.progress*100)}%`, backgroundColor:color, borderRadius:2, opacity:0.7 }} />
          </View>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, marginTop:3, fontFamily:mono }}>
            {totalDives}×10 dives  +  {Math.min(streak,30)}×15 streak
          </Text>
        </View>
      </View>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <View style={{ flexDirection:'row', gap:7, marginHorizontal:16, marginBottom:14 }}>
        {[
          { label:'DIVES',  value:totalDives.toString() },
          { label:'WEEK',   value:divesThisWeek.toString() },
          { label:'STREAK', value:streak>0?`${streak}d`:'—' },
          { label:'LQ',     value:avgLQ>0?`${(avgLQ*100).toFixed(0)}%`:'—' },
          { label:'RELICS', value:earnedRelicData.length.toString() },
        ].map(({ label, value }) => (
          <View key={label} style={{ flex:1, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border, backgroundColor:SOL_THEME.surface, alignItems:'center', gap:2 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:7, letterSpacing:1.5, fontFamily:mono }}>{label}</Text>
            <Text style={{ color, fontSize:14, fontWeight:'700', fontFamily:mono }}>{value}</Text>
          </View>
        ))}
      </View>

      {/* ── BATTLE ────────────────────────────────────────────────────────── */}
      <View onLayout={e => { battleY.current = e.nativeEvent.layout.y; }} style={{ marginHorizontal:16, marginBottom:14, padding:16, borderRadius:14, borderWidth:1.5, borderColor:'#FF444455', backgroundColor:'#130000' }}>
        {/* Header — wave counter */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>ENTROPY WAVES</Text>
            {(battle?.wave ?? 1) > 1 && (
              <View style={{ backgroundColor:'#FF440022', borderRadius:6, paddingHorizontal:6, paddingVertical:2 }}>
                <Text style={{ color:'#FF6644', fontSize:9, fontFamily:mono, letterSpacing:1 }}>WAVE {battle?.wave}</Text>
              </View>
            )}
          </View>
          <Text style={{ color:'#FF6666', fontSize:10, fontFamily:mono }}>{tokensLeft} strikes</Text>
        </View>

        {battle && !battle.won && <>
          {/* Entity HP bar */}
          <View style={{ marginBottom:12 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
              <Text style={{ color:'#FF6666', fontSize:14, fontWeight:'700' }}>{battle.entityName}</Text>
              <Text style={{ color:'#FF4444', fontSize:11, fontFamily:mono }}>{battle.entityHP}/{battle.maxHP} HP</Text>
            </View>
            <View style={{ height:8, backgroundColor:'#330000', borderRadius:4, overflow:'hidden' }}>
              <View style={{ height:8, width:`${Math.round((battle.entityHP/battle.maxHP)*100)}%`, backgroundColor:'#FF4444', borderRadius:4 }} />
            </View>
          </View>

          {/* Power + XP row */}
          <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}>
            <View style={{ flex:1, paddingVertical:10, paddingHorizontal:12, borderRadius:8, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono }}>ATK POWER</Text>
              <Text style={{ color, fontSize:22, fontWeight:'700', fontFamily:mono }}>{attackPower}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9 }}>LQ × 100 + gear</Text>
            </View>
            <View style={{ flex:1, paddingVertical:10, paddingHorizontal:12, borderRadius:8, borderWidth:1, borderColor:'#FF444433', backgroundColor:'#FF000008' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono }}>WAVE XP</Text>
              <Text style={{ color:'#FF6666', fontSize:22, fontWeight:'700', fontFamily:mono }}>{battle.waveXP}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9 }}>+{battle.wave * 20} on clear</Text>
            </View>
          </View>

          {/* STRIKE button — big, tappable */}
          <TouchableOpacity
            onPress={handleAttack}
            disabled={tokensLeft <= 0 || attackAnim}
            style={{ paddingVertical:18, borderRadius:12, borderWidth:2, borderColor:tokensLeft > 0 ? '#FF4444' : SOL_THEME.border, backgroundColor:tokensLeft > 0 ? '#FF000022' : 'transparent', alignItems:'center', marginBottom:8 }}
          >
            <Text style={{ color:tokensLeft > 0 ? '#FF6666' : SOL_THEME.textMuted, fontSize:18, fontWeight:'700', letterSpacing:3, fontFamily:mono }}>
              {attackAnim ? '· · ·' : '⚔  STRIKE'}
            </Text>
            {tokensLeft > 0 && <Text style={{ color:'#FF444488', fontSize:10, fontFamily:mono, marginTop:3 }}>{tokensLeft} strikes remaining</Text>}
          </TouchableOpacity>

          {/* Retreat button */}
          {battle.wave > 1 && (
            <TouchableOpacity onPress={handleRetreat} style={{ paddingVertical:8, alignItems:'center', marginBottom:8 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontFamily:mono, letterSpacing:2 }}>↩ RETREAT TO WAVE 1</Text>
            </TouchableOpacity>
          )}

          {/* Combat log */}
          {battle.log.length > 0 && (
            <View style={{ gap:3 }}>
              {battle.log.map((entry, i) => (
                <Text key={i} style={{ color: entry.includes('✧CHAOS') ? '#FF9F1C' : i === 0 ? '#FF8888' : SOL_THEME.textMuted, fontSize:10, fontFamily:mono, opacity:1-i*0.15 }}>
                  › {entry}
                </Text>
              ))}
            </View>
          )}
        </>}

        {/* Wave cleared — shows briefly before auto-chain */}
        {battle?.won && (
          <View style={{ alignItems:'center', gap:8, paddingVertical:12 }}>
            <Text style={{ color:'#FF6666', fontSize:28, fontFamily:mono }}>✕</Text>
            <Text style={{ color:'#FF8866', fontSize:15, fontWeight:'700' }}>WAVE {battle.wave} CLEARED</Text>
            <Text style={{ color:color, fontSize:13, fontFamily:mono }}>+{battle.wave * 20} XP</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:11, fontStyle:'italic' }}>Next wave rising…</Text>
          </View>
        )}

        <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontStyle:'italic', marginTop:8, opacity:0.4 }}>
          LQ score = attack power · waves never end · LYCHEETAH gets chaos multipliers
        </Text>
      </View>

      {/* ── FEED ──────────────────────────────────────────────────────────── */}
      <View onLayout={e => { feedY.current = e.nativeEvent.layout.y; }} style={{ marginHorizontal:16, marginBottom:14, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'33', backgroundColor:cardBg }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>FEED YOUR COMPANION</Text>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{fedToday.length}/3 today</Text>
        </View>
        <View style={{ flexDirection:'row', gap:8 }}>
          {dailyFoods.map(food => {
            const eaten = fedToday.includes(food.id);
            return (
              <TouchableOpacity key={food.id} onPress={() => handleFeed(food)} disabled={eaten} style={{ flex:1, paddingVertical:14, paddingHorizontal:4, borderRadius:12, borderWidth:1.5, borderColor:eaten?color+'55':food.color+'66', backgroundColor:eaten?color+'10':food.color+'0D', alignItems:'center', gap:5, opacity:eaten?0.65:1 }}>
                <Text style={{ fontSize:22 }}>{food.glyph}</Text>
                <Text style={{ color:eaten?color:food.color, fontSize:8, fontFamily:mono, letterSpacing:1, textAlign:'center' }}>{food.domain.toUpperCase()}</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9 }}>+{food.xp} XP</Text>
                {eaten && <Text style={{ color, fontSize:11 }}>✓ fed</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', marginTop:8, opacity:0.45 }}>
          3 domain foods refresh daily. Tap to feed — companion reacts.
        </Text>
      </View>

      {/* ── NEEDS ─────────────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:SOL_THEME.border, backgroundColor:SOL_THEME.surface }}>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:12 }}>COMPANION NEEDS</Text>
        {[
          { label:'HUNGER', value:hunger, desc:'Feed domain foods',      full:'#E8C76A' },
          { label:'WISDOM', value:wisdom, desc:'Study quality (LQ avg)', full:'#7B8FE8' },
          { label:'ENERGY', value:energy, desc:'Recency of study',       full:'#6AE8A0' },
        ].map(({ label, value, desc, full }) => (
          <View key={label} style={{ marginBottom:10 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>{label}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontStyle:'italic' }}>{desc}</Text>
            </View>
            <View style={{ height:6, backgroundColor:'#1A1A2A', borderRadius:3, overflow:'hidden' }}>
              <View style={{ height:6, width:`${Math.round(value*100)}%`, backgroundColor:full, borderRadius:3 }} />
            </View>
          </View>
        ))}
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', marginTop:2, opacity:0.5 }}>
          {hunger<0.3&&energy<0.3 ? 'The companion rests. Come study.' : hunger>=1&&wisdom>=0.8 ? 'Well fed. The companion glows.' : 'Needs grow through the Work.'}
        </Text>
      </View>

      {/* ── LAMAGUE GEAR ──────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:14, padding:16, borderRadius:12, borderWidth:1, borderColor:color+'33', backgroundColor:cardBg }}>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:4 }}>LAMAGUE EQUIPMENT</Text>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', marginBottom:12, opacity:0.65 }}>
          Gear unlocks from dive milestones. Symbols from the LAMAGUE corpus.
        </Text>
        {([['CROWN', gearCrown, nextCrown], ['SIGIL', gearSigil, nextSigil], ['MANTLE', gearMantle, nextMantle]] as [string, GearTier, GearTier|null][]).map(([slotName, gear, next]) => (
          <View key={slotName} style={{ marginBottom:10, paddingBottom:10, borderBottomWidth:1, borderBottomColor:SOL_THEME.border+'55' }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
              <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:gear.threshold>0?color+'66':SOL_THEME.border, backgroundColor:gear.threshold>0?color+'10':'transparent', alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color:gear.threshold>0?color:SOL_THEME.textMuted, fontSize:16 }}>{gear.glyph}</Text>
              </View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono }}>{slotName}</Text>
                  {next && <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono }}>next at {next.threshold} dives</Text>}
                </View>
                <Text style={{ color:gear.threshold>0?color:SOL_THEME.textMuted, fontSize:12, fontWeight:'600', marginTop:1 }}>{gear.name}</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1 }}>{gear.effect}</Text>
              </View>
            </View>
          </View>
        ))}
        {allGearEquipped && (
          <View style={{ marginTop:4, paddingTop:8, alignItems:'center' }}>
            <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:1 }}>✦ FULL LOADOUT ACTIVE</Text>
          </View>
        )}
      </View>

      {/* ── DAILY QUESTS ──────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:14 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>DAILY QUESTS</Text>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{quests.filter(q=>q.check(questData)).length}/{quests.length}</Text>
        </View>
        <View style={{ gap:8 }}>
          {quests.map(q => {
            const done = q.check(questData);
            return (
              <View key={q.id} style={{ padding:12, borderRadius:10, borderWidth:1, borderColor:done?color+'55':SOL_THEME.border, backgroundColor:done?color+'0C':SOL_THEME.surface, flexDirection:'row', alignItems:'center', gap:12 }}>
                <Text style={{ fontSize:16, opacity:done?1:0.3 }}>{done?'✓':'○'}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ color:done?color:SOL_THEME.text, fontSize:13, fontWeight:'600' }}>{q.label}</Text>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1 }}>{q.desc}</Text>
                </View>
                <View style={{ alignItems:'center' }}>
                  <Text style={{ color:done?color:SOL_THEME.textMuted, fontSize:12, fontWeight:'700', fontFamily:mono }}>+{q.xp}</Text>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono }}>XP</Text>
                </View>
              </View>
            );
          })}
        </View>
        {quests.length>0 && quests.every(q=>q.check(questData)) && (
          <View style={{ marginTop:10, padding:12, borderRadius:10, borderWidth:1, borderColor:color, backgroundColor:color+'12', alignItems:'center' }}>
            <Text style={{ color, fontSize:13, fontWeight:'700' }}>✦ All quests complete</Text>
          </View>
        )}
      </View>

      {/* ── VIGIL ─────────────────────────────────────────────────────────── */}
      {vigilName && (
        <View style={{ marginHorizontal:16, marginBottom:12, padding:12, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, flexDirection:'row', alignItems:'center', gap:10 }}>
          <Text style={{ color, fontSize:18 }}>◎</Text>
          <View style={{ flex:1 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:1 }}>ACTIVE VIGIL</Text>
            <Text style={{ color:SOL_THEME.text, fontSize:13 }}>{vigilName}</Text>
          </View>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>+100 XP day 7</Text>
        </View>
      )}

      {/* ── RELICS ────────────────────────────────────────────────────────── */}
      {earnedRelicData.length>0 && (
        <View style={{ marginHorizontal:16, marginBottom:14 }}>
          <TouchableOpacity onPress={() => setShowRelics(r=>!r)} style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>RELICS ({earnedRelicData.length})</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10 }}>{showRelics?'▲':'▼'}</Text>
          </TouchableOpacity>
          {showRelics && (
            <View style={{ gap:6 }}>
              {earnedRelicData.map(r => (
                <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:12, padding:10, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border }}>
                  <Text style={{ fontSize:20 }}>{r.glyph}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'600' }}>{r.name}</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1 }}>{r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── COMPANION LORE ────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:SOL_THEME.border }}>
        <TouchableOpacity onPress={() => setShowLore(l=>!l)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>COMPANION LORE · {stageData.name}</Text>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:10 }}>{showLore?'▲':'▼'}</Text>
        </TouchableOpacity>
        {showLore && (
          <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:20, fontStyle:'italic', marginTop:10 }}>
            {stageData.lore}
          </Text>
        )}
      </View>

      {/* ── LAW ───────────────────────────────────────────────────────────── */}
      <View style={{ marginHorizontal:16, marginBottom:8, padding:14, borderRadius:12, borderWidth:1, borderColor:SOL_THEME.border }}>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>COMPANION LAW</Text>
        <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:19, fontStyle:'italic' }}>
          Never starves. Never dies. Never guilts. Absence is rest. Evolution earned through the Work — the form is sacred and cannot be bought.
        </Text>
      </View>

      {/* ── RPG STATS MODAL ───────────────────────────────────────────────── */}
      <Modal visible={showStatModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, borderWidth:1, borderColor:color+'33', borderBottomWidth:0 }}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <View>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:3, fontFamily:mono }}>CHARACTER SHEET</Text>
                <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>
                  {companionName || archetype.name}
                </Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
              </View>
              <Text style={{ color, fontSize:32 }}>{archetype.glyph}</Text>
            </View>

            {([
              { label:'ATK',  glyph:'⚔',  value:attackPower,                       desc:'LQ × 100 + gear + archetype',  col:'#FF6B6B' },
              { label:'DEF',  glyph:'◈',  value:Math.min(99, streak * 2),           desc:'Streak × 2',                  col:'#4ECDC4' },
              { label:'WIS',  glyph:'⊛',  value:Math.floor(avgLQ * 100),            desc:'Average LQ score',            col:'#9B6BFF' },
              { label:'BOND', glyph:'◉',  value:Math.min(99, totalDives + streak),  desc:'Dives + streak depth',        col:'#C49A3C' },
            ] as { label:string; glyph:string; value:number; desc:string; col:string }[]).map(({ label, glyph, value, desc, col }) => (
              <View key={label} style={{ marginBottom:14 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <Text style={{ color:col, fontSize:16 }}>{glyph}</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:10, letterSpacing:2, fontFamily:mono }}>{label}</Text>
                  </View>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <Text style={{ color:col, fontSize:22, fontWeight:'700', fontFamily:mono }}>{value}</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontStyle:'italic' }}>{desc}</Text>
                  </View>
                </View>
                <View style={{ height:5, backgroundColor:SOL_THEME.border, borderRadius:3, overflow:'hidden' }}>
                  <View style={{ height:5, width:`${Math.min(100, value)}%`, backgroundColor:col, borderRadius:3 }} />
                </View>
              </View>
            ))}

            <View style={{ marginTop:4, padding:12, borderRadius:10, borderWidth:1, borderColor:color+'33', backgroundColor:color+'0A' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:4 }}>ARCHETYPE BONUS</Text>
              <Text style={{ color, fontSize:12 }}>{archetype.specialty}</Text>
            </View>

            <TouchableOpacity onPress={() => setShowStatModal(false)} style={{ marginTop:16, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, fontFamily:mono }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
