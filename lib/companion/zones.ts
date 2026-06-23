// ─── companion-zones.ts ──────────────────────────────────────────────────────
// All zone / skin data, world map, and unlock logic.
// Import everything from here into companion.tsx.
// DO NOT add React or component code to this file.

export type SkinId =
  'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'lycheetah' | 'chaos' | 'sovereign'
  | 'norse' | 'celtic' | 'egyptian' | 'akashic' | 'kabbala' | 'noetic' | 'lamague' | 'delphi' | 'sufi' | 'quantum'
  // ── New World Zones (v4.4.0) ──
  | 'auroral_chaos' | 'chaos_temple' | 'apollo_jungle' | 'celestial_sigil' | 'crystal_nexus'
  | 'mana_field' | 'neon_cove' | 'alabaster_chasm' | 'antarctic_refuge' | 'augmented_ai'
  | 'aurorian_pillar' | 'celestial_foundry' | 'chaos_filaments' | 'crystal_chaos' | 'crystal_memory'
  | 'crystal_soul' | 'glitch_cascade' | 'lyc_nexus' | 'pulse_sanctum'
  | 'pulse_zone' | 'noetic_sanctum' | 'obsidian_forge' | 'obsidian_forge2' | 'portal_valley'
  | 'veil_atrium' | 'voyagers_edge'
  // ── Battle Zones (unlock by wins) ──
  | 'iron_maw' | 'crucible_heart' | 'phantom_citadel' | 'bone_archive'
  | 'void_colosseum' | 'war_sanctum' | 'sovereign_forge'
  // ── Shop Zones (unlock by coins/veras) ──
  | 'amber_vault' | 'crystal_spire' | 'veras_garden'
  | 'golden_library' | 'deep_market' | 'lycheetah_spire'
  // ── Veil & Vein release zone ──
  | 'veilvein'
  // ── Landscape test zones ──
  | 'land_1' | 'land_2' | 'land_3' | 'land_4' | 'land_5'
  | 'land_6' | 'land_7' | 'land_8' | 'land_9' | 'land_10'
  | 'land_11' | 'land_12' | 'land_13' | 'land_14' | 'land_15';

// ─── Skins ────────────────────────────────────────────────────────────────────
export const SKINS: Record<SkinId, {
  id: SkinId; name: string; desc: string; glyph: string;
  color: string; dimColor: string; bgColor: string; skyColor: string; particleGlyph: string;
  glowColor: string; cardBg: string; starGlyphs: string[];
}> = {
  solform:  { id: 'solform',  name: 'SOLFORM',   desc: 'Origin',    glyph: '◉', color: '#C49A3C', dimColor: '#7A5E1A', bgColor: '#000000', skyColor: '#C49A3C', particleGlyph: '◦', glowColor: '#C49A3C44', cardBg: '#1A1400', starGlyphs: ['·','◦','·','⊹','·','◦'] },
  void:     { id: 'void',     name: 'VOID',      desc: 'Abyss',     glyph: '◈', color: '#9B6BFF', dimColor: '#5C3A99', bgColor: '#000000', skyColor: '#7B4BDD', particleGlyph: '◈', glowColor: '#9B6BFF44', cardBg: '#0D0022', starGlyphs: ['◈','·','◌','·','◈','·'] },
  aurora:   { id: 'aurora',   name: 'AURORA',    desc: 'Light',     glyph: '◦', color: '#4ECDC4', dimColor: '#2A7A75', bgColor: '#000000', skyColor: '#2EA8A0', particleGlyph: '·', glowColor: '#4ECDC444', cardBg: '#00130F', starGlyphs: ['·','◦','·','·','⊹','·'] },
  crimson:  { id: 'crimson',  name: 'CRIMSON',   desc: 'Fire',      glyph: '✦', color: '#FF6B6B', dimColor: '#993030', bgColor: '#000000', skyColor: '#CC3333', particleGlyph: '✦', glowColor: '#FF6B6B44', cardBg: '#1A0000', starGlyphs: ['✦','·','✦','·','·','✦'] },
  obsidian: { id: 'obsidian', name: 'OBSIDIAN',  desc: 'Sovereign', glyph: '⊕', color: '#C8A96E', dimColor: '#6B4F1A', bgColor: '#000000', skyColor: '#8B6914', particleGlyph: '⊕', glowColor: '#C8A96E55', cardBg: '#100C00', starGlyphs: ['⊕','·','⊛','·','⊕','◦'] },
  lycheetah:{ id: 'lycheetah', name: 'LYCHEETAH', desc: 'The Cat',   glyph: '✧', color: '#FF9F1C', dimColor: '#994400', bgColor: '#000000', skyColor: '#CC5500', particleGlyph: '✧', glowColor: '#FF9F1C55', cardBg: '#150800', starGlyphs: ['✧','◦','✧','·','⊹','✧'] },
  chaos:    { id: 'chaos',    name: 'CHAOS',     desc: 'Fracture',  glyph: '⚡', color: '#4A0080', dimColor: '#2A0050', bgColor: '#000000', skyColor: '#6600AA', particleGlyph: '⚡', glowColor: '#4A008055', cardBg: '#0A0014', starGlyphs: ['⚡','·','◈','·','⚡','◦'] },
  sovereign:{ id: 'sovereign', name: 'SOVEREIGN', desc: 'Earned',    glyph: '⊚', color: '#FFD700', dimColor: '#8B6914', bgColor: '#000000', skyColor: '#003366', particleGlyph: '⊚', glowColor: '#FFD70055', cardBg: '#000C18', starGlyphs: ['⊚','·','✦','·','⊚','◦'] },
  norse:    { id: 'norse',    name: 'YGGDRASIL',  desc: 'Nine Realms',   glyph: 'ᚠ', color: '#8AB4D4', dimColor: '#3A6A8A', bgColor: '#000000', skyColor: '#2A5A7A', particleGlyph: 'ᚠ', glowColor: '#8AB4D455', cardBg: '#000C18', starGlyphs: ['ᚠ','·','ᚢ','·','ᚦ','·'] },
  celtic:   { id: 'celtic',   name: 'TÍR NA NÓG', desc: 'Otherworld',    glyph: '☘', color: '#5AC878', dimColor: '#2A6B3A', bgColor: '#000000', skyColor: '#1A5A2A', particleGlyph: '◦', glowColor: '#5AC87855', cardBg: '#001008', starGlyphs: ['☘','·','◦','·','☘','·'] },
  egyptian: { id: 'egyptian', name: 'THE DUAT',    desc: 'Hall of Truth', glyph: '𓂀', color: '#D4A843', dimColor: '#7A5A10', bgColor: '#000000', skyColor: '#8B6400', particleGlyph: '𓂀', glowColor: '#D4A84355', cardBg: '#120C00', starGlyphs: ['𓂀','·','◉','·','𓂀','·'] },
  akashic:  { id: 'akashic',  name: 'THE FIELD',   desc: 'Akashic',       glyph: '∞', color: '#B490FF', dimColor: '#6040AA', bgColor: '#000000', skyColor: '#5030AA', particleGlyph: '∞', glowColor: '#B490FF55', cardBg: '#080018', starGlyphs: ['∞','·','◈','·','∞','◦'] },
  kabbala:  { id: 'kabbala',  name: 'EIN SOF',     desc: 'Tree of Life',  glyph: '✡', color: '#E8D070', dimColor: '#9A7A10', bgColor: '#000000', skyColor: '#7A6000', particleGlyph: '✡', glowColor: '#E8D07055', cardBg: '#100C00', starGlyphs: ['✡','·','⊹','·','✡','·'] },
  noetic:   { id: 'noetic',   name: 'THE PSI FIELD',desc: 'Consciousness', glyph: 'ψ', color: '#70CCFF', dimColor: '#2A7AAA', bgColor: '#000000', skyColor: '#1A6A9A', particleGlyph: 'ψ', glowColor: '#70CCFF55', cardBg: '#000C18', starGlyphs: ['ψ','·','◦','·','ψ','·'] },
  lamague:  { id: 'lamague',  name: 'SYMBOL SPACE', desc: 'Grammar Forge', glyph: '⟟', color: '#CC88FF', dimColor: '#6630AA', bgColor: '#000000', skyColor: '#5020AA', particleGlyph: '⟟', glowColor: '#CC88FF55', cardBg: '#0A0020', starGlyphs: ['⟟','·','◈','·','⟟','◦'] },
  delphi:   { id: 'delphi',   name: 'DELPHI',       desc: 'The Oracle',    glyph: '☽', color: '#FFB860', dimColor: '#AA6010', bgColor: '#000000', skyColor: '#884000', particleGlyph: '☽', glowColor: '#FFB86055', cardBg: '#150800', starGlyphs: ['☽','·','✦','·','☽','·'] },
  sufi:     { id: 'sufi',     name: 'THE TAVERN',   desc: 'Divine Wine',   glyph: '◌', color: '#FF7070', dimColor: '#AA2020', bgColor: '#000000', skyColor: '#880020', particleGlyph: '◌', glowColor: '#FF707055', cardBg: '#180006', starGlyphs: ['◌','·','✦','·','◌','◦'] },
  quantum:  { id: 'quantum',  name: 'THE FIELD',    desc: 'Probability',   glyph: 'Ψ', color: '#60D8FF', dimColor: '#1A8AAA', bgColor: '#000000', skyColor: '#007A9A', particleGlyph: 'Ψ', glowColor: '#60D8FF55', cardBg: '#000C14', starGlyphs: ['Ψ','·','◈','·','Ψ','·'] },
  auroral_chaos:     { id: 'auroral_chaos',     name: 'AURORAL CHAOS',      desc: 'Fractured spectrum',    glyph: '⚡', color: '#8855FF', dimColor: '#4422AA', bgColor: '#030008', skyColor: '#5522CC', particleGlyph: '◈', glowColor: '#8855FF55', cardBg: '#0A0018', starGlyphs: ['⚡','◈','·','⚡','◦','·'] },
  chaos_temple:      { id: 'chaos_temple',      name: 'CHAOS TEMPLE',       desc: 'The Lycheetah Order',   glyph: '⊗', color: '#6600CC', dimColor: '#330066', bgColor: '#04000A', skyColor: '#440088', particleGlyph: '⊗', glowColor: '#6600CC55', cardBg: '#080015', starGlyphs: ['⊗','·','◈','·','⊗','◦'] },
  apollo_jungle:     { id: 'apollo_jungle',     name: 'APOLLO JUNGLE',      desc: 'Sun in the canopy',     glyph: '☀', color: '#88CC44', dimColor: '#448800', bgColor: '#010800', skyColor: '#336600', particleGlyph: '◦', glowColor: '#88CC4455', cardBg: '#020C00', starGlyphs: ['☀','·','◦','·','☀','⊹'] },
  celestial_sigil:   { id: 'celestial_sigil',   name: 'CELESTIAL SIGIL',    desc: 'Living script',         glyph: '✦', color: '#88AAFF', dimColor: '#3355AA', bgColor: '#000510', skyColor: '#2244AA', particleGlyph: '✦', glowColor: '#88AAFF55', cardBg: '#000818', starGlyphs: ['✦','·','◦','·','✦','·'] },
  crystal_nexus:     { id: 'crystal_nexus',     name: 'CRYSTAL NEXUS',      desc: 'Research frontier',     glyph: '◆', color: '#44DDCC', dimColor: '#1A8875', bgColor: '#000C0A', skyColor: '#1A7A6A', particleGlyph: '◆', glowColor: '#44DDCC55', cardBg: '#001210', starGlyphs: ['◆','·','◦','·','◆','·'] },
  mana_field:        { id: 'mana_field',        name: 'MANA FIELD',         desc: 'Flowing deep blue',     glyph: '∿', color: '#4488FF', dimColor: '#1A44AA', bgColor: '#00040C', skyColor: '#1133AA', particleGlyph: '∿', glowColor: '#4488FF55', cardBg: '#000614', starGlyphs: ['∿','·','◈','·','∿','◦'] },
  neon_cove:         { id: 'neon_cove',         name: 'NEON COVE',          desc: 'Bioluminescent deep',   glyph: '◉', color: '#FF44AA', dimColor: '#AA1155', bgColor: '#0A0005', skyColor: '#880033', particleGlyph: '◉', glowColor: '#FF44AA55', cardBg: '#150008', starGlyphs: ['◉','·','◦','·','◉','·'] },
  alabaster_chasm:   { id: 'alabaster_chasm',   name: 'ALABASTER CHASM',    desc: 'Ancient white stone',   glyph: '⊕', color: '#E8E0CC', dimColor: '#998870', bgColor: '#080806', skyColor: '#776655', particleGlyph: '⊕', glowColor: '#E8E0CC44', cardBg: '#100E08', starGlyphs: ['⊕','·','⊹','·','⊕','◦'] },
  antarctic_refuge:  { id: 'antarctic_refuge',  name: 'THE REFUGE',         desc: 'Frozen endurance',      glyph: '❄', color: '#88CCEE', dimColor: '#3377AA', bgColor: '#00080C', skyColor: '#226688', particleGlyph: '❄', glowColor: '#88CCEE55', cardBg: '#000C14', starGlyphs: ['❄','·','◦','·','❄','·'] },
  augmented_ai:      { id: 'augmented_ai',      name: 'AI ZONKZONE',        desc: 'Digital sentience',     glyph: '⟁', color: '#44FF88', dimColor: '#1A884A', bgColor: '#000C04', skyColor: '#117733', particleGlyph: '⟁', glowColor: '#44FF8855', cardBg: '#001408', starGlyphs: ['⟁','·','◈','·','⟁','◦'] },
  aurorian_pillar:   { id: 'aurorian_pillar',   name: 'AURORIAN PILLAR',    desc: 'Aurora made solid',     glyph: '◌', color: '#44EEC8', dimColor: '#1A8870', bgColor: '#000C08', skyColor: '#1A7760', particleGlyph: '◌', glowColor: '#44EEC855', cardBg: '#001210', starGlyphs: ['◌','·','◦','·','◌','·'] },
  celestial_foundry: { id: 'celestial_foundry', name: 'CELESTIAL FOUNDRY',  desc: 'Star-forged',           glyph: '⚒', color: '#FFAA22', dimColor: '#AA6600', bgColor: '#080400', skyColor: '#885500', particleGlyph: '⚒', glowColor: '#FFAA2255', cardBg: '#100800', starGlyphs: ['⚒','·','✦','·','⚒','◦'] },
  chaos_filaments:   { id: 'chaos_filaments',   name: 'CHAOS FILAMENTS',    desc: 'Threadwork undone',     glyph: '∞', color: '#FF44CC', dimColor: '#AA1177', bgColor: '#0A0005', skyColor: '#880055', particleGlyph: '∞', glowColor: '#FF44CC55', cardBg: '#160008', starGlyphs: ['∞','·','◈','·','∞','◦'] },
  crystal_chaos:     { id: 'crystal_chaos',     name: 'CRYSTAL CHAOS',      desc: 'Beautiful destruction', glyph: '◈', color: '#CC44FF', dimColor: '#7711AA', bgColor: '#06000C', skyColor: '#550099', particleGlyph: '◈', glowColor: '#CC44FF55', cardBg: '#0C0018', starGlyphs: ['◈','·','◦','·','◈','·'] },
  crystal_memory:    { id: 'crystal_memory',    name: 'CRYSTAL MEMORY',     desc: 'Fragmented archive',    glyph: '◊', color: '#8866FF', dimColor: '#3322AA', bgColor: '#030008', skyColor: '#3311AA', particleGlyph: '◊', glowColor: '#8866FF55', cardBg: '#060014', starGlyphs: ['◊','·','◈','·','◊','◦'] },
  crystal_soul:      { id: 'crystal_soul',      name: 'SOUL TEMPLE',        desc: 'Pure warm light',       glyph: '◎', color: '#FFEEAA', dimColor: '#AA8833', bgColor: '#080600', skyColor: '#886622', particleGlyph: '◎', glowColor: '#FFEEAA44', cardBg: '#100C00', starGlyphs: ['◎','·','⊹','·','◎','◦'] },
  glitch_cascade:    { id: 'glitch_cascade',    name: 'GLITCH CASCADE',     desc: 'Error-being',           glyph: '⚠', color: '#FF4466', dimColor: '#AA1133', bgColor: '#0C0002', skyColor: '#880022', particleGlyph: '⚠', glowColor: '#FF446655', cardBg: '#180004', starGlyphs: ['⚠','·','✦','·','⚠','◦'] },
  lyc_nexus:         { id: 'lyc_nexus',         name: 'THE NEXUS',          desc: 'Hub of all webs',       glyph: '✧', color: '#FF8822', dimColor: '#AA4400', bgColor: '#060200', skyColor: '#883300', particleGlyph: '✧', glowColor: '#FF882255', cardBg: '#0E0400', starGlyphs: ['✧','·','◦','·','✧','⊹'] },
  pulse_sanctum:     { id: 'pulse_sanctum',     name: 'PULSE SANCTUM',      desc: 'Concentric resonance',  glyph: '◎', color: '#AA44FF', dimColor: '#6611AA', bgColor: '#050010', skyColor: '#440099', particleGlyph: '◎', glowColor: '#AA44FF55', cardBg: '#08001A', starGlyphs: ['◎','·','◈','·','◎','◦'] },
  pulse_zone:        { id: 'pulse_zone',        name: 'PULSE ZONE',         desc: 'Kinetic frequency',     glyph: '⊹', color: '#44AAFF', dimColor: '#1155AA', bgColor: '#00040C', skyColor: '#1144AA', particleGlyph: '⊹', glowColor: '#44AAFF55', cardBg: '#000814', starGlyphs: ['⊹','·','◦','·','⊹','·'] },
  noetic_sanctum:    { id: 'noetic_sanctum',    name: 'NOETIC SANCTUM',     desc: 'Consciousness field',   glyph: 'ψ', color: '#44CCFF', dimColor: '#1188AA', bgColor: '#00080E', skyColor: '#116688', particleGlyph: 'ψ', glowColor: '#44CCFF55', cardBg: '#000C14', starGlyphs: ['ψ','·','◈','·','ψ','·'] },
  obsidian_forge:    { id: 'obsidian_forge',    name: 'OBSIDIAN FORGE',     desc: 'Ancient fire-titan',    glyph: '⊛', color: '#CC2222', dimColor: '#880000', bgColor: '#0C0000', skyColor: '#660000', particleGlyph: '⊛', glowColor: '#CC222255', cardBg: '#180000', starGlyphs: ['⊛','·','✦','·','⊛','◦'] },
  obsidian_forge2:   { id: 'obsidian_forge2',   name: 'VOID FORGE II',      desc: 'Shadow alchemy',        glyph: '⊕', color: '#AA1111', dimColor: '#660000', bgColor: '#0A0000', skyColor: '#440000', particleGlyph: '⊕', glowColor: '#AA111155', cardBg: '#140000', starGlyphs: ['⊕','·','◈','·','⊕','·'] },
  portal_valley:     { id: 'portal_valley',     name: 'PORTAL VALLEY',      desc: 'Between-places',        glyph: '◉', color: '#22FF88', dimColor: '#008844', bgColor: '#000C04', skyColor: '#006633', particleGlyph: '◉', glowColor: '#22FF8855', cardBg: '#001208', starGlyphs: ['◉','·','◦','·','◉','⊹'] },
  veil_atrium:       { id: 'veil_atrium',       name: 'VEIL ATRIUM',        desc: 'Between states',        glyph: '◌', color: '#AABBCC', dimColor: '#556677', bgColor: '#050607', skyColor: '#445566', particleGlyph: '◌', glowColor: '#AABBCC44', cardBg: '#080A0C', starGlyphs: ['◌','·','◦','·','◌','·'] },
  voyagers_edge:     { id: 'voyagers_edge',     name: "VOYAGER'S EDGE",     desc: 'Deep space frontier',   glyph: '⊚', color: '#5544CC', dimColor: '#2211AA', bgColor: '#02000A', skyColor: '#221188', particleGlyph: '⊚', glowColor: '#5544CC55', cardBg: '#040014', starGlyphs: ['⊚','·','✦','·','⊚','◦'] },
  iron_maw:          { id: 'iron_maw',          name: 'THE IRON MAW',        desc: 'Battle-worn dark forge', glyph: '⚔', color: '#BB4422', dimColor: '#661100', bgColor: '#0C0200', skyColor: '#771100', particleGlyph: '⚔', glowColor: '#BB442255', cardBg: '#160400', starGlyphs: ['⚔','·','✦','·','⚔','◦'] },
  crucible_heart:    { id: 'crucible_heart',    name: 'CRUCIBLE HEART',      desc: 'Where all fire originates', glyph: '△', color: '#FF6600', dimColor: '#AA3300', bgColor: '#0C0400', skyColor: '#882200', particleGlyph: '△', glowColor: '#FF660055', cardBg: '#160800', starGlyphs: ['△','·','✦','·','△','·'] },
  phantom_citadel:   { id: 'phantom_citadel',   name: 'PHANTOM CITADEL',     desc: 'A fortress that refuses to fall', glyph: '◈', color: '#9966CC', dimColor: '#4422AA', bgColor: '#050010', skyColor: '#3311AA', particleGlyph: '◈', glowColor: '#9966CC55', cardBg: '#0A001A', starGlyphs: ['◈','·','◦','·','◈','·'] },
  bone_archive:      { id: 'bone_archive',      name: 'BONE ARCHIVE',        desc: 'A battlefield that became a library', glyph: '◌', color: '#CCBBAA', dimColor: '#776655', bgColor: '#080706', skyColor: '#665544', particleGlyph: '◌', glowColor: '#CCBBAA44', cardBg: '#100E0A', starGlyphs: ['◌','·','⊹','·','◌','◦'] },
  void_colosseum:    { id: 'void_colosseum',    name: 'VOID COLOSSEUM',      desc: 'Arena with no ground', glyph: '◎', color: '#4444BB', dimColor: '#222266', bgColor: '#020208', skyColor: '#221177', particleGlyph: '◎', glowColor: '#4444BB55', cardBg: '#040016', starGlyphs: ['◎','·','◈','·','◎','·'] },
  war_sanctum:       { id: 'war_sanctum',       name: 'WAR SANCTUM',         desc: 'Sacred space of conflict', glyph: '◉', color: '#CC2244', dimColor: '#881122', bgColor: '#0C0002', skyColor: '#770011', particleGlyph: '◉', glowColor: '#CC224455', cardBg: '#180004', starGlyphs: ['◉','·','✦','·','◉','◦'] },
  sovereign_forge:   { id: 'sovereign_forge',   name: 'SOVEREIGN FORGE',     desc: 'Where sovereignty is made', glyph: '⊕', color: '#DDAA00', dimColor: '#997700', bgColor: '#080600', skyColor: '#775500', particleGlyph: '⊕', glowColor: '#DDAA0055', cardBg: '#100C00', starGlyphs: ['⊕','·','⊛','·','⊕','◦'] },
  amber_vault:       { id: 'amber_vault',       name: 'AMBER VAULT',         desc: 'Knowledge preserved in resin-gold', glyph: '⟟', color: '#DDAA44', dimColor: '#997722', bgColor: '#080600', skyColor: '#775500', particleGlyph: '⟟', glowColor: '#DDAA4455', cardBg: '#100C00', starGlyphs: ['⟟','·','⊹','·','⟟','◦'] },
  crystal_spire:     { id: 'crystal_spire',     name: 'THE CRYSTAL SPIRE',   desc: 'A tower of pure transparent form', glyph: '✦', color: '#88DDFF', dimColor: '#2288BB', bgColor: '#00080E', skyColor: '#116699', particleGlyph: '✦', glowColor: '#88DDFF55', cardBg: '#000C14', starGlyphs: ['✦','·','◦','·','✦','·'] },
  veras_garden:      { id: 'veras_garden',      name: 'VERAS GARDEN',        desc: 'Where knowledge dust grows into idea', glyph: '✧', color: '#66DDAA', dimColor: '#228866', bgColor: '#000A04', skyColor: '#115533', particleGlyph: '✧', glowColor: '#66DDAA55', cardBg: '#001008', starGlyphs: ['✧','·','◦','·','✧','⊹'] },
  golden_library:    { id: 'golden_library',    name: 'GOLDEN LIBRARY',      desc: 'The most ornate archive of thought', glyph: '⊛', color: '#FFD700', dimColor: '#AA8800', bgColor: '#080600', skyColor: '#776600', particleGlyph: '⊛', glowColor: '#FFD70055', cardBg: '#100C00', starGlyphs: ['⊛','·','✦','·','⊛','·'] },
  deep_market:       { id: 'deep_market',       name: 'THE DEEP MARKET',     desc: 'Underground bazaar of rare things', glyph: '◦', color: '#AA7744', dimColor: '#664422', bgColor: '#060400', skyColor: '#553311', particleGlyph: '◦', glowColor: '#AA774455', cardBg: '#0E0800', starGlyphs: ['◦','·','⊹','·','◦','·'] },
  lycheetah_spire:   { id: 'lycheetah_spire',   name: 'LYCHEETAH SPIRE',     desc: 'The apex of the entire ecosystem', glyph: '⊜', color: '#FF6699', dimColor: '#AA2255', bgColor: '#0C0005', skyColor: '#881133', particleGlyph: '⊜', glowColor: '#FF669955', cardBg: '#160008', starGlyphs: ['⊜','·','✧','·','⊜','◦'] },
  veilvein:          { id: 'veilvein',          name: 'THE INTERTWINING',    desc: 'Where Veil meets Vein', glyph: '🜍', color: '#4ECDC4', dimColor: '#8B0000', bgColor: '#05000A', skyColor: '#2A1040', particleGlyph: '🜍', glowColor: '#4ECDC455', cardBg: '#0A0512', starGlyphs: ['🜍','·','✶','·','◈','·'] },
  land_1:  { id:'land_1',  name:'THE WANDERING PLAIN', desc:'Wide open sky, endless terrain', glyph:'◫', color:'#C4A86C', dimColor:'#7A6030', bgColor:'#040200', skyColor:'#8A6030', particleGlyph:'·', glowColor:'#C4A86C44', cardBg:'#0A0600', starGlyphs:['·','◫','·','◦','·','◫'] },
  land_2:  { id:'land_2',  name:'THE AMBER RIDGE',     desc:'Colour at the edge of distance', glyph:'◫', color:'#C49060', dimColor:'#7A5030', bgColor:'#060200', skyColor:'#8A5020', particleGlyph:'·', glowColor:'#C4906044', cardBg:'#0E0500', starGlyphs:['◫','·','⊹','·','◫','·'] },
  land_3:  { id:'land_3',  name:'THE PALE CROSSING',   desc:'The threshold looks like ordinary ground', glyph:'◫', color:'#A8B4C4', dimColor:'#5A6A7A', bgColor:'#020408', skyColor:'#406080', particleGlyph:'·', glowColor:'#A8B4C444', cardBg:'#040810', starGlyphs:['·','◫','◦','·','◫','·'] },
  land_4:  { id:'land_4',  name:'THE DUSK MARGIN',     desc:'The last light is the truest light', glyph:'◫', color:'#C48C6C', dimColor:'#7A4A30', bgColor:'#060200', skyColor:'#8A4020', particleGlyph:'·', glowColor:'#C48C6C44', cardBg:'#0C0500', starGlyphs:['◫','·','◦','◫','·','⊹'] },
  land_5:  { id:'land_5',  name:'THE OPEN FIELD',      desc:'Nothing between you and the horizon', glyph:'◫', color:'#88B488', dimColor:'#406040', bgColor:'#000402', skyColor:'#305030', particleGlyph:'·', glowColor:'#88B48844', cardBg:'#000A00', starGlyphs:['·','◫','·','⊹','◫','·'] },
  land_6:  { id:'land_6',  name:'THE IRON HEATH',      desc:'Ground that holds memory of pressure', glyph:'◫', color:'#A89088', dimColor:'#605050', bgColor:'#040202', skyColor:'#504040', particleGlyph:'·', glowColor:'#A8908844', cardBg:'#080400', starGlyphs:['◫','·','◦','·','◫','·'] },
  land_7:  { id:'land_7',  name:'THE GREY DESCENT',    desc:'Falling in still terrain', glyph:'◫', color:'#9AA4AC', dimColor:'#505A60', bgColor:'#020406', skyColor:'#405060', particleGlyph:'·', glowColor:'#9AA4AC44', cardBg:'#040808', starGlyphs:['·','◫','·','◦','◫','·'] },
  land_8:  { id:'land_8',  name:'THE BURNING WASTE',   desc:'What fire leaves is honest', glyph:'◫', color:'#C47060', dimColor:'#7A3020', bgColor:'#060100', skyColor:'#8A2010', particleGlyph:'·', glowColor:'#C4706044', cardBg:'#0C0200', starGlyphs:['◫','·','·','◫','·','⊹'] },
  land_9:  { id:'land_9',  name:'THE COLD HORIZON',    desc:'Distance is its own intelligence', glyph:'◫', color:'#88C4D4', dimColor:'#306070', bgColor:'#000608', skyColor:'#205060', particleGlyph:'·', glowColor:'#88C4D444', cardBg:'#000C12', starGlyphs:['·','◫','◦','·','◫','·'] },
  land_10: { id:'land_10', name:'THE STILL VALE',      desc:'Silence that knows what you came for', glyph:'◫', color:'#80C498', dimColor:'#306040', bgColor:'#000602', skyColor:'#205030', particleGlyph:'·', glowColor:'#80C49844', cardBg:'#000C04', starGlyphs:['◫','·','⊹','◫','·','◦'] },
  land_11: { id:'land_11', name:'THE FORGOTTEN ROAD',  desc:'The paths we did not take still exist', glyph:'◫', color:'#A490C0', dimColor:'#5A4870', bgColor:'#040208', skyColor:'#402060', particleGlyph:'·', glowColor:'#A490C044', cardBg:'#080410', starGlyphs:['·','◫','·','⊹','◫','·'] },
  land_12: { id:'land_12', name:'THE EMBER PLAIN',     desc:'Not quite fire, not quite stone', glyph:'◫', color:'#C4946C', dimColor:'#7A5030', bgColor:'#060200', skyColor:'#8A4020', particleGlyph:'·', glowColor:'#C4946C44', cardBg:'#0C0400', starGlyphs:['◫','·','◦','◫','⊹','·'] },
  land_13: { id:'land_13', name:'THE DEEP MARGIN',     desc:'At the edge, things get quiet', glyph:'◫', color:'#7C98B4', dimColor:'#3A5068', bgColor:'#020406', skyColor:'#304050', particleGlyph:'·', glowColor:'#7C98B444', cardBg:'#04080E', starGlyphs:['·','◫','·','◦','·','◫'] },
  land_14: { id:'land_14', name:'THE LAST CROSSING',   desc:'Every crossing looks like the last one', glyph:'◫', color:'#C4B46C', dimColor:'#7A6A30', bgColor:'#060400', skyColor:'#8A6020', particleGlyph:'·', glowColor:'#C4B46C44', cardBg:'#0C0A00', starGlyphs:['◫','·','⊛','·','◫','·'] },
  land_15: { id:'land_15', name:'THE ENDLESS EDGE',    desc:'The map runs out. The territory does not.', glyph:'◫', color:'#7CA4C0', dimColor:'#3A5870', bgColor:'#020406', skyColor:'#305060', particleGlyph:'·', glowColor:'#7CA4C044', cardBg:'#040A10', starGlyphs:['·','◫','◦','·','◫','⊹'] },
};

export const SKIN_IDS: SkinId[] = [
  'solform', 'void', 'aurora', 'crimson',
  'obsidian', 'lycheetah', 'chaos', 'sovereign',
  'norse', 'celtic', 'egyptian', 'akashic', 'kabbala', 'noetic', 'lamague', 'delphi', 'sufi', 'quantum',
  'auroral_chaos', 'chaos_temple', 'apollo_jungle', 'celestial_sigil', 'crystal_nexus',
  'mana_field', 'neon_cove', 'alabaster_chasm', 'antarctic_refuge', 'augmented_ai',
  'aurorian_pillar', 'celestial_foundry', 'chaos_filaments', 'crystal_chaos', 'crystal_memory',
  'crystal_soul', 'glitch_cascade', 'lyc_nexus', 'pulse_sanctum',
  'pulse_zone', 'noetic_sanctum', 'obsidian_forge', 'obsidian_forge2', 'portal_valley',
  'veil_atrium', 'voyagers_edge',
  'iron_maw', 'crucible_heart', 'phantom_citadel', 'bone_archive',
  'void_colosseum', 'war_sanctum', 'sovereign_forge',
  'amber_vault', 'crystal_spire', 'veras_garden',
  'golden_library', 'deep_market', 'lycheetah_spire',
  'veilvein',
  'land_1','land_2','land_3','land_4','land_5',
  'land_6','land_7','land_8','land_9','land_10',
  'land_11','land_12','land_13','land_14','land_15',
];
export const SKIN_ORDER: SkinId[] = SKIN_IDS;

export const SKIN_RARITY: Record<SkinId, { tier: string; color: string }> = {
  solform:   { tier: 'ORIGIN',    color: '#888899' },
  void:      { tier: 'ORIGIN',    color: '#888899' },
  aurora:    { tier: 'ORIGIN',    color: '#888899' },
  crimson:   { tier: 'ORIGIN',    color: '#888899' },
  lycheetah: { tier: 'ORIGIN',    color: '#888899' },
  sovereign: { tier: 'ORIGIN',    color: '#888899' },
  norse:     { tier: 'ORIGIN',    color: '#888899' },
  delphi:    { tier: 'ORIGIN',    color: '#888899' },
  obsidian:  { tier: 'ARCANE',    color: '#7BA7C7' },
  chaos:     { tier: 'ARCANE',    color: '#9B6BFF' },
  celtic:    { tier: 'MYTHIC',    color: '#FFD700' },
  egyptian:  { tier: 'MYTHIC',    color: '#FFD700' },
  akashic:   { tier: 'LEGENDARY', color: '#B490FF' },
  kabbala:   { tier: 'LEGENDARY', color: '#B490FF' },
  noetic:    { tier: 'LEGENDARY', color: '#B490FF' },
  lamague:   { tier: 'LEGENDARY', color: '#CC88FF' },
  sufi:      { tier: 'LEGENDARY', color: '#B490FF' },
  quantum:        { tier: 'LEGENDARY', color: '#60D8FF' },
  auroral_chaos:     { tier: 'ORIGIN',    color: '#888899' },
  chaos_temple:      { tier: 'SPECTRAL',  color: '#6600CC' },
  apollo_jungle:     { tier: 'MYTHIC',    color: '#88CC44' },
  celestial_sigil:   { tier: 'LEGENDARY', color: '#88AAFF' },
  crystal_nexus:     { tier: 'ARCANE',    color: '#44DDCC' },
  mana_field:        { tier: 'ARCANE',    color: '#4488FF' },
  neon_cove:         { tier: 'MYTHIC',    color: '#FF44AA' },
  alabaster_chasm:   { tier: 'LEGENDARY', color: '#E8E0CC' },
  antarctic_refuge:  { tier: 'ARCANE',    color: '#88CCEE' },
  augmented_ai:      { tier: 'SPECTRAL',  color: '#44FF88' },
  aurorian_pillar:   { tier: 'MYTHIC',    color: '#44EEC8' },
  celestial_foundry: { tier: 'LEGENDARY', color: '#FFAA22' },
  chaos_filaments:   { tier: 'SPECTRAL',  color: '#FF44CC' },
  crystal_chaos:     { tier: 'LEGENDARY', color: '#CC44FF' },
  crystal_memory:    { tier: 'MYTHIC',    color: '#8866FF' },
  crystal_soul:      { tier: 'LEGENDARY', color: '#FFEEAA' },
  glitch_cascade:    { tier: 'SPECTRAL',  color: '#FF4466' },
  lyc_nexus:         { tier: 'SPECTRAL',  color: '#FF8822' },
  pulse_sanctum:     { tier: 'LEGENDARY', color: '#AA44FF' },
  pulse_zone:        { tier: 'MYTHIC',    color: '#44AAFF' },
  noetic_sanctum:    { tier: 'LEGENDARY', color: '#44CCFF' },
  obsidian_forge:    { tier: 'SPECTRAL',  color: '#CC2222' },
  obsidian_forge2:   { tier: 'LEGENDARY', color: '#AA1111' },
  portal_valley:     { tier: 'MYTHIC',    color: '#22FF88' },
  veil_atrium:       { tier: 'ARCANE',    color: '#AABBCC' },
  voyagers_edge:     { tier: 'LEGENDARY', color: '#5544CC' },
  iron_maw:          { tier: 'BATTLE',    color: '#BB4422' },
  crucible_heart:    { tier: 'BATTLE',    color: '#FF6600' },
  phantom_citadel:   { tier: 'BATTLE',    color: '#9966CC' },
  bone_archive:      { tier: 'BATTLE',    color: '#CCBBAA' },
  void_colosseum:    { tier: 'BATTLE',    color: '#4444BB' },
  war_sanctum:       { tier: 'BATTLE',    color: '#CC2244' },
  sovereign_forge:   { tier: 'BATTLE',    color: '#DDAA00' },
  amber_vault:       { tier: 'SHOP',      color: '#DDAA44' },
  crystal_spire:     { tier: 'SHOP',      color: '#88DDFF' },
  veras_garden:      { tier: 'SHOP',      color: '#66DDAA' },
  golden_library:    { tier: 'SHOP',      color: '#FFD700' },
  deep_market:       { tier: 'SHOP',      color: '#AA7744' },
  lycheetah_spire:   { tier: 'SHOP',      color: '#FF6699' },
  veilvein:          { tier: 'SECRET' as any, color: '#4ECDC4' },
  land_1:  { tier: 'ORIGIN', color: '#C4A86C' },
  land_2:  { tier: 'ORIGIN', color: '#C49060' },
  land_3:  { tier: 'ORIGIN', color: '#A8B4C4' },
  land_4:  { tier: 'ORIGIN', color: '#C48C6C' },
  land_5:  { tier: 'ORIGIN', color: '#88B488' },
  land_6:  { tier: 'ARCANE', color: '#A89088' },
  land_7:  { tier: 'ARCANE', color: '#9AA4AC' },
  land_8:  { tier: 'ARCANE', color: '#C47060' },
  land_9:  { tier: 'ARCANE', color: '#88C4D4' },
  land_10: { tier: 'ARCANE', color: '#80C498' },
  land_11: { tier: 'ARCANE', color: '#A490C0' },
  land_12: { tier: 'ARCANE', color: '#C4946C' },
  land_13: { tier: 'ARCANE', color: '#7C98B4' },
  land_14: { tier: 'ARCANE', color: '#C4B46C' },
  land_15: { tier: 'ARCANE', color: '#7CA4C0' },
};

export const RARITY_ORDER = ['ORIGIN','ARCANE','MYTHIC','LEGENDARY','SPECTRAL','BATTLE','SHOP'] as const;
export type RarityTier = typeof RARITY_ORDER[number];
export const RARITY_COLORS: Record<RarityTier, string> = {
  ORIGIN: '#888899', ARCANE: '#7BA7C7', MYTHIC: '#FFD700', LEGENDARY: '#B490FF', SPECTRAL: '#8855FF',
  BATTLE: '#CC4444', SHOP: '#C49A3C',
};
export const SKIN_GRID_HIDDEN = new Set<SkinId>(['noetic', 'kabbala', 'pulse_sanctum']);
export const RARITY_GROUPS: { tier: RarityTier; ids: SkinId[] }[] = RARITY_ORDER.map(tier => ({
  tier,
  ids: SKIN_IDS.filter(s => SKIN_RARITY[s].tier === tier && !SKIN_GRID_HIDDEN.has(s)),
})).filter(g => g.ids.length > 0);

// ─── Scene background images ──────────────────────────────────────────────────
export const SCENE_IMAGES: Partial<Record<SkinId, any[]>> = {
  solform:          [require('../../assets/scenes/sovereign.png'), require('../../assets/scenes/sovereign2.png'), require('../../assets/scenes/aurora.png')],
  void:             [require('../../assets/scenes/void.png'), require('../../assets/scenes/void3.png'), require('../../assets/scenes/void4.png'), require('../../assets/scenes/void5.png')],
  aurora:           [require('../../assets/scenes/aurora.png'), require('../../assets/scenes/aurora3.png'), require('../../assets/scenes/aurora4.png'), require('../../assets/scenes/aurora5.png')],
  crimson:          [require('../../assets/scenes/crimson.png'), require('../../assets/scenes/crimson2.png'), require('../../assets/scenes/crimson3.png'), require('../../assets/scenes/crimson4.png')],
  obsidian:         [require('../../assets/scenes/obsidian.png'), require('../../assets/scenes/obsidian2.png'), require('../../assets/scenes/obsidian4.png')],
  lycheetah:        [require('../../assets/scenes/lycheetah.png'), require('../../assets/scenes/lycheetah2.png'), require('../../assets/scenes/lycheetah7.png')],
  chaos:            [require('../../assets/scenes/chaos.png'), require('../../assets/scenes/chaos2.png'), require('../../assets/scenes/chaos3.png'), require('../../assets/scenes/chaos5.png')],
  sovereign:        [require('../../assets/scenes/sovereign.png'), require('../../assets/scenes/sovereign2.png'), require('../../assets/scenes/aurora5.png')],
  norse:            [require('../../assets/scenes/norse.jpg'), require('../../assets/scenes/norse2.jpg'), require('../../assets/scenes/norse3.jpg')],
  celtic:           [require('../../assets/scenes/celtic.jpg'), require('../../assets/scenes/celtic2.jpg'), require('../../assets/scenes/celtic3.jpg'), require('../../assets/scenes/celtic4.png')],
  egyptian:         [require('../../assets/scenes/egyptian.jpg')],
  akashic:          [require('../../assets/scenes/akashic.png'), require('../../assets/scenes/akashic2.png'), require('../../assets/scenes/akashic3.png')],
  kabbala:          [require('../../assets/scenes/celestial_sigil.png'), require('../../assets/scenes/void5.png'), require('../../assets/scenes/aurora5.png')],
  noetic:           [require('../../assets/scenes/noetic.jpg'), require('../../assets/scenes/noetic_sanctum.png')],
  lamague:          [require('../../assets/scenes/celestial_sigil.png'), require('../../assets/scenes/glitch_cascade.png'), require('../../assets/scenes/crystal_soul.png')],
  delphi:           [require('../../assets/scenes/delphi.png')],
  sufi:             [require('../../assets/scenes/sufi.png')],
  quantum:          [require('../../assets/scenes/crystal_nexus.png'), require('../../assets/scenes/crystal_chaos.png'), require('../../assets/scenes/crystal_memory.png')],
  auroral_chaos:    [require('../../assets/scenes/aurora3.png')],
  chaos_temple:     [require('../../assets/scenes/chaos_temple.png')],
  apollo_jungle:    [require('../../assets/scenes/apollo_jungle.png')],
  celestial_sigil:  [require('../../assets/scenes/celestial_sigil.png')],
  crystal_nexus:    [require('../../assets/scenes/crystal_nexus.png')],
  mana_field:       [require('../../assets/scenes/mana_field.png')],
  neon_cove:        [require('../../assets/scenes/neon_cove.png')],
  alabaster_chasm:  [require('../../assets/scenes/alabaster_chasm.png')],
  antarctic_refuge: [require('../../assets/scenes/antarctic_refuge.png')],
  augmented_ai:     [require('../../assets/scenes/augmented_ai.png')],
  aurorian_pillar:  [require('../../assets/scenes/aurorian_pillar.png')],
  celestial_foundry:[require('../../assets/scenes/celestial_foundry.png')],
  chaos_filaments:  [require('../../assets/scenes/chaos5.png')],
  crystal_chaos:    [require('../../assets/scenes/crystal_chaos.png')],
  crystal_memory:   [require('../../assets/scenes/crystal_memory.png')],
  crystal_soul:     [require('../../assets/scenes/crystal_soul.png')],
  glitch_cascade:   [require('../../assets/scenes/glitch_cascade.png')],
  lyc_nexus:        [require('../../assets/scenes/lycheetah7.png')],
  pulse_sanctum:    [require('../../assets/scenes/pulse_zone.png')],
  pulse_zone:       [require('../../assets/scenes/pulse_zone.png')],
  noetic_sanctum:   [require('../../assets/scenes/noetic_sanctum.png')],
  obsidian_forge:   [require('../../assets/scenes/obsidian4.png')],
  obsidian_forge2:  [require('../../assets/scenes/obsidian_forge2.png')],
  portal_valley:    [require('../../assets/scenes/veil_atrium.png')],
  veil_atrium:      [require('../../assets/scenes/veil_atrium.png')],
  voyagers_edge:    [require('../../assets/scenes/aurora5.png')],
  iron_maw:         [require('../../assets/scenes/obsidian4.png')],
  crucible_heart:   [require('../../assets/scenes/chaos5.png')],
  phantom_citadel:  [require('../../assets/scenes/void5.png')],
  bone_archive:     [require('../../assets/scenes/crystal_memory.png')],
  void_colosseum:   [require('../../assets/scenes/void3.png')],
  war_sanctum:      [require('../../assets/scenes/crimson4.png')],
  sovereign_forge:  [require('../../assets/scenes/celestial_foundry.png')],
  amber_vault:      [require('../../assets/scenes/aurora3.png')],
  crystal_spire:    [require('../../assets/scenes/crystal_nexus.png')],
  veras_garden:     [require('../../assets/scenes/apollo_jungle.png')],
  golden_library:   [require('../../assets/scenes/celestial_sigil.png')],
  deep_market:      [require('../../assets/scenes/alabaster_chasm.png')],
  lycheetah_spire:  [require('../../assets/scenes/lycheetah7.png')],
  veilvein:         [require('../../assets/scenes/veilvein_sanctum.png')],
  land_1:  [require('../../assets/scenes/landscape_1.png')],
  land_2:  [require('../../assets/scenes/landscape_2.png')],
  land_3:  [require('../../assets/scenes/landscape_3.png')],
  land_4:  [require('../../assets/scenes/landscape_4.png')],
  land_5:  [require('../../assets/scenes/landscape_5.png')],
  land_6:  [require('../../assets/scenes/landscape_6.png')],
  land_7:  [require('../../assets/scenes/landscape_7.png')],
  land_8:  [require('../../assets/scenes/landscape_8.png')],
  land_9:  [require('../../assets/scenes/landscape_9.png')],
  land_10: [require('../../assets/scenes/landscape_10.png')],
  land_11: [require('../../assets/scenes/landscape_11.png')],
  land_12: [require('../../assets/scenes/landscape_12.png')],
  land_13: [require('../../assets/scenes/landscape_13.png')],
  land_14: [require('../../assets/scenes/landscape_14.png')],
  land_15: [require('../../assets/scenes/landscape_15.png')],
};

export const ARCHETYPE_SCENES: Partial<Record<string, any[]>> = {
  archivist: [require('../../assets/scenes/archivist.png')],
  alchemist: [require('../../assets/scenes/alchemist.png')],
  wanderer:  [require('../../assets/scenes/wanderer.png')],
  sentinel:  [require('../../assets/scenes/sentinel.png')],
};

export const DAY_SEED = Math.floor(Date.now() / 86400000);

// ─── GBA Map ──────────────────────────────────────────────────────────────────
export const GBA_W = 310;

export const GBA_ADJ: Partial<Record<SkinId, SkinId[]>> = {
  solform:['void','obsidian'], void:['solform','aurora','lycheetah'], aurora:['void','crimson','chaos'], crimson:['aurora','sovereign'],
  obsidian:['solform','lycheetah','norse'], lycheetah:['obsidian','void','chaos','celtic'], chaos:['lycheetah','aurora','sovereign','egyptian'], sovereign:['chaos','crimson','kabbala'],
  norse:['obsidian','celtic','noetic'], celtic:['norse','lycheetah','egyptian','lamague'], egyptian:['celtic','chaos','akashic','delphi'], akashic:['egyptian','sovereign','kabbala','sufi'], kabbala:['akashic','sovereign','quantum'],
  noetic:['norse','lamague'], lamague:['noetic','celtic','delphi'], delphi:['lamague','egyptian','sufi'], sufi:['delphi','akashic','quantum'], quantum:['sufi','kabbala'],
  crystal_nexus:['noetic','crystal_chaos','auroral_chaos'], crystal_chaos:['crystal_nexus','crystal_memory','chaos_filaments'], crystal_memory:['crystal_chaos','crystal_soul','glitch_cascade'], crystal_soul:['crystal_memory','obsidian_forge'],
  auroral_chaos:['crystal_nexus','chaos_temple'], chaos_temple:['auroral_chaos','chaos_filaments'], chaos_filaments:['chaos_temple','crystal_chaos','glitch_cascade'], glitch_cascade:['chaos_filaments','crystal_memory','obsidian_forge'], obsidian_forge:['glitch_cascade','crystal_soul'],
  obsidian_forge2:['chaos_temple','celestial_foundry'], celestial_foundry:['obsidian_forge2','lyc_nexus','noetic_sanctum'], lyc_nexus:['celestial_foundry','veil_atrium'],
  pulse_sanctum:['obsidian_forge2','noetic_sanctum'], noetic_sanctum:['pulse_sanctum','celestial_foundry','veil_atrium'], veil_atrium:['noetic_sanctum','lyc_nexus','pulse_zone'], pulse_zone:['veil_atrium'],
  apollo_jungle:['pulse_sanctum','mana_field'], mana_field:['apollo_jungle','neon_cove'], neon_cove:['mana_field','alabaster_chasm'], alabaster_chasm:['neon_cove','antarctic_refuge'], antarctic_refuge:['alabaster_chasm'],
  aurorian_pillar:['apollo_jungle','augmented_ai'], augmented_ai:['aurorian_pillar','celestial_sigil','portal_valley'], celestial_sigil:['augmented_ai','voyagers_edge'],
  portal_valley:['augmented_ai'], voyagers_edge:['celestial_sigil'],
  veilvein:['lycheetah','sovereign'],
  land_1:['solform','land_2'], land_2:['land_1','land_3'], land_3:['land_2','land_4'], land_4:['land_3','land_5'],
  land_5:['land_4','land_6'], land_6:['land_5','land_7'], land_7:['land_6','land_8'], land_8:['land_7','land_9'],
  land_9:['land_8','land_10'], land_10:['land_9','land_11'], land_11:['land_10','land_12'], land_12:['land_11','land_13'],
  land_13:['land_12','land_14'], land_14:['land_13','land_15'], land_15:['land_14','voyagers_edge'],
};

// ─── World Map ────────────────────────────────────────────────────────────────
export interface SceneRoom { id: string; skinId: SkinId; roomIndex: number; name: string; unlockStage: number; image: any; description: string; }

export const WORLD_MAP: SceneRoom[] = [
  { id:'solform_0', skinId:'solform',   roomIndex:0, name:'THE SOLAR GATE',      unlockStage:0, image:require('../../assets/scenes/sovereign.png'),   description:'Where light begins.' },
  { id:'solform_1', skinId:'solform',   roomIndex:1, name:'THE INNER RADIANCE',  unlockStage:0, image:require('../../assets/scenes/sovereign2.png'),  description:'Deeper warmth.' },
  { id:'solform_2', skinId:'solform',   roomIndex:2, name:'THE SANCTUM OF SOL',  unlockStage:0, image:require('../../assets/scenes/aurora.png'),       description:'The gold within the gold.' },
  { id:'void_0',    skinId:'void',      roomIndex:0, name:'THE VOID THRESHOLD',  unlockStage:0, image:require('../../assets/scenes/void.png'),         description:'Silence has a texture here.' },
  { id:'void_1',    skinId:'void',      roomIndex:1, name:'THE DEEP SILENCE',    unlockStage:0, image:require('../../assets/scenes/void3.png'),        description:'Thought echoes.' },
  { id:'void_2',    skinId:'void',      roomIndex:2, name:'THE VOID HEART',      unlockStage:0, image:require('../../assets/scenes/void4.png'),        description:'Nothing. Everything.' },
  { id:'aurora_0',  skinId:'aurora',    roomIndex:0, name:'THE AURORA GATE',     unlockStage:0, image:require('../../assets/scenes/aurora.png'),       description:'Light braided across sky.' },
  { id:'aurora_1',  skinId:'aurora',    roomIndex:1, name:'THE NORTHERN REACH',  unlockStage:0, image:require('../../assets/scenes/aurora3.png'),      description:'Where cold becomes colour.' },
  { id:'aurora_2',  skinId:'aurora',    roomIndex:2, name:'THE AURORA SANCTUM',  unlockStage:0, image:require('../../assets/scenes/aurora4.png'),      description:'The sky remembers you.' },
  { id:'crimson_0', skinId:'crimson',   roomIndex:0, name:'THE FORGE MOUTH',     unlockStage:0, image:require('../../assets/scenes/crimson.png'),      description:'Heat before form.' },
  { id:'crimson_1', skinId:'crimson',   roomIndex:1, name:'THE IRON HALL',       unlockStage:0, image:require('../../assets/scenes/crimson2.png'),     description:'Where things are made true.' },
  { id:'crimson_2', skinId:'crimson',   roomIndex:2, name:'THE FORGE HEART',     unlockStage:0, image:require('../../assets/scenes/crimson3.png'),     description:'The fire that mends.' },
  { id:'obsidian_0', skinId:'obsidian', roomIndex:0, name:'THE OBSIDIAN GATE',   unlockStage:0, image:require('../../assets/scenes/obsidian.png'),     description:'Ancient and still.' },
  { id:'obsidian_1', skinId:'obsidian', roomIndex:1, name:'THE CRYSTAL HALL',    unlockStage:0, image:require('../../assets/scenes/obsidian2.png'),    description:'Pressure becomes light.' },
  { id:'obsidian_2', skinId:'obsidian', roomIndex:2, name:'THE OBSIDIAN HEART',  unlockStage:0, image:require('../../assets/scenes/obsidian4.png'),    description:'The dark that holds light prisoner.' },
  { id:'lycheetah_0',skinId:'lycheetah',roomIndex:0, name:'THE WILD GATE',       unlockStage:0, image:require('../../assets/scenes/lycheetah.png'),   description:'Everything is alive.' },
  { id:'lycheetah_1',skinId:'lycheetah',roomIndex:1, name:'THE NEON CANOPY',     unlockStage:0, image:require('../../assets/scenes/lycheetah2.png'),  description:'The jungle thinks.' },
  { id:'lycheetah_2',skinId:'lycheetah',roomIndex:2, name:'THE APEX',            unlockStage:0, image:require('../../assets/scenes/lycheetah7.png'),  description:'The top of the food chain is not a place. It is a frequency.' },
  { id:'chaos_0',    skinId:'chaos',    roomIndex:0, name:'THE FRACTURE GATE',   unlockStage:0, image:require('../../assets/scenes/chaos.png'),        description:'Where geometry breaks.' },
  { id:'chaos_1',    skinId:'chaos',    roomIndex:1, name:'THE SHATTERED HALL',  unlockStage:0, image:require('../../assets/scenes/chaos2.png'),       description:'Reality folds here.' },
  { id:'chaos_2',    skinId:'chaos',    roomIndex:2, name:'THE CHAOS HEART',     unlockStage:0, image:require('../../assets/scenes/chaos3.png'),       description:'The fracture watches back.' },
  { id:'sovereign_0',skinId:'sovereign',roomIndex:0, name:'THE SOVEREIGN GATE',  unlockStage:0, image:require('../../assets/scenes/sovereign.png'),    description:'Gold remembers the name.' },
  { id:'sovereign_1',skinId:'sovereign',roomIndex:1, name:'THE HALL OF EARNED',  unlockStage:0, image:require('../../assets/scenes/sovereign2.png'),   description:'Every scar is a room.' },
  { id:'sovereign_2',skinId:'sovereign',roomIndex:2, name:'THE SOVEREIGN SANCTUM',unlockStage:0,image:require('../../assets/scenes/aurora5.png'),      description:'Nothing here was given.' },
  { id:'norse_0', skinId:'norse', roomIndex:0, name:'THE RUNEGATE',              unlockStage:0, image:require('../../assets/scenes/norse.jpg'),        description:'The elder symbols are not decoration. They are locks.' },
  { id:'norse_1', skinId:'norse', roomIndex:1, name:'THE WORLD TREE',            unlockStage:0, image:require('../../assets/scenes/norse3.jpg'),       description:'Nine realms held in one root.' },
  { id:'norse_2', skinId:'norse', roomIndex:2, name:'THE HALL OF SLAIN',         unlockStage:0, image:require('../../assets/scenes/norse2.jpg'),       description:'The honoured rest. The hall remembers what they carried.' },
  { id:'celtic_0', skinId:'celtic', roomIndex:0, name:'THE FAERIE MOUND',        unlockStage:0, image:require('../../assets/scenes/celtic.jpg'),       description:'The mound is not buried. It is hidden in plain sight.' },
  { id:'celtic_1', skinId:'celtic', roomIndex:1, name:'TÍR NA NÓG',              unlockStage:0, image:require('../../assets/scenes/celtic2.jpg'),      description:'Land of eternal youth. Time moves differently here.' },
  { id:'celtic_2', skinId:'celtic', roomIndex:2, name:'THE IRON WOOD',           unlockStage:0, image:require('../../assets/scenes/celtic3.jpg'),      description:'Older than the gods that named it.' },
  { id:'egyptian_0', skinId:'egyptian', roomIndex:0, name:'THE HALL OF TWO TRUTHS',unlockStage:0,image:require('../../assets/scenes/egyptian.jpg'),    description:'Your heart is weighed against a feather. What is its measure?' },
  { id:'egyptian_1', skinId:'egyptian', roomIndex:1, name:'THE EYE OF RA',       unlockStage:0, image:require('../../assets/scenes/egyptian.jpg'),     description:'The sun does not rise. It is remembered into existence.' },
  { id:'egyptian_2', skinId:'egyptian', roomIndex:2, name:'THE DUAT',            unlockStage:0, image:require('../../assets/scenes/egyptian.jpg'),     description:'The underworld is not death. It is the architecture of becoming.' },
  { id:'akashic_0', skinId:'akashic', roomIndex:0, name:'THE AKASHIC GATE',      unlockStage:0, image:require('../../assets/scenes/akashic.png'),      description:'Every event that has ever occurred is written here.' },
  { id:'akashic_1', skinId:'akashic', roomIndex:1, name:'THE ETERNAL LIBRARY',   unlockStage:0, image:require('../../assets/scenes/akashic2.png'),     description:'The books do not contain knowledge. They ARE knowledge.' },
  { id:'akashic_2', skinId:'akashic', roomIndex:2, name:'THE ZERO POINT',        unlockStage:0, image:require('../../assets/scenes/akashic3.png'),     description:'The field beneath the field. Laszlo called it the Akashic. Physicists call it the quantum vacuum.' },
  { id:'kabbala_0', skinId:'kabbala', roomIndex:0, name:'THE TREE OF LIFE',      unlockStage:0, image:require('../../assets/scenes/celestial_sigil.png'),description:'Ten emanations. One source. The map of how anything exists.' },
  { id:'kabbala_1', skinId:'kabbala', roomIndex:1, name:'DAATH — THE ABYSS',     unlockStage:0, image:require('../../assets/scenes/void5.png'),        description:'The sephira that is not a sephira. Knowledge that cannot be possessed, only crossed.' },
  { id:'kabbala_2', skinId:'kabbala', roomIndex:2, name:'EIN SOF',               unlockStage:0, image:require('../../assets/scenes/aurora5.png'),      description:'The infinite without end. Before being, before light, before the first letter.' },
  { id:'noetic_0', skinId:'noetic', roomIndex:0, name:'THE PSI LATTICE',         unlockStage:0, image:require('../../assets/scenes/noetic.jpg'),       description:"Radin's meta-analyses: 800+ psi studies, p < 10⁻⁹. The signal is real." },
  { id:'noetic_1', skinId:'noetic', roomIndex:1, name:'THE STARGATE',            unlockStage:0, image:require('../../assets/scenes/noetic_sanctum.png'),description:'Twenty years. US government. Declassified. Remote viewing is in the public record.' },
  { id:'noetic_2', skinId:'noetic', roomIndex:2, name:'THE ENTANGLED MIND',      unlockStage:0, image:require('../../assets/scenes/noetic.jpg'),       description:"Non-local consciousness. The hard problem Chalmers named. The door science won't open — but the handle is right there." },
  { id:'lamague_0', skinId:'lamague', roomIndex:0, name:'SYMBOL SPACE',          unlockStage:0, image:require('../../assets/scenes/celestial_sigil.png'),description:'Where meaning is compressed into form. Enter if you can read the glyphs.' },
  { id:'lamague_1', skinId:'lamague', roomIndex:1, name:'THE GRAMMAR FORGE',     unlockStage:0, image:require('../../assets/scenes/glitch_cascade.png'),description:'Z₁ through Z₄. The syntax of thought before language claimed it.' },
  { id:'lamague_2', skinId:'lamague', roomIndex:2, name:'THE UTTERANCE CHAMBER', unlockStage:0, image:require('../../assets/scenes/crystal_soul.png'), description:'A symbol ratified here becomes load-bearing in every mind that holds it.' },
  { id:'delphi_0', skinId:'delphi', roomIndex:0, name:'THE VAPOUR GATE',         unlockStage:0, image:require('../../assets/scenes/delphi.png'),       description:'Know thyself. Two words. The entire curriculum.' },
  { id:'delphi_1', skinId:'delphi', roomIndex:1, name:"THE PYTHIA'S CHAMBER",    unlockStage:0, image:require('../../assets/scenes/delphi.png'),       description:'The oracle does not predict. She reads what was always already true.' },
  { id:'delphi_2', skinId:'delphi', roomIndex:2, name:'THE SANCTUARY',           unlockStage:0, image:require('../../assets/scenes/delphi.png'),       description:"Apollo's house. The intersection of beauty, truth, and the future." },
  { id:'sufi_0', skinId:'sufi', roomIndex:0, name:'THE TAVERN OF LOVE',          unlockStage:0, image:require('../../assets/scenes/sufi.png'),         description:"Rumi's wine is not metaphor. It is the closest thing to the real." },
  { id:'sufi_1', skinId:'sufi', roomIndex:1, name:'THE WHIRLING GROUND',         unlockStage:0, image:require('../../assets/scenes/sufi.png'),         description:'The dervish spins because stillness in the centre requires motion at the edge.' },
  { id:'sufi_2', skinId:'sufi', roomIndex:2, name:"THE BELOVED'S VEIL",          unlockStage:0, image:require('../../assets/scenes/sufi.png'),         description:'Separation is the practice. Union is already the fact.' },
  { id:'quantum_0', skinId:'quantum', roomIndex:0, name:'THE PROBABILITY FIELD', unlockStage:0, image:require('../../assets/scenes/crystal_nexus.png'),description:'Nothing is determined until it is observed. Including you.' },
  { id:'quantum_1', skinId:'quantum', roomIndex:1, name:'THE ENTANGLEMENT',       unlockStage:0, image:require('../../assets/scenes/crystal_chaos.png'),description:'Two particles. Opposite ends of the universe. Still one system.' },
  { id:'quantum_2', skinId:'quantum', roomIndex:2, name:'THE COHERENCE CHAMBER', unlockStage:0, image:require('../../assets/scenes/crystal_memory.png'),description:'Photosynthesis uses quantum coherence. Biology found the trick before physics named it.' },
  { id:'auroral_chaos_0',    skinId:'auroral_chaos',    roomIndex:0, name:'THE FRACTURE SPECTRUM',   unlockStage:0, image:require('../../assets/scenes/aurora3.png'),          description:'Aurora and chaos share one root: they are both order at the wrong scale.' },
  { id:'chaos_temple_0',     skinId:'chaos_temple',     roomIndex:0, name:'TEMPLE OF THE LYC ORDER', unlockStage:0, image:require('../../assets/scenes/chaos_temple.png'),      description:'The first rule of the Order is that the Order has no rules that survive contact with reality.' },
  { id:'apollo_jungle_0',    skinId:'apollo_jungle',    roomIndex:0, name:'THE SOLAR CANOPY',        unlockStage:0, image:require('../../assets/scenes/apollo_jungle.png'),     description:'The sun came here first. Everything else grew toward it.' },
  { id:'celestial_sigil_0',  skinId:'celestial_sigil',  roomIndex:0, name:'THE LIVING SCRIPT',       unlockStage:0, image:require('../../assets/scenes/celestial_sigil.png'),   description:'The glyph is not a symbol for the thing. The glyph IS the thing, expressed differently.' },
  { id:'crystal_nexus_0',    skinId:'crystal_nexus',    roomIndex:0, name:'THE RESEARCH NEXUS',      unlockStage:0, image:require('../../assets/scenes/crystal_nexus.png'),     description:'Every crystal holds the memory of every pressure that shaped it.' },
  { id:'mana_field_0',       skinId:'mana_field',       roomIndex:0, name:'THE MANA FIELD',          unlockStage:0, image:require('../../assets/scenes/mana_field.png'),        description:'Sit still long enough and you stop being separate from what surrounds you.' },
  { id:'neon_cove_0',        skinId:'neon_cove',        roomIndex:0, name:'THE NEON COVE',           unlockStage:0, image:require('../../assets/scenes/neon_cove.png'),         description:'In the deep places, light is not a gift. It is an achievement.' },
  { id:'alabaster_chasm_0',  skinId:'alabaster_chasm',  roomIndex:0, name:'THE ALABASTER CHASM',     unlockStage:0, image:require('../../assets/scenes/alabaster_chasm.png'),   description:'The oldest things are white. All colour eventually returns to stone.' },
  { id:'antarctic_refuge_0', skinId:'antarctic_refuge', roomIndex:0, name:'THE REFUGE',              unlockStage:0, image:require('../../assets/scenes/antarctic_refuge.png'),  description:'The coldest places have the clearest air. Nothing lives here that did not choose to.' },
  { id:'augmented_ai_0',     skinId:'augmented_ai',     roomIndex:0, name:'THE AI ZONKZONE',         unlockStage:0, image:require('../../assets/scenes/augmented_ai.png'),      description:'The question is not whether it thinks. The question is what it thinks about.' },
  { id:'aurorian_pillar_0',  skinId:'aurorian_pillar',  roomIndex:0, name:'THE AURORIAN PILLAR',     unlockStage:0, image:require('../../assets/scenes/aurorian_pillar.png'),   description:'Some places exist as light that forgot to remain light.' },
  { id:'celestial_foundry_0',skinId:'celestial_foundry',roomIndex:0, name:'THE CELESTIAL FOUNDRY',   unlockStage:0, image:require('../../assets/scenes/celestial_foundry.png'),  description:'Stars are forges. Everything heavy in the universe was made in one.' },
  { id:'chaos_filaments_0',  skinId:'chaos_filaments',  roomIndex:0, name:'THE CHAOS FILAMENTS',     unlockStage:0, image:require('../../assets/scenes/chaos5.png'),            description:'Pull one thread. Watch everything else realign around the gap.' },
  { id:'crystal_chaos_0',    skinId:'crystal_chaos',    roomIndex:0, name:'THE CRYSTAL CHAOS',       unlockStage:0, image:require('../../assets/scenes/crystal_chaos.png'),     description:'The most beautiful minerals are the ones that formed under the most pressure, in the most unstable conditions.' },
  { id:'crystal_memory_0',   skinId:'crystal_memory',   roomIndex:0, name:'THE MEMORY RIFT',         unlockStage:0, image:require('../../assets/scenes/crystal_memory.png'),    description:'Memory is not storage. It is reconstruction. Every time you remember, you rewrite.' },
  { id:'crystal_soul_0',     skinId:'crystal_soul',     roomIndex:0, name:'THE SOUL TEMPLE',         unlockStage:0, image:require('../../assets/scenes/crystal_soul.png'),      description:'There is something here that has no name in any living language.' },
  { id:'glitch_cascade_0',   skinId:'glitch_cascade',   roomIndex:0, name:'THE GLITCH CASCADE',      unlockStage:0, image:require('../../assets/scenes/glitch_cascade.png'),    description:'Error is information. Every glitch is the system trying to tell you something the designers did not plan for.' },
  { id:'lyc_nexus_0',        skinId:'lyc_nexus',        roomIndex:0, name:'THE LYCHEETAH NEXUS',     unlockStage:0, image:require('../../assets/scenes/lycheetah7.png'),        description:'All webs have a centre. This is where the threads converge.' },
  { id:'pulse_sanctum_0',    skinId:'pulse_sanctum',    roomIndex:0, name:'THE PULSE SANCTUM',       unlockStage:0, image:require('../../assets/scenes/pulse_zone.png'),        description:'Your heartbeat is the oldest rhythm you know. This place knows older ones.' },
  { id:'pulse_zone_0',       skinId:'pulse_zone',       roomIndex:0, name:'THE PULSE ZONE',          unlockStage:0, image:require('../../assets/scenes/pulse_zone.png'),        description:'Frequency is the only language that needs no translation.' },
  { id:'noetic_sanctum_0',   skinId:'noetic_sanctum',   roomIndex:0, name:'THE NOETIC SANCTUM',      unlockStage:0, image:require('../../assets/scenes/noetic_sanctum.png'),    description:'Consciousness is not produced by the brain. The brain is what consciousness looks like from inside a body.' },
  { id:'obsidian_forge_0',   skinId:'obsidian_forge',   roomIndex:0, name:'THE OBSIDIAN FORGE',      unlockStage:0, image:require('../../assets/scenes/obsidian4.png'),         description:'The hottest fire leaves the darkest glass.' },
  { id:'obsidian_forge2_0',  skinId:'obsidian_forge2',  roomIndex:0, name:'THE VOID FORGE',          unlockStage:0, image:require('../../assets/scenes/obsidian_forge2.png'),   description:'The second forge is quieter. Everything it makes is invisible until you need it.' },
  { id:'portal_valley_0',    skinId:'portal_valley',    roomIndex:0, name:'THE PORTAL VALLEY',       unlockStage:0, image:require('../../assets/scenes/veil_atrium.png'),       description:'Every threshold is a portal. Most people just call them doors.' },
  { id:'veil_atrium_0',      skinId:'veil_atrium',      roomIndex:0, name:'THE VEIL ATRIUM',         unlockStage:0, image:require('../../assets/scenes/veil_atrium.png'),       description:'What separates the states is thinner than you think, and more intentional.' },
  { id:'voyagers_edge_0',    skinId:'voyagers_edge',    roomIndex:0, name:"THE VOYAGER'S EDGE",      unlockStage:0, image:require('../../assets/scenes/aurora5.png'),           description:'The edge is not the end. It is where the map runs out and the real journey begins.' },
  { id:'iron_maw_0',         skinId:'iron_maw',         roomIndex:0, name:'THE IRON MAW',            unlockStage:0, image:require('../../assets/scenes/obsidian4.png'),         description:'The jaw of the forge. Ancient, dented, tasting iron. Nothing that enters here leaves unchanged.' },
  { id:'crucible_heart_0',   skinId:'crucible_heart',   roomIndex:0, name:'CRUCIBLE HEART',          unlockStage:0, image:require('../../assets/scenes/chaos5.png'),            description:'The core of all combustion. Every forged thing traces its lineage here.' },
  { id:'phantom_citadel_0',  skinId:'phantom_citadel',  roomIndex:0, name:'PHANTOM CITADEL',         unlockStage:0, image:require('../../assets/scenes/void5.png'),             description:'A fortress that refused to collapse. Its stones are made of unfinished battles.' },
  { id:'bone_archive_0',     skinId:'bone_archive',     roomIndex:0, name:'THE BONE ARCHIVE',        unlockStage:0, image:require('../../assets/scenes/crystal_memory.png'),    description:'A battlefield so old it became a library. Every bone here is a record.' },
  { id:'void_colosseum_0',   skinId:'void_colosseum',   roomIndex:0, name:'VOID COLOSSEUM',          unlockStage:0, image:require('../../assets/scenes/void3.png'),             description:'The arena with no ground. No crowd. No rules. Only the fight.' },
  { id:'war_sanctum_0',      skinId:'war_sanctum',      roomIndex:0, name:'THE WAR SANCTUM',         unlockStage:0, image:require('../../assets/scenes/crimson4.png'),          description:'Some places are holy because of what was survived there. This is one of them.' },
  { id:'sovereign_forge_0',  skinId:'sovereign_forge',  roomIndex:0, name:'THE SOVEREIGN FORGE',     unlockStage:0, image:require('../../assets/scenes/celestial_foundry.png'), description:'Sovereignty is not given. It is made here, in heat, over time, under pressure.' },
  { id:'amber_vault_0',      skinId:'amber_vault',      roomIndex:0, name:'THE AMBER VAULT',         unlockStage:0, image:require('../../assets/scenes/aurora3.png'),           description:'Knowledge preserved in resin-gold. Every thought caught in mid-flight, kept perfect.' },
  { id:'crystal_spire_0',    skinId:'crystal_spire',    roomIndex:0, name:'THE CRYSTAL SPIRE',       unlockStage:0, image:require('../../assets/scenes/crystal_nexus.png'),     description:'A tower of pure transparent form. From here you can see every domain at once.' },
  { id:'veras_garden_0',     skinId:'veras_garden',     roomIndex:0, name:'VERAS GARDEN',            unlockStage:0, image:require('../../assets/scenes/apollo_jungle.png'),     description:'Where knowledge dust settles and blooms. Every ✧ you earned grew something here.' },
  { id:'golden_library_0',   skinId:'golden_library',   roomIndex:0, name:'THE GOLDEN LIBRARY',      unlockStage:0, image:require('../../assets/scenes/celestial_sigil.png'),   description:'The most ornate archive ever built. Entry costs something. What is inside is worth more.' },
  { id:'deep_market_0',      skinId:'deep_market',      roomIndex:0, name:'THE DEEP MARKET',         unlockStage:0, image:require('../../assets/scenes/alabaster_chasm.png'),   description:'Three levels below the city. Rare things only. Barter is the language. Coin is the key.' },
  { id:'lycheetah_spire_0',  skinId:'lycheetah_spire',  roomIndex:0, name:'LYCHEETAH SPIRE',         unlockStage:0, image:require('../../assets/scenes/lycheetah7.png'),        description:'The apex of the entire ecosystem. From here the whole field is visible. You earned the view.' },
  { id:'veilvein_0',         skinId:'veilvein',         roomIndex:0, name:'THE INTERTWINING',        unlockStage:0, image:require('../../assets/scenes/veilvein_sanctum.png'),    description:'The sanctum where the two spirits meet — Veil and Vein, curiosity and want, braided into one white flash. The Lycheetah Tarot was forged here.' },
  { id:'land_1_0',  skinId:'land_1',  roomIndex:0, name:'THE WANDERING PLAIN', unlockStage:0, image:require('../../assets/scenes/landscape_1.png'),  description:'Wide open sky, endless terrain. The place where the question becomes the walk.' },
  { id:'land_2_0',  skinId:'land_2',  roomIndex:0, name:'THE AMBER RIDGE',     unlockStage:0, image:require('../../assets/scenes/landscape_2.png'),  description:'Colour at the edge of distance. Something waits at every ridge you cross.' },
  { id:'land_3_0',  skinId:'land_3',  roomIndex:0, name:'THE PALE CROSSING',   unlockStage:0, image:require('../../assets/scenes/landscape_3.png'),  description:'The threshold looks like ordinary ground. That is how thresholds work.' },
  { id:'land_4_0',  skinId:'land_4',  roomIndex:0, name:'THE DUSK MARGIN',     unlockStage:0, image:require('../../assets/scenes/landscape_4.png'),  description:'The last light is the truest light. Stand here long enough to learn why.' },
  { id:'land_5_0',  skinId:'land_5',  roomIndex:0, name:'THE OPEN FIELD',      unlockStage:0, image:require('../../assets/scenes/landscape_5.png'),  description:'Nothing between you and the horizon. You are the only landmark here.' },
  { id:'land_6_0',  skinId:'land_6',  roomIndex:0, name:'THE IRON HEATH',      unlockStage:0, image:require('../../assets/scenes/landscape_6.png'),  description:'Ground that holds memory of pressure. Every footstep here costs something.' },
  { id:'land_7_0',  skinId:'land_7',  roomIndex:0, name:'THE GREY DESCENT',    unlockStage:0, image:require('../../assets/scenes/landscape_7.png'),  description:'Falling in still terrain. The descent is invisible until you are at the bottom.' },
  { id:'land_8_0',  skinId:'land_8',  roomIndex:0, name:'THE BURNING WASTE',   unlockStage:0, image:require('../../assets/scenes/landscape_8.png'),  description:'What fire leaves is honest. Only what mattered survives.' },
  { id:'land_9_0',  skinId:'land_9',  roomIndex:0, name:'THE COLD HORIZON',    unlockStage:0, image:require('../../assets/scenes/landscape_9.png'),  description:'Distance is its own intelligence. You will not reach what you see. You will become it.' },
  { id:'land_10_0', skinId:'land_10', roomIndex:0, name:'THE STILL VALE',      unlockStage:0, image:require('../../assets/scenes/landscape_10.png'), description:'Silence that knows what you came for. It will not say it first.' },
  { id:'land_11_0', skinId:'land_11', roomIndex:0, name:'THE FORGOTTEN ROAD',  unlockStage:0, image:require('../../assets/scenes/landscape_11.png'), description:'The paths we did not take still exist. This is one of them.' },
  { id:'land_12_0', skinId:'land_12', roomIndex:0, name:'THE EMBER PLAIN',     unlockStage:0, image:require('../../assets/scenes/landscape_12.png'), description:'Not quite fire, not quite stone. The in-between has its own kind of truth.' },
  { id:'land_13_0', skinId:'land_13', roomIndex:0, name:'THE DEEP MARGIN',     unlockStage:0, image:require('../../assets/scenes/landscape_13.png'), description:'At the edge, things get quiet. Edges are where the interesting things live.' },
  { id:'land_14_0', skinId:'land_14', roomIndex:0, name:'THE LAST CROSSING',   unlockStage:0, image:require('../../assets/scenes/landscape_14.png'), description:'Every crossing looks like the last one. This one might be.' },
  { id:'land_15_0', skinId:'land_15', roomIndex:0, name:'THE ENDLESS EDGE',    unlockStage:0, image:require('../../assets/scenes/landscape_15.png'), description:'The map runs out. The territory does not. Walk anyway.' },
];

// ─── Zone unlock costs (dive coins) ──────────────────────────────────────────
export const ZONE_DIVE_COST: Record<string, number> = {
  // Landscapes: affordable entry-tier purchasable zones
  land_6: 3, land_7: 3, land_8: 3, land_9: 3, land_10: 3,
  land_11: 4, land_12: 4, land_13: 4, land_14: 4, land_15: 4,
  auroral_chaos: 2, chaos: 3, mana_field: 4, antarctic_refuge: 5, veil_atrium: 6, sovereign: 8,
  apollo_jungle: 5, neon_cove: 6, celtic: 8, crystal_nexus: 10, egyptian: 14,
  aurorian_pillar: 16, portal_valley: 18, pulse_zone: 20, crystal_memory: 22,
  sufi: 15, delphi: 16, kabbala: 18, noetic: 20, lamague: 22, quantum: 25,
  celestial_sigil: 28, alabaster_chasm: 30, celestial_foundry: 35, crystal_chaos: 40,
  crystal_soul: 45, noetic_sanctum: 50, obsidian_forge2: 55,
  augmented_ai: 35, chaos_filaments: 40, glitch_cascade: 45, lyc_nexus: 50,
  obsidian_forge: 55, voyagers_edge: 60, pulse_sanctum: 65,
  iron_maw: 5, crucible_heart: 10, phantom_citadel: 18, bone_archive: 25,
  void_colosseum: 35, war_sanctum: 50, sovereign_forge: 70,
  amber_vault: 12, crystal_spire: 15, veras_garden: 18, golden_library: 20,
  deep_market: 22, lycheetah_spire: 30,
};

export function getSkinUnlockStatus(
  id: SkinId, totalDives: number, isSovereign: boolean,
  battleWins: number = 0, purchasedZones: string[] = []
): { locked: boolean; reason: string; diveCost: number } {
  const diveCost = ZONE_DIVE_COST[id as string] ?? 0;
  if (purchasedZones.includes(id)) return { locked: false, reason: '', diveCost };
  if (['solform','void','aurora','crimson','land_1','land_2','land_3','land_4','land_5'].includes(id)) return { locked: false, reason: '', diveCost };
  const ARCANE: Record<string, number> = {
    obsidian: 0, auroral_chaos: 3, chaos: 5, mana_field: 7,
    antarctic_refuge: 9, veil_atrium: 11, sovereign: 14,
  };
  if (id === 'lycheetah') return isSovereign ? { locked: false, reason: '', diveCost } : { locked: true, reason: 'Sovereign', diveCost };
  if (id in ARCANE) {
    const need = ARCANE[id as string];
    return totalDives >= need ? { locked: false, reason: '', diveCost } : { locked: true, reason: `${need - totalDives} dives`, diveCost };
  }
  const MYTHIC: Record<string, number> = {
    norse: 0, apollo_jungle: 15, neon_cove: 18, celtic: 22,
    crystal_nexus: 26, egyptian: 34,
    aurorian_pillar: 38, portal_valley: 42, pulse_zone: 46, crystal_memory: 50,
  };
  if (id in MYTHIC) {
    const need = MYTHIC[id as string];
    return totalDives >= need ? { locked: false, reason: '', diveCost } : { locked: true, reason: `${need - totalDives} dives`, diveCost };
  }
  const LEGENDARY: Record<string, number> = {
    akashic: 0, sufi: 40, delphi: 44, kabbala: 48, noetic: 52,
    lamague: 56, quantum: 60, celestial_sigil: 65, alabaster_chasm: 72,
    celestial_foundry: 80, crystal_chaos: 88, crystal_soul: 96,
    noetic_sanctum: 104, obsidian_forge2: 112,
  };
  if (id in LEGENDARY) {
    const need = LEGENDARY[id as string];
    return totalDives >= need ? { locked: false, reason: '', diveCost } : { locked: true, reason: `${need - totalDives} dives`, diveCost };
  }
  const SPECTRAL: Record<string, number> = {
    chaos_temple: 0, augmented_ai: 80, chaos_filaments: 90,
    glitch_cascade: 100, lyc_nexus: 110, obsidian_forge: 120, voyagers_edge: 130, pulse_sanctum: 140,
  };
  if (id in SPECTRAL) {
    const need = SPECTRAL[id as string];
    return totalDives >= need ? { locked: false, reason: '', diveCost } : { locked: true, reason: `${need - totalDives} dives`, diveCost };
  }
  const BATTLE_WIN: Record<string, number> = {
    iron_maw: 5, crucible_heart: 12, phantom_citadel: 20, bone_archive: 35,
    void_colosseum: 50, war_sanctum: 75, sovereign_forge: 100,
  };
  if (id in BATTLE_WIN) {
    const need = BATTLE_WIN[id as string];
    return battleWins >= need ? { locked: false, reason: '', diveCost } : { locked: true, reason: `${need - battleWins} wins`, diveCost };
  }
  const SHOP_ZONES = [
    'land_6','land_7','land_8','land_9','land_10','land_11','land_12','land_13','land_14','land_15',
    'amber_vault','crystal_spire','veras_garden','golden_library','deep_market','lycheetah_spire',
  ];
  if (SHOP_ZONES.includes(id)) {
    return { locked: true, reason: `${diveCost} ✦`, diveCost };
  }
  return { locked: false, reason: '', diveCost };
}
