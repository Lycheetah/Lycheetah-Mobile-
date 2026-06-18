// ─── LYCHEETAH WORLD ZONES ───────────────────────────────────────────────────
// 27 pixel-art zones. Each maps to a school category or special feature.
// action: { type: 'category', value: school filter tab }
//        | { type: 'feature', value: feature id }

export type ZoneCategory = 'edge' | 'void' | 'noetic' | 'outer' | 'inner' | 'special';

export type ZoneAction =
  | { type: 'category'; value: 'inner' | 'outer' | 'edge' | 'void' | 'noetic' }
  | { type: 'feature'; value: 'zonkzone' | 'timebraiding' };

export interface WorldZone {
  id: string;
  name: string;
  category: ZoneCategory;
  action: ZoneAction;
  image: ReturnType<typeof require>;
}

export const WORLD_ZONES: WorldZone[] = [
  // ── EDGE / LYCHEETAH ──
  {
    id: 'lycheetah_nexus',
    name: 'The Lycheetah Nexus',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The lycheetah Nexus.png'),
  },
  {
    id: 'lycheetah_pulse_zone',
    name: 'The Lycheetah Pulse Zone',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The Lycheetah Pulse Zone.png'),
  },
  {
    id: 'lycheetah_pulse_sanctum',
    name: 'The Lycheetah Pulse Sanctum',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The lycheetah pulse sanctum.png'),
  },
  {
    id: 'lycheetah_apollo_jungle',
    name: 'Lycheetah Apollo — In the Jungle',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/Lycheetah Apollo In the jungle.png'),
  },
  {
    id: 'lycheetah_celestial',
    name: 'Lycheetah Celestial',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/Lycheetah celestial sggiulat.png'),
  },
  {
    id: 'lycheetah_crystal_fall',
    name: 'Lycheetah Crystal Fall Research Nexus',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/Lycheetah Crytsal fall research nexus.png'),
  },
  {
    id: 'lycheetah_obsidian_mana',
    name: 'Lycheetah Obsidian Mana Field',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/Lycheetah Obsidian Mana Field.png'),
  },
  {
    id: 'lycheetah_soul_temple',
    name: 'The Crystal Lycheetah Soul Temple',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The Crystal Lycheetah SOUL TEMPLE.png'),
  },
  {
    id: 'aurorian_pillar',
    name: 'The Aurorian Pillar of Lycheetah',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The Aurorian Pillar of Lycheetah.png'),
  },
  {
    id: 'chaotic_crystal_zone',
    name: 'The Chaotic Lycheetah Crystal Zone',
    category: 'edge',
    action: { type: 'category', value: 'edge' },
    image: require('../../assets/world/The chaotic lycheetah crystal zone.png'),
  },

  // ── VOID ──
  {
    id: 'obsidian_void_forge',
    name: 'The Obsidian Void Forge',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/The OBSIDIAN VOID FORGE.png'),
  },
  {
    id: 'obsidian_void_forge_2',
    name: 'The Obsidian Void Forge II',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/The obsidian void forge 2.png'),
  },
  {
    id: 'alabaster_chasm',
    name: 'The Alabaster Chasm',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/The Alabaster Chasm.png'),
  },
  {
    id: 'chaos_filaments',
    name: 'The Chaos Filaments',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/The chaos filaments.png'),
  },
  {
    id: 'auroral_chaos',
    name: 'Auroral Chaos — Lycheetah Zone',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/Auroral chaos Lycheetah zone.png'),
  },
  {
    id: 'chaos_temple',
    name: 'Chaos Temple of the Lyc Order',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/CHAOS TEMPLE OF THE LYC ORDER.png'),
  },
  {
    id: 'glitch_cascade',
    name: 'The Glitch Cascade',
    category: 'void',
    action: { type: 'category', value: 'void' },
    image: require('../../assets/world/The glitch cascade.png'),
  },

  // ── NOETIC ──
  {
    id: 'noetic_sanctum',
    name: 'The Noetic Sanctum',
    category: 'noetic',
    action: { type: 'category', value: 'noetic' },
    image: require('../../assets/world/The Noetic Sanctum.png'),
  },

  // ── OUTER / SECULAR ──
  {
    id: 'neon_genesis_cove',
    name: 'Neon Genesis Cove',
    category: 'outer',
    action: { type: 'category', value: 'outer' },
    image: require('../../assets/world/neon genesis cove.png'),
  },
  {
    id: 'voyagers_edge',
    name: "The Voyager's Edge",
    category: 'outer',
    action: { type: 'category', value: 'outer' },
    image: require('../../assets/world/The Voyagers Edge.png'),
  },
  {
    id: 'celestial_foundry',
    name: 'The Celestial Foundry',
    category: 'outer',
    action: { type: 'category', value: 'outer' },
    image: require('../../assets/world/the celestial foundry.png'),
  },

  // ── INNER / CONTEMPLATIVE ──
  {
    id: 'antar_refuge',
    name: 'The Antar Refuge',
    category: 'inner',
    action: { type: 'category', value: 'inner' },
    image: require('../../assets/world/the antar reguge.png'),
  },
  {
    id: 'veile_atrium',
    name: 'The Veile Atrium',
    category: 'inner',
    action: { type: 'category', value: 'inner' },
    image: require('../../assets/world/The veile atrium.png'),
  },
  {
    id: 'portal_valley_forge',
    name: 'The Portal Valley Forge',
    category: 'inner',
    action: { type: 'category', value: 'inner' },
    image: require('../../assets/world/The Portal Valley Forge Lycheetah .png'),
  },

  // ── SPECIAL ──
  {
    id: 'zonk_zone',
    name: 'The Augmented Lycheetah AI Zonk Zone',
    category: 'special',
    action: { type: 'feature', value: 'zonkzone' },
    image: require('../../assets/world/The AUgmented Lycheetah AI ZONKZONE.png'),
  },
  {
    id: 'memory_rift',
    name: 'The Crystallized Memory Rift',
    category: 'special',
    action: { type: 'feature', value: 'timebraiding' },
    image: require('../../assets/world/the chrrytaized memorty rfit.png'),
  },
  {
    id: 'elve_village',
    name: 'The Dwarven Elve Village',
    category: 'special',
    action: { type: 'category', value: 'inner' },
    image: require('../../assets/world/the drawven elve  village.png'),
  },
];

export const ZONE_SECTIONS: { label: string; category: ZoneCategory; color: string }[] = [
  { label: '⟟ EDGE · LYCHEETAH', category: 'edge',    color: '#7B68EE' },
  { label: '◌ VOID',              category: 'void',    color: '#4A0080' },
  { label: 'ψ NOETIC',            category: 'noetic',  color: '#8B0000' },
  { label: '◦ OUTER',             category: 'outer',   color: '#2E8B57' },
  { label: '✦ INNER',             category: 'inner',   color: '#C8A96E' },
  { label: '⊚ SPECIAL',           category: 'special', color: '#FF6B35' },
];
