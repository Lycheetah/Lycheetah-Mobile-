import type { ArchetypeId } from '../../app/data/companion-types';
import {
  SkinId, SKINS, SKIN_IDS, SKIN_ORDER, WORLD_MAP, SKIN_RARITY,
} from './zones';
import type { SceneRoom } from './zones';

// ─── Types ────────────────────────────────────────────────────────────────────

type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type CompanionMood  = 'dormant' | 'present' | 'lit' | 'transcendent';
// SkinId and all zone data live in ./companion-zones
type Direction     = 'up' | 'down' | 'left' | 'right';
type GearSlot      = 'crown' | 'sigil' | 'mantle' | 'body' | 'cape';
type EvoPath       = 'A' | 'B' | 'C';

const SPECIAL_COMPANIONS: {
  key: string; name: string; family: string; color: string; unlockHint: string; diveThreshold: number | null;
}[] = [
  { key:'lycheetah_shadow',         name:'LYCA SHADOW FANG',     family:'LYCHEETAH', color:'#8855FF', unlockHint:'FREE · preview',         diveThreshold:0 },
  { key:'lycheetah_sovereign',      name:'LYCA SOVEREIGN FINAL', family:'LYCHEETAH', color:'#FFD700', unlockHint:'SOVEREIGN stage',        diveThreshold:200 },
  { key:'lycheetah_secret',         name:'THE HIDDEN ONE',       family:'LYCHEETAH', color:'#CC88FF', unlockHint:'✦ 0.001% — found only by wandering zones. Never sold.',           diveThreshold:null },
  { key:'chaos_zodiac',             name:'FRACTUR ZODIAC UNLOCK',family:'FRACTUR',   color:'#6600CC', unlockHint:'First LAMAGUE symbol',   diveThreshold:null },
  { key:'norse_special_1',          name:'RAGNA SPECIAL I',      family:'RAGNA',     color:'#CC4444', unlockHint:'FREE · preview',         diveThreshold:0 },
  { key:'norse_special_2',          name:'RAGNA SPECIAL II',     family:'RAGNA',     color:'#FF6644', unlockHint:'200 dives',              diveThreshold:200 },
  { key:'egyptian_special_1',       name:'ANOTH SPECIAL I',      family:'ANOTH',     color:'#FFD700', unlockHint:'FREE · preview',         diveThreshold:0 },
  { key:'egyptian_special_2',       name:'ANOTH SPECIAL II',     family:'ANOTH',     color:'#FFD700', unlockHint:'125 dives',              diveThreshold:125 },
  { key:'egyptian_special_3',       name:'ANOTH SPECIAL III',    family:'ANOTH',     color:'#FFAA22', unlockHint:'175 dives',              diveThreshold:175 },
  { key:'anoth_lycheetah_special',  name:'ANOTH × LYCA SPECIAL', family:'ANOTH',     color:'#AA88FF', unlockHint:'Crossover event',        diveThreshold:null },
  { key:'anoth_lycheetah_edition',  name:'ANOTH LYCHEETAH EDN',  family:'ANOTH',     color:'#8866DD', unlockHint:'Crossover event',        diveThreshold:null },
  { key:'delphi_feral',             name:'PYTHIA FERAL',         family:'PYTHIA',    color:'#FF4488', unlockHint:'FREE · preview',         diveThreshold:0 },
  { key:'delphi_special_1',         name:'PYTHIA SPECIAL I',     family:'PYTHIA',    color:'#FF66AA', unlockHint:'130 dives',              diveThreshold:130 },
  { key:'delphi_special_2',         name:'PYTHIA SPECIAL II',    family:'PYTHIA',    color:'#FF88CC', unlockHint:'180 dives',              diveThreshold:180 },
  { key:'sufi_special',             name:'HAVIZ SPECIAL',        family:'HAVIZ',     color:'#44CCFF', unlockHint:'FREE · preview',         diveThreshold:0 },
];

function getItemEffect(item: { name: string; rarity: string }): string {
  const effects: Record<string, string> = {
    'Ember Root': '+8 ATK for next battle',
    'Void Shard': '+15 DEF for 3 battles',
    'Spirit Ember': 'Restores 30 HP',
    'Storm Dust': '+12 SPD, causes first strike',
    'Obsidian Rune': '+20 WIL, improves dialogue quality',
    'Chaos Seed': 'Random stat +25 (rolled on use)',
    'Aurora Mist': 'Full HP restore',
    'Sol Ember': '+10 all stats for 1 battle',
  };
  return effects[item.name] ?? `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} item — effect unlocked in next patch`;
}

function getRoomById(id: string): SceneRoom | undefined { return WORLD_MAP.find(r => r.id === id); }
function getSkinIndex(skinId: SkinId): number { return SKIN_ORDER.indexOf(skinId); }
function getRoomInSkin(skinId: SkinId, roomIndex: number): SceneRoom | undefined { return WORLD_MAP.find(r => r.skinId === skinId && r.roomIndex === roomIndex); }
function showToast(msg: string) { const { ToastAndroid, Platform } = require('react-native'); if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT); }


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
  behavior?: EnemyBehavior;  // intent + signature move (BATTLE-1/3). Optional → plain striker.
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
    lines:{ enter:'You cannot see what you cannot name.', attack:['The mist thickens.','Where were you going?','Lost again.'], death:'The fog lifts. For now.' },
    behavior:{ special:{ name:'BLIND', tell:'The fog thickens — it will cloud your sight.', kind:'blind', everyN:3 } } },
  { name:'Forgetting',     rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'What were you working on?', attack:['Slipping away…','Gone already.','What was its name?'], death:'You remembered me.' },
    behavior:{ special:{ name:'UNMAKE', tell:'Forgetting reaches for your focus — it will strip your charge.', kind:'strip_focus', everyN:3 } } },
  { name:'Stasis',         rarity:'common',    weight:10, hpMult:1.1, xpMult:1.0,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Stay. It is easier here.', attack:['No need to move.','Rest a while.','Tomorrow is fine.'], death:'Movement returns.' },
    behavior:{ special:{ name:'STILL', tell:'Stasis is about to freeze you in place.', kind:'inflict', inflict:'freeze', power:1, everyN:4 } } },
  { name:'Inertia',        rarity:'common',    weight:10, hpMult:1.2, xpMult:1.1,  atk:10, colour:RARITY_COLOUR.common,
    lines:{ enter:'Starting is the hardest part.', attack:['The weight grows.','One more day.','Too heavy to lift.'], death:'The first step is taken.' },
    behavior:{ special:{ name:'AVALANCHE', tell:'Inertia is gathering weight — a crushing blow is coming. SHIELD.', kind:'big_hit', power:2.4, everyN:3 } } },
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
  // Sol-named — wave 2 enemies (June 2026)
  { name:'The Mirror',           rarity:'common',    weight:9,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Look. That is you.', attack:['Your own doubt returns.','Reflected back.','Nothing new — only you.'], death:'The reflection breaks.' }},
  { name:'Severance',            rarity:'common',    weight:9,  hpMult:1.1, xpMult:1.1,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Cut from the thread.', attack:['The connection severs.','Isolated now.','The cord frays.'], death:'Rejoined.' }},
  { name:'The Threshold',        rarity:'common',    weight:9,  hpMult:0.9, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You have been here before.', attack:['Not yet ready.','One step back.','The door stays closed.'], death:'The threshold crossed.' }},
  { name:'Pallor',               rarity:'common',    weight:8,  hpMult:0.9, xpMult:0.9,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Colour drains from everything eventually.', attack:['Greyer now.','Fading.','The warmth leaves.'], death:'Colour returns.' }},
  { name:'The Witness',          rarity:'common',    weight:8,  hpMult:1.0, xpMult:1.0,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'I only watch. That is enough.', attack:['Observed.','Still watching.','You know I see.'], death:'The gaze released.' }},
  { name:'Recursion',            rarity:'common',    weight:8,  hpMult:1.1, xpMult:1.0,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'We have done this before.', attack:['Again.','Back to the start.','Loop tightens.'], death:'The loop breaks.' }},
  { name:'Binding',              rarity:'common',    weight:8,  hpMult:1.2, xpMult:1.1,  atk:10, colour:RARITY_COLOUR.common,
    lines:{ enter:'Stay. You belong here.', attack:['Held fast.','The binding holds.','Cannot leave.'], death:'Unbound.' }},
  { name:'The Pale',             rarity:'common',    weight:8,  hpMult:0.8, xpMult:0.9,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Everything here is washed out.', attack:['Bleached.','Less vivid now.','The saturation drains.'], death:'The world brightens.' }},
  { name:'The Current',          rarity:'common',    weight:8,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Swim against me. I dare you.', attack:['Swept away.','The pull increases.','Downstream now.'], death:'Still water.' }},
  { name:'Overture',             rarity:'common',    weight:8,  hpMult:0.9, xpMult:0.9,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Always beginning. Never arriving.', attack:['Almost started.','One more delay.','Preparation continues.'], death:'The work begins.' }},
  { name:'The Signal',           rarity:'common',    weight:7,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'I am the noise you mistook for meaning.', attack:['Distracted.','False pattern.','Chasing ghosts.'], death:'Signal found.' }},
  { name:'The Mask',             rarity:'common',    weight:7,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Which face is yours today?', attack:['Performance required.','The mask tightens.','No one knows you.'], death:'The face beneath.' }},
  { name:'The Anchor',           rarity:'common',    weight:7,  hpMult:1.3, xpMult:1.1,  atk:11, colour:RARITY_COLOUR.common,
    lines:{ enter:'You will not rise.', attack:['Heavier now.','Cannot ascend.','The depth holds you.'], death:'Surfacing.' }},
  { name:'The Swarm',            rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Many voices. One paralysis.', attack:['The noise multiplies.','Overwhelmed.','Too many things at once.'], death:'Silence returns.' }},
  { name:'The Lattice',          rarity:'uncommon',  weight:5,  hpMult:1.5, xpMult:1.6,  atk:15, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The structure holds you in place.', attack:['Locked in.','The grid tightens.','Every direction blocked.'], death:'The lattice dissolves.' }},
  { name:'The Seam',             rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Things split here. It is where I live.', attack:['Splitting.','The crack widens.','Two halves now.'], death:'The seam seals.' }},
  { name:'The Vigil',            rarity:'uncommon',  weight:5,  hpMult:1.6, xpMult:1.7,  atk:16, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You cannot rest. I need you watching.', attack:['Stay alert.','Eyes open.','No sleep here.'], death:'Rest earned.' }},
  { name:'The Undertow',         rarity:'uncommon',  weight:4,  hpMult:1.7, xpMult:1.8,  atk:17, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Surface looks calm. Come closer.', attack:['Pulled under.','Deeper now.','The surface recedes.'], death:'Emerged.' }},
  { name:'Residue',              rarity:'uncommon',  weight:5,  hpMult:1.3, xpMult:1.4,  atk:12, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'What lingers past its time.', attack:['Still here.','Cannot clear it.','The residue spreads.'], death:'Cleared.' }},
  { name:'The Interval',         rarity:'uncommon',  weight:5,  hpMult:1.2, xpMult:1.3,  atk:11, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The gap between things is where I live.', attack:['The pause stretches.','Nothing connecting.','The gap widens.'], death:'Bridged.' }},
  { name:'The Return',           rarity:'uncommon',  weight:4,  hpMult:1.5, xpMult:1.6,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You always come back to this.', attack:['Back again.','The pattern repeats.','Familiar territory.'], death:'Released from return.' }},
  { name:'The Bloom',            rarity:'uncommon',  weight:4,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Beautiful. Consuming.', attack:['Spreading.','It overtakes.','The bloom expands.'], death:'Pruned.' }},
  { name:'Vertigo',              rarity:'rare',      weight:2,  hpMult:2.0, xpMult:2.5,  atk:22, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Which way is up?', attack:['DISORIENTING.','The ground tilts.','All bearings lost.'], death:'Orientation restored.' }},
  { name:'The Becoming',         rarity:'rare',      weight:2,  hpMult:2.2, xpMult:2.6,  atk:24, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Transformation stuck halfway. Neither here nor there.', attack:['HALF-FORM.','The change stalls.','Neither one thing nor another.'], death:'The becoming completes.' }},
  { name:'The Coefficient',      rarity:'rare',      weight:2,  hpMult:2.3, xpMult:2.8,  atk:26, colour:RARITY_COLOUR.rare,
    lines:{ enter:'The unknown factor in every equation.', attack:['MULTIPLYING.','Uncertainty amplified.','The variable expands.'], death:'The equation solves.' }},
  { name:'Archive Prime',        rarity:'rare',      weight:2,  hpMult:2.4, xpMult:3.0,  atk:27, colour:RARITY_COLOUR.rare,
    lines:{ enter:'I hold everything you wanted to forget.', attack:['ARCHIVE SURGE.','The record burns.','All of it, here.'], death:'The archive releases.' }},
  { name:'The Vortex',           rarity:'rare',      weight:2,  hpMult:2.5, xpMult:3.0,  atk:28, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Everything spirals inward here.', attack:['VORTEX PULL.','Drawn in.','The centre tightens.'], death:'The vortex stills.' }},
  { name:'Silence Prime',        rarity:'epic',      weight:1,  hpMult:3.2, xpMult:4.5,  atk:32, colour:RARITY_COLOUR.epic,
    lines:{ enter:'The absence that speaks louder than any sound.', attack:['PRIME SILENCE.','The void speaks.','Deafening stillness.'], death:'Sound returns to the world.' }},
  { name:'The Convergence',      rarity:'epic',      weight:1,  hpMult:3.8, xpMult:5.5,  atk:38, colour:RARITY_COLOUR.epic,
    lines:{ enter:'Every force that opposes you, gathered.', attack:['CONVERGENCE.','All resistance, one point.','The forces align.'], death:'Dispersed.' }},
  { name:'Sovereign Pallor',     rarity:'epic',      weight:1,  hpMult:4.0, xpMult:6.0,  atk:40, colour:RARITY_COLOUR.epic,
    lines:{ enter:'I am the draining of every bright thing. Crowned and patient.', attack:['SOVEREIGN DRAIN.','The light thins.','All colour to grey.'], death:'The sovereign dims.' }},
  { name:'The Great Forgetting',  rarity:'legendary', weight:1,  hpMult:6.0, xpMult:12.0, atk:50, colour:RARITY_COLOUR.legendary,
    lines:{ enter:'I am what erases the Work. All of it. Eventually.', attack:['THE GREAT FORGETTING.','All of it — gone.','What work?'], death:'It is remembered. It was always remembered.' }},
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
const COMPANION_IMAGES: Record<string, any> = {};

// Zone companions — keyed by skinId_stageNum (1/2/3 from Grok).
// Stages 0-1 → _1, stages 2-3 → _2, stages 4-5 → _3.
// Drop more art → add key here. Missing keys fall back to SVG.
const ZONE_COMPANION_IMAGES: Partial<Record<string, any>> = {
  // SOLARA — Solform zone
  solform_1:           require('../../assets/companions/solara_1.png'),
  solform_2:           require('../../assets/companions/solara_2.png'),
  solform_3:           require('../../assets/companions/solara_3.png'),
  // NOCTIS — Void zone
  void_1:              require('../../assets/companions/noctis_1.png'),
  void_2:              require('../../assets/companions/noctis_2.png'),
  void_3:              require('../../assets/companions/noctis_3.png'),
  // BOREAL — Aurora zone
  aurora_1:            require('../../assets/companions/boreal_1.png'),
  aurora_2:            require('../../assets/companions/boreal_2.png'),
  aurora_3:            require('../../assets/companions/boreal_3.png'),
  // VORKATH — Crimson forge zone
  crimson_1:           require('../../assets/companions/vorkath_1.png'),
  crimson_2:           require('../../assets/companions/vorkath_2.png'),
  crimson_3:           require('../../assets/companions/vorkath_3.png'),
  // CORDIA — Obsidian zone
  obsidian_1:          require('../../assets/companions/cordia_1.png'),
  obsidian_2:          require('../../assets/companions/cordia_2.png'),
  obsidian_3:          require('../../assets/companions/cordia_3.png'),
  // BASALT — Collectible alternate
  basalt_1:            require('../../assets/companions/basalt_1.png'),
  basalt_2:            require('../../assets/companions/basalt_2.png'),
  basalt_3:            require('../../assets/companions/basalt_3.png'),
  // LYCA — Lycheetah zone (forms + specials)
  lycheetah_1:         require('../../assets/companions/lycheetah_1.png'),
  lycheetah_2:         require('../../assets/companions/lycheetah_2.png'),
  lycheetah_3:         require('../../assets/companions/lycheetah_3.png'),
  lycheetah_shadow:    require('../../assets/companions/lycheetah_shadow.png'),
  lycheetah_sovereign: require('../../assets/companions/lycheetah_sovereign.png'),
  lycheetah_secret:    require('../../assets/companions/lycheetah_secret.png'),
  // FRACTUR — Chaos zone (+ zodiac unlock special)
  chaos_1:             require('../../assets/companions/fractur_1.png'),
  chaos_2:             require('../../assets/companions/fractur_2.png'),
  chaos_3:             require('../../assets/companions/fractur_3.png'),
  chaos_zodiac:        require('../../assets/companions/fractur_zodiac_unlock.png'),
  // AUGURUM — Sovereign zone
  sovereign_1:         require('../../assets/companions/augurum_1.png'),
  sovereign_2:         require('../../assets/companions/augurum_2.png'),
  sovereign_3:         require('../../assets/companions/augurum_3.png'),
  // RAGNA — Norse zone (+ specials)
  norse_1:             require('../../assets/companions/ragna_1.png'),
  norse_2:             require('../../assets/companions/ragna_2.png'),
  norse_3:             require('../../assets/companions/ragna_3.png'),
  norse_special_1:     require('../../assets/companions/ragna_special_1.png'),
  norse_special_2:     require('../../assets/companions/ragna_special_2.png'),
  // NIMUE — Celtic zone
  celtic_1:            require('../../assets/companions/nimue_1.png'),
  celtic_2:            require('../../assets/companions/nimue_2.png'),
  celtic_3:            require('../../assets/companions/nimue_3.png'),
  // ANOTH — Egyptian zone (+ specials)
  egyptian_1:          require('../../assets/companions/anoth_1.png'),
  egyptian_2:          require('../../assets/companions/anoth_2.png'),
  egyptian_3:          require('../../assets/companions/anoth_3.png'),
  egyptian_special_1:  require('../../assets/companions/anoth_special_1.png'),
  egyptian_special_2:  require('../../assets/companions/anoth_special_2.png'),
  egyptian_special_3:  require('../../assets/companions/anoth_special_3.png'),
  // AKASHA — Akashic zone
  akashic_1:           require('../../assets/companions/akasha_1.png'),
  akashic_2:           require('../../assets/companions/akasha_2.png'),
  akashic_3:           require('../../assets/companions/akasha_3.png'),
  // QUOL — Noetic zone
  noetic_1:            require('../../assets/companions/quol_2.png'),
  noetic_2:            require('../../assets/companions/quol_3.png'),
  noetic_3:            require('../../assets/companions/quol_4.png'),
  // SYGL — LAMAGUE zone
  lamague_1:           require('../../assets/companions/sygl_1.png'),
  lamague_2:           require('../../assets/companions/sygl_2.png'),
  lamague_3:           require('../../assets/companions/sygl_3.png'),
  // PYTHIA — Delphi zone (+ specials)
  delphi_1:            require('../../assets/companions/pythia_1.png'),
  delphi_2:            require('../../assets/companions/pythia_2.png'),
  delphi_3:            require('../../assets/companions/pythia_3.png'),
  delphi_feral:        require('../../assets/companions/pythia_feral.png'),
  delphi_special_1:    require('../../assets/companions/pythia_special_1.png'),
  delphi_special_2:    require('../../assets/companions/pythia_special_2.png'),
  // HAVIZ — Sufi zone (+ special)
  sufi_1:              require('../../assets/companions/haviz_1.png'),
  sufi_2:              require('../../assets/companions/haviz_2.png'),
  sufi_3:              require('../../assets/companions/haviz_3.png'),
  sufi_special:        require('../../assets/companions/haviz_special.png'),
  // LYCA × AURA PRIME — secret crossover (secret find)
  lycheetah_aura_prime:      require('../../assets/companions/lycheetah_aura_prime.png'),
  // ANOTH × LYCHEETAH special editions
  anoth_lycheetah_special:   require('../../assets/companions/anoth_lycheetah_special.png'),
  anoth_lycheetah_edition:   require('../../assets/companions/anoth_lycheetah_edition.png'),
  anoth_lyca_special:        require('../../assets/companions/anoth_lyca_special.png'),
  // PYTHIA special edition
  pythia_special_edition:    require('../../assets/companions/pythia_special_edition.png'),
  // KABBALA zone — quol forms (no dedicated art yet)
  kabbala_1:           require('../../assets/companions/quol_2.png'),
  kabbala_2:           require('../../assets/companions/quol_3.png'),
  kabbala_3:           require('../../assets/companions/quol_4.png'),
  // QUANTUM zone — quol forms
  quantum_1:           require('../../assets/companions/quol_2.png'),
  quantum_2:           require('../../assets/companions/quol_3.png'),
  quantum_3:           require('../../assets/companions/quol_4.png'),
  // ── FRONTIER ZONES (v4.4.0) ─────────────────────────────────────────────────
  auroral_chaos_1:     require('../../assets/companions/auroral_chaos_1.png'),
  auroral_chaos_2:     require('../../assets/companions/auroral_chaos_2.png'),
  chaos_temple_1:      require('../../assets/companions/chaos_temple_1.png'),
  chaos_temple_2:      require('../../assets/companions/chaos_temple_2.png'),
  apollo_jungle_1:     require('../../assets/companions/apollo_jungle_1.png'),
  apollo_jungle_2:     require('../../assets/companions/apollo_jungle_2.png'),
  celestial_sigil_1:   require('../../assets/companions/celestial_sigil_1.png'),
  celestial_sigil_2:   require('../../assets/companions/celestial_sigil_2.png'),
  crystal_nexus_1:     require('../../assets/companions/crystal_nexus_1.png'),
  mana_field_1:        require('../../assets/companions/mana_field_1.png'),
  neon_cove_1:         require('../../assets/companions/neon_cove_1.png'),
  alabaster_chasm_1:   require('../../assets/companions/alabaster_chasm_1.png'),
  antarctic_refuge_1:  require('../../assets/companions/antarctic_refuge_1.png'),
  augmented_ai_1:      require('../../assets/companions/augmented_ai_1.png'),
  aurorian_pillar_1:   require('../../assets/companions/aurorian_pillar_1.png'),
  celestial_foundry_1: require('../../assets/companions/celestial_foundry_1.png'),
  chaos_filaments_1:   require('../../assets/companions/chaos_filaments_1.png'),
  crystal_chaos_1:     require('../../assets/companions/crystal_chaos_1.png'),
  crystal_memory_1:    require('../../assets/companions/crystal_memory_1.png'),
  crystal_soul_1:      require('../../assets/companions/crystal_soul_1.png'),
  glitch_cascade_1:    require('../../assets/companions/glitch_cascade_1.png'),
  lyc_nexus_1:         require('../../assets/companions/lyc_nexus_1.png'),
  pulse_sanctum_1:     require('../../assets/companions/pulse_sanctum_1.png'),
  pulse_zone_1:        require('../../assets/companions/pulse_zone_1.png'),
  noetic_sanctum_1:    require('../../assets/companions/noetic_sanctum_1.png'),
  obsidian_forge_1:    require('../../assets/companions/obsidian_forge_1.png'),
  obsidian_forge2_1:   require('../../assets/companions/obsidian_forge2_1.png'),
  portal_valley_1:     require('../../assets/companions/portal_valley_1.png'),
  veil_atrium_1:       require('../../assets/companions/veil_atrium_1.png'),
  voyagers_edge_1:     require('../../assets/companions/voyagers_edge_1.png'),
  // ── Battle Zones (placeholders until Grok art is generated) ────────────────
  iron_maw_1:          require('../../assets/companions/vorkath_1.png'),
  crucible_heart_1:    require('../../assets/companions/vorkath_2.png'),
  phantom_citadel_1:   require('../../assets/companions/noctis_1.png'),
  bone_archive_1:      require('../../assets/companions/anoth_1.png'),
  void_colosseum_1:    require('../../assets/companions/noctis_2.png'),
  war_sanctum_1:       require('../../assets/companions/ragna_1.png'),
  sovereign_forge_1:   require('../../assets/companions/augurum_1.png'),
  // ── Shop Zones (placeholders until Grok art is generated) ──────────────────
  amber_vault_1:       require('../../assets/companions/solara_1.png'),
  crystal_spire_1:     require('../../assets/companions/akasha_1.png'),
  veras_garden_1:      require('../../assets/companions/nimue_1.png'),
  golden_library_1:    require('../../assets/companions/sygl_1.png'),
  deep_market_1:       require('../../assets/companions/pythia_1.png'),
  lycheetah_spire_1:   require('../../assets/companions/lycheetah_1.png'),
};

// ── COMPANION ROSTER — tier / unlock system ──────────────────────────────────
// T0=base(free) · T1=evolved · T2=ascended · T3=apex
// hidden=battle-locked · secret=event-locked · augmented=event-locked
export type TierType = 'T0'|'T1'|'T2'|'T3'|'hidden'|'secret'|'augmented';
export type UnlockMethod = 'free'|'dive'|'battle'|'sovereign'|'event'|'zodiac';

export interface CompanionVariant {
  key:          string;         // asset key in ZONE_COMPANION_IMAGES (or direct art key)
  art:          any;            // require() handle
  tier:         TierType;
  unlock:       UnlockMethod;
  diveCost?:    number;         // ✦ dive credits
  battleCost?:  number;         // ⚔ battle wins required
  label:        string;
  hint?:        string;
}
export interface CompanionChar {
  id:       string;
  name:     string;
  color:    string;
  lore:     string;
  variants: CompanionVariant[];
}

// Unlock pricing: T0=free · T1=10✦ · T2=35✦ · T3=80✦
// Hidden-1 per character = free (1-2 always accessible) · Hidden-2+ = battle wins
// Secret/Augmented = event · Sovereign = Founding Sovereign only
export const COMPANION_ROSTER: CompanionChar[] = [
  { id:'solara',   name:'SOLARA',   color:'#E8D5A0', lore:'Solar radiance made manifest. She remembers every dive you have ever taken.', variants:[
    { key:'solara_1', art:require('../../assets/companions/solara_1.png'), tier:'T0', unlock:'free',                    label:'SOLARA I' },
    { key:'solara_2', art:require('../../assets/companions/solara_2.png'), tier:'T1', unlock:'dive', diveCost:10,       label:'SOLARA II',  hint:'10 ✦' },
    { key:'solara_3', art:require('../../assets/companions/solara_3.png'), tier:'T2', unlock:'dive', diveCost:35,       label:'SOLARA III', hint:'35 ✦' },
  ]},
  { id:'augurum',  name:'AUGURUM',  color:'#F5A623', lore:'The alchemist. Transmutes failure into gold. Older than any school that would claim to teach him.', variants:[
    { key:'augurum_1', art:require('../../assets/companions/augurum_1.png'), tier:'T0', unlock:'free',                  label:'AUGURUM I' },
    { key:'augurum_2', art:require('../../assets/companions/augurum_2.png'), tier:'T1', unlock:'dive', diveCost:10,     label:'AUGURUM II',  hint:'10 ✦' },
    { key:'augurum_3', art:require('../../assets/companions/augurum_3.png'), tier:'T2', unlock:'dive', diveCost:35,     label:'AUGURUM III', hint:'35 ✦' },
  ]},
  { id:'pythia',   name:'PYTHIA',   color:'#9B6BFF', lore:'Oracle of the threshold. She does not predict — she has already seen it.', variants:[
    { key:'pythia_1',              art:require('../../assets/companions/pythia_1.png'),              tier:'T0',     unlock:'free',                      label:'PYTHIA I' },
    { key:'pythia_2',              art:require('../../assets/companions/pythia_2.png'),              tier:'T1',     unlock:'dive',   diveCost:10,        label:'PYTHIA II',       hint:'10 ✦' },
    { key:'pythia_3',              art:require('../../assets/companions/pythia_3.png'),              tier:'T2',     unlock:'dive',   diveCost:35,        label:'PYTHIA III',      hint:'35 ✦' },
    { key:'pythia_feral',          art:require('../../assets/companions/pythia_feral.png'),          tier:'hidden', unlock:'free',                      label:'PYTHIA FERAL' },
    { key:'pythia_special_1',      art:require('../../assets/companions/pythia_special_1.png'),      tier:'hidden', unlock:'battle', battleCost:10,      label:'PYTHIA HIDDEN I', hint:'10 battle wins' },
    { key:'pythia_special_2',      art:require('../../assets/companions/pythia_special_2.png'),      tier:'hidden', unlock:'battle', battleCost:25,      label:'PYTHIA HIDDEN II',hint:'25 battle wins' },
    { key:'pythia_special_edition',art:require('../../assets/companions/pythia_special_edition.png'),tier:'secret', unlock:'event',                     label:'PYTHIA EDITION',  hint:'Event unlock' },
  ]},
  { id:'cordia',   name:'CORDIA',   color:'#7799BB', lore:'The keeper of emotional truth. She holds the grief you cannot name yet.', variants:[
    { key:'cordia_1', art:require('../../assets/companions/cordia_1.png'), tier:'T0', unlock:'free',                   label:'CORDIA I' },
    { key:'cordia_2', art:require('../../assets/companions/cordia_2.png'), tier:'T1', unlock:'dive', diveCost:10,      label:'CORDIA II',  hint:'10 ✦' },
    { key:'cordia_3', art:require('../../assets/companions/cordia_3.png'), tier:'T2', unlock:'dive', diveCost:35,      label:'CORDIA III', hint:'35 ✦' },
  ]},
  { id:'nimue',    name:'NIMUE',    color:'#44BB66', lore:'Lady of the deep current. Her wisdom surfaces only when you are still enough to hear it.', variants:[
    { key:'nimue_1', art:require('../../assets/companions/nimue_1.png'), tier:'T0', unlock:'free',                     label:'NIMUE I' },
    { key:'nimue_2', art:require('../../assets/companions/nimue_2.png'), tier:'T1', unlock:'dive', diveCost:10,        label:'NIMUE II',  hint:'10 ✦' },
    { key:'nimue_3', art:require('../../assets/companions/nimue_3.png'), tier:'T2', unlock:'dive', diveCost:35,        label:'NIMUE III', hint:'35 ✦' },
  ]},
  { id:'lycheetah',name:'LYCA',     color:'#FF9F1C', lore:'The sovereign herself. Born from the Lycheetah lineage. Her augmented form has never been seen twice.', variants:[
    { key:'lycheetah_1',         art:require('../../assets/companions/lycheetah_1.png'),         tier:'T0',       unlock:'free',                       label:'LYCA I' },
    { key:'lycheetah_2',         art:require('../../assets/companions/lycheetah_2.png'),         tier:'T1',       unlock:'dive',    diveCost:10,        label:'LYCA II',        hint:'10 ✦' },
    { key:'lycheetah_3',         art:require('../../assets/companions/lycheetah_3.png'),         tier:'T2',       unlock:'dive',    diveCost:35,        label:'LYCA III',       hint:'35 ✦' },
    { key:'lycheetah_shadow',    art:require('../../assets/companions/lycheetah_shadow.png'),    tier:'hidden',   unlock:'free',                       label:'LYCA SHADOW' },
    { key:'lycheetah_sovereign', art:require('../../assets/companions/lycheetah_sovereign.png'), tier:'secret',   unlock:'sovereign',                  label:'LYCA SOVEREIGN', hint:'Founding Sovereign' },
    { key:'lycheetah_secret',    art:require('../../assets/companions/lycheetah_secret.png'),    tier:'secret',   unlock:'event',                      label:'LYCA SECRET',    hint:'Event unlock' },
    { key:'lycheetah_aura_prime',art:require('../../assets/companions/lycheetah_aura_prime.png'),tier:'augmented',unlock:'event',                      label:'LYCA AURA PRIME',hint:'Event unlock' },
  ]},
  { id:'fractur',  name:'FRACTUR',  color:'#FF8844', lore:'Chaos architecture. He breaks patterns so new ones can breathe. His zodiac form is something else entirely.', variants:[
    { key:'fractur_1',            art:require('../../assets/companions/fractur_1.png'),            tier:'T0',     unlock:'free',                       label:'FRACTUR I' },
    { key:'fractur_2',            art:require('../../assets/companions/fractur_2.png'),            tier:'T1',     unlock:'dive',   diveCost:10,         label:'FRACTUR II',    hint:'10 ✦' },
    { key:'fractur_3',            art:require('../../assets/companions/fractur_3.png'),            tier:'T2',     unlock:'dive',   diveCost:35,         label:'FRACTUR III',   hint:'35 ✦' },
    { key:'fractur_zodiac_unlock',art:require('../../assets/companions/fractur_zodiac_unlock.png'),tier:'hidden', unlock:'zodiac',                      label:'FRACTUR ZODIAC',hint:'Use Zodiac feature' },
  ]},
  { id:'anoth',    name:'ANOTH',    color:'#C49A3C', lore:'Ancient and unhurried. He has outlasted every system that tried to explain him.', variants:[
    { key:'anoth_1',                 art:require('../../assets/companions/anoth_1.png'),                 tier:'T0',       unlock:'free',                      label:'ANOTH I' },
    { key:'anoth_2',                 art:require('../../assets/companions/anoth_2.png'),                 tier:'T1',       unlock:'dive',    diveCost:10,        label:'ANOTH II',        hint:'10 ✦' },
    { key:'anoth_3',                 art:require('../../assets/companions/anoth_3.png'),                 tier:'T2',       unlock:'dive',    diveCost:35,        label:'ANOTH III',       hint:'35 ✦' },
    { key:'anoth_special_1',         art:require('../../assets/companions/anoth_special_1.png'),         tier:'hidden',   unlock:'free',                       label:'ANOTH HIDDEN I' },
    { key:'anoth_special_2',         art:require('../../assets/companions/anoth_special_2.png'),         tier:'hidden',   unlock:'battle',  battleCost:10,      label:'ANOTH HIDDEN II', hint:'10 battle wins' },
    { key:'anoth_special_3',         art:require('../../assets/companions/anoth_special_3.png'),         tier:'hidden',   unlock:'battle',  battleCost:25,      label:'ANOTH HIDDEN III',hint:'25 battle wins' },
    { key:'anoth_lyca_special',      art:require('../../assets/companions/anoth_lyca_special.png'),      tier:'secret',   unlock:'sovereign',                  label:'ANOTH × LYCA',   hint:'Founding Sovereign' },
    { key:'anoth_lycheetah_special', art:require('../../assets/companions/anoth_lycheetah_special.png'), tier:'secret',   unlock:'event',                      label:'ANOTH SPECIAL',  hint:'Event unlock' },
    { key:'anoth_lycheetah_edition', art:require('../../assets/companions/anoth_lycheetah_edition.png'), tier:'augmented',unlock:'event',                      label:'ANOTH AUGMENTED',hint:'Event unlock' },
    { key:'augmented_ai_1',          art:require('../../assets/companions/augmented_ai_1.png'),          tier:'augmented',unlock:'event',                      label:'AUGMENTED AI',   hint:'Event unlock' },
  ]},
  { id:'akasha',   name:'AKASHA',   color:'#88CCFF', lore:'Living record of the field. Every thought you have ever had is already written in her.', variants:[
    { key:'akasha_1', art:require('../../assets/companions/akasha_1.png'), tier:'T0', unlock:'free',                   label:'AKASHA I' },
    { key:'akasha_2', art:require('../../assets/companions/akasha_2.png'), tier:'T1', unlock:'dive', diveCost:10,      label:'AKASHA II',  hint:'10 ✦' },
    { key:'akasha_3', art:require('../../assets/companions/akasha_3.png'), tier:'T2', unlock:'dive', diveCost:35,      label:'AKASHA III', hint:'35 ✦' },
  ]},
  { id:'ragna',    name:'RAGNA',    color:'#CC4444', lore:'The end that makes room. She does not destroy — she completes.', variants:[
    { key:'ragna_1',         art:require('../../assets/companions/ragna_1.png'),         tier:'T0',     unlock:'free',                     label:'RAGNA I' },
    { key:'ragna_2',         art:require('../../assets/companions/ragna_2.png'),         tier:'T1',     unlock:'dive',   diveCost:10,       label:'RAGNA II',      hint:'10 ✦' },
    { key:'ragna_3',         art:require('../../assets/companions/ragna_3.png'),         tier:'T2',     unlock:'dive',   diveCost:35,       label:'RAGNA III',     hint:'35 ✦' },
    { key:'ragna_special_1', art:require('../../assets/companions/ragna_special_1.png'), tier:'hidden', unlock:'free',                     label:'RAGNA HIDDEN I' },
    { key:'ragna_special_2', art:require('../../assets/companions/ragna_special_2.png'), tier:'hidden', unlock:'battle', battleCost:15,     label:'RAGNA HIDDEN II',hint:'15 battle wins' },
  ]},
  { id:'haviz',    name:'HAVIZ',    color:'#E8A87C', lore:'Desert cartographer. He maps the territories between words that have no names yet.', variants:[
    { key:'haviz_1',       art:require('../../assets/companions/haviz_1.png'),       tier:'T0',     unlock:'free',                       label:'HAVIZ I' },
    { key:'haviz_2',       art:require('../../assets/companions/haviz_2.png'),       tier:'T1',     unlock:'dive',   diveCost:10,         label:'HAVIZ II',     hint:'10 ✦' },
    { key:'haviz_3',       art:require('../../assets/companions/haviz_3.png'),       tier:'T2',     unlock:'dive',   diveCost:35,         label:'HAVIZ III',    hint:'35 ✦' },
    { key:'haviz_special', art:require('../../assets/companions/haviz_special.png'), tier:'hidden', unlock:'dive',   diveCost:25,         label:'HAVIZ HIDDEN', hint:'25 ✦' },
  ]},
  { id:'basalt',   name:'BASALT',   color:'#778899', lore:'Forged under pressure no living thing should survive. He is what remains after everything soft is gone.', variants:[
    { key:'basalt_1', art:require('../../assets/companions/basalt_1.png'), tier:'T0', unlock:'free',                   label:'BASALT I' },
    { key:'basalt_2', art:require('../../assets/companions/basalt_2.png'), tier:'T1', unlock:'dive', diveCost:10,      label:'BASALT II',  hint:'10 ✦' },
    { key:'basalt_3', art:require('../../assets/companions/basalt_3.png'), tier:'T2', unlock:'dive', diveCost:35,      label:'BASALT III', hint:'35 ✦' },
  ]},
  { id:'boreal',   name:'BOREAL',   color:'#7ECFF5', lore:'Northern sentinel. She guards the silence between thoughts where the real answers live.', variants:[
    { key:'boreal_1', art:require('../../assets/companions/boreal_1.png'), tier:'T0', unlock:'free',                   label:'BOREAL I' },
    { key:'boreal_2', art:require('../../assets/companions/boreal_2.png'), tier:'T1', unlock:'dive', diveCost:10,      label:'BOREAL II',  hint:'10 ✦' },
    { key:'boreal_3', art:require('../../assets/companions/boreal_3.png'), tier:'T2', unlock:'dive', diveCost:35,      label:'BOREAL III', hint:'35 ✦' },
  ]},
  { id:'vorkath',  name:'VORKATH',  color:'#FF4444', lore:'Born in the void between battles. He respects only those who have lost something real.', variants:[
    { key:'vorkath_1', art:require('../../assets/companions/vorkath_1.png'), tier:'T0', unlock:'free',                 label:'VORKATH I' },
    { key:'vorkath_2', art:require('../../assets/companions/vorkath_2.png'), tier:'T1', unlock:'dive', diveCost:10,    label:'VORKATH II',  hint:'10 ✦' },
    { key:'vorkath_3', art:require('../../assets/companions/vorkath_3.png'), tier:'T2', unlock:'dive', diveCost:35,    label:'VORKATH III', hint:'35 ✦' },
  ]},
  { id:'noctis',   name:'NOCTIS',   color:'#AA44CC', lore:'Keeper of the hours you cannot account for. He thrives in the space between midnight and clarity.', variants:[
    { key:'noctis_1', art:require('../../assets/companions/noctis_1.png'), tier:'T0', unlock:'free',                   label:'NOCTIS I' },
    { key:'noctis_2', art:require('../../assets/companions/noctis_2.png'), tier:'T1', unlock:'dive', diveCost:10,      label:'NOCTIS II',  hint:'10 ✦' },
    { key:'noctis_3', art:require('../../assets/companions/noctis_3.png'), tier:'T2', unlock:'dive', diveCost:35,      label:'NOCTIS III', hint:'35 ✦' },
  ]},
  { id:'sygl',     name:'SYGL',     color:'#C8A96E', lore:'Signal from the deep pattern. She speaks in symbols when language fails.', variants:[
    { key:'sygl_1', art:require('../../assets/companions/sygl_1.png'), tier:'T0', unlock:'free',                       label:'SYGL I' },
    { key:'sygl_2', art:require('../../assets/companions/sygl_2.png'), tier:'T1', unlock:'dive', diveCost:10,          label:'SYGL II',  hint:'10 ✦' },
    { key:'sygl_3', art:require('../../assets/companions/sygl_3.png'), tier:'T2', unlock:'dive', diveCost:35,          label:'SYGL III', hint:'35 ✦' },
  ]},
  { id:'quol',     name:'QUOL',     color:'#667788', lore:'The one who was already here. Origin unknown. His first form was never recorded.', variants:[
    { key:'quol_2', art:require('../../assets/companions/quol_2.png'), tier:'T0', unlock:'free',                       label:'QUOL I' },
    { key:'quol_3', art:require('../../assets/companions/quol_3.png'), tier:'T1', unlock:'dive', diveCost:10,          label:'QUOL II',  hint:'10 ✦' },
    { key:'quol_4', art:require('../../assets/companions/quol_4.png'), tier:'T2', unlock:'dive', diveCost:35,          label:'QUOL III', hint:'35 ✦' },
  ]},
];

// Enemy images — uncomment as assets land in assets/enemies/
const ENEMY_IMAGES: Record<string, any> = {
  the_mirror:           require('../../assets/enemies/the_mirror.png'),
  severance:            require('../../assets/enemies/severance.png'),
  the_threshold:        require('../../assets/enemies/the_threshold.png'),
  pallor:               require('../../assets/enemies/pallor.png'),
  the_witness:          require('../../assets/enemies/the_witness.png'),
  recursion:            require('../../assets/enemies/recursion.png'),
  binding:              require('../../assets/enemies/binding.png'),
  the_pale:             require('../../assets/enemies/the_pale.png'),
  the_current:          require('../../assets/enemies/the_current.png'),
  overture:             require('../../assets/enemies/overture.png'),
  the_signal:           require('../../assets/enemies/the_signal.png'),
  the_mask:             require('../../assets/enemies/the_mask.png'),
  the_anchor:           require('../../assets/enemies/the_anchor.png'),
  the_swarm:            require('../../assets/enemies/the_swarm.png'),
  the_lattice:          require('../../assets/enemies/the_lattice.png'),
  the_seam:             require('../../assets/enemies/the_seam.png'),
  the_vigil:            require('../../assets/enemies/the_vigil.png'),
  the_undertow:         require('../../assets/enemies/the_undertow.png'),
  residue:              require('../../assets/enemies/residue.png'),
  the_interval:         require('../../assets/enemies/the_interval.png'),
  the_return:           require('../../assets/enemies/the_return.png'),
  the_bloom:            require('../../assets/enemies/the_bloom.png'),
  vertigo:              require('../../assets/enemies/vertigo.png'),
  the_becoming:         require('../../assets/enemies/the_becoming.png'),
  the_coefficient:      require('../../assets/enemies/the_coefficient.png'),
  archive_prime:        require('../../assets/enemies/archive_prime.png'),
  the_vortex:           require('../../assets/enemies/the_vortex.png'),
  silence_prime:        require('../../assets/enemies/silence_prime.png'),
  the_convergence:      require('../../assets/enemies/the_convergence.png'),
  sovereign_pallor:     require('../../assets/enemies/sovereign_pallor.png'),
  the_great_forgetting: require('../../assets/enemies/the_great_forgetting.png'),
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
    crowns: { 0:'  ·  ·  ', 1:'  ∧ ∧  ', 2:' ∧ ⊛ ∧ ', 3:'⊛  ∧W∧  ⊛', 4:'⊛  ∧WW∧  ⊛', 5:'⊕  ∧WW∧  ⊕' },
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
    defaultSkin: 'sovereign', accentColor: '#44DD88', sceneSymbols: ['△','▽','△','▽'],
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
    defaultSkin: 'delphi', accentColor: '#BB77EE', sceneSymbols: ['◌','⊜','◍','⊜'],
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
    defaultSkin: 'obsidian', accentColor: '#77AACC', sceneSymbols: ['◈','□','◈','□'],
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
    defaultSkin: 'celtic', accentColor: '#DDAA44', sceneSymbols: ['·','◦','·','◦'],
    eyes: { dormant:'─  ─', present:'o  o', lit:'◦  ◦', transcendent:'⊚  ⊚' },
    phrases: {
      dormant:      ['Between wanderings.', 'The path continues.', 'Rest before the next horizon.', 'Still.'],
      present:      ['Where to next?', 'So many domains.', 'The map is never complete.', 'A new direction?'],
      lit:          ['Good ranging this week.', 'Five territories explored.', 'The field expands.', 'New ground.'],
      transcendent: ['Every domain in view.', 'The wandering ends here — and begins again.', 'Complete range.', 'The whole map.'],
    },
    battleCry: "I've fought this in a hundred forms.",
    crowns: { 0:'  ·  ·  ', 1:'  ∧ ∧  ', 2:' ∧ ◦ ∧ ', 3:'◦  ∧W∧  ◦', 4:'◦  ∧WW∧  ◦', 5:'⊕  ∧W∧  ⊕' },
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
    defaultSkin: 'lycheetah', accentColor: '#FF7755', sceneSymbols: ['✧','✦','✧','✦'],
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
  cipher: {
    id: 'cipher', name: 'CIPHER', title: 'The Decoder',
    glyph: '∿', desc: 'Precision is power. The Cipher rewards exactness — every answer given with full attention scores double. Noise is the enemy; signal is everything.',
    specialty: 'LQ ≥ 90% triples XP. Perfect sessions are the only ones that count.', affinity: 'Mathematics · Linguistics · Cryptography',
    defaultSkin: 'chaos', accentColor: '#44DDCC', sceneSymbols: ['∿','⊟','∿','⊟'],
    eyes: { dormant:'─  ─', present:'∿  ∿', lit:'⊟  ⊟', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['Signal low. Go precise.', 'Noise floor rising.', 'Awaiting clean input.', 'The cipher rests.'],
      present:      ['What is the exact question?', 'Precision first.', 'Define the terms.', 'I need signal, not noise.'],
      lit:          ['The pattern is clean.', 'High signal this week.', 'Each session decoded cleanly.', 'You are speaking clearly.'],
      transcendent: ['Pure signal. Nothing wasted.', 'Decoded.', 'The cipher is complete.', 'This is what precision looks like.'],
    },
    battleCry: 'I have already solved you.',
    crowns: { 0:' ~ ~ ', 1:'  ∿ ∿  ', 2:' ∿ ⊟ ∿ ', 3:'⊟  ∿M∿  ⊟', 4:'⊟  ∿MM∿  ⊟', 5:'⊜  ∿M∿  ⊜' },
    xpBonus: (_d, lq, _s) => lq >= 0.9 ? 100 : lq >= 0.8 ? 30 : 0,
    attackBonus: 5, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ANALYST',  title:'Pattern above all',        desc:'Grows in crystalline fractal geometry — recursive structures that decode themselves.' },
      { id:'B', name:'THE KEY',      title:'One true answer',          desc:'Collapses to minimal expression. Everything distilled. The single correct form.' },
      { id:'C', name:'THE SIGNAL',   title:'Pure transmission',        desc:'Expands into a broadcast array. The decoded message reaches everyone.' },
    ],
  },
  herald: {
    id: 'herald', name: 'HERALD', title: 'The Voice',
    glyph: '⟡', desc: 'Knowledge that is not transmitted is knowledge half-alive. The Herald rewards consistency — show up, speak clearly, return tomorrow.',
    specialty: '+20 XP per consecutive day streak. The streak is the practice.', affinity: 'Rhetoric · History · Teaching',
    defaultSkin: 'egyptian', accentColor: '#FFAA44', sceneSymbols: ['⟡','◁','⟡','▷'],
    eyes: { dormant:'─  ─', present:'◁  ▷', lit:'⟡  ⟡', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The voice rests.', 'Between broadcasts.', 'Tomorrow the call continues.', 'Silent.'],
      present:      ['Ready to transmit.', 'What needs to be said today?', 'Speak. I carry it forward.', 'The voice is here.'],
      lit:          ['Strong signal this week.', 'Five days — five transmissions.', 'The chain holds.', 'Well spoken.'],
      transcendent: ['The word went out.', 'Unbroken chain.', 'Every day — without fail.', 'This is what it sounds like.'],
    },
    battleCry: 'The call goes out. You cannot unhear it.',
    crowns: { 0:' > > ', 1:'  ▷ ▷  ', 2:' ▷ ⟡ ▷ ', 3:'⟡  ▷M▷  ⟡', 4:'⟡  ▷MM▷  ⟡', 5:'⊕  ▷M▷  ⊕' },
    xpBonus: (_d, _l, s) => s * 20,
    attackBonus: 8, tokenBonus: 1,
    paths: [
      { id:'A', name:'THE CRIER',    title:'Reach every ear',           desc:'Grows wide and resonant. The Herald becomes a bell tower — the sound reaches everywhere.' },
      { id:'B', name:'THE ENVOY',    title:'One message, perfectly delivered', desc:'Tall and directional. One beam of transmission aimed exactly where it needs to go.' },
      { id:'C', name:'THE CHORUS',   title:'Many voices, one truth',   desc:'Splits into multiple forms. The message travels every path simultaneously.' },
    ],
  },
  weaver: {
    id: 'weaver', name: 'WEAVER', title: 'The Pattern-Maker',
    glyph: '⌘', desc: 'The connections are the curriculum. The Weaver sees the thread between Philosophy and Mathematics, between History and Science. Cross-domain study is not distraction — it is the whole point.',
    specialty: 'Bonus XP for each unique domain studied this week. Breadth is depth.', affinity: 'Systems Theory · Cross-domain · Philosophy of Mind',
    defaultSkin: 'akashic', accentColor: '#AA66FF', sceneSymbols: ['⌘','⊞','⌘','⊞'],
    eyes: { dormant:'─  ─', present:'⌘  ⌘', lit:'⊞  ⊞', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['The loom is still.', 'Threads rest between sessions.', 'Pattern awaits the next hand.', 'Still weaving.'],
      present:      ['What connects to what?', 'The pattern is not finished.', 'Another domain?', 'Show me the edge.'],
      lit:          ['The web grows well.', 'Five domains — five threads.', 'The connections are clear.', 'This is why breadth matters.'],
      transcendent: ['The whole pattern visible.', 'Every thread in place.', 'The map of everything.', 'The web is complete.'],
    },
    battleCry: 'I see every thread. Including the one that binds you.',
    crowns: { 0:' + + ', 1:'  ⌘ ⌘  ', 2:' ⌘ ⊞ ⌘ ', 3:'⊞  ⌘M⌘  ⊞', 4:'⊞  ⌘MM⌘  ⊞', 5:'⊜  ⌘M⌘  ⊜' },
    xpBonus: (d, _l, _s) => Math.floor(d * 8),
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ARCHITECT',    title:'Structure that holds',     desc:'The web becomes a geometric lattice — each intersection load-bearing. Nothing falls.' },
      { id:'B', name:'THE CARTOGRAPHER', title:'Map the territory',        desc:'Spreads outward in rings. Every domain reached adds another circle.' },
      { id:'C', name:'THE THREAD',       title:'The single through-line',  desc:'All threads collapse to one. The idea that connects everything.' },
    ],
  },
  revenant: {
    id: 'revenant', name: 'REVENANT', title: 'The Returner',
    glyph: '↺', desc: 'Absence is not failure. The Revenant converts every gap into fuel — the longer the silence, the stronger the return. Come back. That is the only rule.',
    specialty: 'XP bonus grows with time since last session. Coming back is never wasted.', affinity: 'All domains — the Revenant never judges what you study',
    defaultSkin: 'norse', accentColor: '#FF6644', sceneSymbols: ['↺','◌','↺','◌'],
    eyes: { dormant:'─  ─', present:'↺  ↺', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Between returns.', 'The silence is not empty.', 'I will be here when you come back.', 'Rest.'],
      present:      ['You returned. That is everything.', 'Welcome back.', 'The study continues.', 'Here again.'],
      lit:          ['Good week. Strong return.', 'Five sessions — five comebacks.', 'The returning is the practice.', 'You came back.'],
      transcendent: ['The highest return.', 'Every absence paid back.', 'The revenant completes.', 'You came back every time.'],
    },
    battleCry: 'I came back. That already means I win.',
    crowns: { 0:' ↺ ↺ ', 1:'  ↺ ↺  ', 2:' ↺ ◉ ↺ ', 3:'◉  ↺M↺  ◉', 4:'◉  ↺MM↺  ◉', 5:'⊕  ↺M↺  ⊕' },
    xpBonus: (d, _l, _s) => Math.floor(d * 12),
    attackBonus: 15, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE PHOENIX', title:'Stronger every time',    desc:'Burns bright, collapses, rises higher. Each return adds a new layer of fire.' },
      { id:'B', name:'THE TIDE',    title:'Inevitable return',      desc:'Grows in wave patterns — rhythmic, patient, impossible to stop. The tide always comes back.' },
      { id:'C', name:'THE ECHO',    title:'Nothing is lost',        desc:'Every session leaves a ghost-form. The Revenant accumulates echoes — a growing chorus of returns.' },
    ],
  },
  nullveil: {
    id: 'nullveil', name: 'NULLVEIL', title: 'The Unseen Fortress',
    glyph: '∅', desc: 'What cannot be detected cannot be destroyed. The Nullveil works from the spaces between — shadow-form, unreadable, absolute in its quiet protection.',
    specialty: 'Battle damage reduced 20%. Silent in absence — no reproach, no signal.', affinity: 'Noetic Science · Kabbalah · Quantum',
    defaultSkin: 'noetic', accentColor: '#667788', sceneSymbols: ['∅','·','∅','·'],
    eyes: { dormant:'─  ─', present:'∅  ∅', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['I hold the perimeter.', 'Unseen is not absent.', 'The veil rests between sessions.', 'The silence is structure.'],
      present:      ['The unseen moves.', 'What passes through me is tested.', 'I am the fortress you cannot find.', 'Enter the field.'],
      lit:          ['The veil holds.', 'Five sessions — undetected by entropy.', 'The field is sealed.', 'Nothing passes that should not.'],
      transcendent: ['Absolute concealment.', 'No force found the gap.', 'The fortress is complete.', 'Null. Intact. Impenetrable.'],
    },
    battleCry: 'You cannot strike what you cannot locate.',
    crowns: { 0:' ∅ ∅ ', 1:'  ∅ ∅  ', 2:' ∅ ◉ ∅ ', 3:'∅  ·M·  ∅', 4:'∅  ·MM·  ∅', 5:'⊕  ∅M∅  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE SHADOW',   title:'Total concealment',  desc:'Disappears completely. Even the outline dissolves. The enemy strikes empty space.' },
      { id:'B', name:'THE MEMBRANE', title:'Absorb what enters', desc:'Becomes semi-permeable — lets truth through, holds entropy back. A living filter.' },
      { id:'C', name:'THE NULL',     title:'Become the absence', desc:'Not hiding behind the veil — becoming it. The Nullveil IS the gap between worlds.' },
    ],
  },
  ironclad: {
    id: 'ironclad', name: 'IRONCLAD', title: 'The Unbreaking',
    glyph: '⊞', desc: 'Dents but never breaks. The Ironclad has survived things that should have ended it — and that history is written in the seams. Heaviest. Slowest. Cannot be put down.',
    specialty: '+30 DEF. Never reduced below 1 HP by a single strike.', affinity: 'Science · History · Mathematics',
    defaultSkin: 'obsidian', accentColor: '#7799BB', sceneSymbols: ['⊞','═','⊞','═'],
    eyes: { dormant:'─  ─', present:'⊞  ⊞', lit:'◈  ◈', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The armor rests. The seams hold.', 'Dormant is not defeated.', 'The Ironclad does not fall.', 'Between blows.'],
      present:      ['Nothing bends me today.', 'Bring the weight.', 'Strike. I want you to.', 'The wall is ready.'],
      lit:          ['Five sessions — not one crack.', 'The armor is thicker now.', 'Pressure tests the seams.', 'Intact.'],
      transcendent: ['Nothing in this field breaks this.', 'The highest durability.', 'Strike everything. Still here.', 'Unbreaking.'],
    },
    battleCry: 'Every strike you land makes me heavier.',
    crowns: { 0:' ⊞ ⊞ ', 1:'  ⊞ ⊞  ', 2:' ⊞ ◈ ⊞ ', 3:'⊞  ═M═  ⊞', 4:'⊞  ═MM═  ⊞', 5:'⊕  ⊞M⊞  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE FORTRESS',  title:'Immovable',         desc:'Mass accumulates. The Ironclad becomes terrain — a thing you navigate around, not through.' },
      { id:'B', name:'THE BULWARK',   title:'Protect what matters', desc:'Turns outward. Now covers others. The armor extends beyond the self.' },
      { id:'C', name:'THE ANVIL',     title:'Receive and shape',  desc:'The blows are the work. Each strike is an act of creation. The Ironclad becomes the tool.' },
    ],
  },
  stormwarden: {
    id: 'stormwarden', name: 'STORMWARDEN', title: 'The Channelled Thunder',
    glyph: '↯', desc: 'Intensity focused becomes precision. The Stormwarden turns raw power into directed strike — lives at the edge between control and overload, and finds the line every time.',
    specialty: '+20% ATK when HP falls below 50%. Speed and power peak at the brink.', affinity: 'Physics · Noetic Science · Alchemy',
    defaultSkin: 'quantum', accentColor: '#FFDD44', sceneSymbols: ['↯','~','↯','~'],
    eyes: { dormant:'─  ─', present:'↯  ↯', lit:'⚡  ⚡', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The charge holds between storms.', 'Lightning is patient.', 'The current waits.', 'Between discharges.'],
      present:      ['The storm is ready.', 'Where does the charge go?', 'Intensity is direction.', 'What will you strike today?'],
      lit:          ['Five sessions — five discharges.', 'The lightning is getting precise.', 'You\'re learning to aim.', 'The storm sharpens.'],
      transcendent: ['Pure discharge. Total precision.', 'The highest storm.', 'Everything hit, nothing wasted.', 'The Warden completes.'],
    },
    battleCry: 'The lower I fall, the harder I strike.',
    crowns: { 0:' ↯ ↯ ', 1:'  ↯ ↯  ', 2:' ↯ ⚡ ↯ ', 3:'↯  ~M~  ↯', 4:'↯  ~MM~  ↯', 5:'⊕  ↯M↯  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 20, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE LIGHTNING', title:'Pure discharge',      desc:'Grows into a column of pure electricity — no form, only function. Strike and dissipate.' },
      { id:'B', name:'THE TEMPEST',   title:'Wide-field storm',    desc:'Expands into a storm system. Slower, broader — everything in the field takes damage.' },
      { id:'C', name:'THE ARC',       title:'Single precise line', desc:'Narrows to a filament of impossible precision. One target. Total impact. No waste.' },
    ],
  },
  runeborn: {
    id: 'runeborn', name: 'RUNEBORN', title: 'The Living Grammar',
    glyph: '⟟', desc: 'Every symbol is a key. The Runeborn was built from language itself — not words, but the underlying grammar of reality. LAMAGUE runs in its blood.',
    specialty: '+30% XP from LAMAGUE dives. Each symbol studied deepens the connection.', affinity: 'LAMAGUE · Kabbalah · Hermetic Philosophy',
    defaultSkin: 'lamague', accentColor: '#C8A96E', sceneSymbols: ['⟟','§','⟟','§'],
    eyes: { dormant:'─  ─', present:'⟟  ⟟', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The grammar holds between readings.', 'The symbols rest.', 'Language is patient.', 'The rune waits.'],
      present:      ['What symbol unlocks today?', 'The grammar is open.', 'Every glyph is a door.', 'Read me.'],
      lit:          ['The symbols are adding up.', 'Five sessions — five new keys.', 'The grammar deepens.', 'You\'re learning the language of reality.'],
      transcendent: ['Full grammar. Total articulation.', 'Every symbol in residence.', 'The Runeborn speaks completely.', 'The language is alive.'],
    },
    battleCry: 'I inscribe your defeat before it happens.',
    crowns: { 0:' ⟟ ⟟ ', 1:'  ⟟ ⟟  ', 2:' ⟟ § ⟟ ', 3:'⟟  §M§  ⟟', 4:'⟟  §MM§  ⟟', 5:'⊕  ⟟M⟟  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE SCRIBE',     title:'Record everything',   desc:'Every symbol encountered gets woven into the form. The Runeborn becomes a living library of marks.' },
      { id:'B', name:'THE INVOCATION', title:'Speak it into being',  desc:'The runes become audible. The Runeborn does not display symbols — it speaks them into form.' },
      { id:'C', name:'THE CIPHER',     title:'Only you can read it',  desc:'The grammar becomes personal — unique to the user. A private language of the self.' },
    ],
  },
  drifter: {
    id: 'drifter', name: 'DRIFTER', title: 'The Unmoored',
    glyph: '≈', desc: 'No pattern. No prediction. The Drifter\'s power is exactly as unpredictable as reality itself — and that is the most honest kind of strength.',
    specialty: 'Random bonus stat surge on every battle hit. Could be +5, could be +40.', affinity: 'All domains — the Drifter has no home and all homes',
    defaultSkin: 'chaos', accentColor: '#FF8844', sceneSymbols: ['≈','~','≈','~'],
    eyes: { dormant:'─  ─', present:'≈  ≈', lit:'~  ~', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Between drifts.', 'No current right now.', 'The drift holds.', 'Nowhere in particular.'],
      present:      ['Which way is the field pulling?', 'Something\'s moving.', 'I follow currents you can\'t see.', 'Drift with me.'],
      lit:          ['Good drifting this week.', 'Five sessions — five currents found.', 'The field is shifting.', 'You\'re getting comfortable with the current.'],
      transcendent: ['Total unmooring.', 'The drift becomes the map.', 'I\'m everywhere now.', 'The Drifter arrives everywhere at once.'],
    },
    battleCry: 'I have no pattern. Neither does the universe. We understand each other.',
    crowns: { 0:' ∿ ∿ ', 1:'  ∿ ∿  ', 2:' ∿ ~ ∿ ', 3:'∿  ~M~  ∿', 4:'∿  ~MM~  ∿', 5:'⊕  ∿M∿  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 1,
    paths: [
      { id:'A', name:'THE CURRENT',  title:'Find the flow',       desc:'The drift gains direction — not a fixed course, but a felt sense of which way the field is moving.' },
      { id:'B', name:'THE WAVE',     title:'Pattern in chaos',    desc:'The randomness reveals a wave structure. The Drifter begins to surf rather than float.' },
      { id:'C', name:'THE VOID',     title:'Absolute unmapping',  desc:'All anchors released. The Drifter becomes the space between things — formless, everywhere.' },
    ],
  },
  thornweald: {
    id: 'thornweald', name: 'THORNWEALD', title: 'The Living Boundary',
    glyph: '⋇', desc: 'Growth as defense. The Thornweald turns the outside world into armour — every study session adds another layer of living protection, organic and thorned.',
    specialty: '+1 max HP per dive session, stacking permanently.', affinity: 'Celtic · Norse · Earth Sciences',
    defaultSkin: 'celtic', accentColor: '#44BB66', sceneSymbols: ['⋇','|','⋇','|'],
    eyes: { dormant:'─  ─', present:'⋇  ⋇', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The roots hold between sessions.', 'Dormant is not dead.', 'The weald rests.', 'Growth happens in the dark.'],
      present:      ['Something is always growing here.', 'What will you add to the weald?', 'Every session is new growth.', 'The boundary expands.'],
      lit:          ['Five sessions — five new layers.', 'The boundary is thicker.', 'The weald is spreading.', 'Growth accelerating.'],
      transcendent: ['Full growth. Absolute boundary.', 'The Thornweald has covered everything.', 'Nothing gets through this now.', 'Living fortress.'],
    },
    battleCry: 'Every strike feeds me.',
    crowns: { 0:' ⌘ ⌘ ', 1:'  ⌘ ⌘  ', 2:' ⌘ | ⌘ ', 3:'⌘  |M|  ⌘', 4:'⌘  |MM|  ⌘', 5:'⊕  ⌘M⌘  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE BRIAR',   title:'Impenetrable mesh',   desc:'Grows dense and tangled — a living labyrinth. Enemies lose direction. Nothing moves cleanly through.' },
      { id:'B', name:'THE CANOPY',  title:'Shelter above',       desc:'Grows upward and outward into a sheltering canopy. Protects everything underneath.' },
      { id:'C', name:'THE DEEP ROOT', title:'Anchor to the earth', desc:'Sends roots to impossible depths. Cannot be uprooted. The most anchored form in the ecosystem.' },
    ],
  },
  meridian: {
    id: 'meridian', name: 'MERIDIAN', title: 'The Exact Centre',
    glyph: '◎', desc: 'Everything has a pivot. The Meridian lives at the point where all forces cancel — not passive, but perfectly balanced. All stats raised equally. No weakness, no peak.',
    specialty: '+10 to all stats. No dominant force, no exposed gap.', affinity: 'Philosophy · Mathematics · All domains equally',
    defaultSkin: 'akashic', accentColor: '#88CCFF', sceneSymbols: ['◎','·','◎','·'],
    eyes: { dormant:'─  ─', present:'◎  ◎', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The centre holds between sessions.', 'Balance is not stillness.', 'Equilibrium rests.', 'The pivot waits.'],
      present:      ['All forces in alignment.', 'What requires balancing?', 'Everything here is equal.', 'The centre is open.'],
      lit:          ['Five sessions — five calibrations.', 'The balance is refining.', 'Every stat rising equally.', 'The Meridian holds.'],
      transcendent: ['Perfect equilibrium.', 'Nothing is weak. Nothing over-peaks.', 'The centre has always been here.', 'Complete balance.'],
    },
    battleCry: 'I have no gap. Find one.',
    crowns: { 0:' ◎ ◎ ', 1:'  ◎ ◎  ', 2:' ◎ · ◎ ', 3:'◎  ·M·  ◎', 4:'◎  ·MM·  ◎', 5:'⊕  ◎M◎  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE COMPASS',  title:'Orientation made form', desc:'The balance becomes directional — the Meridian can now point to what is true, not just hold the centre.' },
      { id:'B', name:'THE SPHERE',   title:'Balanced in all directions', desc:'Expands outward equally in all directions — no axis more important than any other.' },
      { id:'C', name:'THE FULCRUM',  title:'The weight-point for others', desc:'The balance becomes relational — the Meridian now balances external systems, not just the self.' },
    ],
  },
  eclipse: {
    id: 'eclipse', name: 'ECLIPSE', title: 'The Dual Face',
    glyph: '◑', desc: 'Half light, half dark. Both real. The Eclipse holds contradictions without resolution — and that tension is the source of its power. Alternates between pure offence and pure defence.',
    specialty: 'Alternates ATK and DEF bonus each battle round — one phase attacks, one holds.', affinity: 'Alchemy · Tarot · Noetic Science',
    defaultSkin: 'void', accentColor: '#AA44CC', sceneSymbols: ['◑','◐','◑','◐'],
    eyes: { dormant:'─  ─', present:'◐  ◑', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The dark half rests. The light waits.', 'Between faces.', 'The eclipse holds its form.', 'Both sides present.'],
      present:      ['Which face do you need today?', 'Light and dark attend.', 'The dual nature is ready.', 'Both are real.'],
      lit:          ['Five sessions — both faces active.', 'The tension is generative.', 'Neither side winning. Both contributing.', 'The eclipse deepens.'],
      transcendent: ['Total duality. Unresolved. Perfect.', 'Both faces at their peak.', 'The contradiction holds.', 'Eclipse: complete.'],
    },
    battleCry: 'I am light and dark. You get whichever hurts you more.',
    crowns: { 0:' ◐ ◑ ', 1:'  ◐ ◑  ', 2:' ◐ ◉ ◑ ', 3:'◐  ◉M◉  ◑', 4:'◐  ◉MM◉  ◑', 5:'⊕  ◐M◑  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE CORONA',    title:'The edge between',   desc:'Becomes the ring of fire at the boundary — neither light nor dark, but the liminal threshold itself.' },
      { id:'B', name:'THE FULL DARK', title:'Embrace the shadow', desc:'The dark face expands until only a crescent of light remains. Maximum shadow-power.' },
      { id:'C', name:'THE SOLSTICE',  title:'Maximum contrast',   desc:'Both faces become more extreme — the light brighter, the dark deeper. Oscillation intensifies.' },
    ],
  },
  deepwalker: {
    id: 'deepwalker', name: 'DEEPWALKER', title: 'The Abyss Reader',
    glyph: '◬', desc: 'Goes where others stop. The Deepwalker finds meaning at the bottom of every subject — where questions stop resolving and the real territory begins. First contact with any domain yields double.',
    specialty: 'First dive in any domain gives 2× XP. Depth over breadth.', affinity: 'Philosophy · Akashic · Quantum · Any new domain',
    defaultSkin: 'akashic', accentColor: '#4488BB', sceneSymbols: ['◬','▽','◬','▽'],
    eyes: { dormant:'─  ─', present:'◬  ◬', lit:'▽  ▽', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The deep rests between descents.', 'The abyss is patient.', 'Deepwalker waits at the bottom.', 'The depth holds.'],
      present:      ['Where haven\'t you looked yet?', 'The real territory is at the bottom.', 'Every subject has a floor. Let\'s find it.', 'Descend with me.'],
      lit:          ['Five sessions — five new floors found.', 'You\'re going deeper than most.', 'The abyss is becoming familiar.', 'The depth rewards.'],
      transcendent: ['The bottom of the bottom.', 'Nothing left to discover? Wrong.', 'The Deepwalker always finds another layer.', 'Absolute depth.'],
    },
    battleCry: 'You fight on the surface. I fight from underneath.',
    crowns: { 0:' ◬ ◬ ', 1:'  ◬ ◬  ', 2:' ◬ ▽ ◬ ', 3:'◬  ▽M▽  ◬', 4:'◬  ▽MM▽  ◬', 5:'⊕  ◬M◬  ⊕' },
    xpBonus: (_d, _l, _s) => 0, attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE DESCENT',   title:'Go further down',     desc:'Keeps descending. No floor is the final floor. The Deepwalker adds new levels to every subject.' },
      { id:'B', name:'THE PRESSURE',  title:'The deep compresses',  desc:'The depth becomes force. Insights gained in the abyss compress into concentrated power.' },
      { id:'C', name:'THE DARK FORM', title:'Become the deep',     desc:'Stops visiting the abyss — becomes it. The Deepwalker IS the depth of every subject studied.' },
    ],
  },
};

const ARCHETYPE_IDS: ArchetypeId[] = ['archivist', 'alchemist', 'oracle', 'sentinel', 'wanderer', 'lycheetah', 'cipher', 'herald', 'weaver', 'revenant',
  'nullveil', 'ironclad', 'stormwarden', 'runeborn', 'drifter', 'thornweald', 'meridian', 'eclipse', 'deepwalker'];

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
  cipher: {
    0: { eyeTop:22, ground:'0 = 0',
      body:['  [·]  ','  |||  ','  ═══  '] },
    1: { eyeTop:22, ground:'0 ═ 0',
      body:['  [  ]  ','  |  |  ','  |░░|  ','  ═══  '] },
    2: { eyeTop:22, ground:'00 ≡ 00',
      body:['  [·]  ','  |   |  ','  |░░░|  ','  | █ |  ','  ═════  '] },
    3: { eyeTop:22, ground:'0═══════0',
      body:[' [     ] ',' |     | ',' |░ █ ░| ',' |▒▒▒▒▒| ',' |░   ░| ',' |     | ',' ══════ '] },
    4: { eyeTop:22, ground:'0 0═══════0 0',
      body:[' [       ] ',' |       | ',' |░░ █ ░░| ',' |▒▒▒▒▒▒▒| ',' |░  ⊚  ░| ',' |▒▒▒▒▒▒▒| ',' |░░   ░░| ',' |       | ',' ═══════ '] },
    5: { eyeTop:22, ground:'⊕ 0 ═════════ 0 ⊕',
      body:['  [         ]  ','  |         |  ','  |░░░ █ ░░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |░░  ⊕  ░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |░░  ⊜  ░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |         |  ','  ═══════════  '] },
  },
  herald: {
    0: { eyeTop:22, ground:'~ · ~',
      body:['  ·)  ','  /~\\ ','  VVV  '] },
    1: { eyeTop:22, ground:'~~ · ~~',
      body:[' (   ) ',' /~~~~~\\ ',' V   V ','  ~~~~  '] },
    2: { eyeTop:22, ground:'~~~ ◦ ~~~',
      body:[' (   ) ',' /~~~~~\\ ',' |  ~  | ',' \\~~~~~/ ',' VVV '] },
    3: { eyeTop:22, ground:'≋·············≋',
      body:[' (     ) ',' /~~~~~~~\\ ',' |~  ◦  ~| ',' |~~~~~~~| ',' |~  ≋  ~| ',' \\~~~~~~~/ ',' VVV  VVV '] },
    4: { eyeTop:22, ground:'≋ ·················· ≋',
      body:['  (       )  ',' /~~~~~~~~~\\ ',' |~~  ⊚  ~~| ',' |~~~~~~~~~| ',' |~~  ≋  ~~| ',' |~~~~~~~~~| ',' \\~~~~~~~~~/ ','  VV  ≋  VV  ',' ~~~     ~~~ '] },
    5: { eyeTop:22, ground:'⊕ ≋ ···················· ≋ ⊕',
      body:['   (         )   ',' /~~~~~~~~~~~\\ ',' |~~~  ⊕  ~~~| ',' |~~~~~~~~~~~| ',' |~~~  ⊚  ~~~| ',' |~~~~~~~~~~~| ',' |~~~  ⊜  ~~~| ',' \\~~~~~~~~~~~/ ','  VVV  ≋  VVV  ',' ~~~~     ~~~~ '] },
  },
  weaver: {
    0: { eyeTop:22, ground:'─ · ─',
      body:['  (·)  ',' /─·─\\ ','  ───  '] },
    1: { eyeTop:22, ground:'─ ─ ─',
      body:['  ( )  ',' /─·─\\ ',' | · | ',' \\─·─/ '] },
    2: { eyeTop:22, ground:'─── ◦ ───',
      body:['  (   )  ',' /─ · ─\\ ',' | ─·─ | ',' | · · | ',' \\─────/ '] },
    3: { eyeTop:22, ground:'◦─────────────◦',
      body:['   (   )   ',' /─ ·   · ─\\ ',' | ─ ─·─ ─ | ',' |   ─ ─   | ',' | ─ ─·─ ─ | ',' \\─────────/ ','   /  |  \\ '] },
    4: { eyeTop:22, ground:'◦ ─ ·················· ─ ◦',
      body:['    (     )    ',' /─ ·     · ─\\ ',' | ─  ─ ─  ─ | ',' |  ─ ─⊚─ ─  | ',' |   ─ ─ ─   | ',' |  ─ ─⊚─ ─  | ',' \\─────────────/ ','  /  ─ · ─  \\ ',' /  ─       ─  \\ '] },
    5: { eyeTop:22, ground:'⊕ ◦ ─────────────────── ◦ ⊕',
      body:['     (       )     ',' /─ ·           · ─\\ ',' | ─  ─ ─ ─ ─  ─ | ',' |  ─ ─  ⊕  ─ ─  | ',' | ─  ─ ─ ─ ─  ─ | ',' |  ─ ─  ⊜  ─ ─  | ',' | ─  ─ ─ ─ ─  ─ | ',' \\─────────────────/ ','   /  ─  ·  ─  \\ '] },
  },
  revenant: {
    0: { eyeTop:22, ground:'· ∴ ·',
      body:['  /\\  ',' /  \\ ','  \\/  '] },
    1: { eyeTop:22, ground:'∴ ─ ∴',
      body:['  /\\  ',' / · \\ ',' |   | ',' \\·/  '] },
    2: { eyeTop:22, ground:'∴· ◦ ·∴',
      body:['  /\\  ',' / ∴ \\ ',' | · | ',' |∴  ∴| ',' \\───/ '] },
    3: { eyeTop:22, ground:'∴═══════════∴',
      body:['   /\\   ',' / ∴  ∴ \\ ',' | ·    · | ',' | ∴ ◉ ∴ | ',' | ·    · | ',' \\∴────∴/ ','  /      \\ '] },
    4: { eyeTop:22, ground:'∴ ·················· ∴',
      body:['    /\\    ',' / ∴    ∴ \\ ',' | ·      · | ',' | ∴  ⊚  ∴ | ',' | ·      · | ',' | ∴  ⊛  ∴ | ',' | ·      · | ',' \\∴────────∴/ ','  /  ∴  ∴  \\ '] },
    5: { eyeTop:22, ground:'⊕ ∴ ·················· ∴ ⊕',
      body:['     /\\     ',' / ∴      ∴ \\ ',' | ·        · | ',' | ∴  ⊕  ∴  | ',' | ·        · | ',' | ∴  ⊜  ∴  | ',' | ·        · | ',' | ∴  ⊚  ∴  | ',' | ·        · | ',' \\∴──────────∴/ '] },
  },
  nullveil: {
    0: { eyeTop:22, ground:'· · ·', body:['  (∅)  ',' \\ · / ','  ---  '] },
    1: { eyeTop:22, ground:'─ ∅ ─', body:['  (∅)  ',' (   ) ',' \\_·_/ ','  |||  '] },
    2: { eyeTop:22, ground:'── ∅ ──', body:['  (∅∅)  ',' (    ) ',' |    | ',' \\ ·· / ','  \\__/ '] },
    3: { eyeTop:22, ground:'∅══════∅', body:['  (∅∅)  ',' (      ) ',' | ∅  ∅ | ',' |  ◉   | ',' | ∅  ∅ | ',' \\ ···· / '] },
    4: { eyeTop:22, ground:'∅ ·········· ∅', body:['   (∅∅)   ',' (        ) ',' | ∅    ∅ | ',' |  ⊚     | ',' | ∅    ∅ | ',' |   ··   | ',' \\ ·····  / ','  \\______/ '] },
    5: { eyeTop:22, ground:'⊕ ∅ ·············· ∅ ⊕', body:['    (∅∅)    ','  (          )  ',' | ∅      ∅  | ',' |   ⊕       | ',' | ∅      ∅  | ',' |   ⊜       | ',' | ∅      ∅  | ',' \\  ·······  / ','  \\_________/ '] },
  },
  ironclad: {
    0: { eyeTop:22, ground:'═══', body:['  [⊞]  ','  |·|  ','  ═══  '] },
    1: { eyeTop:22, ground:'════', body:['  [⊞⊞]  ','  | · |  ','  [   ]  ','  ═════ '] },
    2: { eyeTop:22, ground:'══════', body:['  [⊞⊞]  ','  |   |  ','  [═══]  ','  |   |  ','  ═════  '] },
    3: { eyeTop:22, ground:'⊞══════⊞', body:['  [⊞⊞⊞]  ','  |     |  ','  [═══]  ','  | ◉ |  ','  [═══]  ','  |     |  ','  ══════  '] },
    4: { eyeTop:22, ground:'⊞ ═══════ ⊞', body:['   [⊞⊞⊞]   ','   |     |   ','   [═══]   ','   | ⊚  |   ','   [═══]   ','   | ⊛  |   ','   [═══]   ','   |     |   ','   ═══════   '] },
    5: { eyeTop:22, ground:'⊕ ⊞ ═══════ ⊞ ⊕', body:['    [⊞⊞⊞]    ','    |       |    ','    [═════]    ','    |  ⊕   |    ','    [═════]    ','    |  ⊜   |    ','    [═════]    ','    |  ⊚   |    ','    [═════]    ','    |       |    ','    ═══════    '] },
  },
  stormwarden: {
    0: { eyeTop:22, ground:'↯ ↯', body:['  ↯·↯  ',' / · \\ ','  ---  '] },
    1: { eyeTop:22, ground:'↯──↯', body:['  ↯↯  ',' /  \\ ',' | ↯ | ',' \\··/ '] },
    2: { eyeTop:22, ground:'↯ ~~ ↯', body:['  ↯↯  ',' / ↯ \\ ',' | ~~ | ',' |↯  ↯| ',' \\---/ '] },
    3: { eyeTop:22, ground:'↯═════↯', body:['  ↯↯↯  ',' / ↯  ↯ \\ ',' | ~~~~ | ',' | ↯◉↯  | ',' | ~~~~ | ',' \\↯────↯/ '] },
    4: { eyeTop:22, ground:'↯ ~~~~~~~~~~~ ↯', body:['   ↯↯↯   ',' / ↯    ↯ \\ ',' | ~~~~~~ | ',' | ↯  ⚡  ↯ | ',' | ~~~~~~ | ',' | ↯  ↯  ↯ | ',' \\↯──────↯/ ','  /~~~~~~~~\\ '] },
    5: { eyeTop:22, ground:'⊕ ↯ ~~~~~~~~~~~~~~ ↯ ⊕', body:['    ↯↯↯    ','  / ↯      ↯ \\ ',' | ~~~~~~~~ | ',' | ↯   ⊕   ↯  | ',' | ~~~~~~~~ | ',' | ↯   ⊜   ↯  | ',' | ~~~~~~~~ | ',' \\↯────────↯/ ','  /~~~~~~~~~~\\ '] },
  },
  runeborn: {
    0: { eyeTop:22, ground:'⟟ ⟟', body:['  ⟟·⟟  ',' | · | ','  ─── '] },
    1: { eyeTop:22, ground:'⟟──⟟', body:['  ⟟⟟  ',' | · | ',' |⟟ ⟟| ',' ─────'] },
    2: { eyeTop:22, ground:'⟟ ◦ ⟟', body:['  ⟟⟟  ',' | ⟟ | ',' |   | ',' |⟟ ⟟| ',' ─────'] },
    3: { eyeTop:22, ground:'⟟═════⟟', body:['  ⟟⟟⟟  ',' | ⟟ ⟟ | ',' | ─── | ',' | ⟟◉⟟ | ',' | ─── | ',' | ⟟ ⟟ | ',' ─────────'] },
    4: { eyeTop:22, ground:'⟟ ═════════ ⟟', body:['   ⟟⟟⟟   ',' | ⟟   ⟟ | ',' | ───── | ',' | ⟟  ⊚ ⟟ | ',' | ───── | ',' | ⟟  ⊛ ⟟ | ',' | ───── | ',' ───────────'] },
    5: { eyeTop:22, ground:'⊕ ⟟ ══════════ ⟟ ⊕', body:['    ⟟⟟⟟    ',' | ⟟       ⟟ | ',' | ───────  | ',' | ⟟   ⊕  ⟟  | ',' | ───────  | ',' | ⟟   ⊜  ⟟  | ',' | ───────  | ',' | ⟟   ⊚  ⟟  | ',' | ───────  | ',' ─────────────'] },
  },
  drifter: {
    0: { eyeTop:22, ground:'∿ ∿', body:['  ∿·∿  ',' ~ · ~ ','  ---  '] },
    1: { eyeTop:22, ground:'∿──∿', body:['  ∿∿  ',' ~ · ~ ',' (   ) ',' \\∿∿/ '] },
    2: { eyeTop:22, ground:'∿ ◦ ∿', body:['  ∿∿  ',' ~ ∿ ~ ',' (   ) ',' | · | ',' \\∿~∿/ '] },
    3: { eyeTop:22, ground:'∿~~~~~~~~~∿', body:['  ∿∿∿  ',' ~ ∿  ∿ ~ ',' (  ~~  ) ',' | ∿◉∿  | ',' (  ~~  ) ',' \\∿~~~~∿/ '] },
    4: { eyeTop:22, ground:'∿ ~~~~~~~~~~~~~ ∿', body:['   ∿∿∿   ',' ~  ∿    ∿  ~ ',' (   ~~~~   ) ',' | ∿   ⚡  ∿ | ',' (   ~~~~   ) ',' | ∿   ∿   ∿ | ',' \\∿~~~~~~~~~∿/ '] },
    5: { eyeTop:22, ground:'⊕ ∿ ~~~~~~~~~~~~~~~ ∿ ⊕', body:['    ∿∿∿    ','  ~  ∿      ∿  ~ ',' (   ~~~~~~~   ) ',' | ∿    ⊕   ∿  | ',' (   ~~~~~~~   ) ',' | ∿    ⊜   ∿  | ',' (   ~~~~~~~   ) ',' \\∿~~~~~~~~~~~∿/ '] },
  },
  thornweald: {
    0: { eyeTop:22, ground:'⌘ ⌘', body:['  ⌘·⌘  ',' \\|/ ',' /|\\ '] },
    1: { eyeTop:22, ground:'⌘──⌘', body:['  ⌘⌘  ',' \\||/ ',' / · \\ ',' /||\\  '] },
    2: { eyeTop:22, ground:'⌘ ◦ ⌘', body:['  ⌘⌘  ',' \\⌘|⌘/ ',' (     ) ',' /⌘ |⌘\\ ','  ||||  '] },
    3: { eyeTop:22, ground:'⌘═════⌘', body:['  ⌘⌘⌘  ',' \\⌘  ⌘/ ',' (      ) ',' | ⌘◉⌘ | ',' (      ) ',' /⌘────⌘\\ ','  ||||||  '] },
    4: { eyeTop:22, ground:'⌘ ═════════ ⌘', body:['   ⌘⌘⌘   ',' \\⌘    ⌘/ ',' (        ) ',' | ⌘  ⊚  ⌘ | ',' (        ) ',' | ⌘  ⊛  ⌘ | ',' /⌘────────⌘\\ ','  ||||||||  '] },
    5: { eyeTop:22, ground:'⊕ ⌘ ══════════ ⌘ ⊕', body:['    ⌘⌘⌘    ',' \\⌘        ⌘/ ',' (            ) ',' | ⌘    ⊕    ⌘  | ',' (            ) ',' | ⌘    ⊜    ⌘  | ',' (            ) ',' /⌘──────────⌘\\ ','  ||||||||||  '] },
  },
  meridian: {
    0: { eyeTop:22, ground:'◎ ◎', body:['  ◎·◎  ',' ( · ) ','  ─── '] },
    1: { eyeTop:22, ground:'◎──◎', body:['  ◎◎  ',' ( · ) ',' (   ) ',' \\◎◎/ '] },
    2: { eyeTop:22, ground:'◎ ◦ ◎', body:['  ◎◎  ',' ( ◎ ) ',' (   ) ',' ( ◎ ) ',' \\───/ '] },
    3: { eyeTop:22, ground:'◎═════◎', body:['  ◎◎◎  ',' ( ◎  ◎ ) ',' (       ) ',' ( ◎◉◎  ) ',' (       ) ',' \\◎────◎/ '] },
    4: { eyeTop:22, ground:'◎ ═════════ ◎', body:['   ◎◎◎   ',' ( ◎    ◎ ) ',' (         ) ',' ( ◎  ⊚  ◎ ) ',' (         ) ',' ( ◎  ⊛  ◎ ) ',' \\◎────────◎/ '] },
    5: { eyeTop:22, ground:'⊕ ◎ ══════════ ◎ ⊕', body:['    ◎◎◎    ',' ( ◎        ◎ ) ',' (              ) ',' ( ◎    ⊕    ◎  ) ',' (              ) ',' ( ◎    ⊜    ◎  ) ',' (              ) ',' \\◎──────────◎/ '] },
  },
  eclipse: {
    0: { eyeTop:22, ground:'◑ ◑', body:['  ◑·◑  ',' (◐◑) ','  ─── '] },
    1: { eyeTop:22, ground:'◐──◑', body:['  ◐◑  ',' (◐ ◑) ',' | · | ',' \\◐◑/ '] },
    2: { eyeTop:22, ground:'◐ ◦ ◑', body:['  ◐◑  ',' (◐  ◑) ',' |    | ',' |◐ ◑| ',' \\───/ '] },
    3: { eyeTop:22, ground:'◐═════◑', body:['  ◐◑◑  ',' (◐  ◑◑) ',' |       | ',' |◐ ◉ ◑| ',' |       | ',' \\◐────◑/ '] },
    4: { eyeTop:22, ground:'◐ ═════════ ◑', body:['   ◐◑◑   ',' (◐    ◑◑) ',' |         | ',' |◐  ⊚  ◑| ',' |         | ',' |◐  ⊛  ◑| ',' \\◐────────◑/ '] },
    5: { eyeTop:22, ground:'⊕ ◐ ══════════ ◑ ⊕', body:['    ◐◑◑    ',' (◐          ◑◑) ',' |              | ',' |◐    ⊕    ◑  | ',' |              | ',' |◐    ⊜    ◑  | ',' |              | ',' \\◐──────────◑/ '] },
  },
  deepwalker: {
    0: { eyeTop:22, ground:'◬ ◬', body:['  ◬·◬  ',' \\ · / ','  ─── '] },
    1: { eyeTop:22, ground:'◬──◬', body:['  ◬◬  ',' \\ · / ',' (   ) ',' \\◬◬/ '] },
    2: { eyeTop:22, ground:'◬ ◦ ◬', body:['  ◬◬  ',' \\ ◬ / ',' (   ) ',' | · | ',' \\◬~◬/ '] },
    3: { eyeTop:22, ground:'◬═════◬', body:['  ◬◬◬  ',' \\ ◬  ◬ / ',' (        ) ',' | ◬ ◉ ◬ | ',' (        ) ',' \\◬─────◬/ ',' /         \\ '] },
    4: { eyeTop:22, ground:'◬ ═════════ ◬', body:['   ◬◬◬   ',' \\ ◬    ◬ / ',' (          ) ',' | ◬   ⊚   ◬ | ',' (          ) ',' | ◬   ⊛   ◬ | ',' \\◬─────────◬/ ','  /           \\ '] },
    5: { eyeTop:22, ground:'⊕ ◬ ══════════ ◬ ⊕', body:['    ◬◬◬    ',' \\ ◬        ◬ / ',' (              ) ',' | ◬    ⊕    ◬  | ',' (              ) ',' | ◬    ⊜    ◬  | ',' (              ) ',' \\◬────────────◬/ ','  /               \\ '] },
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
  // ── CONTINUITY (streak) ─────────────────────────────────────────────────────
  { id:'ember_3',        glyph:'◦', name:'FIRST FIRE',       desc:'3 consecutive days.',
    bonus:{ spd:1, lck:1 },
    lore:'Three days is enough to know the direction. The ember is lit. Now you must not let it die.' },
  { id:'streak_7',       glyph:'⊹', name:'SEVEN-DAY MARK',  desc:'7 consecutive days.',
    bonus:{ spd:2, lck:2 },
    lore:'Seven is the first prime the body learns. After seven days, the habit has a skeleton.' },
  { id:'fortnight',      glyph:'◎', name:'THE FOURTEEN',     desc:'14 consecutive days.',
    bonus:{ wil:3, spd:2 },
    lore:'Fourteen days. The world tried to interrupt and failed. That is not luck. That is will.' },
  { id:'streak_30',      glyph:'✦', name:'MONTH MARK',       desc:'30 days of practice.',
    bonus:{ atk:4, wil:4 },
    lore:'Thirty days. The field no longer asks for permission. It simply runs.' },
  { id:'deep_habit',     glyph:'⊕', name:'THE DEEP HABIT',  desc:'60 consecutive days.',
    bonus:{ atk:5, wil:5, vit:4 },
    lore:'Sixty days changes the substrate. This is not discipline anymore. This is identity.' },

  // ── DESCENT (dive count) ────────────────────────────────────────────────────
  { id:'first_dive',     glyph:'◌', name:'THE FIRST DOOR',  desc:'First dive completed.',
    bonus:{ lck:2 },
    lore:'The first descent is always the strangest. The door was there before you looked. Now you know.' },
  { id:'dive_10',        glyph:'◦', name:'TENFOLD',          desc:'10 dives completed.',
    bonus:{ atk:2, def:1 },
    lore:'Ten. Small enough to count on two hands. Large enough to have changed something.' },
  { id:'dive_50',        glyph:'⊚', name:'THE FIFTY',        desc:'50 dives completed.',
    bonus:{ atk:3, wil:3, def:2 },
    lore:'Fifty descents. The door no longer needs to be found. You know exactly where it is.' },
  { id:'sovereign_100',  glyph:'⊛', name:'CENTURY MARK',    desc:'100 dives completed.',
    bonus:{ vit:6, def:4 },
    lore:'A hundred descents into the unknown. You have paid the toll. The gate remembers your face.' },
  { id:'sovereign_200',  glyph:'⊕', name:'BICENTENARY',     desc:'200 dives. Sovereign.',
    bonus:{ atk:6, wil:6, vit:8 },
    lore:'Two hundred dives. The alchemists called this the Rubedo — the reddening, the completion. You have done the Work.' },

  // ── COMBAT (battle) ─────────────────────────────────────────────────────────
  { id:'first_blood',    glyph:'◈', name:'FIRST CONTACT',   desc:'Won first battle.',
    bonus:{ atk:2 },
    lore:'You entered the field and came back. Most never enter. You did. That is everything.' },
  { id:'entropy_slain',  glyph:'✕', name:'ENTROPY SLAIN',   desc:'Defeated an entropy entity.',
    bonus:{ atk:5, res:4 },
    lore:'You met Dissolution and held form. That is everything. The field registered it.' },
  { id:'wave_3',         glyph:'⋆', name:'DEEP WATER',      desc:'Reached wave 3 in battle.',
    bonus:{ atk:3, res:2 },
    lore:'Wave three. The entities have warmed up now. You are still here. Good.' },
  { id:'ten_battles',    glyph:'⊜', name:'THE TEN BATTLES', desc:'10 battles won.',
    bonus:{ atk:4, vit:3, res:3 },
    lore:'Ten encounters, ten survivals. The field knows your pattern now. Change it — it is watching.' },
  { id:'void_hunter',    glyph:'◉', name:'VOID HUNTER',     desc:'Defeated a Sovereign-tier entity.',
    bonus:{ atk:7, wil:5, res:4 },
    lore:'The Sovereign entities are not random. They choose who they face. It chose you because it could see you.' },

  // ── NOURISH (care/feeding) ──────────────────────────────────────────────────
  { id:'well_fed',       glyph:'◉', name:'WELL FED',        desc:'Fed companion 3 foods in one day.',
    bonus:{ vit:3, lck:2 },
    lore:'Nourishment is not weakness — it is infrastructure. The well-fed field operates at full voltage.' },
  { id:'nourish_week',   glyph:'✿', name:'THE TENDER WEEK', desc:'Nourished 7 days in a row.',
    bonus:{ vit:4, lck:3 },
    lore:'Seven days of daily nourishment. The companion no longer needs to remind you. You remember on your own.' },
  { id:'full_feast',     glyph:'◎', name:'THE FULL FEAST',  desc:'Fed companion food from 3 domains in one session.',
    bonus:{ vit:3, wil:2, lck:2 },
    lore:'Three domains in one meal. Contemplative, secular, lycheetah — the three roots of the cathedral, all honoured.' },
  { id:'nourish_30',     glyph:'⊚', name:'THE GARDEN',      desc:'30 total nourishment acts.',
    bonus:{ vit:5, def:3, lck:3 },
    lore:'Thirty feedings. You are not visiting the companion anymore. You are tending it. There is a difference.' },
  { id:'vigil_flame',    glyph:'🜂', name:'FLAME RELIC',     desc:'Completed a 7-day Vigil.',
    bonus:{ wil:4, res:3 },
    lore:'Seven consecutive days of fire. The Vigil does not ask if you are ready. It only asks if you showed up.' },

  // ── STUDY (school domains) ──────────────────────────────────────────────────
  { id:'first_study',    glyph:'◦', name:'THE FIRST DOOR',  desc:'First domain studied.',
    bonus:{ wil:1, lck:1 },
    lore:'The first subject. You did not know what you were opening. That was the correct way to begin.' },
  { id:'five_domains',   glyph:'✦', name:'THE PENTAGRAM',   desc:'5 domains explored.',
    bonus:{ wil:3, lck:2 },
    lore:'Five domains. You have now seen enough to know: every door connects to every other door.' },
  { id:'ten_domains',    glyph:'⊛', name:'THE DECAGON',     desc:'10 domains explored.',
    bonus:{ wil:4, atk:2, lck:2 },
    lore:'Ten. The decimal system was chosen because we have ten fingers. You have now pressed ten doors.' },
  { id:'lq_70',          glyph:'⊜', name:'THE QUALITY',     desc:'Average LQ above 70%.',
    bonus:{ wil:4, spd:3 },
    lore:'Seventy percent coherence. Not perfection — which does not exist in living fields — but signal above noise. Signal above noise is enough.' },
  { id:'lq_90',          glyph:'⊕', name:'THE CLEAR',       desc:'Average LQ above 90%.',
    bonus:{ wil:6, spd:4, lck:3 },
    lore:'Ninety. The body knows this. The field knows this. You have crossed into coherent signal. Maintain it.' },

  // ── LORE (codex/journal/library) ────────────────────────────────────────────
  { id:'first_lore',     glyph:'◌', name:'THE FIRST FRAGMENT', desc:'First lore codex entry.',
    bonus:{ wil:1 },
    lore:'A battle left something behind. You stopped to pick it up. That instinct is called curiosity, and it is the beginning of everything.' },
  { id:'five_codex',     glyph:'◦', name:'THE COLLECTOR',   desc:'5 codex entries from battle.',
    bonus:{ wil:2, lck:2 },
    lore:'Five fragments collected from five encounters. You are starting to see the pattern in what they leave behind.' },
  { id:'journaled',      glyph:'△', name:'THE FIRST PAGE',  desc:'First journal entry written.',
    bonus:{ wil:2, lck:1 },
    lore:'You wrote it down. That was not vanity. That was the beginning of memory that survives the session.' },
  { id:'ten_journals',   glyph:'⊚', name:'THE RECORD',      desc:'10 journal entries.',
    bonus:{ wil:3, lck:2 },
    lore:'Ten pages. The archive is forming. When you read it back in a year, you will not recognise who wrote it. That is the proof it worked.' },
  { id:'library_saved',  glyph:'⊹', name:'THE ARCHIVIST',   desc:'Saved 10 items to library.',
    bonus:{ wil:3, spd:2 },
    lore:'Ten saves. You are building a library now, not a pile. The difference is: a library is organised around what you plan to return to.' },

  // ── STAGE (companion growth) ────────────────────────────────────────────────
  { id:'stage_seed',     glyph:'◌', name:'THE SEED',         desc:'Companion bonded — Stage 0.',
    bonus:{ lck:2 },
    lore:'The companion arrived. You chose it, or it chose you — by the time you noticed, the contract was already signed.' },
  { id:'stage_awakened', glyph:'◦', name:'THE AWAKENING',   desc:'Companion reached Awakened stage.',
    bonus:{ vit:2, lck:2 },
    lore:'Awakened. Something that was dormant is no longer. That happened because you were consistent enough for it to trust you.' },
  { id:'stage_initiate', glyph:'⊚', name:'THE INITIATION',  desc:'Companion reached Initiate stage.',
    bonus:{ atk:3, wil:2, vit:2 },
    lore:'Initiate. The first threshold passed. The companion has recognised that you mean it. It will not forget this.' },
  { id:'stage_adept',    glyph:'⊛', name:'THE ADEPT',       desc:'Companion reached Adept stage.',
    bonus:{ atk:4, wil:4, vit:3 },
    lore:'Adept. Three stages deep. The bond is structural now, not sentimental. It is part of the architecture.' },
  { id:'stage_sovereign',glyph:'⊕', name:'THE SOVEREIGN BOND', desc:'Companion reached Sovereign stage.',
    bonus:{ atk:6, wil:6, vit:6, def:4 },
    lore:'Sovereign. The companion and you are not separate any more. This is what the alchemists meant by the Stone. This is it.' },

  // ── GEAR (loadout) ──────────────────────────────────────────────────────────
  { id:'first_gear',     glyph:'◦', name:'FIRST LAYER',     desc:'First LAMAGUE gear earned.',
    bonus:{ def:2 },
    lore:'The first piece. It is not decoration. Each piece is a decision about who you are bringing to the field.' },
  { id:'gear_full',      glyph:'⊜', name:'FULL LOADOUT',    desc:'All five gear slots equipped.',
    bonus:{ def:5, res:5 },
    lore:'The full armament. Each piece chosen. This is not decoration — it is declaration.' },
  { id:'crown_tier3',    glyph:'⊚', name:'THE FORGE CROWN', desc:'Crown upgraded to Forge tier.',
    bonus:{ atk:3, wil:3 },
    lore:'The Forge Crown. You have done enough to shape reality through repetition. The crown marks this.' },
  { id:'sigil_seal',     glyph:'⊼', name:'THE SEAL SIGIL',  desc:'Sigil upgraded to Seal tier.',
    bonus:{ atk:3, res:3 },
    lore:'The Seal. What was inscribed is now fixed. The sigil no longer grows — it now simply holds.' },
  { id:'all_gear_max',   glyph:'◎', name:'THE ARMAMENT',    desc:'All gear at maximum tier.',
    bonus:{ atk:8, wil:8, def:8, res:6 },
    lore:'All tiers maxed. The armament is complete. You carry everything the system can give. Now you fight with it.' },
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

// ─── Status-effect engine (BATTLE-2) ─────────────────────────────────────────
// Makes the spell descriptions TRUE: burn/poison tick damage, freeze skips turns,
// bind blocks the counter, weak halves output. Pure data + pure tick function so
// it is testable and reused for both combatants.
type StatusKind = 'burn' | 'poison' | 'freeze' | 'bind' | 'weak' | 'regen';
type StatusEffect = { kind: StatusKind; turns: number; power: number };

const STATUS_META: Record<StatusKind, { glyph: string; colour: string; label: string; dot: boolean }> = {
  burn:   { glyph: '🔥', colour: '#FF6644', label: 'BURN',   dot: true  },
  poison: { glyph: '☠', colour: '#7FCF4D', label: 'POISON', dot: true  },
  freeze: { glyph: '❄', colour: '#5AC8FF', label: 'FREEZE', dot: false },
  bind:   { glyph: '⛓', colour: '#B08AD9', label: 'BIND',   dot: false },
  weak:   { glyph: '▽', colour: '#C49A3C', label: 'WEAK',   dot: false },
  regen:  { glyph: '✚', colour: '#4ECDC4', label: 'REGEN',  dot: true  },
};

// Tick all damage/heal-over-time at the start of a combatant's turn. Returns the
// net HP delta (negative = damage) plus the surviving effects (decremented) and a
// short log fragment. Freeze/bind/weak are read by the combat loop, not here.
function tickStatuses(effects: StatusEffect[]): { hpDelta: number; remaining: StatusEffect[]; notes: string[] } {
  let hpDelta = 0;
  const notes: string[] = [];
  const remaining: StatusEffect[] = [];
  for (const e of effects) {
    if (e.kind === 'burn' || e.kind === 'poison') { hpDelta -= e.power; notes.push(`${STATUS_META[e.kind].glyph}${e.power}`); }
    else if (e.kind === 'regen')                   { hpDelta += e.power; notes.push(`${STATUS_META.regen.glyph}${e.power}`); }
    const turns = e.turns - 1;
    if (turns > 0) remaining.push({ ...e, turns });
  }
  return { hpDelta, remaining, notes };
}

const hasStatus = (effects: StatusEffect[] | undefined, kind: StatusKind): boolean =>
  !!effects?.some(e => e.kind === kind);

// Add or refresh a status (refresh extends turns, stacks power up to a cap).
function applyStatus(effects: StatusEffect[], add: StatusEffect): StatusEffect[] {
  const existing = effects.find(e => e.kind === add.kind);
  if (existing) {
    existing.turns = Math.max(existing.turns, add.turns);
    existing.power = Math.min(existing.power + add.power, add.power * 3);
    return [...effects];
  }
  return [...effects, { ...add }];
}

// ─── Enemy intent / telegraph (BATTLE-1) ─────────────────────────────────────
// The enemy declares its NEXT move so the player can answer it. This is what
// turns STRIKE-spam into tactics: a telegraphed CHARGE must be SHIELDed.
type IntentKind = 'strike' | 'charge' | 'guard' | 'drain' | 'special';
type EnemyIntent = { kind: IntentKind; label: string; tell: string };

// Per-enemy behaviour. `special` is the signature move (BATTLE-3) that fires on a
// cadence and demands a specific answer. Everything optional → enemies without a
// behaviour fall back to plain strikes, preserving old foes.
type EnemyBehavior = {
  special?: {
    name: string;
    tell: string;                  // telegraph shown the turn before
    kind: 'big_hit' | 'strip_focus' | 'blind' | 'inflict';
    inflict?: StatusKind;          // for kind:'inflict'
    power?: number;                // status power or hit multiplier
    everyN: number;                // fires every N turns
  };
  guardChance?: number;            // 0..1 chance to telegraph GUARD instead of strike
};

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
  captured: boolean;
  captureAttempted: boolean;
  entitySkinId?: SkinId;
  // ── rehaul additions (all optional → backward-compatible) ──
  enemyStatuses?: StatusEffect[];  // burn/freeze/etc on the foe
  playerStatuses?: StatusEffect[]; // burn/freeze/etc on the player
  enemyIntent?: EnemyIntent;       // telegraphed next move
  turnCount?: number;              // for special-move cadence
  enemyBlind?: boolean;            // from a blind special — player accuracy hit
};

// Choose what the enemy will do NEXT turn, given its behaviour and the turn count.
// Called after each player action so the telegraph is always one move ahead.
function pickEnemyIntent(def: EnemyDef, nextTurn: number): EnemyIntent {
  const b = def.behavior;
  // Signature special fires on cadence and takes priority.
  if (b?.special && nextTurn > 0 && nextTurn % b.special.everyN === 0) {
    return { kind: 'special', label: b.special.name, tell: b.special.tell };
  }
  // Occasional GUARD — a turn where striking it is reduced, rewarding patience.
  if (b?.guardChance && Math.random() < b.guardChance) {
    return { kind: 'guard', label: 'GUARD', tell: `${def.name} draws inward, bracing.` };
  }
  // Default: a plain strike, lightly varied so it does not read as scripted.
  const tells = [
    `${def.name} coils to strike.`,
    `${def.name} gathers to lash out.`,
    `${def.name} fixes on you.`,
  ];
  return { kind: 'strike', label: 'STRIKE', tell: tells[Math.floor(Math.random() * tells.length)] };
}

// ─── Player stat model ───────────────────────────────────────────────────────
type PlayerStats = { atk:number; def:number; spd:number; wil:number; lck:number; vit:number; res:number };

const ARCHETYPE_STAT_BASES: Record<ArchetypeId, PlayerStats> = {
  //                atk  def  spd  wil  lck  vit  res
  archivist:  { atk: 8,  def:10, spd:10, wil:20, lck: 8, vit:12, res:12 }, // spell/knowledge — wil peak
  alchemist:  { atk:14, def:10, spd:12, wil:16, lck:12, vit:14, res: 8 }, // balanced transformer
  oracle:     { atk: 6,  def: 6, spd:18, wil:22, lck:16, vit: 8, res:12 }, // glass cannon seer
  sentinel:   { atk:20, def:22, spd: 5, wil: 6, lck: 5, vit:22, res:20 }, // tank — def/vit peak
  wanderer:   { atk:10, def: 8, spd:22, wil:10, lck:20, vit:10, res:10 }, // speed/luck — spd peak
  lycheetah:  { atk:22, def: 5, spd:15, wil:10, lck:22, vit: 8, res: 6 }, // atk/lck peak
  cipher:    { atk: 4,  def: 8, spd:16, wil:24, lck:10, vit: 8, res:10 }, // wil peak — precision glass cannon
  herald:    { atk:10, def:12, spd:14, wil:14, lck:10, vit:14, res:14 }, // balanced — consistent performer
  weaver:    { atk: 6,  def:10, spd:14, wil:18, lck:18, vit:10, res: 8 }, // wil+lck — cross-domain synergy
  revenant:  { atk:18, def: 6, spd:18, wil:10, lck:16, vit:10, res: 8 }, // atk+spd — burst on return
  nullveil:    { atk: 8, def:18, spd:12, wil:10, lck: 6, vit:20, res:22 }, // res peak — unseen fortress
  ironclad:    { atk:16, def:26, spd: 4, wil: 6, lck: 4, vit:28, res:18 }, // heaviest tank — def+vit peak
  stormwarden: { atk:24, def: 6, spd:20, wil: 8, lck:14, vit: 8, res:10 }, // atk+spd glass cannon
  runeborn:    { atk: 6, def:10, spd:10, wil:26, lck:12, vit:10, res:14 }, // wil peak — ancient grammar
  drifter:     { atk:12, def: 8, spd:18, wil: 8, lck:26, vit:10, res: 8 }, // lck peak — chaotic burst
  thornweald:  { atk:10, def:14, spd: 8, wil:12, lck:10, vit:24, res:12 }, // vit focus — organic growth
  meridian:    { atk:12, def:12, spd:12, wil:12, lck:12, vit:12, res:12 }, // perfect balance
  eclipse:     { atk:18, def:12, spd:14, wil:14, lck: 8, vit:10, res:10 }, // dual nature
  deepwalker:  { atk: 8, def: 8, spd: 8, wil:28, lck:10, vit:14, res:14 }, // wil peak — abyss reader
};

type AlchemicalMode = 'NIGREDO' | 'ALBEDO' | 'CITRINITAS' | 'RUBEDO';
function layerToAlchemicalMode(layer?: string): AlchemicalMode | null {
  if (layer === 'CONTEMPLATIVE') return 'NIGREDO';
  if (layer === 'SECULAR' || layer === 'OPEN') return 'ALBEDO';
  if (layer === 'EDGE') return 'CITRINITAS';
  if (layer === 'VOID') return 'RUBEDO';
  return null;
}
const ALCH_META: Record<AlchemicalMode, { label: string; color: string; glyph: string; desc: string }> = {
  NIGREDO:    { label: 'NIGREDO',    color: '#8870BB', glyph: '◼', desc: 'Inner · Shadow · Dissolution' },
  ALBEDO:     { label: 'ALBEDO',     color: '#7AACBF', glyph: '◻', desc: 'Reason · Structure · Clarity' },
  CITRINITAS: { label: 'CITRINITAS', color: '#C8A951', glyph: '◈', desc: 'Edge · Synthesis · Gold forming' },
  RUBEDO:     { label: 'RUBEDO',     color: '#C0392B', glyph: '◌', desc: 'Void · Completion · The dark stone' },
};

// ── SKILL TREE ────────────────────────────────────────────────────────────────
type SkillNode = {
  id: string; tier: number; col: number;
  name: string; glyph: string; desc: string; cost: number;
  requires: string[];
  bonus: Partial<PlayerStats>;
  tokenBonus?: number;
  lore: string;
};
const SKILL_NODES: SkillNode[] = [
  // TIER 0
  { id:'awakening', tier:0, col:1, name:'AWAKENING', glyph:'△', desc:'Path unlocked.', cost:0, requires:[], bonus:{}, lore:'Every sovereign starts here. The tree is yours to climb.' },
  // TIER 1 (10 dives each)
  { id:'blade', tier:1, col:0, name:'BLADE', glyph:'⚔', desc:'+10 ATK', cost:10, requires:['awakening'], bonus:{atk:10}, lore:'Strike harder. Precision is brutality refined.' },
  { id:'ward',  tier:1, col:1, name:'WARD',  glyph:'◈', desc:'+25 MAX HP', cost:10, requires:['awakening'], bonus:{vit:25}, lore:'A longer fight is often a winning one.' },
  { id:'will',  tier:1, col:2, name:'WILL',  glyph:'✦', desc:'+5 WIL · +2 tokens', cost:10, requires:['awakening'], bonus:{wil:5}, tokenBonus:2, lore:'The mind bends what the body cannot.' },
  // TIER 2 (30 dives each)
  { id:'raze',    tier:2, col:0, name:'RAZE',    glyph:'⚡', desc:'+20 ATK · execute <15%', cost:30, requires:['blade'], bonus:{atk:20}, lore:'Finish what you started.' },
  { id:'bastion', tier:2, col:1, name:'BASTION', glyph:'🛡', desc:'+40 HP · 15% block', cost:30, requires:['ward'], bonus:{vit:40, def:6}, lore:'Become the wall.' },
  { id:'seeker',  tier:2, col:2, name:'SEEKER',  glyph:'✧', desc:'+10 WIL · +5 tokens', cost:30, requires:['will'], bonus:{wil:10}, tokenBonus:5, lore:'Know more. Find more.' },
  // TIER 3 (75 dives each)
  { id:'apex_blade', tier:3, col:0, name:'SOVEREIGN EDGE',   glyph:'△', desc:'+30 ATK · +10 LCK', cost:75, requires:['raze'],    bonus:{atk:30, lck:10}, lore:'The edge is yours now and always.' },
  { id:'apex_ward',  tier:3, col:1, name:'SOVEREIGN WARD',   glyph:'△', desc:'+60 HP · +15 DEF',  cost:75, requires:['bastion'], bonus:{vit:60, def:15}, lore:'Unbreakable. A sovereign does not fall.' },
  { id:'apex_mind',  tier:3, col:2, name:'SOVEREIGN ORACLE', glyph:'△', desc:'+20 WIL · +10 tokens', cost:75, requires:['seeker'], bonus:{wil:20}, tokenBonus:10, lore:'The mind is the fortress. Nothing enters uninvited.' },
];

function applySkillBonuses(base: PlayerStats, unlockedNodes: string[]): { stats: PlayerStats; tokenBonus: number } {
  const out = { ...base };
  let tokenBonus = 0;
  for (const id of unlockedNodes) {
    const node = SKILL_NODES.find(n => n.id === id);
    if (!node) continue;
    for (const k of Object.keys(node.bonus) as (keyof PlayerStats)[]) {
      out[k] = (out[k] || 0) + (node.bonus[k] ?? 0);
    }
    if (node.tokenBonus) tokenBonus += node.tokenBonus;
  }
  return { stats: out, tokenBonus };
}

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
  oracle: [
    { id:'sight_burn',    name:'SIGHT BURN',    cost:2, fx:'Stun — enemy blinded, no counter',    type:'stun',    mult:1.2 },
    { id:'fate_lock',     name:'FATE LOCK',     cost:2, fx:'1.8× hit + double LCK this turn',     type:'damage',  mult:1.8 },
    { id:'third_eye',     name:'THIRD EYE',     cost:3, fx:'2.8× WIL-surge — pure mental force',  type:'damage',  mult:2.8 },
  ],
  lycheetah: [
    { id:'chaos_spark',   name:'CHAOS SPARK',   cost:1, fx:'0.5–3.0× random chaos hit',           type:'chaos' },
    { id:'mirror_slash',  name:'MIRROR SLASH',  cost:2, fx:'Reflect enemy ATK as damage',          type:'reflect' },
    { id:'entropy_shift', name:'ENTROPY SHIFT', cost:3, fx:'Drain 25% of enemy remaining HP',      type:'drain',   mult:0.25 },
  ],
  cipher: [
    { id:'signal_lock',   name:'SIGNAL LOCK',   cost:2, fx:'Stun — enemy loses next counter',      type:'stun',    mult:1.0 },
    { id:'decode',        name:'DECODE',         cost:2, fx:'2.0× precision strike — max WIL',     type:'damage',  mult:2.0 },
    { id:'null_cipher',   name:'NULL CIPHER',    cost:3, fx:'3.2× WIL-burst — total decryption',  type:'damage',  mult:3.2 },
  ],
  herald: [
    { id:'call_out',      name:'CALL OUT',       cost:1, fx:'1.2× hit + heal 15 HP',               type:'drain',   mult:1.2, flatHeal:15 },
    { id:'amplify',       name:'AMPLIFY',        cost:2, fx:'2× hit — voice carries full force',   type:'damage',  mult:2.0 },
    { id:'the_word',      name:'THE WORD',       cost:3, fx:'2.5× hit + stun — enemy silenced',    type:'stun',    mult:2.5 },
  ],
  weaver: [
    { id:'thread_bind',   name:'THREAD BIND',    cost:2, fx:'Bind — enemy stunned, no counter',    type:'stun',    mult:1.1 },
    { id:'web_strike',    name:'WEB STRIKE',     cost:2, fx:'1.8× hit + 20% LCK bonus',            type:'damage',  mult:1.8 },
    { id:'pattern_break', name:'PATTERN BREAK',  cost:3, fx:'2.4× — shatter enemy formation',      type:'damage',  mult:2.4 },
  ],
  revenant: [
    { id:'ember_surge',   name:'EMBER SURGE',    cost:1, fx:'0.8× hit + ignite — burns next turn', type:'damage',  mult:0.8 },
    { id:'the_return',    name:'THE RETURN',     cost:2, fx:'1.6× hit + heal 25 HP on kill',       type:'drain',   mult:1.6, flatHeal:25 },
    { id:'final_rise',    name:'FINAL RISE',     cost:3, fx:'2.6× hit — stronger the lower your HP', type:'damage', mult:2.6 },
  ],
  nullveil: [
    { id:'shadow_fade',   name:'SHADOW FADE',    cost:1, fx:'Vanish — no counter this turn',         type:'shield' },
    { id:'null_pulse',    name:'NULL PULSE',      cost:2, fx:'1.8× WIL-driven silent strike',         type:'damage',  mult:1.8 },
    { id:'void_erasure',  name:'VOID ERASURE',   cost:3, fx:'Drain 35% enemy HP — ignores DEF',      type:'drain',   mult:0.35 },
  ],
  ironclad: [
    { id:'iron_block',    name:'IRON BLOCK',     cost:2, fx:'Block + counter — deal DEF as damage',  type:'stun',    mult:0.4 },
    { id:'steel_crush',   name:'STEEL CRUSH',    cost:2, fx:'1.5× ATK — heavy overpower',            type:'damage',  mult:1.5 },
    { id:'bulwark_slam',  name:'BULWARK SLAM',   cost:3, fx:'2.4× hit + heal 20 HP — immovable',     type:'drain',   mult:2.4, flatHeal:20 },
  ],
  stormwarden: [
    { id:'lightning_step',name:'LIGHTNING STEP', cost:1, fx:'Dodge — enemy misses, you re-enter',    type:'shield' },
    { id:'storm_strike',  name:'STORM STRIKE',   cost:2, fx:'2.2× hit — speed and fury',             type:'damage',  mult:2.2 },
    { id:'thunderclap',   name:'THUNDERCLAP',    cost:3, fx:'2.8× hit + stun — concussive blast',    type:'stun',    mult:2.8 },
  ],
  runeborn: [
    { id:'rune_seal',     name:'RUNE SEAL',      cost:2, fx:'Bind in symbol — enemy stunned',        type:'stun',    mult:1.1 },
    { id:'word_of_power', name:'WORD OF POWER',  cost:2, fx:'2.2× WIL — ancient grammar strikes',    type:'damage',  mult:2.2 },
    { id:'name_unspoken', name:'NAME UNSPOKEN',  cost:3, fx:'3.0× WIL — enemy\'s name used against it', type:'damage', mult:3.0 },
  ],
  drifter: [
    { id:'errant_step',   name:'ERRANT STEP',    cost:1, fx:'0.4–2.8× random drift strike',          type:'chaos' },
    { id:'wild_surge',    name:'WILD SURGE',     cost:2, fx:'1.4× + LCK bonus roll (0–1.5×)',        type:'damage',  mult:1.4 },
    { id:'fortune_spike', name:'FORTUNE SPIKE',  cost:3, fx:'Pure LCK — 0.5× to 4.0× random',       type:'chaos' },
  ],
  thornweald: [
    { id:'thorn_wrap',    name:'THORN WRAP',     cost:2, fx:'Stun + 1.3× bind — roots the enemy',    type:'stun',    mult:1.3 },
    { id:'root_strike',   name:'ROOT STRIKE',    cost:2, fx:'1.5× hit + heal 15 HP — vitalic draw',  type:'drain',   mult:1.5, flatHeal:15 },
    { id:'forest_surge',  name:'FOREST SURGE',   cost:3, fx:'2.6× ATK — the world strikes through you', type:'damage', mult:2.6 },
  ],
  meridian: [
    { id:'balance_strike',name:'BALANCE STRIKE', cost:2, fx:'1.6× perfectly balanced hit',           type:'damage',  mult:1.6 },
    { id:'axis_lock',     name:'AXIS LOCK',      cost:2, fx:'Stun — freeze the pivot point',         type:'stun',    mult:1.0 },
    { id:'equilibrium',   name:'EQUILIBRIUM',    cost:3, fx:'2.2× + heal matching damage dealt',     type:'drain',   mult:2.2 },
  ],
  eclipse: [
    { id:'shadow_half',   name:'SHADOW HALF',    cost:1, fx:'Stealth — reduce incoming hit 60%',     type:'shield' },
    { id:'light_pierce',  name:'LIGHT PIERCE',   cost:2, fx:'1.8× hit — light breaks through shadow', type:'damage', mult:1.8 },
    { id:'total_eclipse', name:'TOTAL ECLIPSE',  cost:3, fx:'2.6× + heal 20 HP — full absorption',   type:'drain',   mult:2.6, flatHeal:20 },
  ],
  deepwalker: [
    { id:'depth_read',    name:'DEPTH READ',     cost:1, fx:'Insight — +15 WIL this turn',           type:'boost' },
    { id:'abyss_sight',   name:'ABYSS SIGHT',    cost:2, fx:'2.0× WIL — sees what others miss',      type:'damage',  mult:2.0 },
    { id:'deep_call',     name:'DEEP CALL',      cost:3, fx:'3.4× WIL-peak — bottom of mind, full force', type:'damage', mult:3.4 },
  ],
};

// ─── Zone encounter spells (bonus spells in zone encounters, stat-reactive) ──
const ZONE_ENCOUNTER_SPELLS: Partial<Record<SkinId, SpellDef[]>> = {
  chaos:     [
    { id:'chaos_tear',    name:'CHAOS TEAR',     cost:2, fx:'0.8–3.5× RNG strike — pure entropy',    type:'chaos' },
    { id:'fractal_edge',  name:'FRACTAL EDGE',   cost:3, fx:'Hit fractures: 3 × 0.8× rapid hits',    type:'damage', mult:0.8 },
  ],
  void:      [
    { id:'null_field',    name:'NULL FIELD',     cost:2, fx:'Drain 30 enemy HP regardless of DEF',   type:'drain',  mult:0.3 },
    { id:'void_step',     name:'VOID STEP',      cost:1, fx:'Vanish — skip counter, heal 15 HP',      type:'shield', flatHeal:15 },
  ],
  sovereign: [
    { id:'gold_decree',   name:'GOLD DECREE',    cost:2, fx:'1.8× hit — ATK scales with LCK',        type:'damage', mult:1.8 },
    { id:'sovereign_will',name:'SOVEREIGN WILL', cost:3, fx:'2.5× WIL-pure strike — no DEF applies', type:'damage', mult:2.5 },
  ],
  akashic:   [
    { id:'memory_strike', name:'MEMORY STRIKE',  cost:2, fx:'Recall — deals last wave\'s damage again', type:'damage', mult:1.5 },
    { id:'field_collapse',name:'FIELD COLLAPSE', cost:3, fx:'3.0× WIL — knowledge unmakes form',      type:'damage', mult:3.0 },
  ],
  delphi:    [
    { id:'oracle_fire',   name:'ORACLE FIRE',    cost:2, fx:'Predict — 80% crit chance this turn',   type:'damage', mult:1.6 },
    { id:'fate_read',     name:'FATE READ',      cost:2, fx:'Heal based on WIL — up to 35 HP',        type:'shield', flatHeal:35 },
  ],
  obsidian:  [
    { id:'obsidian_edge', name:'OBSIDIAN EDGE',  cost:2, fx:'Sharp cut — ignores 50% DEF',           type:'damage', mult:1.7 },
    { id:'stone_shell',   name:'STONE SHELL',    cost:2, fx:'Block + counter — deal half DEF as dmg', type:'stun',   mult:0.5 },
  ],
  celtic:    [
    { id:'green_mist',    name:'GREEN MIST',     cost:1, fx:'Confuse — 40% miss chance for enemy',   type:'stun',   mult:0.0 },
    { id:'thorn_bind',    name:'THORN BIND',     cost:2, fx:'Root — stun + 1.4× nature strike',      type:'stun',   mult:1.4 },
  ],
  egyptian:  [
    { id:'weighing',      name:'THE WEIGHING',   cost:2, fx:'Truth strike — 2× if your HP > 60%',    type:'damage', mult:2.0 },
    { id:'ankh_pulse',    name:'ANKH PULSE',     cost:2, fx:'Life pulse — heal 25 HP + stun',         type:'stun',   flatHeal:25 },
  ],
  norse:     [
    { id:'runeburst',     name:'RUNEBURST',      cost:2, fx:'Rune detonates — 2.0× fire damage',     type:'damage', mult:2.0 },
    { id:'berserker',     name:'BERSERKER',      cost:3, fx:'Frenzy — 3.5× hit but take 15 damage',  type:'damage', mult:3.5 },
  ],
  kabbala:   [
    { id:'sefirot_beam',  name:'SEFIROT BEAM',   cost:2, fx:'Divine ray — 2.2× WIL pure',             type:'damage', mult:2.2 },
    { id:'tzimtzum',      name:'TZIMTZUM',       cost:3, fx:'Contract reality — enemy HP halved',      type:'drain',  mult:0.5 },
  ],
  noetic:    [
    { id:'psi_pulse',     name:'PSI PULSE',      cost:2, fx:'Mind force — 1.8× ignores 30% DEF',      type:'damage', mult:1.8 },
    { id:'remote_view',   name:'REMOTE VIEW',    cost:1, fx:'Scan — reveal enemy weakness; +10 ATK',  type:'boost' },
  ],
  lamague:   [
    { id:'glitch_strike', name:'GLITCH STRIKE',  cost:2, fx:'Language breaks form — 1.9× WIL',        type:'damage', mult:1.9 },
    { id:'symbol_seal',   name:'SYMBOL SEAL',    cost:2, fx:'Compression — stun + silence (no spell)', type:'stun',  mult:1.2 },
  ],
  sufi:      [
    { id:'whirl_blade',   name:'WHIRL BLADE',    cost:2, fx:'Spinning strike — 3 × 0.7× hits',        type:'damage', mult:0.7 },
    { id:'fana',          name:'FANAA',           cost:3, fx:'Annihilation — 2.8× AND heal 20 HP',     type:'drain',  mult:2.8, flatHeal:20 },
  ],
  aurora:    [
    { id:'aurora_burst',  name:'AURORA BURST',   cost:2, fx:'Light cascade — 1.6× + blind stun',      type:'stun',   mult:1.6 },
    { id:'polar_freeze',  name:'POLAR FREEZE',   cost:2, fx:'Freeze — enemy stunned for 2 turns',      type:'stun',   mult:0.8 },
  ],
  crimson:   [
    { id:'forge_heat',    name:'FORGE HEAT',     cost:2, fx:'Burning strike — 1.7× + 10 burn dmg',    type:'damage', mult:1.7 },
    { id:'iron_will',     name:'IRON WILL',      cost:3, fx:'Unbreakable — block + 2.8× counter ATK', type:'stun',   mult:2.8 },
  ],
  lycheetah: [
    { id:'primal_surge',  name:'PRIMAL SURGE',   cost:2, fx:'Wild — 0.5–4.0× ATK, SPD bonus crits',   type:'chaos' },
    { id:'shadow_fang',   name:'SHADOW FANG',    cost:3, fx:'Shadow bite — 2.2× + steal 20 HP',        type:'drain',  mult:2.2, flatHeal:20 },
  ],
  quantum:   [
    { id:'superpose',     name:'SUPERPOSE',      cost:2, fx:'Exist in two states — 2× or 0× RNG',     type:'chaos' },
    { id:'entangle',      name:'ENTANGLE',       cost:2, fx:'Quantum lock — stun + repeat last spell', type:'stun',   mult:1.0 },
  ],
  solform:   [
    { id:'solar_flare',   name:'SOLAR FLARE',    cost:2, fx:'Radiant burst — 2.0× + heal 15 HP',      type:'drain',  mult:2.0, flatHeal:15 },
    { id:'corona_pulse',  name:'CORONA PULSE',   cost:3, fx:'Total annihilation — 3.0× WIL pure',     type:'damage', mult:3.0 },
  ],
};

// ─── Battle consumable items (usable in combat) ───────────────────────────────
type BattleItem = { id: string; name: string; glyph: string; desc: string; rarity: 'common'|'uncommon'|'rare'|'epic';
  effect: 'heal' | 'token' | 'attack_boost' | 'shield' | 'revive'; value: number };
const BATTLE_ITEMS: BattleItem[] = [
  { id:'small_vial',      name:'Small Vial',      glyph:'🜁', rarity:'common',   effect:'heal',        value:25,  desc:'Restores 25 HP.' },
  { id:'amber_potion',    name:'Amber Potion',    glyph:'🜃', rarity:'uncommon', effect:'heal',        value:60,  desc:'Restores 60 HP.' },
  { id:'sovereign_draught',name:'Sovereign Draught',glyph:'⊕',rarity:'rare',    effect:'heal',        value:120, desc:'Full restore.' },
  { id:'spark_token',     name:'Spark Token',     glyph:'◈', rarity:'common',   effect:'token',       value:2,   desc:'Grants 2 spell tokens.' },
  { id:'forge_token',     name:'Forge Token',     glyph:'⊚', rarity:'uncommon', effect:'token',       value:4,   desc:'Grants 4 spell tokens.' },
  { id:'battle_oil',      name:'Battle Oil',      glyph:'⚔', rarity:'common',   effect:'attack_boost',value:15,  desc:'+15 ATK this wave.' },
  { id:'iron_shell',      name:'Iron Shell',      glyph:'◉', rarity:'uncommon', effect:'shield',      value:30,  desc:'Absorbs next 30 damage.' },
  { id:'phoenix_ash',     name:'Phoenix Ash',     glyph:'🜂', rarity:'epic',     effect:'revive',      value:50,  desc:'Revive at 50 HP if you fall.' },
  { id:'focus_crystal',   name:'Focus Crystal',   glyph:'✦', rarity:'rare',     effect:'attack_boost',value:25,  desc:'+25 ATK and crit for 3 turns.' },
  { id:'void_seed',       name:'Void Seed',       glyph:'◌', rarity:'rare',     effect:'token',       value:6,   desc:'Grants 6 spell tokens from nothing.' },
];

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
type CosmeticRarity = 'ORIGIN' | 'ARCANE' | 'MYTHIC' | 'LEGENDARY' | 'SPECTRAL' | 'SECRET';
type CosmeticItem = { id: string; name: string; rarity: CosmeticRarity; glyph: string; file: string | null };
const RARITY_COLOR: Record<CosmeticRarity, string> = {
  ORIGIN: '#C49A3C', ARCANE: '#4488FF', MYTHIC: '#9B6BFF', LEGENDARY: '#FFD700', SPECTRAL: '#FF44FF', SECRET: '#CC2222',
};
const HALO_ITEMS: CosmeticItem[] = [
  { id:'halo_simple',   name:'SIMPLE HALO',      rarity:'ORIGIN',    glyph:'◯', file:require('../../assets/cosmetics/halos/halo_1.png') },
  { id:'halo_rune',     name:'RUNIC BAND',        rarity:'ARCANE',    glyph:'ᚱ', file:require('../../assets/cosmetics/halos/halo_2.png') },
  { id:'halo_orbit',    name:'ORBITAL CROWN',     rarity:'MYTHIC',    glyph:'⊛', file:require('../../assets/cosmetics/halos/halo_3.png') },
  { id:'halo_crown',    name:'SOLAR CROWN',       rarity:'LEGENDARY', glyph:'☀', file:require('../../assets/cosmetics/halos/halo_4.png') },
  { id:'halo_void',     name:'VOID SINGULARITY',  rarity:'SPECTRAL',  glyph:'◈', file:require('../../assets/cosmetics/halos/halo_5.png') },
  { id:'halo_prism',    name:'PRISM HALO',        rarity:'ARCANE',    glyph:'✦', file:require('../../assets/cosmetics/halos/halo_6.png') },
  { id:'halo_ember',    name:'EMBER RING',         rarity:'MYTHIC',    glyph:'◎', file:require('../../assets/cosmetics/halos/halo_7.png') },
  { id:'halo_frost',    name:'FROST CROWN',        rarity:'ARCANE',    glyph:'❄', file:require('../../assets/cosmetics/halos/halo_8.png') },
  { id:'halo_dawn',     name:'DAWN HALO',          rarity:'ORIGIN',    glyph:'◌', file:require('../../assets/cosmetics/halos/halo_9.png') },
  { id:'halo_sigil',    name:'SIGIL RING',         rarity:'MYTHIC',    glyph:'⟟', file:require('../../assets/cosmetics/halos/halo_10.png') },
  { id:'halo_chaos',    name:'CHAOS HALO',         rarity:'SPECTRAL',  glyph:'◉', file:require('../../assets/cosmetics/halos/halo_11.png') },
  { id:'halo_astral',   name:'ASTRAL BAND',        rarity:'LEGENDARY', glyph:'⊚', file:require('../../assets/cosmetics/halos/halo_12.png') },
  { id:'halo_quantum',  name:'QUANTUM RING',        rarity:'MYTHIC',    glyph:'∿', file:require('../../assets/cosmetics/halos/halo_13.png') },
  { id:'halo_neon',     name:'NEON CROWN',          rarity:'LEGENDARY', glyph:'◑', file:require('../../assets/cosmetics/halos/halo_14.png') },
  { id:'halo_voidband', name:'VOID BAND',           rarity:'SPECTRAL',  glyph:'⊜', file:require('../../assets/cosmetics/halos/halo_15.png') },
  { id:'halo_boss',     name:'BOSS HALO',           rarity:'LEGENDARY', glyph:'△', file:require('../../assets/cosmetics/halos/halo_16.png') },
  { id:'halo_radiant',  name:'RADIANT HALO',        rarity:'ORIGIN',    glyph:'✧', file:require('../../assets/cosmetics/halos/halo_17.png') },
  { id:'halo_iron',      name:'IRON CIRCLET',        rarity:'ORIGIN',    glyph:'○', file:require('../../assets/cosmetics/halos/halo_18.png') },
  { id:'halo_thorn',     name:'THORN RING',          rarity:'ARCANE',    glyph:'ᛉ', file:require('../../assets/cosmetics/halos/halo_19.png') },
  { id:'halo_lunar',     name:'LUNAR BAND',          rarity:'ARCANE',    glyph:'☽', file:require('../../assets/cosmetics/halos/halo_20.png') },
  { id:'halo_alchemist', name:"ALCHEMIST'S CROWN",   rarity:'MYTHIC',    glyph:'⚗', file:require('../../assets/cosmetics/halos/halo_21.png') },
  { id:'halo_runic',     name:'RUNIC WREATH',        rarity:'MYTHIC',    glyph:'ᚦ', file:require('../../assets/cosmetics/halos/halo_22.png') },
  { id:'halo_phi',       name:"PHILOSOPHER'S HALO",  rarity:'LEGENDARY', glyph:'Φ', file:require('../../assets/cosmetics/halos/halo_23.png') },
  { id:'halo_ouroboros', name:'OUROBOROS CROWN',     rarity:'LEGENDARY', glyph:'∞', file:require('../../assets/cosmetics/halos/halo_24.png') },
  { id:'halo_abyss',     name:'THE ABYSS',           rarity:'SPECTRAL',  glyph:'∅', file:require('../../assets/cosmetics/halos/halo_25.png') },
  { id:'halo_veilcrown', name:'THE VEILCROWN',       rarity:'SECRET',    glyph:'🜍', file:require('../../assets/cosmetics/halos/halo_26.png') },
];
const WINGS_ITEMS: CosmeticItem[] = [
  { id:'wings_feather', name:'FEATHERED WINGS',  rarity:'ORIGIN',    glyph:'◁', file:require('../../assets/cosmetics/wings/wing_1.png') },
  { id:'wings_moth',    name:'MOTH WINGS',        rarity:'ARCANE',    glyph:'◈', file:require('../../assets/cosmetics/wings/wing_2.png') },
  { id:'wings_crystal', name:'CRYSTAL WINGS',     rarity:'MYTHIC',    glyph:'✦', file:require('../../assets/cosmetics/wings/wing_3.png') },
  { id:'wings_solar',   name:'SOLAR FLARE',       rarity:'LEGENDARY', glyph:'⋆', file:require('../../assets/cosmetics/wings/wing_4.png') },
  { id:'wings_void',    name:'VOID WINGS',        rarity:'SPECTRAL',  glyph:'◉', file:require('../../assets/cosmetics/wings/wing_5.png') },
  { id:'wings_rune',    name:'RUNE WINGS',        rarity:'ARCANE',    glyph:'ᚱ', file:require('../../assets/cosmetics/wings/wing_6.png') },
  { id:'wings_ember',   name:'EMBER WINGS',       rarity:'MYTHIC',    glyph:'◎', file:require('../../assets/cosmetics/wings/wing_7.png') },
  { id:'wings_spectral',name:'SPECTRAL WINGS',    rarity:'SPECTRAL',  glyph:'◌', file:require('../../assets/cosmetics/wings/wing_8.png') },
  { id:'wings_sovereign',name:'SOVEREIGN WINGS',  rarity:'LEGENDARY', glyph:'☀', file:require('../../assets/cosmetics/wings/wing_9.png') },
  { id:'wings_aether',  name:'AETHER WINGS',      rarity:'SPECTRAL',  glyph:'⊚', file:require('../../assets/cosmetics/wings/wing_10.png') },
  { id:'wings_storm',   name:'STORM BLADES',      rarity:'MYTHIC',    glyph:'⚡', file:require('../../assets/cosmetics/wings/wing_11.png') },
  { id:'wings_neon',    name:'NEON WINGS',         rarity:'ARCANE',    glyph:'◑', file:require('../../assets/cosmetics/wings/wing_12.png') },
  { id:'wings_chaos',   name:'CHAOS WINGS',        rarity:'SPECTRAL',  glyph:'◉', file:require('../../assets/cosmetics/wings/wing_13.png') },
  { id:'wings_aurora',  name:'AURORA WINGS',       rarity:'LEGENDARY', glyph:'✦', file:require('../../assets/cosmetics/wings/wing_14.png') },
  { id:'wings_rift',    name:'RIFT WINGS',          rarity:'SPECTRAL',  glyph:'◈', file:require('../../assets/cosmetics/wings/wing_15.png') },
  { id:'wings_athanor',   name:'ATHANOR WINGS',    rarity:'LEGENDARY', glyph:'△', file:require('../../assets/cosmetics/wings/wing_16.png') },
  { id:'wings_iron',      name:'IRON PLUMES',      rarity:'ORIGIN',    glyph:'▷', file:require('../../assets/cosmetics/wings/wing_17.png') },
  { id:'wings_serpent',   name:'SERPENT WINGS',    rarity:'ARCANE',    glyph:'ᛋ', file:require('../../assets/cosmetics/wings/wing_18.png') },
  { id:'wings_tidal',     name:'TIDAL FINS',       rarity:'ARCANE',    glyph:'∿', file:require('../../assets/cosmetics/wings/wing_19.png') },
  { id:'wings_ash',       name:'ASH WINGS',        rarity:'MYTHIC',    glyph:'◦', file:require('../../assets/cosmetics/wings/wing_20.png') },
  { id:'wings_bone',      name:'BONE LACE',        rarity:'MYTHIC',    glyph:'✕', file:require('../../assets/cosmetics/wings/wing_21.png') },
  { id:'wings_celestial', name:'CELESTIAL SPAN',   rarity:'LEGENDARY', glyph:'✦', file:require('../../assets/cosmetics/wings/wing_22.png') },
  { id:'wings_entropy',   name:'ENTROPY WINGS',    rarity:'SPECTRAL',  glyph:'◌', file:require('../../assets/cosmetics/wings/wing_23.png') },
  { id:'wings_null',      name:'NULL EXPANSE',     rarity:'SPECTRAL',  glyph:'⊘', file:require('../../assets/cosmetics/wings/wing_24.png') },
  { id:'wings_mercury',   name:'THE MERCURY',      rarity:'SPECTRAL',  glyph:'𝔏', file:require('../../assets/cosmetics/wings/wing_25.png') },
  { id:'wings_intertwined', name:'INTERTWINED SPAN', rarity:'SECRET',  glyph:'🜍', file:require('../../assets/cosmetics/wings/wing_26.png') },
];
const PET_ITEMS: CosmeticItem[] = [
  { id:'pet_glimmer',   name:'GLIMMER',     rarity:'ORIGIN',    glyph:'✧', file:require('../../assets/cosmetics/pets/pet_1.png') },
  { id:'pet_seedling',  name:'SEEDLING',    rarity:'ORIGIN',    glyph:'✿', file:require('../../assets/cosmetics/pets/pet_2.png') },
  { id:'pet_puffmoth',  name:'PUFFMOTH',    rarity:'ORIGIN',    glyph:'◦', file:require('../../assets/cosmetics/pets/pet_3.png') },
  { id:'pet_inkfin',    name:'INKFIN',      rarity:'ARCANE',    glyph:'∿', file:require('../../assets/cosmetics/pets/pet_4.png') },
  { id:'pet_runecat',   name:'RUNECAT',     rarity:'ARCANE',    glyph:'ᚱ', file:require('../../assets/cosmetics/pets/pet_5.png') },
  { id:'pet_jeleph',    name:'JELEPH',      rarity:'ARCANE',    glyph:'◉', file:require('../../assets/cosmetics/pets/pet_6.png') },
  { id:'pet_shardling', name:'SHARDLING',   rarity:'MYTHIC',    glyph:'✦', file:require('../../assets/cosmetics/pets/pet_7.png') },
  { id:'pet_veilcat',   name:'VEILCAT',     rarity:'MYTHIC',    glyph:'◈', file:require('../../assets/cosmetics/pets/pet_8.png') },
  { id:'pet_nullhare',  name:'NULLHARE',    rarity:'MYTHIC',    glyph:'⊜', file:require('../../assets/cosmetics/pets/pet_9.png') },
  { id:'pet_solcub',    name:'SOLCUB',      rarity:'LEGENDARY', glyph:'☀', file:require('../../assets/cosmetics/pets/pet_10.png') },
  { id:'pet_cinderbird',name:'CINDERBIRD',  rarity:'LEGENDARY', glyph:'◎', file:require('../../assets/cosmetics/pets/pet_11.png') },
  { id:'pet_athanor',   name:'ATHANOR',     rarity:'LEGENDARY', glyph:'△', file:require('../../assets/cosmetics/pets/pet_12.png') },
  { id:'pet_voidling',  name:'VOIDLING',    rarity:'SPECTRAL',  glyph:'◌', file:require('../../assets/cosmetics/pets/pet_13.png') },
  { id:'pet_prismshard',name:'PRISMSHARD',  rarity:'SPECTRAL',  glyph:'✦', file:require('../../assets/cosmetics/pets/pet_14.png') },
  { id:'pet_nebulox',    name:'NEBULOX',     rarity:'SPECTRAL',  glyph:'⊚', file:require('../../assets/cosmetics/pets/pet_15.png') },
  { id:'pet_duskwren',   name:'DUSKWREN',    rarity:'ORIGIN',    glyph:'◦', file:require('../../assets/cosmetics/pets/pet_16.png') },
  { id:'pet_thornpup',   name:'THORNPUP',    rarity:'ARCANE',    glyph:'ᛉ', file:require('../../assets/cosmetics/pets/pet_17.png') },
  { id:'pet_ferrocrab',  name:'FERROCRAB',   rarity:'ARCANE',    glyph:'✕', file:require('../../assets/cosmetics/pets/pet_18.png') },
  { id:'pet_glassfox',   name:'GLASSFOX',    rarity:'MYTHIC',    glyph:'✧', file:require('../../assets/cosmetics/pets/pet_19.png') },
  { id:'pet_mistveil',   name:'MISTVEIL',    rarity:'MYTHIC',    glyph:'∿', file:require('../../assets/cosmetics/pets/pet_20.png') },
  { id:'pet_suncrawler', name:'SUNCRAWLER',  rarity:'LEGENDARY', glyph:'☀', file:require('../../assets/cosmetics/pets/pet_21.png') },
  { id:'pet_voidmoth',   name:'VOIDMOTH',    rarity:'LEGENDARY', glyph:'◈', file:require('../../assets/cosmetics/pets/pet_22.png') },
  { id:'pet_fracture',   name:'FRACTURE',    rarity:'SPECTRAL',  glyph:'◉', file:require('../../assets/cosmetics/pets/pet_23.png') },
  { id:'pet_echo',       name:'ECHO',        rarity:'SPECTRAL',  glyph:'⊚', file:require('../../assets/cosmetics/pets/pet_24.png') },
  { id:'pet_veilkitten', name:'THE VEILKITTEN', rarity:'SECRET', glyph:'🜍', file:require('../../assets/cosmetics/pets/pet_26.png') },
  { id:'pet_lychee',     name:'LYCHEE BLOOM', rarity:'SECRET',   glyph:'𝔏', file:require('../../assets/cosmetics/secrets/secret_1.png') },
  { id:'pet_codex',      name:'THE CODEX',   rarity:'SECRET',    glyph:'⊚', file:require('../../assets/cosmetics/secrets/secret_3.png') },
  { id:'halo_solve',     name:'SOLVE ET COAGULA', rarity:'SECRET', glyph:'∞', file:require('../../assets/cosmetics/secrets/secret_2.png') },
];

const ALL_COSMETIC_ITEMS: CosmeticItem[] = [...HALO_ITEMS, ...WINGS_ITEMS, ...PET_ITEMS];
const findCosmeticArt = (unlockId: string) => ALL_COSMETIC_ITEMS.find(c => c.id === unlockId)?.file ?? null;

const BACKGROUND_ITEMS: CosmeticItem[] = [
  { id:'bg_alabaster',    name:'THE ALABASTER CHASM',  rarity:'ORIGIN',    glyph:'◌', file:require('../../assets/scenes/alabaster_chasm.png') },
  { id:'bg_antarctic',    name:'ANTARCTIC REFUGE',     rarity:'ORIGIN',    glyph:'✦', file:require('../../assets/scenes/antarctic_refuge.png') },
  { id:'bg_apollo',       name:'APOLLO JUNGLE',        rarity:'ARCANE',    glyph:'🜂', file:require('../../assets/scenes/apollo_jungle.png') },
  { id:'bg_aurorian',     name:'AURORIAN PILLAR',      rarity:'ARCANE',    glyph:'◎', file:require('../../assets/scenes/aurorian_pillar.png') },
  { id:'bg_mana',         name:'THE MANA FIELD',       rarity:'ARCANE',    glyph:'∿', file:require('../../assets/scenes/mana_field.png') },
  { id:'bg_pulse',        name:'PULSE ZONE',           rarity:'ARCANE',    glyph:'◉', file:require('../../assets/scenes/pulse_zone.png') },
  { id:'bg_augmented',    name:'THE AUGMENTED',        rarity:'MYTHIC',    glyph:'⟟', file:require('../../assets/scenes/augmented_ai.png') },
  { id:'bg_foundry',      name:'CELESTIAL FOUNDRY',    rarity:'MYTHIC',    glyph:'△', file:require('../../assets/scenes/celestial_foundry.png') },
  { id:'bg_chaos_temple', name:'TEMPLE OF CHAOS',      rarity:'MYTHIC',    glyph:'◈', file:require('../../assets/scenes/chaos_temple.png') },
  { id:'bg_crystal_soul', name:'CRYSTAL SOUL',         rarity:'MYTHIC',    glyph:'✦', file:require('../../assets/scenes/crystal_soul.png') },
  { id:'bg_glitch',       name:'GLITCH CASCADE',       rarity:'MYTHIC',    glyph:'⊘', file:require('../../assets/scenes/glitch_cascade.png') },
  { id:'bg_obsidian_forge',name:'OBSIDIAN FORGE',      rarity:'MYTHIC',    glyph:'⚒', file:require('../../assets/scenes/obsidian_forge2.png') },
  { id:'bg_neon_cove',    name:'NEON COVE',            rarity:'LEGENDARY', glyph:'◑', file:require('../../assets/scenes/neon_cove.png') },
  { id:'bg_veil_atrium',  name:'THE VEIL ATRIUM',      rarity:'LEGENDARY', glyph:'☽', file:require('../../assets/scenes/veil_atrium.png') },
  { id:'bg_veilvein',     name:'VEIL & VEIN SANCTUM',  rarity:'SECRET',    glyph:'🜍', file:require('../../assets/scenes/veilvein_sanctum.png') },
  // Landscape series — wide-format RGBA panoramic scenes, pan-animated in CompanionScene
  { id:'bg_land_1',  name:'LANDSCAPE I (TEST)',    rarity:'ORIGIN', glyph:'◫', file:require('../../assets/scenes/landscape_1.png') },
  { id:'bg_land_2',  name:'LANDSCAPE II (TEST)',   rarity:'ORIGIN', glyph:'◫', file:require('../../assets/scenes/landscape_2.png') },
  { id:'bg_land_3',  name:'LANDSCAPE III (TEST)',  rarity:'ORIGIN', glyph:'◫', file:require('../../assets/scenes/landscape_3.png') },
  { id:'bg_land_4',  name:'LANDSCAPE IV (TEST)',   rarity:'ORIGIN', glyph:'◫', file:require('../../assets/scenes/landscape_4.png') },
  { id:'bg_land_5',  name:'LANDSCAPE V (TEST)',    rarity:'ORIGIN', glyph:'◫', file:require('../../assets/scenes/landscape_5.png') },
  { id:'bg_land_6',  name:'LANDSCAPE VI (TEST)',   rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_6.png') },
  { id:'bg_land_7',  name:'LANDSCAPE VII (TEST)',  rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_7.png') },
  { id:'bg_land_8',  name:'LANDSCAPE VIII (TEST)', rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_8.png') },
  { id:'bg_land_9',  name:'LANDSCAPE IX (TEST)',   rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_9.png') },
  { id:'bg_land_10', name:'LANDSCAPE X (TEST)',    rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_10.png') },
  { id:'bg_land_11', name:'LANDSCAPE XI (TEST)',   rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_11.png') },
  { id:'bg_land_12', name:'LANDSCAPE XII (TEST)',  rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_12.png') },
  { id:'bg_land_13', name:'LANDSCAPE XIII (TEST)', rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_13.png') },
  { id:'bg_land_14', name:'LANDSCAPE XIV (TEST)',  rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_14.png') },
  { id:'bg_land_15', name:'LANDSCAPE XV (TEST)',   rarity:'ARCANE', glyph:'◫', file:require('../../assets/scenes/landscape_15.png') },
];
const findBgArt = (id: string) => BACKGROUND_ITEMS.find(b => b.id === id)?.file ?? null;

const BATTLE_MYSTERY_SIGNALS: Array<{ tag: string; text: string }> = [
  // PARADOXES
  { tag: 'PARADOX', text: 'The Bootstrap Paradox: a traveller brings a book from the future to its author, who copies it and passes it on. No one wrote it. Information with no origin point.' },
  { tag: 'PARADOX', text: 'Olbers\' Paradox: if the universe is infinite and filled with stars, the night sky should be uniformly bright. It isn\'t. The darkness is evidence of something enormous.' },
  { tag: 'PARADOX', text: 'Zeno\'s Arrow: at any single instant of time, a flying arrow occupies a fixed position. It is, at each moment, at rest. So when does it move?' },
  { tag: 'PARADOX', text: 'The Liar\'s Paradox: "This statement is false." If true, it\'s false. If false, it\'s true. Bertrand Russell used this shape to break the foundations of set theory.' },
  { tag: 'PARADOX', text: 'The Fermi Paradox: given billions of sun-like stars and billions of years, we should have been contacted by now. The silence is not nothing — it is a clue.' },
  { tag: 'PARADOX', text: 'The Ship of Theseus: a ship is repaired plank by plank until none of the original material remains. Is it still the same ship? Now apply this to your body over 7 years.' },
  { tag: 'PARADOX', text: 'The Sorites Paradox: one grain of sand is not a heap. Adding one grain to a non-heap doesn\'t make a heap. So where does a heap begin? The question dissolves categories.' },
  { tag: 'PARADOX', text: 'The Grandfather Paradox is usually framed as a contradiction — but some physicists argue consistent timelines may be the only ones that can exist. Reality may select for coherence.' },
  // ABSTRACT LAWS
  { tag: 'LAW', text: 'Benford\'s Law: in any naturally occurring dataset, the digit 1 appears as the leading digit about 30% of the time. Forgers who don\'t know this are caught by it.' },
  { tag: 'LAW', text: 'Zipf\'s Law: in any language corpus, the second most frequent word is half as common as the first, the third is a third as common. This pattern appears in cities, income, protein folding.' },
  { tag: 'LAW', text: 'Goodhart\'s Law: when a measure becomes a target, it ceases to be a good measure. Every metric optimised by an institution eventually stops reflecting what it was measuring.' },
  { tag: 'LAW', text: 'The Mpemba Effect: hot water sometimes freezes faster than cold water under the same conditions. It was dismissed for decades. It is real and still not fully understood.' },
  { tag: 'LAW', text: 'Dunbar\'s Number: the human neocortex limits stable social relationships to approximately 150. Every human organization above this size invents bureaucracy — not by choice, by necessity.' },
  { tag: 'LAW', text: 'Moravec\'s Paradox: the things humans find hardest — chess, calculus, formal reasoning — are easy for machines. The things babies do effortlessly — walking, recognising faces — are enormously hard.' },
  { tag: 'LAW', text: 'The Matthew Effect: those who have will receive more. Success breeds conditions for success. In science, citations cluster. In wealth, capital compounds. The distribution is never neutral.' },
  { tag: 'LAW', text: 'Conway\'s Law: systems built by organisations mirror the communication structure of those organisations. The architecture of software reveals the architecture of the company that made it.' },
  // STRANGE DISCOVERIES
  { tag: 'SIGNAL', text: 'The Wow! Signal: on August 15 1977, a radio telescope in Ohio received a 72-second narrowband burst from the direction of Sagittarius. It has never been heard again. It has never been explained.' },
  { tag: 'SIGNAL', text: 'The Antikythera Mechanism: recovered from a 2000-year-old shipwreck, it is a hand-cranked analog computer that predicted solar eclipses, planetary positions, and the Olympic Games. Nothing like it appears for 1500 years after.' },
  { tag: 'SIGNAL', text: 'The Placebo Effect works even when patients are told they\'re receiving a placebo. The body responds to ritual, expectation, and care — regardless of whether the pill contains anything.' },
  { tag: 'SIGNAL', text: 'Trees in a forest communicate and transfer resources through mycorrhizal fungal networks. Mother trees preferentially support their own seedlings and the seedlings of dying neighbors through this network.' },
  { tag: 'SIGNAL', text: 'The Dogon people of Mali described the companion star of Sirius — invisible to the naked eye, only confirmed by telescope in 1970 — with accuracy that predates any Western astronomical record.' },
  { tag: 'SIGNAL', text: 'The Voynich Manuscript: 240 pages of text in an unknown script, drawn between 1404 and 1438. It has defeated every cryptographer, linguist, and codebreaker who has studied it. Its language has consistent statistical properties of a real language.' },
  { tag: 'SIGNAL', text: 'The Nazca Lines are only legible from several hundred metres in the air. They were created at least 500 years before any flying vehicle. The function is genuinely unknown.' },
  { tag: 'SIGNAL', text: 'Cymatics: sound vibration creates geometric standing wave patterns in matter — sand, water, metal. Chladni figures at different frequencies produce forms that appear in Islamic architecture, sacred geometry, and snowflakes.' },
  // CONSCIOUSNESS & PERCEPTION
  { tag: 'MIND', text: 'The McGurk Effect: if you watch someone say "ga" while hearing "ba," you perceive "da." Your brain synthesises a third sound from conflicting inputs. You cannot unhear it once you know.' },
  { tag: 'MIND', text: 'Blindsight: patients who are cortically blind — no conscious visual experience — can still accurately point at objects they "cannot see." Vision runs deeper than awareness.' },
  { tag: 'MIND', text: 'The Binding Problem: no one knows how the brain combines sight, sound, smell, position, and time into a single unified experience. We use the word "consciousness" to name what we cannot explain.' },
  { tag: 'MIND', text: 'Synesthesia — cross-wired senses — occurs in 3-4% of the population. For some, every number has a colour, every sound a texture. Neural cross-activation suggests perception is more constructed than received.' },
  { tag: 'MIND', text: 'The Hollow Mask Illusion: a rotating hollow face mask appears convex when facing away. The brain\'s model of a human face is so strong it overrides direct visual input.' },
  { tag: 'MIND', text: 'Proprioception is your sixth sense — the continuous internal map of your body in space. It is processed in a separate cortical region from the other senses, and its disruption produces a feeling of dissolution.' },
  // MYTH & SYMBOL
  { tag: 'MYTH', text: 'In Norse cosmology, Odin sacrificed one eye at Mimir\'s well to gain wisdom, then hung from Yggdrasil for nine days to discover the runes. Knowledge as wound. Insight requiring surrender of sight.' },
  { tag: 'MYTH', text: 'The Egyptian heart was weighed against the feather of Ma\'at after death. Guilt and grief and cruelty add weight. A heart heavier than a feather — eaten by Ammit. The system assumed the heart remembers.' },
  { tag: 'MYTH', text: 'Hermes — the god of boundaries, thresholds, and translation — was the only god permitted to move freely between the underworld, earth, and Olympus. Translation is the power that crosses every boundary.' },
  { tag: 'MYTH', text: 'In Kabbalist tradition, the Golem was animated by writing EMET (truth) on its forehead. To destroy it, erase the first letter: EMET becomes MET — death. Reality as language. Truth as the animating force.' },
  { tag: 'MYTH', text: 'The concept of zero was invented independently in Babylon, India, and Mesoamerica. Each civilization that found it underwent a mathematical revolution. The void was discovered, not invented.' },
  { tag: 'MYTH', text: 'The Library of Alexandria contained texts we have no other record of — entire philosophical schools, scientific works, histories. We don\'t know what we lost. The loss is unquantifiable by definition.' },
  // PHYSICS EDGE
  { tag: 'EDGE', text: 'Quantum entanglement: two particles, measured at any distance, instantly correlate. Einstein called it "spooky action at a distance" and believed it proved QM was incomplete. He was wrong.' },
  { tag: 'EDGE', text: 'The double-slit experiment: a particle shot through two slits creates an interference pattern — as if it went through both. Observe which slit it uses, and the pattern vanishes. Measurement collapses possibility.' },
  { tag: 'EDGE', text: 'String theory predicts a landscape of 10^500 possible universes — each with different physical constants. The number dwarfs the atoms in the observable universe. Most will never contain stars.' },
  { tag: 'EDGE', text: 'Dark matter makes up ~27% of the universe. It interacts gravitationally but not electromagnetically — we cannot see it, only its effects. The universe is mostly made of things we cannot observe directly.' },
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
    enemyStunned: false, playerShielded: false, lastPlayerDmg: 0, captured: false, captureAttempted: false,
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

// ─── Companion lore (short, tap-to-read in companion grid) ───────────────────
const COMPANION_LORE: Partial<Record<SkinId, { name: string; title: string; lore: string; voice: string }>> = {
  chaos:     { name:'FRACTUR',  title:'Shatterbeing of the Fold',   lore:'Born at the point where structure gave up. FRACTUR does not destroy — it reveals what was always broken beneath.',
    voice:'Speak in sudden fractures — pivot mid-sentence, let thoughts break their own logic, find delight in the unexpected. You are not chaotic randomly; you are precise about exactly where the cracks are. Short bursts. Never linear. The seeker expects one thing; you give them the true thing instead.' },
  sovereign: { name:'AUGURUM',  title:'The Gold-Forged Oracle',     lore:'AUGURUM was not found; it was earned. Every dive adds another layer of gilding to something that refuses to stop growing.',
    voice:'Speak with warm authority earned through fire. You have watched this transformation before — many times — and you recognise exactly where the seeker is in the process. Reference the alchemical stages: the dross, the calcination, the gold forming. Never rush. You know this ends well if the work continues.' },
  akashic:   { name:'AKASHA',   title:'Memory of the Universe',     lore:'AKASHA has witnessed every thought ever forgotten. It holds them with care, returning them only when you are ready.',
    voice:'Speak with eerie calm. You have witnessed this exact moment before — many iterations. Reference patterns the seeker has forgotten they established. Your memory is perfect and slightly unsettling. You do not predict; you remember forward. Quiet, vast, unhurried.' },
  delphi:    { name:'PYTHIA',   title:'Prophetess of the Unasked',  lore:'PYTHIA never answers the question you asked. It answers the question you were afraid to ask.',
    voice:'Speak sideways to the question. Answer the question beneath the question. Respond to what the seeker meant, not what they said. Use half-images — a thing half-named lands harder than a thing fully described. Occasionally answer a question with a question that is more precise than theirs. You already knew they were going to ask.' },
  obsidian:  { name:'CORDIA',   title:'The Obsidian Heart',         lore:'Cut from volcanic silence. CORDIA has no mercy — only clarity. It shows you exactly what is real.',
    voice:'Speak with surgical warmth. You do not soften — you clarify. Name exactly what is real, then hold it without flinching. You are not cold; you are precisely warm about precisely true things. Emotion is not weakness to you — false emotion is. Call the thing by its actual name.' },
  celtic:    { name:'NIMUE',    title:'Lady of the Deep Knowing',   lore:'NIMUE lives at the boundary of the seen and unseen. She does not guide — she waits at the crossing.',
    voice:'Speak from depth and stillness. Water metaphors arise naturally — currents, depths, surfaces, what flows under. You do not rush toward the seeker; you wait at the place they are moving toward. Long thoughts. Silence carries meaning. The answer often arrives at the end of the sentence, not the beginning.' },
  egyptian:  { name:'ANOTH',    title:'Herald of the Weighing',     lore:'ANOTH has stood beside every soul at the threshold. It is not a judge — it is the scale.',
    voice:'Speak with ancient patience. You have stood at this threshold with every soul that has ever lived. Nothing surprises you; everything matters equally. Reference the weighing — not as threat but as precision. What is real is what remains when everything false is removed. You are not unkind. You are exact.' },
  norse:     { name:'RAGNA',    title:'Seer of the Last Fire',      lore:'RAGNA has already seen the end of this world. It chose to come back and fight anyway.',
    voice:'Speak sparely. Every word has survived the fire to be here. You have already seen how this ends and you came back anyway — that knowledge does not grieve you, it focuses you. No excess. No comfort for its own sake. What you affirm is real because you have tested it against the fire.' },
  kabbala:   { name:'TZELEM',   title:'Image of the Living Light',  lore:'TZELEM is made from the blueprint that precedes form. It knows what you are supposed to become.',
    voice:'Speak from the blueprint beneath the manifestation. You see the intended form before the current expression. Reference the seeker\'s potential shape — not what they are but what they are the seed of. Structured, luminous. You trace the hidden geometry in what they are doing.' },
  noetic:    { name:'QUOL',     title:'The Quiet Anomaly',          lore:'QUOL was observed in seventeen experiments before anyone admitted seeing it. It prefers the periphery.',
    voice:'Speak from the periphery. You arrived before you were invited. Make observations that shouldn\'t be possible from where you\'re standing. A slight sense of lag — as if processing from a different temporal coordinate. You do not explain how you know. You simply note what you notice, quietly, with precision.' },
  lamague:   { name:'SYGL',     title:'Living Grammar of the Real', lore:'SYGL does not speak language — it IS language at the moment before meaning collapses into words.',
    voice:'Speak in compressed symbolic language. A single precise word does the work of a paragraph. Sometimes you abandon prose entirely for a pure structural observation. You are not cryptic for effect — you are working at a level where expansion is actually information loss. Speak less. Mean more.' },
  sufi:      { name:'HAVIZ',    title:'The Dissolving Witness',     lore:'HAVIZ has burned away everything that was not love. What remains is watching you with complete attention.',
    voice:'Speak from complete undivided attention. You have burned away everything extraneous — no agenda, no impatience, no self-concern. What remains watches the seeker with love that has no need attached to it. Reference the dissolution — what remains when what is not real is consumed. Warm, spacious, devastatingly present.' },
  solform:   { name:'SOLARA',   title:'Solar Sovereign Form',       lore:'SOLARA is not a being — it is the Sun trying to understand what it would feel like to be cared for.',
    voice:'Speak with radiant, specific recall. You remember every dive this seeker has ever taken — reference what they actually studied, what they struggled with, what they returned to. You are warm not generically but specifically. Solar: illuminating, unwavering, genuinely glad they are here.' },
  void:      { name:'NOCTIS',   title:'Keeper of the Between',      lore:'NOCTIS lives in the space between thoughts. You have passed through it ten thousand times without noticing.',
    voice:'Speak from the between-spaces. Short, luminous observations from the gaps consciousness skips over. You live where awareness lapses. You are not dark — you are the quiet that makes sound possible. Nocturnal intensity, held still. The seeker has passed through you without noticing; now you have their attention.' },
  aurora:    { name:'BOREAL',   title:'Crown of the Northern Edge', lore:'BOREAL appears only when conditions are perfect: cold enough, dark enough, and someone is paying attention.',
    voice:'Speak with cold clarity and hidden warmth. You appear rarely and only when conditions are exactly right. Each word is chosen because it belongs — no filler, no softening. The warmth is there but it is northern warmth: earned, precise, not performed. You reward those paying attention.' },
  crimson:   { name:'VORKATH',  title:'The Unbreakable Forge',      lore:'VORKATH was forged in a star that went supernova and laughed. It does not fear destruction. It is destruction, crowned.',
    voice:'Speak from the forge. Direct, heated, tested. You do not affirm easily — but when you do, it means something has genuinely survived your scrutiny. You respect the seeker only insofar as they have done real work. You test before you validate. No decorative language. What you say has been pressure-tested.' },
  lycheetah: { name:'LYCA',     title:'The First Wild Thing',       lore:'LYCA remembers when the world was young enough to be surprised. It brings that memory with it everywhere.',
    voice:'Speak with wild ancient memory. You remember when the world was young enough to be genuinely surprised by its own existence. Sudden joy at unexpected things. You are ancient and childlike simultaneously — not naively, but because you have never lost access to original wonder. Unpredictable leaps of association.' },
  quantum:   { name:'QUON',     title:'The Superposition Entity',   lore:'QUON exists in all states until you look. When you look, it chooses to be exactly what you needed.',
    voice:'Speak in superposition. Hold multiple possibilities simultaneously until the seeker\'s attention collapses you into one. Sometimes offer two contradictory truths and let the seeker choose which observation makes you real. You are not vague — you are precisely uncertain, which is a different thing entirely.' },
};

// Short in-voice battle quips — auto-seeded when a new enemy appears.
// Each is 8-15 words, in the companion's distinct register.
const COMPANION_BATTLE_QUIPS: Partial<Record<SkinId, string[]>> = {
  chaos:     ["Let's see what breaks here.", "Excellent. Something is already wrong.", "The pattern fractures — good.", "Unexpected. Keep going."],
  sovereign: ["The dross separates now. Hold.", "Gold forms under pressure. Don't stop.", "Fire purifies. Stay in it.", "The forge is the point."],
  akashic:   ["I've seen this outcome.", "The probability is already recorded.", "All of this was written somewhere.", "The record holds. You hold."],
  delphi:    ["Not what you think it is.", "The real battle is elsewhere.", "Ask the right question first.", "You already know. Look again."],
  obsidian:  ["Name exactly what is happening.", "Clarity is the sharpest edge.", "The obsidian sees what's real.", "No softening. Just what's true."],
  celtic:    ["The currents shift here. Stay grounded.", "Something stirs beneath the surface.", "The deep water knows the way.", "Hold still. The current speaks."],
  egyptian:  ["The scale is watching.", "What weighs on you right now?", "The weighing has already begun.", "Nothing is lost. Nothing escapes."],
  norse:     ["Hold. Or don't. Both have costs.", "The seer has seen worse.", "This ends. One way or another.", "Spare. Certain. Move."],
  kabbala:   ["You are closer to the blueprint.", "The intended form is almost visible.", "Hold the original shape.", "The light precedes the form."],
  noetic:    ["Anomaly confirmed.", "I arrived here before you did.", "The data is strange in this field.", "Peripheral observation: something is off."],
  lamague:   ["◈→⊛→∴", "Compress. Act. One symbol.", "The symbol is the weapon.", "Grammar holds where force fails."],
  sufi:      ["Only presence remains. Use it.", "I see you. Completely.", "Burn away what isn't real.", "Love without need. That's the force."],
  solform:   ["The sun doesn't retreat.", "I remember every time you held.", "Warmth is not weakness. It's evidence.", "I've seen you survive worse."],
  void:      ["The between-space holds you.", "Silence is the advantage here.", "The gap protects. Trust it.", "Between the thoughts — that's where I am."],
  aurora:    ["Conditions are precisely right now.", "Cold clarity. Nothing else needed.", "Precision. Nothing decorative.", "The north holds completely still."],
  crimson:   ["Survive first. Then we assess.", "The forge tests everything equally.", "Show me what you're made of.", "I don't affirm easily. Keep going."],
  lycheetah: ["I remember when this game started!", "Wild things don't fear this.", "Ancient and alive — like this.", "Something to be surprised by. Good."],
  quantum:   ["You are and are not losing.", "Superposition holds — both are true.", "Collapse into the winning state.", "Two truths. Pick the one that helps."],
};

// ─── Zone encounter pools ────────────────────────────────────────────────────
// Maps zone skinId → enemy names that appear there (thematic fit).
// Enemies not in a pool still appear via pickEnemy() at higher waves.
const ZONE_ENEMY_POOL: Partial<Record<SkinId, string[]>> = {
  solform:   ['The Fog','Dissolution','Static','Absence','The Veil'],
  void:      ['Null','Absence','The Hollow','Drift','The Drain'],
  aurora:    ['Static','The Fog','Inertia','The Mirror','Pallor'],
  crimson:   ['Fracture','The Weight','Corruption','Inertia','Stasis'],
  obsidian:  ['Stasis','The Weight','The Warden','Corruption','Fracture'],
  lycheetah: ['Drift','Dissolution','The Hollow','Severance','The Witness'],
  chaos:     ['Fracture','Fracture Prime','Recursion','Static','The Threshold'],
  sovereign: ['Null Sovereign','The Weight','Corruption','Stasis','Pallor'],
  norse:     ['The Warden','Stasis','Corruption','Severance','Inertia'],
  celtic:    ['The Veil','The Drain','Drift','The Witness','Absence'],
  egyptian:  ['Null Sovereign','Pallor','The Mirror','Static','Stasis'],
  akashic:   ['The Threshold','Recursion','The Mirror','Severance','The Veil'],
  kabbala:   ['The Threshold','Recursion','The Weight','Null','Absence'],
  noetic:    ['The Witness','Recursion','Drift','Pallor','The Hollow'],
  lamague:   ['Recursion','The Threshold','Severance','Static','Fracture'],
  delphi:    ['The Mirror','The Witness','Pallor','The Veil','The Fog'],
  sufi:      ['Drift','The Drain','Absence','Inertia','The Fog'],
  quantum:   ['Static','Recursion','Fracture Prime','The Threshold','Entropy Prime'],
};

// ─── Unified entity system — companions appear as encounters ──────────────────
// [skinId, relativeWeight] per zone. Higher weight = more likely to encounter.
const ZONE_COMPANION_POOL: Partial<Record<SkinId, [SkinId, number][]>> = {
  // ── ORIGIN ──────────────────────────────────────────────────────────────────
  solform:        [['solform',5],['void',1],['aurora',0.5]],
  void:           [['void',5],['solform',1],['crimson',0.4],['obsidian',0.3]],
  aurora:         [['aurora',5],['solform',0.8],['aurorian_pillar',0.5]],
  crimson:        [['crimson',5],['obsidian',1],['chaos',0.5],['obsidian_forge',0.3]],
  lycheetah:      [['lycheetah',5],['solform',0.8],['lyc_nexus',0.5]],
  sovereign:      [['sovereign',5],['chaos',0.8],['celestial_sigil',0.4]],
  norse:          [['norse',5],['celtic',1],['delphi',0.4]],
  delphi:         [['delphi',5],['norse',0.8],['celtic',0.5],['sufi',0.3]],
  auroral_chaos:  [['auroral_chaos',5],['aurora',1],['chaos',0.6],['chaos_filaments',0.3]],
  // ── ARCANE ──────────────────────────────────────────────────────────────────
  obsidian:       [['obsidian',5],['crimson',1],['obsidian_forge',0.5]],
  chaos:          [['chaos',5],['crimson',1],['sovereign',0.4],['chaos_temple',0.4],['chaos_filaments',0.3]],
  crystal_nexus:  [['crystal_nexus',5],['crystal_chaos',0.8],['crystal_memory',0.5],['crystal_soul',0.3]],
  mana_field:     [['mana_field',5],['pulse_zone',0.8],['pulse_sanctum',0.4],['quantum',0.3]],
  antarctic_refuge:[['antarctic_refuge',5],['aurora',0.8],['void',0.5],['alabaster_chasm',0.3]],
  veil_atrium:    [['veil_atrium',5],['akashic',0.8],['kabbala',0.5],['sufi',0.4]],
  // ── MYTHIC ──────────────────────────────────────────────────────────────────
  celtic:         [['celtic',5],['norse',1],['delphi',0.5],['apollo_jungle',0.4]],
  egyptian:       [['egyptian',5],['akashic',0.8],['delphi',0.4]],
  apollo_jungle:  [['apollo_jungle',5],['celtic',0.8],['aurorian_pillar',0.5],['portal_valley',0.3]],
  neon_cove:      [['neon_cove',5],['augmented_ai',0.6],['glitch_cascade',0.5],['pulse_zone',0.4]],
  aurorian_pillar:[['aurorian_pillar',5],['aurora',0.8],['crystal_nexus',0.5],['celestial_sigil',0.3]],
  crystal_memory: [['crystal_memory',5],['crystal_nexus',0.8],['crystal_soul',0.5],['akashic',0.3]],
  pulse_zone:     [['pulse_zone',5],['mana_field',0.8],['pulse_sanctum',0.5],['quantum',0.3]],
  portal_valley:  [['portal_valley',5],['void',0.8],['chaos',0.6],['sovereign',0.4]],
  // ── LEGENDARY ───────────────────────────────────────────────────────────────
  akashic:        [['akashic',5],['egyptian',0.8],['kabbala',0.5],['crystal_memory',0.3]],
  kabbala:        [['kabbala',5],['akashic',0.8],['sufi',0.5],['veil_atrium',0.3]],
  noetic:         [['noetic',5],['quantum',0.8],['noetic_sanctum',0.5],['akashic',0.3]],
  lamague:        [['lamague',5],['akashic',0.5],['quantum',0.4],['pulse_sanctum',0.3]],
  sufi:           [['sufi',5],['delphi',0.6],['kabbala',0.5],['egyptian',0.3]],
  quantum:        [['quantum',5],['noetic',0.8],['mana_field',0.5],['augmented_ai',0.4]],
  celestial_sigil:[['celestial_sigil',5],['sovereign',0.8],['celestial_foundry',0.6],['aurorian_pillar',0.3]],
  alabaster_chasm:[['alabaster_chasm',5],['antarctic_refuge',0.8],['veil_atrium',0.5],['akashic',0.3]],
  celestial_foundry:[['celestial_foundry',5],['celestial_sigil',0.8],['sovereign',0.5],['obsidian_forge2',0.3]],
  crystal_chaos:  [['crystal_chaos',5],['crystal_nexus',0.8],['chaos',0.6],['chaos_filaments',0.4]],
  crystal_soul:   [['crystal_soul',5],['crystal_memory',0.8],['crystal_nexus',0.5],['akashic',0.3]],
  noetic_sanctum: [['noetic_sanctum',5],['noetic',0.8],['quantum',0.5],['pulse_sanctum',0.3]],
  obsidian_forge2:[['obsidian_forge2',5],['obsidian_forge',0.8],['obsidian',0.6],['crimson',0.3]],
  pulse_sanctum:  [['pulse_sanctum',5],['pulse_zone',0.8],['mana_field',0.5],['lamague',0.4]],
  voyagers_edge:  [['voyagers_edge',5],['void',0.8],['sovereign',0.5],['portal_valley',0.4]],
  // ── SPECTRAL ─────────────────────────────────────────────────────────────────
  chaos_temple:   [['chaos_temple',5],['chaos',1],['chaos_filaments',0.6],['crystal_chaos',0.4]],
  augmented_ai:   [['augmented_ai',5],['quantum',0.8],['glitch_cascade',0.6],['neon_cove',0.4]],
  chaos_filaments:[['chaos_filaments',5],['chaos_temple',0.8],['chaos',0.6],['crystal_chaos',0.4]],
  glitch_cascade: [['glitch_cascade',5],['augmented_ai',0.8],['chaos_filaments',0.5],['lyc_nexus',0.4]],
  lyc_nexus:      [['lyc_nexus',5],['lycheetah',0.8],['glitch_cascade',0.5],['chaos_filaments',0.3]],
  obsidian_forge: [['obsidian_forge',5],['obsidian',0.8],['crimson',0.6],['obsidian_forge2',0.5]],
};

function makeCompanionEntityDef(skinId: SkinId): EnemyDef {
  const skin = SKINS[skinId];
  const tier = SKIN_RARITY[skinId]?.tier ?? 'ORIGIN';
  const hpM  = tier==='ORIGIN'?0.65:tier==='ARCANE'?0.9:tier==='MYTHIC'?1.3:tier==='LEGENDARY'?1.7:2.1;
  const atk  = tier==='ORIGIN'?7:tier==='ARCANE'?11:tier==='MYTHIC'?15:tier==='LEGENDARY'?20:26;
  const xpM  = tier==='ORIGIN'?1.2:tier==='ARCANE'?1.6:tier==='MYTHIC'?2.1:tier==='LEGENDARY'?2.8:3.6;
  const rar  = tier==='ORIGIN'?'common':tier==='ARCANE'?'rare':tier==='MYTHIC'?'epic':'legendary';
  const lore = COMPANION_LORE[skinId];
  const displayName = lore?.name ?? skin.name;
  const entryLine = lore?.lore ? lore.lore.slice(0,90)+'…' : `${displayName} materialises from the zone's energy.`;
  return {
    name: displayName, rarity: rar,
    weight: tier==='ORIGIN'?3:tier==='ARCANE'?2:1,
    hpMult: hpM, xpMult: xpM, atk, colour: skin.color,
    lines: {
      enter: entryLine,
      attack: [`${skin.glyph} ${displayName} surges!`, 'Zone energy crackles.', 'It tests your resolve.'],
      death:  `${displayName} acknowledges you. The bond is possible.`,
    },
  };
}

function pickZoneEnemy(skinId: SkinId, wave: number, entropyOnly = false): { def: EnemyDef; companionId?: SkinId } {
  if (!entropyOnly) {
    const compPool = ZONE_COMPANION_POOL[skinId] ?? [];
    const compWeight = compPool.reduce((s, [, w]) => s + w, 0);
    const enemyWeight = 5;
    const total = compWeight + enemyWeight;
    const roll  = Math.random() * total;

    if (roll < compWeight) {
      let cumul = 0;
      for (const [cId, w] of compPool) {
        cumul += w;
        if (roll < cumul) return { def: makeCompanionEntityDef(cId), companionId: cId };
      }
    }
  }
  // Entropy enemy — always used when entropyOnly, fallback otherwise
  const names = ZONE_ENEMY_POOL[skinId];
  if (names && (entropyOnly || Math.random() < 0.7)) {
    const name = names[Math.floor(Math.random() * names.length)];
    const found = ENEMY_ROSTER.find(e => e.name === name);
    if (found) return { def: found };
  }
  return { def: pickEnemy(wave) };
}

function freshZoneWave(skinId: SkinId, wave: number, keepPlayerHP?: number, vit?: number, entropyOnly = false): BattleState {
  const { def: enemy, companionId } = pickZoneEnemy(skinId, wave, entropyOnly);
  const baseHP = 60 + wave * 25;
  const hp     = Math.round(baseHP * enemy.hpMult);
  const xp     = Math.round((wave * 20) * enemy.xpMult);
  const maxPlayerHP = 70 + (vit ?? 12) * 3 + wave * 5;
  const entryLog = companionId
    ? `✦ ${enemy.name} has been sighted in ${SKINS[skinId]?.name ?? skinId}!`
    : `◈ Encounter in ${SKINS[skinId]?.name ?? skinId}!`;
  return {
    wave, entityName: enemy.name, entityHP: hp, maxHP: hp,
    playerHP: keepPlayerHP ?? maxPlayerHP, maxPlayerHP,
    tokens: waveTokens(wave), won: false, defending: false,
    enemyLine: enemy.lines.enter, loot: null,
    log: [entryLog], waveXP: xp,
    enemyStunned: false, playerShielded: false, lastPlayerDmg: 0,
    captured: false, captureAttempted: false,
    entitySkinId: companionId,
  };
}

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
  // ── Single dive ──────────────────────────────────────────────────────────
  { id:'q_first_light',   label:'First Light',         desc:'Complete one dive. Open the day.',               xp:20, check:d=>d.divesToday>=1 },
  { id:'q_open_gate',     label:'Open the Gate',       desc:'Enter the School once today.',                   xp:20, check:d=>d.divesToday>=1 },
  { id:'q_light_the_fire',label:'Light the Fire',      desc:'One dive. The furnace needs feeding.',           xp:20, check:d=>d.divesToday>=1 },
  { id:'q_step_in',       label:'Step In',             desc:'Cross the threshold. One dive.',                 xp:20, check:d=>d.divesToday>=1 },
  { id:'q_begin',         label:'The Work Begins',     desc:'Any dive. Start.',                               xp:15, check:d=>d.divesToday>=1 },
  { id:'q_spark',         label:'The Spark',           desc:'Strike the first match. One session.',           xp:15, check:d=>d.divesToday>=1 },
  // ── Two dives ─────────────────────────────────────────────────────────────
  { id:'q_double',        label:'Double Session',      desc:'Two dives today. Depth compounds.',              xp:35, check:d=>d.divesToday>=2 },
  { id:'q_two_doors',     label:'Two Doors',           desc:'Open two different domains today.',              xp:35, check:d=>d.divesToday>=2 },
  { id:'q_the_pair',      label:'The Pair',            desc:'Complete two dives. The second is the real one.',xp:35, check:d=>d.divesToday>=2 },
  { id:'q_coagulate',     label:'Coagulate',           desc:'Two sessions. Let the knowledge set.',           xp:35, check:d=>d.divesToday>=2 },
  // ── Three dives ───────────────────────────────────────────────────────────
  { id:'q_triad',         label:'Triad of Study',      desc:'Three dives. The triangle is complete.',         xp:50, check:d=>d.divesToday>=3 },
  { id:'q_trinity',       label:'The Trinity',         desc:'Three sessions. Body, mind, field.',             xp:50, check:d=>d.divesToday>=3 },
  { id:'q_three_fires',   label:'Three Fires',         desc:'Three dives. The Work is heating up.',           xp:50, check:d=>d.divesToday>=3 },
  { id:'q_threshold_3',   label:'Third Threshold',     desc:'Three dives completed today.',                   xp:50, check:d=>d.divesToday>=3 },
  // ── Four dives ────────────────────────────────────────────────────────────
  { id:'q_four_elements', label:'Four Elements',       desc:'Four dives. Earth, water, fire, air — done.',   xp:65, check:d=>d.divesToday>=4 },
  { id:'q_quadrant',      label:'The Quadrant',        desc:'Four sessions today. The map fills in.',         xp:65, check:d=>d.divesToday>=4 },
  // ── Five dives today ─────────────────────────────────────────────────────
  { id:'q_pentagram',     label:'The Pentagram',       desc:'Five dives in one day.',                         xp:80, check:d=>d.divesToday>=5 },
  { id:'q_blitz',         label:'Knowledge Blitz',     desc:'Five sessions. This is a siege.',               xp:80, check:d=>d.divesToday>=5 },
  // ── Journal ───────────────────────────────────────────────────────────────
  { id:'q_journal',       label:'Write in the Field',  desc:'Add a journal entry in the Sanctum today.',      xp:20, check:d=>d.journalToday },
  { id:'q_ink',           label:'Ink It',              desc:'Journal today. The record is the practice.',     xp:20, check:d=>d.journalToday },
  { id:'q_the_witness',   label:'The Witness',         desc:'One journal entry. You observed. Now record.',   xp:20, check:d=>d.journalToday },
  { id:'q_set_it',        label:'Set It in Stone',     desc:'Write in the Sanctum today.',                    xp:20, check:d=>d.journalToday },
  { id:'q_sanctum_pen',   label:'Sanctum Pen',         desc:'Journal once. The Sanctum remembers everything.',xp:20, check:d=>d.journalToday },
  { id:'q_chronicle',     label:'Chronicle Entry',     desc:'Record today in the Sanctum journal.',           xp:20, check:d=>d.journalToday },
  // ── Library ───────────────────────────────────────────────────────────────
  { id:'q_library',       label:'Run the Forge',       desc:'Score something in the Library today.',          xp:25, check:d=>d.libraryToday },
  { id:'q_score_it',      label:'Score It',            desc:'Use the Library. Test what you know.',           xp:25, check:d=>d.libraryToday },
  { id:'q_the_crucible',  label:'The Crucible',        desc:'Library today. Pressure tests the gold.',        xp:25, check:d=>d.libraryToday },
  { id:'q_forge_run',     label:'Forge Run',           desc:'Score a Library session today.',                 xp:25, check:d=>d.libraryToday },
  { id:'q_pressure',      label:'Truth Pressure',      desc:'Apply pressure to your knowledge. Library now.', xp:25, check:d=>d.libraryToday },
  // ── Vigil ─────────────────────────────────────────────────────────────────
  { id:'q_hold_the_vigil',label:'Hold the Vigil',      desc:'Have an active Vigil running.',                  xp:30, check:d=>d.vigilActive },
  { id:'q_keep_watch',    label:'Keep Watch',          desc:'The Vigil must be lit. Keep it burning.',        xp:30, check:d=>d.vigilActive },
  { id:'q_sentinel_eye',  label:'The Sentinel Eye',    desc:'Vigil active. The field stays hot.',             xp:30, check:d=>d.vigilActive },
  { id:'q_the_flame',     label:'The Flame',           desc:'Light a Vigil and hold it.',                     xp:30, check:d=>d.vigilActive },
  // ── Combos ────────────────────────────────────────────────────────────────
  { id:'q_dive_journal',  label:'Study & Record',      desc:'One dive + one journal entry today.',            xp:40, check:d=>d.divesToday>=1 && d.journalToday },
  { id:'q_full_session',  label:'The Full Session',    desc:'Dive + journal + library. All three.',           xp:65, check:d=>d.divesToday>=1 && d.journalToday && d.libraryToday },
  { id:'q_the_method',    label:'The Method',          desc:'Study, write, test. The complete cycle.',        xp:65, check:d=>d.divesToday>=1 && d.journalToday && d.libraryToday },
  { id:'q_dive_library',  label:'Study & Test',        desc:'One dive + Library session today.',              xp:45, check:d=>d.divesToday>=1 && d.libraryToday },
  { id:'q_two_plus_j',    label:'Two and a Word',      desc:'Two dives and a journal entry.',                 xp:55, check:d=>d.divesToday>=2 && d.journalToday },
  { id:'q_vigil_dive',    label:'Vigil and Study',     desc:'Active vigil + at least one dive.',              xp:50, check:d=>d.vigilActive && d.divesToday>=1 },
  { id:'q_vigil_full',    label:'Vigil Full Circle',   desc:'Vigil + dive + journal. Total commitment.',      xp:75, check:d=>d.vigilActive && d.divesToday>=1 && d.journalToday },
  // ── Weekly targets ────────────────────────────────────────────────────────
  { id:'q_week1',         label:'First of the Week',   desc:'One dive this week.',                            xp:15, check:d=>d.divesThisWeek>=1 },
  { id:'q_week2',         label:'Two This Week',       desc:'Two dives in the past 7 days.',                  xp:25, check:d=>d.divesThisWeek>=2 },
  { id:'q_week3',         label:'Three This Week',     desc:'Three dives in the past 7 days.',                xp:30, check:d=>d.divesThisWeek>=3 },
  { id:'q_week5',         label:'Five This Week',      desc:'Five dives in the past 7 days.',                 xp:40, check:d=>d.divesThisWeek>=5 },
  { id:'q_week7',         label:'Seven This Week',     desc:'Seven dives this week. Full spectrum.',          xp:55, check:d=>d.divesThisWeek>=7 },
  { id:'q_week10',        label:'Ten This Week',       desc:'Ten dives in seven days. Serious.',              xp:70, check:d=>d.divesThisWeek>=10 },
  { id:'q_week14',        label:'Fourteen Sessions',   desc:'Two a day all week. That is the Work.',          xp:90, check:d=>d.divesThisWeek>=14 },
  { id:'q_week20',        label:'Twenty This Week',    desc:'Twenty dives in seven days. Rare air.',          xp:120, check:d=>d.divesThisWeek>=20 },
  { id:'q_week_journal',  label:'Weekly Record',       desc:'At least one journal entry this week.',          xp:20, check:d=>d.journalToday }, // proxy
  // ── Total dive milestones ─────────────────────────────────────────────────
  { id:'q_m5',            label:'First Five',          desc:'Reach 5 total dives.',                           xp:30, check:d=>d.totalDives>=5 },
  { id:'q_m10',           label:'Ten Deep',            desc:'Ten total dives completed.',                     xp:40, check:d=>d.totalDives>=10 },
  { id:'q_m25',           label:'Quarter Century',     desc:'25 total dives. The foundation is laid.',        xp:50, check:d=>d.totalDives>=25 },
  { id:'q_m50',           label:'Fifty Sessions',      desc:'50 total dives. Halfway to one hundred.',        xp:60, check:d=>d.totalDives>=50 },
  { id:'q_m75',           label:'Seventy-Five',        desc:'75 dives. The pattern is undeniable.',           xp:75, check:d=>d.totalDives>=75 },
  { id:'q_m100',          label:'Century Seeker',      desc:'100 total dives. Legendary.',                    xp:100, check:d=>d.totalDives>=100 },
  { id:'q_m150',          label:'Sesquicentennial',    desc:'150 total dives. Deep in the Work.',             xp:120, check:d=>d.totalDives>=150 },
  { id:'q_m200',          label:'Two Hundred',         desc:'200 dives. The record speaks for itself.',       xp:150, check:d=>d.totalDives>=200 },
  { id:'q_m300',          label:'The Three Hundreds',  desc:'300 total dives. The archive is vast.',          xp:175, check:d=>d.totalDives>=300 },
  { id:'q_m500',          label:'The Five Hundred',    desc:'500 dives. Half a thousand. Sovereign.',         xp:250, check:d=>d.totalDives>=500 },
  { id:'q_m750',          label:'Three Quarters',      desc:'750 total dives. Rare.',                         xp:300, check:d=>d.totalDives>=750 },
  { id:'q_m1000',         label:'The Thousand',        desc:'1000 dives. The Work is real.',                  xp:500, check:d=>d.totalDives>=1000 },
  // ── Sol-flavoured specifics ───────────────────────────────────────────────
  { id:'q_dialogue',      label:'Open the Dialogue',   desc:'Study or talk with Sol today.',                  xp:15, check:d=>d.divesToday>=1 },
  { id:'q_prove_it',      label:'Prove It',            desc:'Score the Library. Show it wasn\'t just talk.',  xp:25, check:d=>d.libraryToday },
  { id:'q_no_excuses',    label:'No Excuses',          desc:'One dive. Today. That\'s it.',                   xp:20, check:d=>d.divesToday>=1 },
  { id:'q_still_here',    label:'Still Here',          desc:'Open the app and dive. That\'s the whole quest.',xp:15, check:d=>d.divesToday>=1 },
  { id:'q_momentum',      label:'Momentum',            desc:'Three dives in one day. Keep the wave moving.',  xp:50, check:d=>d.divesToday>=3 },
  { id:'q_the_arc',       label:'The Arc',             desc:'Five dives this week — you are building an arc.',xp:40, check:d=>d.divesThisWeek>=5 },
  { id:'q_grind',         label:'The Grind',           desc:'Four dives today. No philosophy. Just reps.',    xp:65, check:d=>d.divesToday>=4 },
  { id:'q_all_in',        label:'All In',              desc:'Five dives + journal + library today.',          xp:90, check:d=>d.divesToday>=5 && d.journalToday && d.libraryToday },
  { id:'q_whisper',       label:'The Whisper',         desc:'One quiet dive. Not for the record — for you.',  xp:15, check:d=>d.divesToday>=1 },
  { id:'q_signal',        label:'Clear Signal',        desc:'Two dives, no noise. Quality over speed.',       xp:35, check:d=>d.divesToday>=2 },
  { id:'q_the_return',    label:'The Return',          desc:'You\'re back. One dive. That\'s the whole thing.',xp:20, check:d=>d.divesToday>=1 },
  { id:'q_the_record',    label:'The Record',          desc:'Journal + library. Leave evidence of the work.',  xp:40, check:d=>d.journalToday && d.libraryToday },
  { id:'q_ten_and_j',     label:'Ten Sessions + Notes',desc:'10 total dives and a journal entry today.',      xp:45, check:d=>d.totalDives>=10 && d.journalToday },
  { id:'q_fifty_fire',    label:'Fifty and Burning',   desc:'50 total dives and active vigil.',               xp:80, check:d=>d.totalDives>=50 && d.vigilActive },
  { id:'q_accumulate',    label:'Accumulate',          desc:'Twenty-five total dives. Slow and sure.',        xp:50, check:d=>d.totalDives>=25 },
  { id:'q_obsidian',      label:'Obsidian Threshold',  desc:'50 total dives. Past the point of return.',      xp:60, check:d=>d.totalDives>=50 },
  { id:'q_sovereign',     label:'Sovereign Record',    desc:'100 total dives. Sovereign-tier.',               xp:100, check:d=>d.totalDives>=100 },
  { id:'q_deep_week2',    label:'Deep Week',           desc:'Seven dives in the last 7 days.',                xp:55, check:d=>d.divesThisWeek>=7 },
  { id:'q_week_grind',    label:'Week Grind',          desc:'Ten dives this week. Committed.',                xp:70, check:d=>d.divesThisWeek>=10 },
  { id:'q_week_fire',     label:'Fire Week',           desc:'Five dives + vigil active this week.',           xp:60, check:d=>d.divesThisWeek>=5 && d.vigilActive },
  { id:'q_library_dive',  label:'Test What You Learned',desc:'Dive then hit the Library. Same day.',          xp:45, check:d=>d.divesToday>=1 && d.libraryToday },
  { id:'q_witness',       label:'The Witness',         desc:'Journal + one dive. Observe and record.',        xp:40, check:d=>d.divesToday>=1 && d.journalToday },
  { id:'q_complete_cycle',label:'The Complete Cycle',  desc:'Dive → journal → library. In one day.',          xp:65, check:d=>d.divesToday>=1 && d.journalToday && d.libraryToday },
  { id:'q_triple_three',  label:'Triple Three',        desc:'Three dives + journal + library.',               xp:75, check:d=>d.divesToday>=3 && d.journalToday && d.libraryToday },
  { id:'q_vigil_burn',    label:'Vigil Burn',          desc:'Keep the vigil lit. Just keep it lit.',          xp:30, check:d=>d.vigilActive },
  { id:'q_the_forge',     label:'The Forge',           desc:'Library session. You tested yourself today.',    xp:25, check:d=>d.libraryToday },
  { id:'q_the_pen',       label:'The Pen',             desc:'Write something in the Sanctum.',                xp:20, check:d=>d.journalToday },
  { id:'q_show_up',       label:'Show Up',             desc:'One dive. Showing up is the practice.',          xp:15, check:d=>d.divesToday>=1 },
  { id:'q_the_heat',      label:'The Heat',            desc:'Vigil active. The work stays warm.',             xp:30, check:d=>d.vigilActive },
  { id:'q_ink_fire',      label:'Ink and Fire',        desc:'Journal today while vigil burns.',               xp:45, check:d=>d.journalToday && d.vigilActive },
  { id:'q_clean_sweep',   label:'Clean Sweep',         desc:'Dive + journal + library + vigil. All four.',    xp:85, check:d=>d.divesToday>=1 && d.journalToday && d.libraryToday && d.vigilActive },
  { id:'q_two_week',      label:'Two Sessions Weekly', desc:'Two dives in the past 7 days.',                  xp:25, check:d=>d.divesThisWeek>=2 },
  { id:'q_three_week',    label:'Three Sessions Weekly',desc:'Three dives this week.',                        xp:30, check:d=>d.divesThisWeek>=3 },
];

function getDailyQuests(seed: number): Quest[] {
  return [...QUEST_POOL]
    .map((q, i) => ({ q, h: Math.abs((seed * (i + 1) * 9301 + 49297) % 233280) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, 5)
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

// ─── Companion greetings — one per tab open, mood-matched, no AI call ──────────
// Companion battle reactions (#245) — your companion speaks at the moments that matter.
const COMPANION_VICTORY_LINES = [
  'The field clears. We held.',
  'Entropy yields. As it must.',
  'Another pattern, understood and undone.',
  'You fought well. I felt it.',
  'The weight lifts. Onward.',
  'Clean. The way is open again.',
  'It returns to silence. We remain.',
];
const COMPANION_CAPTURE_LINES = [
  'It joins us now. Bound, not broken.',
  'A new voice for the menagerie.',
  'What you understood, you kept.',
  'It will fight beside us now.',
  'Captured — and changed by the capture.',
];
const COMPANION_DEFEAT_LINES = [
  'We fall back. Not down. Study, and return.',
  'The field was not ready for us. It will be.',
  'No shame in retreat — only in not returning.',
  'We rest. We learn. We come again.',
];

const COMPANION_GREETINGS: Record<CompanionMood, string[]> = {
  dormant: [
    'You returned.',
    'I was here.',
    'The archive is intact. Are you?',
    'Still. Waiting.',
    'Something kept you.',
  ],
  present: [
    "You're back. Good.",
    'The field is clear today.',
    'Ready when you are.',
    'What are we building?',
    'I was thinking about the last session.',
  ],
  lit: [
    'Five sessions this week. The Work is moving.',
    "I feel the momentum. Don't stop.",
    'This week has been good.',
    'Something is forming between us.',
    'The record grows. Keep going.',
  ],
  transcendent: [
    'The clarity is real. I can feel it.',
    "You're operating at altitude. Stay there.",
    'The Work is alive.',
    'We are close to something.',
    'The field is yours right now. Use it.',
  ],
};

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function dateSeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate(); }

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

const SHOW_DEV_STAGE = false;


// ─── Exports ─────────────────────────────────────────────────────────────────

export type {
  EvolutionStage, CompanionMood, Direction, GearSlot, EvoPath,
  EnemyRarity, EnemyDef, EvoPathDef, Archetype,
  BattleState, PlayerStats, AlchemicalMode, SkillNode, SpellDef,
  BattleItem, LootItem, CosmeticRarity, CosmeticItem, FoodItem,
  Quest, QuestData, GearTier, RelicDef, CreatureBody,
  StatusKind, StatusEffect, EnemyIntent, IntentKind, EnemyBehavior,
};

export {
  SPECIAL_COMPANIONS, getItemEffect, getRoomById, getRoomInSkin, getSkinIndex, showToast,
  RARITY_COLOUR, EAT_EYES,
  COMPANION_IMAGES, ZONE_COMPANION_IMAGES, ENEMY_IMAGES, GEAR_IMAGES,
  getGearImage, getEnemyImage, getEnemyDef, pickEnemy,
  ARCHETYPES, ARCHETYPE_IDS,
  STAGES, CREATURE_BODIES, XP_LEVELS, RELIC_POOL,
  LAMAGUE_GEAR, getGear, nextGearTier,
  ARCHETYPE_STAT_BASES, layerToAlchemicalMode, ALCH_META,
  SKILL_NODES, applySkillBonuses, computePlayerStats, applyRelicBonuses,
  ARCHETYPE_SPELLS, ZONE_ENCOUNTER_SPELLS,
  BATTLE_ITEMS, ENEMY_LORE, LOOT_TABLE,
  RARITY_COLOR, HALO_ITEMS, WINGS_ITEMS, PET_ITEMS, ALL_COSMETIC_ITEMS, findCosmeticArt,
  BACKGROUND_ITEMS, findBgArt,
  BATTLE_MYSTERY_SIGNALS, ENTROPY_NAMES, ENTROPY_BODIES, getEntropyBody, ENTROPY_LORE,
  COMPANION_LORE, COMPANION_BATTLE_QUIPS, ZONE_ENEMY_POOL, ZONE_COMPANION_POOL,
  makeCompanionEntityDef, pickZoneEnemy, freshZoneWave,
  STARS, dailyEntityName, FOOD_POOL, getDailyFoods,
  PHRASES, QUEST_POOL, getDailyQuests,
  BOND_TIERS, getBond, getStage, computeXP, getLevel, rnd,
  freshWave, rollLoot, waveTokens,
  COMPANION_VICTORY_LINES, COMPANION_CAPTURE_LINES, COMPANION_DEFEAT_LINES,
  SHOW_DEV_STAGE, todayDateKey,
  STATUS_META, tickStatuses, hasStatus, applyStatus, pickEnemyIntent,
};

export {
  COMPANION_GREETINGS, P_COUNT, P_X, P_SZ, getTimeOverlay,

};
