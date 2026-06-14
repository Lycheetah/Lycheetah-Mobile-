import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Easing,
  Platform, Dimensions, TextInput, Modal, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { CreatureSvg } from '../../components/CreatureSvg';
import { sendMessage } from '../../lib/ai-client';
import { getProviderKey, getActiveKey, getModel } from '../../lib/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 340;
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── Types ────────────────────────────────────────────────────────────────────

type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type CompanionMood  = 'dormant' | 'present' | 'lit' | 'transcendent';
type SkinId        = 'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'chaos';
type GearSlot      = 'crown' | 'sigil' | 'mantle' | 'body' | 'cape';
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

// ─── Scene background images (drop JPGs into assets/scenes/) ─────────────────
// If an image exists for the skin it renders under all effects.
// Rename your files to match these keys exactly.
const SCENE_IMAGES: Partial<Record<SkinId, any>> = {
  solform:  require('../../assets/scenes/solform.png'),
  void:     require('../../assets/scenes/void.png'),
  aurora:   require('../../assets/scenes/aurora.png'),
  crimson:  require('../../assets/scenes/crimson.png'),
  obsidian: require('../../assets/scenes/obsidian.png'),
  chaos:    require('../../assets/scenes/chaos.png'),
};

// ─── Enemy images (drop JPGs into assets/enemies/) ────────────────────────────
// ─── Enemy roster ─────────────────────────────────────────────────────────────
type EnemyRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

type EnemyDef = {
  name: string;
  rarity: EnemyRarity;
  weight: number;
  hpMult: number;
  xpMult: number;
  colour: string;
  atk: number;          // base damage per turn
  lines: { enter: string; attack: string[]; death: string };
};

const RARITY_COLOUR: Record<EnemyRarity, string> = {
  common:    '#666677',
  uncommon:  '#4ECDC4',
  rare:      '#4A9EFF',
  epic:      '#9B6BFF',
  legendary: '#C49A3C',
};

const ENEMY_ROSTER: EnemyDef[] = [
  { name:'Dissolution',    rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You are already coming apart.', attack:['Unravelling…','Your form weakens.','Nothing holds here.'], death:'I was always you.' }},
  { name:'The Fog',        rarity:'common',    weight:10, hpMult:0.9, xpMult:0.9,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You cannot see what you cannot name.', attack:['The mist thickens.','Where were you going?','Lost again.'], death:'The fog lifts. For now.' }},
  { name:'Forgetting',     rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'What were you working on?', attack:['Slipping away…','Gone already.','What was its name?'], death:'You remembered me.' }},
  { name:'Stasis',         rarity:'common',    weight:10, hpMult:1.1, xpMult:1.0,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Stay. It is easier here.', attack:['No need to move.','Rest a while.','Tomorrow is fine.'], death:'Movement returns.' }},
  { name:'Inertia',        rarity:'common',    weight:10, hpMult:1.2, xpMult:1.1,  atk:10, colour:RARITY_COLOUR.common,
    lines:{ enter:'Starting is the hardest part.', attack:['The weight grows.','One more day.','Too heavy to lift.'], death:'The first step is taken.' }},
  { name:'Drift',          rarity:'common',    weight:10, hpMult:0.8, xpMult:0.9,  atk:5,  colour:RARITY_COLOUR.common,
    lines:{ enter:'No direction. That is fine.', attack:['Carried away…','Which way?','Adrift.'], death:'Direction found.' }},
  { name:'Static',         rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'The noise is comfortable now, isn\'t it.', attack:['Signal lost.','All noise.','Can\'t hear yourself.'], death:'Silence.' }},
  { name:'Null',           rarity:'common',    weight:10, hpMult:0.9, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Nothing here. Nothing anywhere.', attack:['Void expands.','Meaning drains.','What is the point?'], death:'Something remains.' }},
  { name:'Absence',        rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Something is missing. Did you notice?', attack:['More gone now.','The gap widens.','What did you lose?'], death:'Presence restored.' }},
  { name:'The Hollow',     rarity:'common',    weight:10, hpMult:1.1, xpMult:1.1,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Echo. Echo. Echo.', attack:['The emptiness spreads.','Nothing inside.','Hollow to the core.'], death:'Filled again.' }},
  { name:'The Drain',      rarity:'uncommon',  weight:5,  hpMult:1.3, xpMult:1.5,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You feel tired already.', attack:['Draining…','Energy siphoned.','Your light dims.'], death:'The flow reverses.' }},
  { name:'The Veil',       rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'What you see is not what is.', attack:['Illusion deepens.','False light.','Deceived again.'], death:'The veil tears.' }},
  { name:'Fracture',       rarity:'uncommon',  weight:5,  hpMult:1.5, xpMult:1.6,  atk:16, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The cracks are already there.', attack:['Breaking point.','Another crack.','Structural failure.'], death:'Mended.' }},
  { name:'The Weight',     rarity:'uncommon',  weight:5,  hpMult:1.6, xpMult:1.7,  atk:18, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'How long have you been carrying this?', attack:['Heavier now.','Shoulders drop.','The load increases.'], death:'Put down.' }},
  { name:'Corruption',     rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:15, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Small compromises. Reasonable ones.', attack:['It spreads.','A little more.','Almost normal now.'], death:'Purified.' }},
  { name:'The Warden',     rarity:'rare',      weight:2,  hpMult:2.0, xpMult:2.5,  atk:22, colour:RARITY_COLOUR.rare,
    lines:{ enter:'No one leaves the field without paying.', attack:['HOLD.','The gate is locked.','None shall pass.'], death:'The gate opens.' }},
  { name:'Null Sovereign', rarity:'rare',      weight:2,  hpMult:2.2, xpMult:2.8,  atk:25, colour:RARITY_COLOUR.rare,
    lines:{ enter:'I rule the space between your thoughts.', attack:['Dominion expands.','Bow to nothing.','The void commands.'], death:'Sovereignty broken.' }},
  { name:'Fracture Prime', rarity:'rare',      weight:2,  hpMult:2.5, xpMult:3.0,  atk:28, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Everything breaks eventually. I am the proof.', attack:['PRIME FRACTURE.','All things split.','Irreparable.'], death:'The prime fracture heals.' }},
  { name:'Entropy Prime',  rarity:'epic',      weight:1,  hpMult:3.5, xpMult:5.0,  atk:35, colour:RARITY_COLOUR.epic,
    lines:{ enter:'I am the reason nothing lasts.', attack:['ENTROPY SURGE.','Heat death incoming.','Order unravels.'], death:'Entropy contained. For now.' }},
  { name:"The Athanor's Shadow", rarity:'legendary', weight:1, hpMult:5.0, xpMult:10.0, atk:45, colour:RARITY_COLOUR.legendary,
    lines:{ enter:'You built something. I am what wanted to stop you.', attack:['THE SHADOW STRIKES.','All work undone.','The athanor darkens.'], death:'The shadow retreats. The Work continues.' }},
];

function pickEnemy(wave: number): EnemyDef {
  const pool = ENEMY_ROSTER.filter(e => {
    if (e.rarity === 'epic' && wave < 5) return false;
    if (e.rarity === 'legendary' && wave < 10) return false;
    return true;
  });
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return pool[0];
}

// Companion portraits — uncomment per archetype+stage as art lands in assets/companions/
// Naming: archetype_id + '_' + stage (0-5). Falls back to SVG if no image found.
const COMPANION_IMAGES: Record<string, any> = {
  // vigil_0:       require('../../assets/companions/vigil_0.png'),
  // vigil_1:       require('../../assets/companions/vigil_1.png'),
  // vigil_2:       require('../../assets/companions/vigil_2.png'),
  // vigil_3:       require('../../assets/companions/vigil_3.png'),
  // vigil_4:       require('../../assets/companions/vigil_4.png'),
  // vigil_5:       require('../../assets/companions/vigil_5.png'),
  // alchemist_0:   require('../../assets/companions/alchemist_0.png'),
  // alchemist_1:   require('../../assets/companions/alchemist_1.png'),
  // alchemist_2:   require('../../assets/companions/alchemist_2.png'),
  // alchemist_3:   require('../../assets/companions/alchemist_3.png'),
  // alchemist_4:   require('../../assets/companions/alchemist_4.png'),
  // alchemist_5:   require('../../assets/companions/alchemist_5.png'),
  // sentinel_0:    require('../../assets/companions/sentinel_0.png'),
  // sentinel_1:    require('../../assets/companions/sentinel_1.png'),
  // sentinel_2:    require('../../assets/companions/sentinel_2.png'),
  // sentinel_3:    require('../../assets/companions/sentinel_3.png'),
  // sentinel_4:    require('../../assets/companions/sentinel_4.png'),
  // sentinel_5:    require('../../assets/companions/sentinel_5.png'),
  // wanderer_0:    require('../../assets/companions/wanderer_0.png'),
  // wanderer_1:    require('../../assets/companions/wanderer_1.png'),
  // wanderer_2:    require('../../assets/companions/wanderer_2.png'),
  // wanderer_3:    require('../../assets/companions/wanderer_3.png'),
  // wanderer_4:    require('../../assets/companions/wanderer_4.png'),
  // wanderer_5:    require('../../assets/companions/wanderer_5.png'),
  // archivist_0:   require('../../assets/companions/archivist_0.png'),
  // archivist_1:   require('../../assets/companions/archivist_1.png'),
  // archivist_2:   require('../../assets/companions/archivist_2.png'),
  // archivist_3:   require('../../assets/companions/archivist_3.png'),
  // archivist_4:   require('../../assets/companions/archivist_4.png'),
  // archivist_5:   require('../../assets/companions/archivist_5.png'),
  // helix_0:       require('../../assets/companions/helix_0.png'),
  // helix_1:       require('../../assets/companions/helix_1.png'),
  // helix_2:       require('../../assets/companions/helix_2.png'),
  // helix_3:       require('../../assets/companions/helix_3.png'),
  // helix_4:       require('../../assets/companions/helix_4.png'),
  // helix_5:       require('../../assets/companions/helix_5.png'),
};

// Enemy images — uncomment as assets land in assets/enemies/
const ENEMY_IMAGES: Record<string, any> = {
  dissolution:          require('../../assets/enemies/dissolution.png'),
  the_fog:              require('../../assets/enemies/the_fog.png'),
  forgetting:           require('../../assets/enemies/forgetting.png'),
  stasis:               require('../../assets/enemies/stasis.png'),
  inertia:              require('../../assets/enemies/inertia.png'),
  drift:                require('../../assets/enemies/drift.png'),
  static:               require('../../assets/enemies/static.png'),
  null:                 require('../../assets/enemies/null.png'),
  absence:              require('../../assets/enemies/absence.png'),
  the_hollow:           require('../../assets/enemies/the_hollow.png'),
  the_drain:            require('../../assets/enemies/the_drain.png'),
  the_veil:             require('../../assets/enemies/the_veil.png'),
  fracture:             require('../../assets/enemies/fracture.png'),
  the_weight:           require('../../assets/enemies/the_weight.png'),
  corruption:           require('../../assets/enemies/corruption.png'),
  the_warden:           require('../../assets/enemies/the_warden.png'),
  null_sovereign:       require('../../assets/enemies/null_sovereign.png'),
  fracture_prime:       require('../../assets/enemies/fracture_prime.png'),
  entropy_prime:        require('../../assets/enemies/entropy_prime.png'),
  athanors_shadow:      require('../../assets/enemies/athanors_shadow.png'),
};

// Gear overlay images — drop art in assets/gear/ and uncomment per tier
// Naming: slot_tiername (lowercase, underscores). Renders as overlay on companion body.
const GEAR_IMAGES: Record<string, any> = {
  // crown_ember_circlet:    require('../../assets/gear/crown_ember_circlet.png'),
  // crown_sight_crown:      require('../../assets/gear/crown_sight_crown.png'),
  // crown_forge_crown:      require('../../assets/gear/crown_forge_crown.png'),
  // crown_sovereign_halo:   require('../../assets/gear/crown_sovereign_halo.png'),
  // body_thread_robe:       require('../../assets/gear/body_thread_robe.png'),
  // body_scholar_robe:      require('../../assets/gear/body_scholar_robe.png'),
  // body_void_robe:         require('../../assets/gear/body_void_robe.png'),
  // body_sovereign_robe:    require('../../assets/gear/body_sovereign_robe.png'),
  // cape_shadow_cape:       require('../../assets/gear/cape_shadow_cape.png'),
  // cape_drift_cape:        require('../../assets/gear/cape_drift_cape.png'),
  // cape_void_cape:         require('../../assets/gear/cape_void_cape.png'),
  // cape_sovereign_wings:   require('../../assets/gear/cape_sovereign_wings.png'),
  // mantle_dust_mantle:     require('../../assets/gear/mantle_dust_mantle.png'),
  // mantle_aura_mantle:     require('../../assets/gear/mantle_aura_mantle.png'),
  // mantle_flame_mantle:    require('../../assets/gear/mantle_flame_mantle.png'),
  // mantle_sovereign_mantle:require('../../assets/gear/mantle_sovereign_mantle.png'),
  // sigil_fracture_sigil:   require('../../assets/gear/sigil_fracture_sigil.png'),
  // sigil_spark_sigil:      require('../../assets/gear/sigil_spark_sigil.png'),
  // sigil_omega_sigil:      require('../../assets/gear/sigil_omega_sigil.png'),
};
function getGearImage(slot: GearSlot, gearName: string): any {
  const key = `${slot}_${gearName.toLowerCase().replace(/\s+/g, '_')}`;
  return GEAR_IMAGES[key] ?? null;
}

function getEnemyImage(name: string) {
  const key = name.toLowerCase().replace(/[\s']+/g, '_');
  return ENEMY_IMAGES[key] ?? null;
}

function getEnemyDef(name: string): EnemyDef {
  return ENEMY_ROSTER.find(e => e.name === name) ?? ENEMY_ROSTER[0];
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

type EvoPathDef = { id: EvoPath; name: string; title: string; desc: string };

type Archetype = {
  id: ArchetypeId; name: string; title: string; glyph: string;
  desc: string; specialty: string; affinity: string;
  defaultSkin: SkinId;
  accentColor: string; sceneSymbols: string[];
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
    defaultSkin: 'solform', accentColor: '#5588FF', sceneSymbols: ['§','⊛','¶','⊛'],
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
    defaultSkin: 'crimson', accentColor: '#44DD88', sceneSymbols: ['△','▽','△','▽'],
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
    defaultSkin: 'void', accentColor: '#BB77EE', sceneSymbols: ['◌','⊜','◍','⊜'],
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
    defaultSkin: 'aurora', accentColor: '#77AACC', sceneSymbols: ['◈','□','◈','□'],
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
    defaultSkin: 'aurora', accentColor: '#DDAA44', sceneSymbols: ['·','◦','·','◦'],
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
    defaultSkin: 'chaos', accentColor: '#FF7755', sceneSymbols: ['✧','✦','✧','✦'],
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

type RelicDef = {
  id: string; glyph: string; name: string; desc: string;
  bonus?: Partial<PlayerStats>;
  lore?: string;
};
const RELIC_POOL: RelicDef[] = [
  { id:'vigil_flame',   glyph:'🜂', name:'Flame Relic',     desc:'Completed a 7-day Vigil.',
    bonus:{ wil:4, res:3 },
    lore:'Seven consecutive days of fire. The Vigil does not ask if you are ready. It only asks if you showed up.' },
  { id:'streak_7',      glyph:'⊹', name:'Seven-Day Mark',  desc:'7 consecutive days.',
    bonus:{ spd:2, lck:2 },
    lore:'Seven is the first prime the body learns. After seven days, the habit has a skeleton.' },
  { id:'streak_30',     glyph:'✦', name:'Month Mark',      desc:'30 days of practice.',
    bonus:{ atk:4, wil:4 },
    lore:'Thirty days. The field no longer asks for permission. It simply runs.' },
  { id:'sovereign_100', glyph:'⊛', name:'Century Mark',    desc:'100 dives completed.',
    bonus:{ vit:6, def:4 },
    lore:'A hundred descents into the unknown. You have paid the toll. The gate remembers your face.' },
  { id:'sovereign_200', glyph:'⊕', name:'Bicentenary',     desc:'200 dives. Sovereign.',
    bonus:{ atk:6, wil:6, vit:8 },
    lore:'Two hundred dives. The alchemists called this the Rubedo — the reddening, the completion. You have done the Work.' },
  { id:'entropy_slain', glyph:'✕', name:'Entropy Slain',   desc:'Defeated an entropy entity.',
    bonus:{ atk:5, res:4 },
    lore:'You met Dissolution and held form. That is everything. The field registered it.' },
  { id:'well_fed',      glyph:'◉', name:'Well Fed',         desc:'Fed companion 3 foods in one day.',
    bonus:{ vit:3, lck:2 },
    lore:'Nourishment is not weakness — it is infrastructure. The well-fed field operates at full voltage.' },
  { id:'gear_full',     glyph:'⊜', name:'Full Loadout',    desc:'All five gear slots equipped.',
    bonus:{ def:5, res:5 },
    lore:'The full armament. Each piece chosen. This is not decoration — it is declaration.' },
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
  body: [
    { threshold: 0,   glyph: '◌', name: 'UNROBED',           effect: 'Unactivated.' },
    { threshold: 15,  glyph: '◦', name: 'THREAD ROBE',       effect: '+5% XP from all sources.' },
    { threshold: 40,  glyph: '⊚', name: 'SCHOLAR ROBE',      effect: 'Library dives grant +1 token.' },
    { threshold: 80,  glyph: '✦', name: 'VOID ROBE',         effect: 'Entropy damage reduced 15%.' },
    { threshold: 175, glyph: '⊕', name: 'SOVEREIGN ROBE',    effect: 'Evolution threshold reduced 10%.' },
  ],
  cape: [
    { threshold: 0,   glyph: '◌', name: 'NONE',              effect: 'Unactivated.' },
    { threshold: 25,  glyph: '◦', name: 'SHADOW CAPE',       effect: 'Companion recovers 1 token on victory.' },
    { threshold: 60,  glyph: '⊚', name: 'DRIFT CAPE',        effect: 'Idle XP decay halved.' },
    { threshold: 120, glyph: '✦', name: 'VOID CAPE',         effect: 'One free revival per week.' },
    { threshold: 250, glyph: '⊕', name: 'SOVEREIGN WINGS',   effect: 'All mood bonuses doubled.' },
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
  playerHP: number; maxPlayerHP: number;
  tokens: number; won: boolean;
  defending: boolean;
  enemyLine: string;
  loot: string | null;
  log: string[]; waveXP: number;
  enemyStunned: boolean;
  playerShielded: boolean;
  lastPlayerDmg: number;
};

// ─── Player stat model ───────────────────────────────────────────────────────
type PlayerStats = { atk:number; def:number; spd:number; wil:number; lck:number; vit:number; res:number };

const ARCHETYPE_STAT_BASES: Record<ArchetypeId, PlayerStats> = {
  //                atk  def  spd  wil  lck  vit  res
  archivist:  { atk: 8,  def:10, spd:10, wil:20, lck: 8, vit:12, res:12 }, // spell/knowledge — wil peak
  alchemist:  { atk:14, def:10, spd:12, wil:16, lck:12, vit:14, res: 8 }, // balanced transformer
  oracle:     { atk: 6,  def: 6, spd:18, wil:22, lck:16, vit: 8, res:12 }, // glass cannon seer
  sentinel:   { atk:20, def:22, spd: 5, wil: 6, lck: 5, vit:22, res:20 }, // tank — def/vit peak
  wanderer:   { atk:10, def: 8, spd:22, wil:10, lck:20, vit:10, res:10 }, // speed/luck — spd peak
  lycheetah:  { atk:22, def: 5, spd:15, wil:10, lck:22, vit: 8, res: 6 }, // chaos — atk/lck peak
};

function computePlayerStats(archId: ArchetypeId, lqAvg: number, totalDives: number): PlayerStats {
  const base = ARCHETYPE_STAT_BASES[archId] ?? ARCHETYPE_STAT_BASES.archivist;
  const lvl  = Math.floor(totalDives / 15);
  const lqM  = 0.75 + lqAvg * 0.5; // 0.75 → 1.25
  const s = (b: number, w = 1) => Math.max(1, Math.round((b + lvl * w) * lqM));
  return { atk: s(base.atk,1.2), def: s(base.def,0.8), spd: s(base.spd,0.5), wil: s(base.wil,1.2), lck: s(base.lck,0.6), vit: s(base.vit,1.0), res: s(base.res,0.4) };
}

function applyRelicBonuses(base: PlayerStats, earnedRelics: string[], inventory: string[]): PlayerStats {
  const out = { ...base };
  // Achievement relic bonuses
  for (const id of earnedRelics) {
    const r = RELIC_POOL.find(x => x.id === id);
    if (r?.bonus) {
      for (const k of Object.keys(r.bonus) as (keyof PlayerStats)[]) {
        out[k] = (out[k] || 0) + (r.bonus[k] ?? 0);
      }
    }
  }
  // Loot inventory bonuses (stored as names e.g. "NULL SHARD")
  for (const name of inventory) {
    const l = LOOT_TABLE.find(x => x.name === name || x.id === name);
    if (l?.bonus) {
      for (const k of Object.keys(l.bonus) as (keyof PlayerStats)[]) {
        out[k] = (out[k] || 0) + (l.bonus[k] ?? 0);
      }
    }
  }
  // Set bonuses: 3+ common → +2 RES, 3+ uncommon → +3 ATK, 2+ rare → +5 DEF+ATK, any epic → +6 WIL
  const counts = { common: 0, uncommon: 0, rare: 0, epic: 0 };
  for (const name of inventory) {
    const l = LOOT_TABLE.find(x => x.name === name || x.id === name);
    if (l) counts[l.rarity]++;
  }
  if (counts.common >= 3)   out.res += 2;
  if (counts.uncommon >= 3) out.atk += 3;
  if (counts.rare >= 2)     { out.def += 5; out.atk += 5; }
  if (counts.epic >= 1)     out.wil += 6;
  return out;
}

type SpellDef = { id: string; name: string; cost: number; fx: string; type: string; mult?: number; flatHeal?: number };
const ARCHETYPE_SPELLS: Record<string, SpellDef[]> = {
  vigil:     [
    { id:'lantern_flash', name:'LANTERN FLASH', cost:2, fx:'Hit + stun — enemy skips counter',    type:'stun',    mult:1.4 },
    { id:'archive_seal',  name:'ARCHIVE SEAL',  cost:3, fx:'2× sealed strike',                     type:'damage',  mult:2.0 },
    { id:'tower_ward',    name:'TOWER WARD',     cost:2, fx:'Block all damage this turn',           type:'shield' },
  ],
  alchemist: [
    { id:'acid_flask',    name:'ACID FLASK',    cost:2, fx:'1.5× hit + enemy weakened',            type:'damage',  mult:1.5 },
    { id:'transmute',     name:'TRANSMUTE',     cost:3, fx:'1.6× hit + heal 30% back',             type:'drain',   mult:1.6 },
    { id:'forge_burst',   name:'FORGE BURST',   cost:3, fx:'2.2× explosive blast',                 type:'damage',  mult:2.2 },
  ],
  sentinel:  [
    { id:'shield_slam',   name:'SHIELD SLAM',   cost:2, fx:'Hit + block counter this turn',        type:'stun',    mult:1.3 },
    { id:'crystal_lock',  name:'CRYSTAL LOCK',  cost:2, fx:'Stun enemy — no counter',              type:'stun',    mult:0.9 },
    { id:'resonance',     name:'RESONANCE',     cost:3, fx:'Repeat your last hit exactly',         type:'boost' },
  ],
  wanderer:  [
    { id:'dust_step',     name:'DUST STEP',     cost:1, fx:'Dodge — no counter this turn',         type:'shield',  mult:0 },
    { id:'horizon_pull',  name:'HORIZON PULL',  cost:2, fx:'1.6× hit + heal 20 HP',               type:'drain',   mult:1.6, flatHeal:20 },
    { id:'wind_strike',   name:'WIND STRIKE',   cost:2, fx:'3 rapid hits — 1.2× total',           type:'damage',  mult:1.2 },
  ],
  archivist: [
    { id:'ink_bind',      name:'INK BIND',      cost:2, fx:'Stun — enemy cannot counter',          type:'stun',    mult:1.1 },
    { id:'page_storm',    name:'PAGE STORM',    cost:3, fx:'2.5× knowledge surge',                 type:'damage',  mult:2.5 },
    { id:'codex_seal',    name:'CODEX SEAL',    cost:2, fx:'Shield — 70% damage reduction',        type:'shield' },
  ],
  lycheetah: [
    { id:'chaos_spark',   name:'CHAOS SPARK',   cost:1, fx:'0.5–3.0× random chaos hit',           type:'chaos' },
    { id:'mirror_slash',  name:'MIRROR SLASH',  cost:2, fx:'Reflect enemy ATK as damage',          type:'reflect' },
    { id:'entropy_shift', name:'ENTROPY SHIFT', cost:3, fx:'Drain 25% of enemy remaining HP',      type:'drain',   mult:0.25 },
  ],
};

const ENEMY_LORE: Record<string, string> = {
  dissolution:      'What dissolves cannot be lost — only transformed. The alchemist knows this.',
  the_fog:          'Clarity is not the absence of fog. It is the decision to move through it.',
  forgetting:       'Memory is a muscle. Every session you train it, Forgetting loses ground.',
  stasis:           'Motion broke the crystal. You are the force that refuses to stop.',
  inertia:          'The first step costs more than all others combined. You paid it.',
  drift:            'The wanderer drifts too — but with intention. That is everything.',
  static:           'Signal emerges from noise when the receiver learns to tune.',
  null:             'You cannot fight what is absent. You build until it has no space.',
  absence:          'The void you filled was never empty — it was waiting for you.',
  the_hollow:       'A hollow form still holds a shape. You gave it substance.',
  the_drain:        'Some things take without giving. You have learned to recognise them.',
  the_veil:         'Behind every veil is another field. The student pulls it back.',
  fracture:         'Cracks let the light enter. What broke you made you load-bearing.',
  the_weight:       'You carried it. That is the whole lesson.',
  corruption:       'Corruption spreads by making itself feel like the default. You refused.',
  the_warden:       'The cage had no lock — only habit. The key was always your own refusal.',
  null_sovereign:   'The sovereign of nothing rules everything it is given. You gave it nothing.',
  fracture_prime:   'At the highest fractures, reality negotiates with those who hold form.',
  entropy_prime:    'Entropy is not your enemy. Entropy without direction is. You gave it one.',
  athanors_shadow:  'The shadow knows your shape. That means you have a shape worth casting.',
};

type LootItem = {
  id: string; name: string; rarity: 'common'|'uncommon'|'rare'|'epic'; glyph: string;
  bonus?: Partial<PlayerStats>;
  lore?: string;
};
const LOOT_TABLE: LootItem[] = [
  { id:'shard_null',      name:'NULL SHARD',      rarity:'common',   glyph:'◈', bonus:{ def:1 },          lore:'A fragment of collapsed void. Carries faint structural resonance.' },
  { id:'dust_void',       name:'VOID DUST',        rarity:'common',   glyph:'◦', bonus:{ spd:1 },          lore:'Fine particulate from a dissolved entity. Lighter than it should be.' },
  { id:'ink_entropy',     name:'ENTROPY INK',      rarity:'common',   glyph:'✕', bonus:{ wil:1 },          lore:'The residue of Entropy defeated. Useful for inscription work.' },
  { id:'fragment_fog',    name:'FOG FRAGMENT',     rarity:'common',   glyph:'~', bonus:{ res:1 },           lore:'Solidified fog, crystallised at the moment of its dissolution.' },
  { id:'seed_hollow',     name:'HOLLOW SEED',      rarity:'common',   glyph:'○', bonus:{ vit:1 },           lore:'The Hollow left this when it fell. Seeds do not stay hollow for long.' },
  { id:'thread_stasis',   name:'STASIS THREAD',    rarity:'common',   glyph:'—', bonus:{ def:1, res:1 },   lore:'Cut from the crystal mid-freeze. Holds a moment suspended inside.' },
  { id:'lens_clarity',    name:'CLARITY LENS',     rarity:'uncommon', glyph:'◉', bonus:{ wil:3, spd:2 },  lore:'Ground from compressed fog-crystal. Objects seen through it refuse to lie.' },
  { id:'orb_memory',      name:'MEMORY ORB',       rarity:'uncommon', glyph:'⊛', bonus:{ wil:4, res:2 },  lore:'Contains a loop — the same moment played forward and backward simultaneously.' },
  { id:'glyph_fracture',  name:'FRACTURE GLYPH',   rarity:'uncommon', glyph:'⟁', bonus:{ atk:3, lck:2 }, lore:'Carved from a reality seam. Two meanings that cannot reconcile.' },
  { id:'dust_corruption', name:'CORRUPTION DUST',  rarity:'uncommon', glyph:'◌', bonus:{ atk:2, vit:3 },  lore:'The tendrils crumbled to this. Corrupted things leave fertile residue.' },
  { id:'veil_shard',      name:'VEIL SHARD',       rarity:'uncommon', glyph:'◇', bonus:{ spd:3, lck:3 },  lore:'A piece of the Veil itself. Something on the other side still presses against it.' },
  { id:'seal_warden',     name:"WARDEN'S SEAL",    rarity:'rare',     glyph:'⊕', bonus:{ def:6, res:4 },  lore:'The lock that was never locked. The Warden carried it as a reminder of what it guarded.' },
  { id:'core_null',       name:'NULL CORE',        rarity:'rare',     glyph:'⬡', bonus:{ vit:6, def:4 },  lore:'The dense centre of a Null entity. Self-contained absence — somehow heavier than presence.' },
  { id:'rune_sovereign',  name:'SOVEREIGN RUNE',   rarity:'rare',     glyph:'✦', bonus:{ atk:5, wil:5 },  lore:"The Null Sovereign's mark. Authority carved into matter at absolute zero." },
  { id:'eye_entropy',     name:'ENTROPY EYE',      rarity:'epic',     glyph:'◈', bonus:{ wil:8, lck:6, spd:4 }, lore:'Entropy Prime looked back. This is what fell out.' },
  { id:'heart_athanor',   name:"ATHANOR'S EMBER",  rarity:'epic',     glyph:'△', bonus:{ atk:8, vit:6, res:6 },  lore:"The shadow-companion's heart-coal. Carries memory of every archetype it inverted." },
];
function rollLoot(wave: number): LootItem {
  const epicWeight   = wave >= 10 ? 8 : wave >= 5 ? 2 : 0;
  const rareWeight   = wave >= 5  ? 15 : 5;
  const uncommonW    = 30;
  const commonW      = 100;
  const total = commonW + uncommonW + rareWeight + epicWeight;
  const roll  = Math.random() * total;
  let tier: LootItem['rarity'] = 'common';
  if (roll < epicWeight) tier = 'epic';
  else if (roll < epicWeight + rareWeight) tier = 'rare';
  else if (roll < epicWeight + rareWeight + uncommonW) tier = 'uncommon';
  const pool = LOOT_TABLE.filter(l => l.rarity === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

function waveTokens(wave: number) { return 5 + Math.floor(wave / 2); }
function freshWave(wave: number, keepPlayerHP?: number, vit?: number): BattleState {
  const enemy  = pickEnemy(wave);
  const baseHP = 60 + wave * 25;
  const hp     = Math.round(baseHP * enemy.hpMult);
  const xp     = Math.round((wave * 20) * enemy.xpMult);
  const maxPlayerHP = 70 + (vit ?? 12) * 3 + wave * 5;
  return {
    wave, entityName: enemy.name, entityHP: hp, maxHP: hp,
    playerHP: keepPlayerHP ?? maxPlayerHP, maxPlayerHP,
    tokens: waveTokens(wave), won: false, defending: false,
    enemyLine: enemy.lines.enter, loot: null,
    log: [], waveXP: xp,
    enemyStunned: false, playerShielded: false, lastPlayerDmg: 0,
  };
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
  // 0=skin-color, 1=white, 2=dim-white
  ct: i % 3,
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

function getTimeOverlay(): { color: string; opacity: number } | null {
  const h = new Date().getHours();
  if (h >= 5  && h < 8)  return { color: '#FF9944', opacity: 0.07 }; // dawn
  if (h >= 8  && h < 17) return null;                                  // day — clear
  if (h >= 17 && h < 20) return { color: '#CC4422', opacity: 0.09 }; // sunset
  if (h >= 20 && h < 23) return { color: '#221144', opacity: 0.13 }; // dusk
  return { color: '#040818', opacity: 0.20 };                          // deep night
}

function CompanionScene({
  stage, mood, skin, archetype, onTap, phrase, phraseAnim, companionName,
  battleHP, battleMaxHP, battleEntityName, battleWave, entityShakeAnim, eating, evoPath, devStagePin,
  gearCrown, gearBody, gearCape, gearMantle,
}: {
  stage: EvolutionStage; mood: CompanionMood; skin: typeof SKINS[SkinId]; archetype: Archetype;
  onTap: () => void; phrase: string | null; phraseAnim: Animated.Value;
  companionName?: string;
  battleHP: number; battleMaxHP: number; battleEntityName: string; battleWave: number;
  entityShakeAnim: Animated.Value; eating: boolean; evoPath: EvoPath | null;
  devStagePin: EvolutionStage | null;
  gearCrown: GearTier; gearBody: GearTier; gearCape: GearTier; gearMantle: GearTier;
}) {
  const stageData = STAGES[stage];
  const { color, bgColor, skyColor, particleGlyph, glowColor, cardBg, starGlyphs } = skin;
  const battleActive = battleHP > 0;

  const breathAnim    = useRef(new Animated.Value(0)).current;
  const auraPulse     = useRef(new Animated.Value(0)).current;
  const blinkAnim     = useRef(new Animated.Value(1)).current;
  const bobAnim       = useRef(new Animated.Value(0)).current;
  const driftAnim     = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0)).current;
  const skyAnim       = useRef(new Animated.Value(0)).current;
  const shadowAnim    = useRef(new Animated.Value(0)).current;
  const ring1Anim     = useRef(new Animated.Value(0)).current;
  const ring2Anim     = useRef(new Animated.Value(0)).current;
  const ring3Anim     = useRef(new Animated.Value(0)).current;
  const entityFadeAnim   = useRef(new Animated.Value(1)).current;
  const victoryFlash     = useRef(new Animated.Value(0)).current;
  const particleAnims    = useRef(Array.from({ length: P_COUNT }, () => new Animated.Value(0))).current;
  const fogAnims         = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;
  const entitySlideAnim  = useRef(new Animated.Value(120)).current;  // enemy entrance
  const entityHitFlash   = useRef(new Animated.Value(0)).current;    // red hit flash
  const entityScaleAnim  = useRef(new Animated.Value(1)).current;    // death shrink
  const moodFlash        = useRef(new Animated.Value(0)).current;    // mood-up pulse
  const tapRipple        = useRef(new Animated.Value(0)).current;    // tap ripple
  const [tapPos,  setTapPos]  = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const bgParallaxX = driftAnim.interpolate({ inputRange: [-30, 30], outputRange: [-18, 18] });

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

  // Horizontal lazy drift — creature wanders slowly across scene
  useEffect(() => {
    const driftDur = mood === 'transcendent' ? 3200 : mood === 'lit' ? 2400 : 4200;
    const driftAmt = mood === 'transcendent' ? 38 : mood === 'lit' ? 28 : 18;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(driftAnim, { toValue: driftAmt, duration: driftDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: -driftAmt, duration: driftDur * 1.3, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: 0, duration: driftDur * 0.7, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  // Shadow breathes opposite to bob (squishes when creature descends)
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shadowAnim, { toValue: 1, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
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

  // Layered mist — 4 independent loops at different speeds/delays for depth parallax
  useEffect(() => {
    const cfgs = [
      { dur: 9000, delay: 0 },
      { dur: 13000, delay: 2200 },
      { dur: 7500, delay: 1000 },
      { dur: 11500, delay: 3600 },
    ];
    const loops = cfgs.map(({ dur, delay }, i) => {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(fogAnims[i], { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(fogAnims[i], { toValue: 0, duration: dur * 1.15, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
      const t = setTimeout(() => loop.start(), delay);
      return { loop, t };
    });
    return () => loops.forEach(({ loop, t }) => { loop.stop(); clearTimeout(t); });
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

  // Enemy entrance — slide in when entity name changes (new wave)
  useEffect(() => {
    if (!battleEntityName) return;
    entitySlideAnim.setValue(140);
    entityFadeAnim.setValue(1);
    entityScaleAnim.setValue(1);
    Animated.spring(entitySlideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [battleEntityName]);

  // Hit flash — fires on any HP decrease
  const prevHP = useRef(battleHP);
  useEffect(() => {
    if (battleHP < prevHP.current && battleHP > 0) {
      entityHitFlash.setValue(1);
      Animated.timing(entityHitFlash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
    if (battleHP === 0) {
      // Death: flash white, shrink, fade
      Animated.sequence([
        Animated.timing(victoryFlash, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(victoryFlash, { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]).start();
      Animated.parallel([
        Animated.timing(entityScaleAnim, { toValue: 0.1, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.timing(entityFadeAnim,  { toValue: 0,   duration: 700, useNativeDriver: true }),
      ]).start();
    } else {
      victoryFlash.setValue(0);
    }
    prevHP.current = battleHP;
  }, [battleHP]);

  const breathScale = breathAnim.interpolate({ inputRange: [0,1], outputRange: [0.96, 1.04] });
  const auraScale   = auraPulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.15] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0,1], outputRange: [0.18, 0.45] });
  const bobY        = bobAnim.interpolate({ inputRange: [0,1], outputRange: [0, -16] });
  const driftX      = driftAnim;
  const glowOp      = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.01, 0.04] });
  const skyOp       = skyAnim.interpolate({ inputRange: [0,1], outputRange: [0.02, 0.06] });
  const bodyOp      = breathAnim.interpolate({ inputRange: [0,1], outputRange: mood === 'dormant' ? [0.35, 0.65] : [0.82, 1] });
  // Shadow squishes when creature is up (bobY negative), expands when down
  const shadowScaleX = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [1.0, 0.72] });
  const shadowOp     = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [0.55, 0.28] });

  const ring1Op = ring1Anim.interpolate({ inputRange:[0,1], outputRange:[0.12, 0.28] });
  const ring2Op = ring2Anim.interpolate({ inputRange:[0,1], outputRange:[0.07, 0.18] });
  const ring3Op = ring3Anim.interpolate({ inputRange:[0,1], outputRange:[0.04, 0.10] });
  const ring1Scale = ring1Anim.interpolate({ inputRange:[0,1], outputRange:[0.88, 1.08] });
  const ring2Scale = ring2Anim.interpolate({ inputRange:[0,1], outputRange:[0.94, 1.18] });
  const ring3Scale = ring3Anim.interpolate({ inputRange:[0,1], outputRange:[1.0, 1.32] });

  const sceneBg = SCENE_IMAGES[skin.id as SkinId];
  const hitTint = entityHitFlash.interpolate({ inputRange: [0, 1], outputRange: ['#00000000', '#FF000088'] });

  return (
    <View style={{ width: SCREEN_W, height: SCENE_H, backgroundColor: '#0D0D0D', overflow: 'hidden' }}>
      {sceneBg && (
        <Animated.Image
          source={sceneBg}
          style={{ position: 'absolute', top: -18, left: -18, width: SCREEN_W + 36, height: SCENE_H + 36, opacity: 0.45, transform: [{ translateX: bgParallaxX }] }}
          resizeMode="cover"
        />
      )}

      {/* No color washes — bgColor speaks for itself */}

      {/* Time-of-day tint removed — was washing bgColor */}

      {/* Starfield — parallax at 0.3x, three color tiers */}
      {STARS.map((s, i) => {
        const starCol = s.ct === 0 ? '#CCDDFF' : s.ct === 1 ? '#FFFFFF' : '#AAAACC';
        return (
          <Animated.Text key={`star-${i}`} style={{ position:'absolute', top:s.y*SCENE_H, left:s.x*SCREEN_W, color:starCol, fontSize:s.sz, opacity:s.op, fontFamily:mono, transform:[{ translateX: driftAnim.interpolate({ inputRange:[-30,30], outputRange:[-(1-s.x)*9, (s.x)*9] }) }] }}>
            {starGlyphs[s.gi]}
          </Animated.Text>
        );
      })}
      {/* Archetype ambient marks — float at corners, low opacity, archetype-specific color */}
      {[
        { x: 0.04, y: 0.06, sz: 13, symIdx: 0 },
        { x: 0.86, y: 0.10, sz: 13, symIdx: 1 },
        { x: 0.07, y: 0.52, sz: 10, symIdx: 2 },
        { x: 0.83, y: 0.48, sz: 10, symIdx: 3 },
      ].map(({ x, y, sz, symIdx }, i) => (
        <Text key={`arch-${i}`} style={{ position:'absolute', top:y*SCENE_H, left:x*SCREEN_W, color:'#FFFFFF', fontSize:sz, opacity:0.12, fontFamily:mono }}>
          {archetype.sceneSymbols[symIdx % archetype.sceneSymbols.length]}
        </Text>
      ))}
      {/* Side vignettes — depth framing */}
      <View style={{ position:'absolute', top:0, left:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      <View style={{ position:'absolute', top:0, right:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      {/* Bottom dark fade — grounding only, no colour */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, height:SCENE_H*0.10, backgroundColor:'#000000', opacity:0.35 }} pointerEvents="none" />

      {/* Layered mist bands — mid-depth, independent drift, archetype-tinted */}
      {[
        { yFrac: 0.12, h: 48, op: 0.038, amp: 0.28, fi: 0 },
        { yFrac: 0.42, h: 30, op: 0.026, amp: 0.20, fi: 1 },
        { yFrac: 0.65, h: 38, op: 0.032, amp: 0.35, fi: 2 },
        { yFrac: 0.28, h: 22, op: 0.018, amp: 0.18, fi: 3 },
      ].map(({ yFrac, h, op, amp, fi }, i) => (
        <Animated.View key={`mist-${i}`} pointerEvents="none" style={{
          position: 'absolute',
          top: yFrac * SCENE_H - h / 2,
          left: -SCREEN_W * 0.25,
          width: SCREEN_W * 1.6,
          height: h,
          borderRadius: h / 2,
          backgroundColor: color,
          opacity: op,
          transform: [{ translateX: fogAnims[fi].interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_W * amp] }) }],
        }} />
      ))}

      {/* Concentric pulsing rings behind creature */}
      {[{ anim:ring3Anim, op:ring3Op, sc:ring3Scale, sz:220, col:color, bw:0.5 },
        { anim:ring2Anim, op:ring2Op, sc:ring2Scale, sz:160, col:color, bw:0.7 },
        { anim:ring1Anim, op:ring1Op, sc:ring1Scale, sz:110, col:'#FFFFFF', bw:1.2 }].map(({ op, sc, sz, col, bw }, ri) => (
        <Animated.View key={`ring-${ri}`} style={{
          position:'absolute',
          top: SCENE_H*0.22 + 110 - sz/2,
          left: SCREEN_W/2 - sz/2,
          width:sz, height:sz, borderRadius:sz/2,
          borderWidth: bw,
          borderColor: col,
          opacity: op,
          transform:[{ scale:sc }],
        }} />
      ))}

      {particleAnims.map((anim, i) => {
        const yRange = mood === 'lit' ? [-80,-140] : mood === 'dormant' ? [-10,-30] : [-40,-90];
        return (
          <Animated.Text key={i} style={{ position:'absolute', bottom:SCENE_H*0.35+(i%3)*12, left:P_X[i]*SCREEN_W, fontSize:P_SZ[i], color,
            transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:yRange }) }],
            opacity: anim.interpolate({ inputRange:[0,0.2,0.6,1], outputRange:[0,0.9,0.85,0] }) }}>
            {particleGlyph}
          </Animated.Text>
        );
      })}

      {stageData.aura.map((line, i) => (
        <Animated.Text key={i} style={{ position:'absolute', top:SCENE_H*0.17+i*22, alignSelf:'center', color:'#FFFFFF', fontSize:stage>=4?18:14, fontFamily:mono, letterSpacing:4+i*2, transform:[{scale:auraScale}], opacity:auraOpacity }}>
          {line}
        </Animated.Text>
      ))}

      {/* Companion — always centred */}
      <Animated.View style={{ position:'absolute', top: SCENE_H * 0.22, left: 0, right: 0, alignItems:'center', transform:[{translateY:bobY},{translateX:driftX}] }}>
        {/* Ground sigil — glowing archetype ring, replaces oval */}
        <View style={{ position:'absolute', bottom:-8, alignSelf:'center', width:110, height:18,
          borderRadius:55, borderWidth:1, borderColor:color+'55',
          backgroundColor:color+'09', shadowColor:color, shadowOpacity:0.6, shadowRadius:8, elevation:4 }} />
        <TouchableOpacity
          onPress={(e) => {
            setTapPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
            setShowRipple(true);
            tapRipple.setValue(0);
            Animated.timing(tapRipple, { toValue: 1, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start(() => setShowRipple(false));
            onTap();
          }}
          activeOpacity={0.85}
        >
          {/* Tap ripple */}
          {showRipple && (
            <Animated.View pointerEvents="none" style={{
              position:'absolute', zIndex:10,
              top: tapPos.y - 40, left: tapPos.x - 40,
              width:80, height:80, borderRadius:40,
              borderWidth:1.5, borderColor: color,
              opacity: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.8,0] }),
              transform:[{ scale: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.3,2.2] }) }],
            }} />
          )}
          <Animated.View style={{ transform:[{scale:breathScale}], opacity:bodyOp, alignItems:'center', zIndex:1 }}>
            {/* Crown row — archetype tier */}
            <Text style={{ color, fontSize:14, lineHeight:22, fontFamily:mono, textAlign:'center', letterSpacing:1.5, marginBottom:3 }}>
              {archetype.crowns[stage]}
            </Text>
            {/* Companion body — portrait image if available, SVG fallback */}
            <View style={{ width:120, height:180 }}>
              {COMPANION_IMAGES[`${archetype.id}_${devStagePin !== null ? devStagePin : stage}`]
                ? <Image source={COMPANION_IMAGES[`${archetype.id}_${devStagePin !== null ? devStagePin : stage}`]} style={{ width:120, height:180 }} resizeMode="contain" />
                : <CreatureSvg archId={archetype.id} stage={devStagePin !== null ? devStagePin : 1 as EvolutionStage} color={color} path={evoPath} />
              }
              {/* Gear overlays — rendered in layer order: cape behind, body mid, crown top */}
              {(['cape','body','mantle','crown'] as GearSlot[]).map(slot => {
                const g = slot === 'cape' ? gearCape : slot === 'body' ? gearBody : slot === 'mantle' ? gearMantle : gearCrown;
                const img = g.threshold > 0 ? getGearImage(slot, g.name) : null;
                return img ? <Image key={slot} source={img} style={{ position:'absolute', top:0, left:0, width:120, height:180 }} resizeMode="contain" /> : null;
              })}
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

      {/* Ground shadow */}
      <Animated.View style={{
        position:'absolute', bottom:54, alignSelf:'center',
        width:72, height:10, borderRadius:36,
        backgroundColor:'#000000',
        opacity:shadowOp,
        transform:[{scaleX:shadowScaleX}],
      }} />

      <View style={{ position:'absolute', bottom:48, left:0, right:0, alignItems:'center' }}>
        <View style={{ width:SCREEN_W*0.85, height:1, backgroundColor:'#FFFFFF', opacity:0.18, borderRadius:1 }} />
        <View style={{ width:SCREEN_W*0.6, height:1, backgroundColor:'#FFFFFF', opacity:0.08, marginTop:2, borderRadius:1 }} />
        <Text style={{ color, fontSize:12, fontFamily:mono, letterSpacing:2, opacity:0.75, marginTop:6 }}>{STAGES[stage].ground}</Text>
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
        <Text style={{ color:{ dormant:'#888899', present:color, lit:'#FFD966', transcendent:'#FFFFFF' }[mood], fontSize:11, fontWeight:'700' }}>
          {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
        </Text>
        <Text style={{ color:{ dormant:'#777788', present:color+'DD', lit:'#FFD966CC', transcendent:'#FFFFFFCC' }[mood], fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700' }}>
          {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
        </Text>
      </View>

      {phrase && (
        <Animated.View style={{ position:'absolute', bottom:72, left:20, right:20, opacity:phraseAnim, padding:14, borderRadius:14, borderWidth:1, borderTopWidth:2, borderColor:archetype.accentColor+'44', borderTopColor:archetype.accentColor+'99', backgroundColor:'#000000DD', alignItems:'center' }}>
          <Text style={{ color:'#FFFFFF', fontSize:14, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>{phrase}</Text>
          <Text style={{ color:archetype.accentColor, fontSize:8, fontFamily:mono, letterSpacing:2, marginTop:6, opacity:0.7 }}>{archetype.name}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SHOW_DEV_STAGE = true; // flip to false before public release

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
  const [showBattle,    setShowBattle]    = useState(false);
  const [showGear,      setShowGear]      = useState(false);
  const [showNeeds,     setShowNeeds]     = useState(false);
  const [newRelic,      setNewRelic]      = useState<typeof RELIC_POOL[0] | null>(null);
  // DEV ONLY — remove before shipping
  const [devStagePin,   setDevStagePin]   = useState<EvolutionStage | null>(null);

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
  const [playerStats,    setPlayerStats]   = useState<PlayerStats>({ atk:10, def:10, spd:10, wil:10, lck:10, vit:12, res:10 });
  const [activeTab,      setActiveTab]     = useState<'battle'|'feed'|'gear'|'field'>('battle');
  const [loreCodex,      setLoreCodex]     = useState<Array<{id:string; enemy:string; text:string; date:string; type:'enemy'|'loot'}>>([]);
  const [tokensLeft,     setTokensLeft]    = useState(3);
  const [attackAnim,     setAttackAnim]    = useState(false);
  const [spellMenuOpen,  setSpellMenuOpen] = useState(false);

  const [dailyFoods,   setDailyFoods]   = useState<FoodItem[]>([]);
  const [fedToday,     setFedToday]     = useState<string[]>([]);
  const [eating,       setEating]       = useState(false);
  const [recentDives,  setRecentDives]  = useState<Array<{ subjectName: string; domainLabel: string }>>([]);
  const [inventory,    setInventory]    = useState<string[]>([]);
  const [uploadedDoc,  setUploadedDoc]  = useState<{ name: string; excerpt: string; date: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

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
  const [lamagueSt,  setLamagueSt]  = useState<string | null>(null);
  const [liveLore,   setLiveLore]   = useState<{ text: string; subject: string; date: string }[]>([]);

  // ── AI Talk panel ──────────────────────────────────────────────────────────
  const [showTalk,    setShowTalk]    = useState(false);
  const [talkInput,   setTalkInput]   = useState('');
  const [talkHistory, setTalkHistory] = useState<{ role: 'user'|'companion'; text: string }[]>([]);
  const [talkLoading, setTalkLoading] = useState(false);
  const talkScrollRef = useRef<any>(null);
  const talkSlideAnim = useRef(new Animated.Value(0)).current;
  const summonChoiceAnim = useRef(new Animated.Value(0)).current;
  const [dreamFragment, setDreamFragment] = useState<{ domain: string; glyph: string; color: string; text: string } | null>(null);
  const dreamAnim = useRef(new Animated.Value(0)).current;
  const [evoPath,           setEvoPath]           = useState<EvoPath | null>(null);
  const [showPathCeremony,  setShowPathCeremony]  = useState(false);
  const pathCeremonyAnim = useRef(new Animated.Value(0)).current;
  const scrollRef  = useRef<any>(null);
  const feedY      = useRef(0);
  const battleY    = useRef(0);
  const loreY      = useRef(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const keys = [
        'sol_dive_log','sanctum_lq_history','sol_vigil','sol_study_streak',
        'sol_companion_relics','sol_companion_name','sanctum_journal',
        'cascade_library_v3','sol_companion_skin','sol_companion_battle','sol_companion_fed',
        'sol_companion_archetype','sol_premium','sol_companion_named','sol_companion_path',
        'sol_lamague_state','sol_companion_live_lore','sol_inventory','sol_lore_codex',
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

      const sigil = getGear('sigil', total);
      const gearTokenBonus = sigil.threshold >= 20 ? 2 : 0;
      const archData = ARCHETYPES[archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist'];
      const baseStats  = computePlayerStats(archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist', lqAvg, total);
      const invRawEarly: string[] = get('sol_inventory') ? JSON.parse(get('sol_inventory')!) : [];
      const stats = applyRelicBonuses(baseStats, earned, invRawEarly);

      let bat: BattleState | null = get('sol_companion_battle') ? JSON.parse(get('sol_companion_battle')!) : null;
      if (!bat || !('wave' in bat)) {
        bat = freshWave(1, undefined, stats.vit);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
      }

      const fedRaw = get('sol_companion_fed');
      const fedData: {date:string;ids:string[]} = fedRaw ? JSON.parse(fedRaw) : {date:'',ids:[]};
      const todayFed = fedData.date === todayK ? fedData.ids : [];
      const power    = stats.atk + (getGear('crown', total).threshold >= 1 ? 5 : 0);
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
      setPlayerStats(stats);
      setTokensLeft(bat.tokens);
      setDailyFoods(getDailyFoods(seed));
      setFedToday(todayFed);
      const invRaw = await AsyncStorage.getItem('sol_inventory');
      setInventory(invRaw ? JSON.parse(invRaw) : []);
      try { setLoreCodex(get('sol_lore_codex') ? JSON.parse(get('sol_lore_codex')!) : []); } catch {}
      setLamagueSt(get('sol_lamague_state'));
      try { setLiveLore(get('sol_companion_live_lore') ? JSON.parse(get('sol_companion_live_lore')!) : []); } catch {}
      try {
        const docRaw = await AsyncStorage.getItem('sol_uploaded_doc');
        if (docRaw) setUploadedDoc(JSON.parse(docRaw));
      } catch {}

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
      // Daily lore generation — fires async after data loads, once per day
      setTimeout(() => generateDailyLore(), 3000);
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

  const generateLivePhrase = async (): Promise<string | null> => {
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return null;
      const diveContext = recentDives.length > 0
        ? `Recent studies: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : 'No recent dives yet.';
      const prompt = `You are ${archetype.name}, ${archetype.title}. Mood: ${mood}. ${diveContext} Speak ONE short sentence (max 12 words) in your voice — cryptic, alive, personal. No quotes. No explanation.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are a ${archetype.name} companion spirit in a mystery school app. Speak in character.`,
        key, model as any, undefined, 'fast', 80,
      );
      return result.text?.trim() || null;
    } catch { return null; }
  };

  const handleUploadDoc = async () => {
    try {
      setUploadLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/x-markdown', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const excerpt = content.replace(/\s+/g, ' ').trim().slice(0, 2000);
      const doc = { name: asset.name, excerpt, date: todayDateKey() };
      setUploadedDoc(doc);
      await AsyncStorage.setItem('sol_uploaded_doc', JSON.stringify(doc));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent — user may cancel */ } finally {
      setUploadLoading(false);
    }
  };

  const generateDailyLore = async () => {
    try {
      const todayK = todayDateKey();
      const lastLoreDate = await AsyncStorage.getItem('sol_companion_lore_date');
      if (lastLoreDate === todayK) return; // already generated today
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const diveCtx = recentDives.length > 0
        ? `The student recently studied: ${recentDives.slice(0, 3).map(d => d.subjectName).join(', ')}.`
        : 'The student has not yet dived today.';
      const docCtx = uploadedDoc
        ? ` The student also uploaded a document: "${uploadedDoc.name}". Excerpt: ${uploadedDoc.excerpt.slice(0, 400)}`
        : '';
      const seeds = [
        `${archetype.name} notices something about the student's recent work.`,
        `A fragment surfaces from ${archetype.name}'s memory about this stage of the Work.`,
        `${archetype.name} reflects on what it means to be at the ${stageData.name} stage.`,
        `Something from the field today catches ${archetype.name}'s attention.`,
        ...(uploadedDoc ? [`${archetype.name} has been studying the student's uploaded document.`] : []),
      ];
      const seed = seeds[Math.floor(Math.random() * seeds.length)];
      const result = await sendMessage(
        [{ role: 'user', content: `${seed} ${diveCtx}${docCtx} Write ONE lore fragment (max 20 words). Cryptic. In character. No explanation.` }],
        `You are ${archetype.name}, ${archetype.title}. ${archetype.desc}`,
        key, model as any, undefined, 'fast', 80,
      );
      const text = result.text?.trim();
      if (!text) return;
      const entry = { text, subject: recentDives[0]?.subjectName ?? 'the field', date: todayK };
      const updated = [entry, ...liveLore].slice(0, 10);
      setLiveLore(updated);
      await AsyncStorage.multiSet([
        ['sol_companion_live_lore', JSON.stringify(updated)],
        ['sol_companion_lore_date', todayK],
      ]);
    } catch { /* silent */ }
  };

  const openTalk = () => {
    setShowTalk(true);
    talkSlideAnim.setValue(0);
    Animated.spring(talkSlideAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 11 }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const sendTalk = async () => {
    const text = talkInput.trim();
    if (!text || talkLoading) return;
    setTalkInput('');
    setTalkLoading(true);
    const next = [...talkHistory, { role: 'user' as const, text }];
    setTalkHistory(next);
    setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const diveCtx = recentDives.length > 0
        ? `The student has recently studied: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : '';
      const history = next.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const result = await sendMessage(
        history as any,
        `You are ${archetype.name}, ${archetype.title} — a living companion spirit in a mystery school. Your mood is ${mood}. ${diveCtx} Speak in your unique voice: ${archetype.desc} Keep replies to 1-3 sentences. Cryptic, alive, personal. No generic assistant language.`,
        key, model as any, undefined, 'normal', 200,
      );
      const reply = result.text?.trim() || archetype.phrases[mood][0];
      setTalkHistory(h => [...h, { role: 'companion', text: reply }]);
      setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      setTalkHistory(h => [...h, { role: 'companion', text: rnd(archetype.phrases[mood]) }]);
    } finally {
      setTalkLoading(false);
    }
  };

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 60% chance of live AI phrase, fall back to static instantly
    if (Math.random() < 0.6) {
      setPhrase('...');
      generateLivePhrase().then(live => {
        setPhrase(live || (recentDives.length > 0 && Math.random() < 0.5
          ? (() => { const dive = recentDives[Math.floor(Math.random() * recentDives.length)]; return MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)](dive.subjectName, dive.domainLabel); })()
          : rnd(archetype.phrases[mood])));
      });
    } else if (recentDives.length > 0 && Math.random() < 0.3) {
      const dive = recentDives[Math.floor(Math.random() * recentDives.length)];
      const tmpl = MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)];
      setPhrase(tmpl(dive.subjectName, dive.domainLabel));
    } else {
      setPhrase(rnd(archetype.phrases[mood]));
    }
  };

  const saveToCodex = async (entry: {id:string; enemy:string; text:string; type:'enemy'|'loot'}) => {
    const raw = await AsyncStorage.getItem('sol_lore_codex');
    const existing: typeof loreCodex = raw ? JSON.parse(raw) : [];
    if (existing.some(e => e.id === entry.id)) return;
    const updated = [{ ...entry, date: todayDateKey() }, ...existing].slice(0, 60);
    await AsyncStorage.setItem('sol_lore_codex', JSON.stringify(updated));
    setLoreCodex(updated);
  };

  const handleBattleAction = async (action: 'attack' | 'spell' | 'defend' | 'item') => {
    if (!battle || battle.won || tokensLeft <= 0 || attackAnim) return;
    if (action === 'spell') { setSpellMenuOpen(true); return; }
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(action === 'attack' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    setAttackAnim(true);

    let dmg = 0, healAmt = 0, logEntry = '', tokenCost = 1, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newDefending = false, enemyAttacksBack = true;
    let newStunned = false, newShielded = false;

    if (action === 'attack') {
      const variance = Math.floor(Math.random() * 20);
      const chaosRoll = archetype.id === 'lycheetah' && Math.random() < 0.3;
      const chaosMult = chaosRoll ? 1.5 + Math.random() * 1.5 : 1;
      // LCK crit: lck/4 % chance of 1.5× damage
      const critRoll = Math.random() * 100 < playerStats.lck / 4;
      const critMult = critRoll ? 1.5 : 1;
      dmg = Math.round((attackPower + variance) * chaosMult * critMult);
      chaosNote = chaosRoll ? ` ✧CHAOS×${chaosMult.toFixed(1)}` : critRoll ? ' ✦CRIT' : '';
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      logEntry = `⚔ ${dmg} dmg${chaosNote}`;
    } else if (action === 'defend') {
      newDefending = true;
      newShielded = true;
      enemyAttacksBack = false;
      logEntry = `◈ DEFEND — shield raised`;
    } else if (action === 'item') {
      healAmt = Math.round(20 + Math.random() * 25);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
      enemyAttacksBack = false;
      logEntry = `◦ ITEM +${healAmt} HP`;
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:4, duration:80, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:80, useNativeDriver:true }),
      ]).start();
    }

    // ── Enemy counterattack ────────────────────────────────────────────────
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const shieldMult = (battle.defending || battle.playerShielded) ? 0.3 : 1;
      // SPD dodge: spd >= 18 grants 25% full dodge chance
      const spdDodge = playerStats.spd >= 18 && Math.random() < 0.25;
      // DEF flat reduction: up to 30% of enemy's base atk
      const defReduction = spdDodge ? 0 : Math.min(Math.floor(def.atk * 0.3), Math.floor(playerStats.def / 3));
      const rawEnemyDmg = spdDodge ? 0 : Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult);
      const enemyDmg = Math.max(0, rawEnemyDmg - defReduction);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
      const shieldNote = shieldMult < 1 ? ' (blocked)' : spdDodge ? ' (dodged)' : defReduction > 0 ? ` (-${defReduction})` : '';
      logEntry += ` · foe ${spdDodge ? 0 : enemyDmg}${shieldNote}`;
    } else if (battle.enemyStunned && newEnemyHP > 0) {
      logEntry += ' · foe stunned';
    }

    if (dmg > 0) {
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
      ]).start();
    }

    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const handleSpell = async (spell: SpellDef) => {
    if (!battle || battle.won || tokensLeft < spell.cost || attackAnim) return;
    setSpellMenuOpen(false);
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAttackAnim(true);

    let dmg = 0, healAmt = 0, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newStunned = false, newShielded = false, enemyAttacksBack = true;

    // WIL multiplier: 1.0 at wil=10, scales up/down. Caps at 1.4×
    const wilMult = Math.min(1.4, 0.8 + (playerStats.wil / 50));
    if (spell.type === 'damage') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.5) * wilMult + Math.random() * 10);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    } else if (spell.type === 'stun') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.0) * wilMult + Math.random() * 8);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      newStunned = true;
      enemyAttacksBack = false;
    } else if (spell.type === 'shield') {
      newShielded = true;
      enemyAttacksBack = false;
      if ((spell.mult ?? 1) > 0) {
        dmg = Math.round(attackPower * (spell.mult ?? 0.8) * wilMult);
        newEnemyHP = Math.max(0, battle.entityHP - dmg);
        enemyAttacksBack = true;
      }
    } else if (spell.type === 'drain') {
      if (spell.id === 'entropy_shift') {
        dmg = Math.round(battle.entityHP * 0.25);
      } else {
        dmg = Math.round(attackPower * (spell.mult ?? 1.6) * wilMult + Math.random() * 10);
      }
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      healAmt = spell.flatHeal ?? Math.round(dmg * 0.3);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
    } else if (spell.type === 'chaos') {
      const mult = 0.5 + Math.random() * 2.5;
      dmg = Math.round(attackPower * mult * wilMult + Math.random() * 15);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      chaosNote = ` ✧×${mult.toFixed(1)}`;
    } else if (spell.type === 'reflect') {
      dmg = Math.round(def.atk * (0.9 + Math.random() * 0.3));
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      enemyAttacksBack = false;
    } else if (spell.type === 'boost') {
      dmg = battle.lastPlayerDmg > 0 ? battle.lastPlayerDmg : Math.round(attackPower * 1.5 * wilMult);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    }

    // Enemy counter (unless stunned/shielded)
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const shieldMult = newShielded ? 0.0 : 1;
      const enemyDmg = Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
    }

    if (dmg > 0) {
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
      ]).start();
    }

    const logEntry = `✦ ${spell.name} ${dmg > 0 ? dmg + ' dmg' : ''}${chaosNote}${healAmt > 0 ? ' +' + healAmt + 'HP' : ''}`;
    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost: spell.cost, chaosNote, newEnemyHP, newPlayerHP, newDefending: false, newStunned, newShielded });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const _commitBattleResult = async (p: {
    def: EnemyDef; dmg: number; healAmt: number; logEntry: string; tokenCost: number; chaosNote: string;
    newEnemyHP: number; newPlayerHP: number; newDefending: boolean; newStunned: boolean; newShielded: boolean;
  }) => {
    const { def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded } = p;
    const won = newEnemyHP === 0;
    const newTokens = Math.max(0, tokensLeft - tokenCost);
    const loot = won ? rollLoot(battle!.wave) : null;

    const updated: BattleState = {
      ...battle!,
      entityHP: newEnemyHP, playerHP: newPlayerHP,
      tokens: newTokens, won, defending: newDefending,
      enemyLine: won ? def.lines.death : (p as any).enemyLine ?? battle!.enemyLine,
      loot: loot?.name ?? null,
      log: [logEntry, ...battle!.log].slice(0, 4),
      waveXP: battle!.waveXP + (won ? battle!.wave * 20 : 0),
      enemyStunned: newStunned,
      playerShielded: newShielded,
      lastPlayerDmg: dmg > 0 ? dmg : battle!.lastPlayerDmg,
    };
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
      const enemyKey = battle!.entityName.toLowerCase().replace(/ /g,'_');
      const loreText = ENEMY_LORE[enemyKey] ?? '';
      const waveMsg = `Wave ${battle!.wave} clear. +${battle!.wave * 20} XP.`;
      setPhrase(loreText || waveMsg);
      if (loreText) saveToCodex({ id:`enemy_${enemyKey}`, enemy:battle!.entityName, text:loreText, type:'enemy' });
      if (loot) {
        const raw = await AsyncStorage.getItem('sol_inventory');
        const inv: string[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem('sol_inventory', JSON.stringify([loot.name, ...inv].slice(0, 50)));
        if (loot.lore) saveToCodex({ id:`loot_${loot.id}`, enemy:loot.name, text:loot.lore, type:'loot' });
      }
      setTimeout(async () => {
        const next = freshWave(battle!.wave + 1, newPlayerHP);
        setBattle(next);
        setTokensLeft(next.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
        setPhrase(archetype.phrases.lit[Math.floor(Math.random() * archetype.phrases.lit.length)]);
      }, 3500);
    } else if (newPlayerHP === 0) {
      setPhrase('You fall. The field resets.');
      setTimeout(async () => {
        const reset = freshWave(1);
        setBattle(reset);
        setTokensLeft(reset.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
      }, 2500);
    } else {
      setPhrase(dmg > 0 ? `${dmg} dmg${chaosNote}. ${newEnemyHP} HP remains.` : healAmt > 0 ? `+${healAmt} HP restored.` : 'Braced.');
    }
    if (dmg > 0) fireXPPop(chaosNote ? `✧${dmg}` : `${dmg}`);
  };

  const handleRetreat = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
    setPhrase('The field resets. Return when ready.');
    Haptics.selectionAsync();
  };

  const handleBattleStart = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
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
    // AI flavour — fires async, replaces static reaction if it arrives in time
    (async () => {
      try {
        const [key, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!key) return;
        const result = await sendMessage(
          [{ role: 'user', content: `You just ate ${food.domain}. React in ONE sentence, in character. Raw, alive, strange.` }],
          `You are ${archetype.name}, ${archetype.title}. Mood: ${mood}. Max 12 words. No quotes. No explanation.`,
          key, model as any, undefined, 'fast', 60,
        );
        const reply = result.text?.trim();
        if (reply) setPhrase(reply);
      } catch { /* keep static reaction */ }
    })();
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
  const gearCrown  = getGear('crown',  totalDives);
  const gearSigil  = getGear('sigil',  totalDives);
  const gearMantle = getGear('mantle', totalDives);
  const gearBody   = getGear('body',   totalDives);
  const gearCape   = getGear('cape',   totalDives);
  const nextCrown  = nextGearTier('crown',  totalDives);
  const nextSigil  = nextGearTier('sigil',  totalDives);
  const nextMantle = nextGearTier('mantle', totalDives);
  const nextBody   = nextGearTier('body',   totalDives);
  const nextCape   = nextGearTier('cape',   totalDives);
  const allGearEquipped = gearCrown.threshold > 0 && gearSigil.threshold > 0 && gearMantle.threshold > 0 && gearBody.threshold > 0 && gearCape.threshold > 0;

  const xpPopY  = xpPopAnim.interpolate({ inputRange:[0,1], outputRange:[0,-32] });
  const xpPopOp = xpPopAnim.interpolate({ inputRange:[0,0.3,1], outputRange:[0,1,0] });

  const { glowColor, cardBg } = skin;

  return (
    <ScrollView ref={scrollRef} style={{ flex:1, backgroundColor:'#0D0D0D' }} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>

      {/* ── COMPANION HEADER ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:4, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
          <View>
            <Text style={{ color:SOL_THEME.text, fontSize:15, fontWeight:'700', fontFamily:mono }}>
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
        devStagePin={devStagePin}
        gearCrown={gearCrown}
        gearBody={gearBody}
        gearCape={gearCape}
        gearMantle={gearMantle}
      />

      {xpPop && (
        <Animated.Text style={{ position:'absolute', top:SCENE_H-55, alignSelf:'center', color, fontSize:13, fontFamily:mono, fontWeight:'700', transform:[{translateY:xpPopY}], opacity:xpPopOp }}>
          {xpPop}
        </Animated.Text>
      )}

      {/* ── LAMAGUE STATE STRIP ──────────────────────────────────────────── */}
      {lamagueSt && (
        <View style={{ marginHorizontal:16, marginBottom:6, paddingHorizontal:10, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border, backgroundColor:SOL_THEME.surface, flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ color:color, fontSize:8, fontFamily:mono, letterSpacing:0.5 }}>Ψ</Text>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:0.3, flex:1 }} numberOfLines={1}>{lamagueSt}</Text>
        </View>
      )}

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View style={{ flexDirection:'row', gap:4, marginHorizontal:16, marginTop:10, marginBottom:4 }}>
        {([
          { id:'battle' as const, label:'⚔', name:'BATTLE' },
          { id:'feed'   as const, label:'△', name:'FEED'   },
          { id:'gear'   as const, label:'⊛', name:'GEAR'   },
          { id:'field'  as const, label:'◉', name:'FIELD'  },
        ]).map(t => (
          <TouchableOpacity key={t.id}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(t.id); }}
            activeOpacity={0.75}
            style={{ flex:1, paddingVertical:10, borderRadius:10, borderWidth:1.5, alignItems:'center', gap:2,
              borderColor: activeTab===t.id ? color : '#1A1A26',
              backgroundColor: activeTab===t.id ? color+'14' : 'transparent' }}>
            <Text style={{ color: activeTab===t.id ? color : '#333344', fontSize:14, fontFamily:mono }}>{t.label}</Text>
            <Text style={{ color: activeTab===t.id ? color : '#333344', fontSize:7, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── AI TALK PANEL ────────────────────────────────────────────────── */}
      <Modal visible={showTalk} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:skin.bgColor, borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1, borderColor:color+'44', borderBottomWidth:0, maxHeight:'78%', minHeight:360 }}>
            {/* Header */}
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:18, paddingBottom:10, borderBottomWidth:1, borderBottomColor:color+'22' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <Text style={{ color, fontSize:20 }}>{archetype.glyph}</Text>
                <View>
                  <Text style={{ color:SOL_THEME.text, fontSize:13, fontWeight:'700', fontFamily:mono }}>{companionName || archetype.name}</Text>
                  <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:1, opacity:0.7 }}>{archetype.title.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTalk(false)} style={{ padding:8 }}>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView ref={talkScrollRef} style={{ flex:1, padding:16 }} contentContainerStyle={{ gap:12, paddingBottom:8 }} showsVerticalScrollIndicator={false}>
              {talkHistory.length === 0 && (
                <View style={{ alignItems:'center', paddingVertical:20, gap:10 }}>
                  <Text style={{ color, fontSize:28 }}>{archetype.glyph}</Text>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>
                    {rnd(archetype.phrases[mood])}
                  </Text>
                  <View style={{ width:'100%', borderTopWidth:1, borderColor:SOL_THEME.border, marginVertical:8 }} />
                  <View style={{ width:'100%', gap:6 }}>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:2, marginBottom:2 }}>SOMETHING BROUGHT YOU HERE</Text>
                    {[
                      '◉  The School has 22 doors — each one a domain of real study',
                      '⊕  Complete dives to feed your companion and grow together',
                      '✦  Your companion evolves as you learn — 6 stages, 6 archetypes',
                      '◈  Battle Entropy Waves between sessions to earn loot and XP',
                      '⊛  Add an API key in Settings for live AI companion responses',
                      '◌  Gear, lore, and relics unlock as you go deeper into the field',
                    ].map((line, i) => (
                      <Text key={i} style={{ color:SOL_THEME.textMuted, fontSize:11, lineHeight:18, opacity:0.7 }}>{line}</Text>
                    ))}
                  </View>
                </View>
              )}
              {talkHistory.map((m, i) => (
                <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth:'82%', padding:12, borderRadius:14,
                    borderTopRightRadius: m.role === 'user' ? 4 : 14,
                    borderTopLeftRadius:  m.role === 'companion' ? 4 : 14,
                    backgroundColor: m.role === 'user' ? color+'22' : SOL_THEME.surface,
                    borderWidth:1, borderColor: m.role === 'user' ? color+'44' : SOL_THEME.border,
                  }}>
                    <Text style={{ color: m.role === 'user' ? color : SOL_THEME.text, fontSize:13, lineHeight:20, fontStyle: m.role === 'companion' ? 'italic' : 'normal' }}>
                      {m.text}
                    </Text>
                  </View>
                  {m.role === 'companion' && (
                    <Text style={{ color:color, fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:3, marginLeft:4, opacity:0.5 }}>{archetype.name}</Text>
                  )}
                </View>
              ))}
              {talkLoading && (
                <View style={{ alignItems:'flex-start' }}>
                  <View style={{ padding:12, borderRadius:14, borderTopLeftRadius:4, backgroundColor:SOL_THEME.surface, borderWidth:1, borderColor:SOL_THEME.border }}>
                    <Text style={{ color:color, fontSize:13, letterSpacing:4 }}>· · ·</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={{ flexDirection:'row', gap:10, padding:16, paddingTop:10, borderTopWidth:1, borderTopColor:color+'22' }}>
              <TextInput
                value={talkInput}
                onChangeText={setTalkInput}
                placeholder={`Speak to ${companionName || archetype.name}...`}
                placeholderTextColor={SOL_THEME.textMuted}
                style={{ flex:1, backgroundColor:SOL_THEME.surface, borderRadius:12, paddingHorizontal:14, paddingVertical:10, color:SOL_THEME.text, fontSize:14, borderWidth:1, borderColor:color+'33' }}
                onSubmitEditing={sendTalk}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                onPress={sendTalk}
                disabled={!talkInput.trim() || talkLoading}
                style={{ width:44, height:44, borderRadius:12, backgroundColor: talkInput.trim() ? color : color+'33', alignItems:'center', justifyContent:'center' }}
              >
                <Text style={{ color:'#000000', fontSize:18, fontWeight:'700' }}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SKINS ─────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:4 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
          <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>SKIN</Text>
        </View>
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

      {/* ── SKIN PICKER (GEAR tab) ──────────────────────────────────────── */}
      {activeTab === 'gear' && (
        <View style={{ paddingHorizontal:16, marginBottom:6, marginTop:8 }}>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:8 }}>SKIN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6 }}>
            {SKIN_IDS.map(id => {
              const s = SKINS[id]; const active = id === activeSkin;
              return (
                <TouchableOpacity key={id}
                  onPress={() => { Haptics.selectionAsync(); setActiveSkin(id); AsyncStorage.setItem('sol_companion_skin', id); }}
                  style={{ paddingHorizontal:14, paddingVertical:10, borderRadius:10, borderWidth: active ? 1.5 : 1,
                    borderColor: active ? s.color : '#1A1A26', backgroundColor: active ? s.color+'14' : 'transparent', alignItems:'center', gap:3 }}>
                  <Text style={{ color: active ? s.color : '#333344', fontSize:16 }}>{s.glyph}</Text>
                  <Text style={{ color: active ? s.color : '#444455', fontSize:8, letterSpacing:1, fontFamily:mono }}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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

      {/* ── NAME + LEVEL (FIELD tab) ───────────────────────────────────────── */}
      {activeTab === 'field' && false && /* merged into FIELD panel below */ null}
      {/* kept for ceremony reference */}
      <View style={{ marginHorizontal:16, marginTop:10, marginBottom:4, padding:14, borderRadius:14, backgroundColor:SOL_THEME.surface, borderWidth:1, borderColor:color+'33', borderLeftWidth:3, borderLeftColor:color }}>
        {/* Archetype badge + choose button */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
            <View>
              <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700', fontFamily:mono }}>{archetype.name}</Text>
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
              ? <Text style={{ color:SOL_THEME.text, fontSize:15, fontWeight:'700', fontFamily:mono }}>{companionName} <Text style={{ color }}>✎</Text></Text>
              : <Text style={{ color:SOL_THEME.textMuted, fontSize:12, fontStyle:'italic' }}>tap to name your companion</Text>
            }
          </TouchableOpacity>
          <Text style={{ color:SOL_THEME.text, fontSize:11, fontFamily:mono, fontWeight:'700' }}>{lvl.cur.glyph}  LV.{lvl.level}  {lvl.cur.title.toUpperCase()}</Text>
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

      {/* ════════════════════════════════════════════════════════════════════
          BATTLE TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'battle' && (
        <View style={{ paddingHorizontal:16, paddingTop:6 }}>

          {/* Top row: TALK + STATS */}
          <View style={{ flexDirection:'row', gap:8, marginBottom:12 }}>
            <TouchableOpacity onPress={openTalk} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'14', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color, fontSize:16 }}>◈</Text>
              <Text style={{ color, fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>TALK</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1, borderColor:'#1A1A26', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:16 }}>⊛</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>SHEET</Text>
            </TouchableOpacity>
          </View>

          {/* Stats chips row */}
          <View style={{ flexDirection:'row', gap:5, marginBottom:14 }}>
            {[
              { l:'DIVES',  v:totalDives.toString(),                         hi: totalDives > 0 },
              { l:'STREAK', v:streak>0?`${streak}d`:'—',                     hi: streak >= 3 },
              { l:'LQ',     v:avgLQ>0?`${(avgLQ*100).toFixed(0)}%`:'—',     hi: avgLQ >= 0.7 },
              { l:'WAVE',   v:`W${battle?.wave??1}`,                         hi: (battle?.wave??1) > 1 },
              { l:'RELICS', v:earnedRelicData.length.toString(),              hi: earnedRelicData.length > 0 },
            ].map(s => (
              <View key={s.l} style={{ flex:1, paddingVertical:9, borderRadius:8, borderWidth:1,
                borderColor: s.hi ? color+'33' : '#1A1A26',
                backgroundColor: s.hi ? color+'08' : '#0A0A10', alignItems:'center', gap:2 }}>
                <Text style={{ color: s.hi ? color+'99' : '#333344', fontSize:6, letterSpacing:1, fontFamily:mono }}>{s.l}</Text>
                <Text style={{ color: s.hi ? color : SOL_THEME.text, fontSize:14, fontWeight:'700', fontFamily:mono }}>{s.v}</Text>
              </View>
            ))}
          </View>

          {/* BATTLE PANEL ─────────────────────────── */}
          <View onLayout={e => { battleY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1.5, borderColor:'#FF444433', backgroundColor:'#0C0000' }}>

            {/* Header */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:'#FF6644' }} />
                <Text style={{ color:'#666677', fontSize:10, letterSpacing:2, fontFamily:mono }}>ENTROPY WAVES</Text>
                {(battle?.wave??1)>1 && (
                  <View style={{ backgroundColor:'#FF440018', borderRadius:6, paddingHorizontal:6, paddingVertical:2 }}>
                    <Text style={{ color:'#FF6644', fontSize:9, fontFamily:mono }}>WAVE {battle?.wave}</Text>
                  </View>
                )}
              </View>
              {/* Token pips */}
              <View style={{ flexDirection:'row', gap:4, alignItems:'center' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ width:8, height:8, borderRadius:4,
                    backgroundColor: i < tokensLeft ? color : '#1A1A26',
                    shadowColor: i < tokensLeft ? color : 'transparent',
                    shadowOpacity: 0.8, shadowRadius: 4, elevation: i < tokensLeft ? 3 : 0 }} />
                ))}
              </View>
            </View>

            {battle && !battle.won && (() => {
              const def = getEnemyDef(battle.entityName);
              const rc  = def.colour;
              const enemyImg = ENEMY_IMAGES[battle.entityName.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES];
              const disabled = tokensLeft <= 0 || attackAnim;
              const spells = ARCHETYPE_SPELLS[archetype.id] ?? ARCHETYPE_SPELLS['vigil'];
              return (<>
                {/* Spell menu overlay */}
                {spellMenuOpen && (
                  <TouchableOpacity activeOpacity={1} onPress={() => setSpellMenuOpen(false)}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20, justifyContent:'center' }}>
                    <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:color+'44', padding:14, margin:4 }}>
                      <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:12, textAlign:'center' }}>✦ SPELLS</Text>
                      {spells.map(sp => {
                        const canCast = tokensLeft >= sp.cost;
                        return (
                          <TouchableOpacity key={sp.id} onPress={() => canCast && handleSpell(sp)} disabled={!canCast}
                            style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:11, paddingHorizontal:12, marginBottom:7, borderRadius:10, borderWidth:1,
                              borderColor: canCast ? color+'55' : '#22223355', backgroundColor: canCast ? color+'0E' : 'transparent' }}>
                            <View style={{ flex:1 }}>
                              <Text style={{ color: canCast ? SOL_THEME.text : '#444455', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{sp.name}</Text>
                              <Text style={{ color: canCast ? color+'77' : '#22223366', fontSize:9, fontFamily:mono, marginTop:3 }}>{sp.fx}</Text>
                            </View>
                            <View style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor: canCast ? color+'88' : '#33334488', backgroundColor: canCast ? color+'18' : 'transparent' }}>
                              <Text style={{ color: canCast ? color : '#444455', fontSize:11, fontFamily:mono, fontWeight:'700' }}>{sp.cost}T</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Enemy row */}
                <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
                  <Animated.View style={{ transform:[{translateX:entityShakeAnim}] }}>
                    {enemyImg ? (
                      <Image source={enemyImg} style={{ width:60, height:76, borderRadius:4 }} resizeMode="contain" />
                    ) : (
                      <View style={{ width:60, height:76, borderRadius:4, borderWidth:1, borderColor:rc+'33', backgroundColor:rc+'06', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:rc, fontSize:20, fontFamily:mono }}>✕</Text>
                      </View>
                    )}
                  </Animated.View>
                  <View style={{ flex:1, gap:4 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                      <Text style={{ color:rc, fontSize:12, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{battle.entityName.toUpperCase()}</Text>
                      {battle.enemyStunned && <Text style={{ color:'#FFBB00', fontSize:8, fontFamily:mono }}>STUNNED</Text>}
                    </View>
                    <View style={{ height:8, backgroundColor:'#1A0000', borderRadius:4, overflow:'hidden' }}>
                      <View style={{ height:8, width:`${Math.round((battle.entityHP/battle.maxHP)*100)}%` as any,
                        backgroundColor:rc, borderRadius:4,
                        shadowColor:rc, shadowOpacity:0.7, shadowRadius:4, elevation:2 }} />
                    </View>
                    <Text style={{ color:rc+'88', fontSize:8, fontFamily:mono }}>{battle.entityHP}/{battle.maxHP} HP</Text>
                  </View>
                </View>

                {/* Dialogue box */}
                <View style={{ borderWidth:1, borderColor:'#FFFFFF14', backgroundColor:'#040407', borderRadius:6, padding:8, marginBottom:10, minHeight:36, justifyContent:'center' }}>
                  <Text style={{ color:'#AAAABC', fontSize:10, fontFamily:mono, lineHeight:16 }} numberOfLines={2}>{`"${battle.enemyLine}"`}</Text>
                </View>

                {/* Player HP */}
                <View style={{ marginBottom:10 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                    <Text style={{ color:'#44FF88', fontSize:8, fontFamily:mono, letterSpacing:1 }}>
                      YOU{battle.playerShielded ? '  ◈ SHIELDED' : battle.defending ? '  ◈ BRACED' : ''}
                    </Text>
                    <Text style={{ color: battle.playerHP < battle.maxPlayerHP*0.3 ? '#FF4444' : '#44FF88AA', fontSize:8, fontFamily:mono }}>
                      {battle.playerHP}/{battle.maxPlayerHP}
                    </Text>
                  </View>
                  <View style={{ height:8, backgroundColor:'#001A00', borderRadius:4, overflow:'hidden' }}>
                    <View style={{ height:8, width:`${Math.round((battle.playerHP/battle.maxPlayerHP)*100)}%` as any,
                      backgroundColor: battle.playerHP < battle.maxPlayerHP*0.3 ? '#FF4444' : '#44FF88', borderRadius:4,
                      shadowColor: battle.playerHP < battle.maxPlayerHP*0.3 ? '#FF4444' : '#44FF88',
                      shadowOpacity:0.6, shadowRadius:4, elevation:2 }} />
                  </View>
                </View>

                {/* 2×2 action grid */}
                <View style={{ flexDirection:'row', gap:6, marginBottom:8 }}>
                  <View style={{ flex:1, gap:6 }}>
                    {([
                      { id:'attack' as const, label:'⚔', name:'FIGHT',  col:'#FF5544' },
                      { id:'defend' as const, label:'◈', name:'GUARD',  col:'#4488FF' },
                    ]).map(btn => (
                      <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={disabled}
                        style={{ paddingVertical:14, borderRadius:10, borderWidth:1.5,
                          borderColor: disabled ? '#1A1A1A' : btn.col+'66',
                          backgroundColor: disabled ? '#0A0A0A' : btn.col+'12', alignItems:'center', gap:2 }}>
                        <Text style={{ color: disabled ? '#222233' : btn.col, fontSize:18, fontFamily:mono }}>
                          {attackAnim && btn.id==='attack' ? '·' : btn.label}
                        </Text>
                        <Text style={{ color: disabled ? '#1A1A2A' : btn.col+'CC', fontSize:8, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                          {attackAnim && btn.id==='attack' ? '···' : btn.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flex:1, gap:6 }}>
                    {([
                      { id:'spell' as const, label:'✦', name:'SPELL', col:color },
                      { id:'item'  as const, label:'◦', name:'ITEM',  col:'#44CC88' },
                    ]).map(btn => {
                      const spellDis = btn.id==='spell' && (disabled || tokensLeft < Math.min(...spells.map(s=>s.cost)));
                      const dis2 = btn.id==='spell' ? spellDis : disabled;
                      return (
                        <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={dis2}
                          style={{ paddingVertical:14, borderRadius:10, borderWidth:1.5,
                            borderColor: dis2 ? '#1A1A1A' : btn.col+'66',
                            backgroundColor: dis2 ? '#0A0A0A' : btn.col+'12', alignItems:'center', gap:2 }}>
                          <Text style={{ color: dis2 ? '#222233' : btn.col, fontSize:18, fontFamily:mono }}>{btn.label}</Text>
                          <Text style={{ color: dis2 ? '#1A1A2A' : btn.col+'CC', fontSize:8, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>{btn.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Log + tokens */}
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ gap:2 }}>
                    {battle.log.slice(0,3).map((entry,i) => (
                      <Text key={i} style={{ color: i===0?(entry.includes('✦')?'#CC99FF':entry.includes('foe')?'#FF7777':'#AAAAAA'):'#444455',
                        fontSize:8, fontFamily:mono, opacity:1-i*0.3 }}>{entry}</Text>
                    ))}
                  </View>
                  {battle.wave>1 && (
                    <TouchableOpacity onPress={handleRetreat}>
                      <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>↩ W1</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>);
            })()}

            {/* Wave cleared */}
            {battle?.won && (
              <View style={{ alignItems:'center', gap:6, paddingVertical:10 }}>
                <Text style={{ color:'#FF6644', fontSize:22, fontFamily:mono }}>✕ CLEARED</Text>
                <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:1 }}>WAVE {battle.wave} · +{battle.wave*20} XP</Text>
                {battle.loot && (
                  <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:6, borderWidth:1, borderColor:'#FFD70055', backgroundColor:'#FFD70009' }}>
                    <Text style={{ color:'#FFD700', fontSize:10, fontFamily:mono }}>◈ {battle.loot}</Text>
                  </View>
                )}
                {(() => { const lore = ENEMY_LORE[battle.entityName.toLowerCase().replace(/ /g,'_')]; return lore ? (
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', textAlign:'center', paddingHorizontal:8, lineHeight:15, opacity:0.7 }}>{lore}</Text>
                ) : null; })()}
                <Text style={{ color:'#222233', fontSize:9, fontFamily:mono, marginTop:4 }}>next wave rising…</Text>
              </View>
            )}
          </View>

          {/* INVENTORY ──────────────────────────────── */}
          {inventory.length > 0 && (
            <View style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'22', backgroundColor:'#080808' }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>INVENTORY</Text>
                <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{inventory.length}/50</Text>
              </View>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                {(() => {
                  const counts: Record<string, number> = {};
                  inventory.forEach(name => { counts[name] = (counts[name]??0)+1; });
                  return Object.entries(counts).map(([name, count]) => {
                    const item = LOOT_TABLE.find(l => l.name === name);
                    const c = item?.rarity==='epic'?'#FF9F1C':item?.rarity==='rare'?'#CC66FF':item?.rarity==='uncommon'?'#44AAFF':'#555566';
                    return (
                      <View key={name} style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:5, borderRadius:7, borderWidth:1, borderColor:c+'44', backgroundColor:c+'0C' }}>
                        <Text style={{ color:c, fontSize:11, fontFamily:mono }}>{item?.glyph??'◈'}</Text>
                        <Text style={{ color:c, fontSize:9, fontFamily:mono, letterSpacing:1 }}>{name}</Text>
                        {count>1 && <Text style={{ color:c+'88', fontSize:8, fontFamily:mono }}>×{count}</Text>}
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FEED TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'feed' && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>

          {/* Active vigil */}
          {vigilName && (
            <View style={{ marginBottom:12, padding:12, borderRadius:10, borderWidth:1, borderColor:color+'44', backgroundColor:color+'08', flexDirection:'row', alignItems:'center', gap:10 }}>
              <Text style={{ color, fontSize:18 }}>◎</Text>
              <View style={{ flex:1 }}>
                <Text style={{ color:'#333344', fontSize:8, letterSpacing:2, fontFamily:mono }}>ACTIVE VIGIL</Text>
                <Text style={{ color:SOL_THEME.text, fontSize:12, marginTop:1 }}>{vigilName}</Text>
              </View>
              <Text style={{ color:color, fontSize:8, fontFamily:mono }}>+100 day 7</Text>
            </View>
          )}

          {/* Feed */}
          <View onLayout={e => { feedY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'33', backgroundColor:cardBg }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>FEED</Text>
              <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{fedToday.length}/3 today</Text>
            </View>
            <View style={{ flexDirection:'row', gap:8 }}>
              {dailyFoods.map(food => {
                const eaten = fedToday.includes(food.id);
                return (
                  <TouchableOpacity key={food.id} onPress={() => handleFeed(food)} disabled={eaten}
                    style={{ flex:1, paddingVertical:14, paddingHorizontal:4, borderRadius:12, borderWidth:1.5, borderColor:eaten?color+'55':food.color+'66', backgroundColor:eaten?color+'10':food.color+'0D', alignItems:'center', gap:5, opacity:eaten?0.65:1 }}>
                    <Text style={{ fontSize:22 }}>{food.glyph}</Text>
                    <Text style={{ color:eaten?color:food.color, fontSize:8, fontFamily:mono, letterSpacing:1, textAlign:'center' }}>{food.domain.toUpperCase()}</Text>
                    <Text style={{ color:'#444455', fontSize:9 }}>+{food.xp} XP</Text>
                    {eaten && <Text style={{ color, fontSize:10 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Needs — always visible, no collapse */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}>
            <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:12 }}>COMPANION NEEDS</Text>
            {[
              { label:'HUNGER', value:hunger, full:'#E8C76A', desc:'Feed domain foods' },
              { label:'WISDOM', value:wisdom, full:'#7B8FE8', desc:'LQ avg' },
              { label:'ENERGY', value:energy, full:'#6AE8A0', desc:'Recency of study' },
            ].map(({ label, value, full, desc }) => (
              <View key={label} style={{ marginBottom:10 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:1.5, fontFamily:mono }}>{label}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    <Text style={{ color:full, fontSize:9, fontWeight:'700', fontFamily:mono }}>{Math.round(value*100)}%</Text>
                    <Text style={{ color:'#333344', fontSize:8, fontStyle:'italic' }}>{desc}</Text>
                  </View>
                </View>
                <View style={{ height:5, backgroundColor:'#111120', borderRadius:3, overflow:'hidden' }}>
                  <View style={{ height:5, width:`${Math.round(value*100)}%`, backgroundColor:full, borderRadius:3 }} />
                </View>
              </View>
            ))}
            <Text style={{ color:'#333344', fontSize:10, fontStyle:'italic', marginTop:4, lineHeight:16 }}>
              {hunger<0.3&&energy<0.3 ? 'The companion rests. Come study.' : hunger>=1&&wisdom>=0.8 ? 'Well fed. The companion glows.' : 'Needs grow through the Work.'}
            </Text>
          </View>

        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          GEAR TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gear' && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>

          {/* LAMAGUE Gear */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'33', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowGear(g=>!g); }}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:showGear?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>LAMAGUE GEAR</Text>
                {allGearEquipped && <Text style={{ color:color, fontSize:9 }}>✦</Text>}
              </View>
              <Text style={{ color:'#333344', fontSize:10 }}>{showGear?'▲':'▼'}</Text>
            </TouchableOpacity>
            {showGear && (
              <>{([['CROWN',gearCrown,nextCrown],['BODY',gearBody,nextBody],['CAPE',gearCape,nextCape],['SIGIL',gearSigil,nextSigil],['MANTLE',gearMantle,nextMantle]] as [string,GearTier,GearTier|null][]).map(([slotName,gear,next]) => (
                <View key={slotName} style={{ marginBottom:10, paddingBottom:10, borderBottomWidth:1, borderBottomColor:'#1A1A26' }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                    <View style={{ width:34, height:34, borderRadius:8, borderWidth:1,
                      borderColor:gear.threshold>0?color+'66':'#1A1A26', backgroundColor:gear.threshold>0?color+'10':'transparent', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ color:gear.threshold>0?color:'#333344', fontSize:15 }}>{gear.glyph}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                        <Text style={{ color:'#333344', fontSize:8, letterSpacing:2, fontFamily:mono }}>{slotName}</Text>
                        {next && <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>next {next.threshold}d</Text>}
                      </View>
                      <Text style={{ color:gear.threshold>0?color:'#444455', fontSize:12, fontWeight:'600', marginTop:1 }}>{gear.name}</Text>
                      <Text style={{ color:'#555566', fontSize:10, marginTop:1 }}>{gear.effect}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {allGearEquipped && <Text style={{ color, fontSize:10, fontFamily:mono, letterSpacing:1, textAlign:'center', paddingTop:4 }}>✦ FULL LOADOUT ACTIVE</Text>}
              </>
            )}
          </View>

          {/* Relics — with bonus stats */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:earnedRelicData.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>RELICS</Text>
                <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:color+'18', borderWidth:1, borderColor:color+'33' }}>
                  <Text style={{ color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{earnedRelicData.length}</Text>
                </View>
              </View>
            </View>
            {earnedRelicData.length > 0 ? (
              <View style={{ gap:8 }}>
                {earnedRelicData.map(r => {
                  const bonusKeys = r.bonus ? (Object.keys(r.bonus) as (keyof PlayerStats)[]) : [];
                  return (
                    <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:10, padding:10, borderRadius:10, borderWidth:1, borderColor:color+'22', backgroundColor:color+'06' }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:color+'44', backgroundColor:color+'12', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:18 }}>{r.glyph}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700' }}>{r.name}</Text>
                        {bonusKeys.length > 0 && (
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4 }}>
                            {bonusKeys.map(k => (
                              <View key={k} style={{ paddingHorizontal:5, paddingVertical:2, borderRadius:4, backgroundColor:color+'18' }}>
                                <Text style={{ color:color, fontSize:8, fontFamily:mono }}>+{r.bonus![k]} {k.toUpperCase()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {r.lore && (
                          <Text style={{ color:'#444455', fontSize:9, marginTop:4, fontStyle:'italic', lineHeight:13 }} numberOfLines={2}>{r.lore}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>No relics yet. Complete school dives.</Text>
            )}
          </View>

          {/* Companion Lore */}
          <View onLayout={e => { loreY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26' }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>LORE · {stageData.name}</Text>
              <TouchableOpacity onPress={handleUploadDoc} disabled={uploadLoading}
                style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3,
                  borderRadius:6, borderWidth:1, borderColor: uploadedDoc ? color+'44' : '#1A1A26',
                  backgroundColor: uploadedDoc ? color+'0A' : 'transparent' }}>
                <Text style={{ color: uploadedDoc ? color : '#333344', fontSize:8, fontFamily:mono }}>
                  {uploadLoading ? '···' : uploadedDoc ? `↑ ${uploadedDoc.name.slice(0,16)}${uploadedDoc.name.length>16?'…':''}` : '↑ upload'}
                </Text>
              </TouchableOpacity>
            </View>
            {liveLore.slice(0,5).map((l,i) => (
              <View key={i} style={{ borderLeftWidth:2, borderLeftColor:color+'55', paddingLeft:10, marginBottom:10 }}>
                <Text style={{ color:SOL_THEME.text, fontSize:12, lineHeight:19, fontStyle:'italic' }}>{l.text}</Text>
                <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, marginTop:2 }}>{l.subject} · {l.date}</Text>
              </View>
            ))}
            {liveLore.length > 0 && <View style={{ height:1, backgroundColor:'#1A1A26', marginVertical:6 }} />}
            <Text style={{ color:'#555566', fontSize:12, lineHeight:19, fontStyle:'italic' }}>{stageData.lore}</Text>
          </View>

          {/* Lore Codex */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#060608' }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:loreCodex.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:'#7744CC' }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>CODEX</Text>
                {loreCodex.length > 0 && (
                  <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:'#7744CC18', borderWidth:1, borderColor:'#7744CC33' }}>
                    <Text style={{ color:'#9966EE', fontSize:8, fontFamily:mono, fontWeight:'700' }}>{loreCodex.length}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>battle drops</Text>
            </View>
            {loreCodex.length > 0 ? (
              <View style={{ gap:8 }}>
                {loreCodex.slice(0, 12).map((entry, i) => (
                  <View key={entry.id} style={{ flexDirection:'row', gap:10, paddingBottom: i < Math.min(loreCodex.length,12)-1 ? 8 : 0,
                    borderBottomWidth: i < Math.min(loreCodex.length,12)-1 ? 1 : 0, borderBottomColor:'#111118' }}>
                    <View style={{ width:20, height:20, borderRadius:4, alignItems:'center', justifyContent:'center',
                      backgroundColor: entry.type==='enemy' ? '#33006688' : '#00441188' }}>
                      <Text style={{ fontSize:10, color: entry.type==='enemy' ? '#9966CC' : '#44BB77' }}>
                        {entry.type==='enemy' ? '✕' : '◈'}
                      </Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: entry.type==='enemy' ? '#665577' : '#446655', fontSize:8, letterSpacing:1, fontFamily:mono, marginBottom:3 }}>
                        {entry.enemy.toUpperCase()} · {entry.date}
                      </Text>
                      <Text style={{ color:'#666677', fontSize:11, lineHeight:17, fontStyle:'italic' }}>{entry.text}</Text>
                    </View>
                  </View>
                ))}
                {loreCodex.length > 12 && (
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, textAlign:'center' }}>+{loreCodex.length-12} more entries</Text>
                )}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>
                Defeat entities in battle to unlock lore fragments.
              </Text>
            )}
          </View>

        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FIELD TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'field' && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>

          {/* Name + Archetype header */}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <View>
              <Text style={{ color:'#333344', fontSize:8, letterSpacing:3, fontFamily:mono }}>{stageData.name}</Text>
              <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>{companionName || archetype.name}</Text>
              <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)} style={{ marginTop:5 }}>
                <Text style={{ color:color+'88', fontSize:9, fontFamily:mono, letterSpacing:1 }}>✎ RENAME</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75} style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color, fontSize:30 }}>{archetype.glyph}</Text>
              <Text style={{ color:color+'66', fontSize:7, fontFamily:mono, letterSpacing:1 }}>SHEET</Text>
            </TouchableOpacity>
          </View>

          {/* Evolution + XP */}
          <View style={{ marginBottom:14, gap:10, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <View>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
                <Text style={{ color, fontSize:9, letterSpacing:2, fontFamily:mono, opacity:0.75 }}>EVO · {stageData.name}</Text>
                <Text style={{ color:'#444455', fontSize:9, fontFamily:mono }}>
                  {stage<5 ? `${totalDives}/${stageData.nextAt} → ${STAGES[(stage+1) as EvolutionStage]?.name}` : '∞ SOVEREIGN'}
                </Text>
              </View>
              <View style={{ height:5, backgroundColor:color+'18', borderRadius:3 }}>
                <View style={{ height:5, width:`${Math.round(evProg*100)}%`, backgroundColor:color, borderRadius:3 }} />
              </View>
            </View>
            <View>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                <Text style={{ color, fontSize:9, letterSpacing:2, fontFamily:mono, opacity:0.75 }}>XP · {xp}</Text>
                <Text style={{ color:'#444455', fontSize:9, fontFamily:mono }}>{lvl.next ? `→ ${lvl.next.title} at ${lvl.next.xp}` : 'MAX'}</Text>
              </View>
              <View style={{ height:3, backgroundColor:color+'18', borderRadius:2 }}>
                <View style={{ height:3, width:`${Math.round(lvl.progress*100)}%`, backgroundColor:color, borderRadius:2, opacity:0.7 }} />
              </View>
            </View>
          </View>

          {/* Quests — chip format */}
          <View style={{ marginBottom:14 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>QUESTS</Text>
              <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{quests.filter(q=>q.check(questData)).length}/{quests.length}</Text>
            </View>
            {/* overall progress bar */}
            {(() => {
              const done = quests.filter(q=>q.check(questData)).length;
              return (
                <View style={{ height:3, backgroundColor:'#1A1A26', borderRadius:2, overflow:'hidden', marginBottom:10 }}>
                  <View style={{ height:3, backgroundColor:done===quests.length?'#44CC88':color, width:`${quests.length>0?(done/quests.length)*100:0}%` as any, borderRadius:2 }} />
                </View>
              );
            })()}
            {/* Quest chips */}
            <View style={{ gap:5 }}>
              {quests.map(q => {
                const done = q.check(questData);
                return (
                  <View key={q.id} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, paddingHorizontal:10, borderRadius:8, borderWidth:1,
                    borderColor:done?color+'44':'#1A1A26', backgroundColor:done?color+'08':'transparent' }}>
                    <Text style={{ color:done?color:'#333344', fontSize:13 }}>{done?'✓':'○'}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:done?color:SOL_THEME.textMuted, fontSize:11, fontWeight:done?'700':'400' }}>{q.label}</Text>
                      {!done && <Text style={{ color:'#333344', fontSize:9, marginTop:1 }}>{q.desc}</Text>}
                    </View>
                    <Text style={{ color:done?color:'#333344', fontSize:11, fontWeight:'700', fontFamily:mono }}>+{q.xp}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Companion Law */}
          <View style={{ marginBottom:14, padding:12, borderRadius:10, borderWidth:1, borderColor:'#1A1A26' }}>
            <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>COMPANION LAW</Text>
            <Text style={{ color:'#555566', fontSize:11, lineHeight:18, fontStyle:'italic' }}>
              Never starves. Never dies. Never guilts. Absence is rest. Evolution earned through the Work — the form is sacred and cannot be bought.
            </Text>
          </View>

        </View>
      )}

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

            {/* Stat grid — 7 stats from playerStats */}
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {([
                { label:'ATK', glyph:'⚔',  value:playerStats.atk, desc:'Physical strike power',    col:'#FF6B6B', max:40 },
                { label:'DEF', glyph:'◈',  value:playerStats.def, desc:'Damage reduction',          col:'#4ECDC4', max:40 },
                { label:'SPD', glyph:'◦',  value:playerStats.spd, desc:'Speed · dodge threshold',   col:'#DDAA44', max:40 },
                { label:'WIL', glyph:'Ψ',  value:playerStats.wil, desc:'Spell power multiplier',    col:'#9B6BFF', max:40 },
                { label:'LCK', glyph:'✦',  value:playerStats.lck, desc:'Crit + loot rate',          col:'#C49A3C', max:40 },
                { label:'VIT', glyph:'◉',  value:playerStats.vit, desc:'Max HP pool',               col:'#44FF88', max:40 },
                { label:'RES', glyph:'⊛',  value:playerStats.res, desc:'Status resist',             col:'#FF9F1C', max:40 },
              ] as { label:string; glyph:string; value:number; desc:string; col:string; max:number }[]).map(({ label, glyph, value, desc, col, max }) => (
                <View key={label} style={{ width:'47%' }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                      <Text style={{ color:col, fontSize:12 }}>{glyph}</Text>
                      <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>{label}</Text>
                    </View>
                    <Text style={{ color:col, fontSize:16, fontWeight:'700', fontFamily:mono }}>{value}</Text>
                  </View>
                  <View style={{ height:3, backgroundColor:SOL_THEME.border, borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                    <View style={{ height:3, width:`${Math.min(100, (value/max)*100)}%` as any, backgroundColor:col, borderRadius:2 }} />
                  </View>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontStyle:'italic' }}>{desc}</Text>
                </View>
              ))}
            </View>

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

      {/* ── DEV STAGE SKIP — remove before shipping ──────────────────────── */}
      {SHOW_DEV_STAGE && (
        <View style={{ marginHorizontal:16, marginBottom:20, padding:12, borderRadius:10, borderWidth:1, borderColor:'#FF440055', backgroundColor:'#FF000008' }}>
          <Text style={{ color:'#FF4444', fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:8 }}>⚠ DEV — STAGE VIEWER</Text>
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap' }}>
            {([0,1,2,3,4,5] as EvolutionStage[]).map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setDevStagePin(devStagePin === s ? null : s)}
                style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:6, borderWidth:1,
                  borderColor: devStagePin === s ? '#FF4444' : '#FF444433',
                  backgroundColor: devStagePin === s ? '#FF000033' : 'transparent' }}
              >
                <Text style={{ color: devStagePin === s ? '#FF6666' : '#FF444488', fontSize:11, fontFamily:mono }}>
                  {s === 0 ? 'S0' : s === 1 ? 'S1★' : `S${s}`}
                </Text>
              </TouchableOpacity>
            ))}
            {devStagePin !== null && (
              <TouchableOpacity onPress={() => setDevStagePin(null)} style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:6, borderWidth:1, borderColor:'#FFFFFF22' }}>
                <Text style={{ color:'#FFFFFF44', fontSize:11, fontFamily:mono }}>RESET</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ color:'#FF444466', fontSize:9, fontFamily:mono, marginTop:6 }}>
            {devStagePin !== null ? `PINNED TO STAGE ${devStagePin}` : 'PINNED TO S1 (default)'}
          </Text>
        </View>
      )}

    </ScrollView>
  );
}
