export type WeaponRarity = 'COMMON' | 'ARCANE' | 'MYTHIC' | 'LEGENDARY' | 'SPECTRAL';
export type WeaponType   = 'BLADE' | 'STAFF' | 'BOW' | 'ORB' | 'RELIC' | 'TOME' | 'FANG';

export interface Weapon {
  id:       string;
  name:     string;
  type:     WeaponType;
  rarity:   WeaponRarity;
  atk:      number;
  spd:      number;
  wil:      number;
  lore:     string;
  dropRate: number;
}

export const WEAPONS: Weapon[] = [
  { id:'rusted-cleaver',     name:'RUSTED CLEAVER',      type:'BLADE', rarity:'COMMON',    atk:3,  spd:1,  wil:0,  lore:"A farmer's tool reborn in blood, still whispering of the harvest.",         dropRate:0.62 },
  { id:'iron-dirge',         name:'IRON DIRGE',           type:'BLADE', rarity:'COMMON',    atk:5,  spd:2,  wil:1,  lore:'Forged in mourning, its edge hums a tune only the dead recognize.',         dropRate:0.58 },
  { id:'rune-etched-saber',  name:'RUNE ETCHED SABER',   type:'BLADE', rarity:'ARCANE',    atk:8,  spd:4,  wil:3,  lore:'Each glyph upon the blade is a word the world forgot.',                     dropRate:0.42 },
  { id:'aether-ripper',      name:'AETHER RIPPER',        type:'BLADE', rarity:'ARCANE',    atk:10, spd:5,  wil:4,  lore:'Cuts not flesh but the space between heartbeats.',                          dropRate:0.38 },
  { id:'obsidian-kris',      name:'OBSIDIAN KRIS',        type:'BLADE', rarity:'MYTHIC',    atk:15, spd:7,  wil:6,  lore:'Born from volcanic glass, it drinks light before it drinks life.',          dropRate:0.22 },
  { id:'void-shard',         name:'VOID SHARD',           type:'BLADE', rarity:'MYTHIC',    atk:18, spd:8,  wil:7,  lore:'A splinter of nothingness held in place by spite alone.',                   dropRate:0.18 },
  { id:'sol-reaper',         name:'SOL REAPER',           type:'BLADE', rarity:'LEGENDARY', atk:28, spd:14, wil:12, lore:"The sun's wrath made manifest, reaping souls at high noon.",                dropRate:0.09 },
  { id:'entropy-blade',      name:'ENTROPY BLADE',        type:'BLADE', rarity:'SPECTRAL',  atk:38, spd:18, wil:16, lore:'Every swing ages the air itself; rust follows where it leads.',             dropRate:0.05 },
  { id:'pine-wand',          name:'PINE WAND',            type:'STAFF', rarity:'COMMON',    atk:1,  spd:2,  wil:4,  lore:"A child's stick that remembered it was once part of a greater whole.",      dropRate:0.60 },
  { id:'driftwood-rod',      name:'DRIFTWOOD ROD',        type:'STAFF', rarity:'COMMON',    atk:2,  spd:1,  wil:3,  lore:"Shaped by tides and time, it channels the ocean's forgotten fury.",         dropRate:0.64 },
  { id:'crystal-septor',     name:'CRYSTAL SEPTOR',       type:'STAFF', rarity:'ARCANE',    atk:6,  spd:5,  wil:8,  lore:'A prism of frozen starlight that bends fate to its will.',                  dropRate:0.40 },
  { id:'chaos-crook',        name:'CHAOS CROOK',          type:'STAFF', rarity:'MYTHIC',    atk:12, spd:8,  wil:12, lore:'Shepherds not sheep but the unraveling threads of causality.',              dropRate:0.20 },
  { id:'lamague-staff',      name:'LAMAGUE STAFF',        type:'STAFF', rarity:'LEGENDARY', atk:22, spd:12, wil:18, lore:'Carved from the first tree that ever dreamed, it speaks in roots.',         dropRate:0.10 },
  { id:'void-staff',         name:'VOID STAFF',           type:'STAFF', rarity:'SPECTRAL',  atk:32, spd:15, wil:20, lore:'Hollows out the ground it touches, leaving only echo behind.',              dropRate:0.05 },
  { id:'ash-shortbow',       name:'ASH SHORTBOW',         type:'BOW',   rarity:'COMMON',    atk:4,  spd:4,  wil:0,  lore:'Strung with sinew from a burned saint, it fires smoke and judgment.',      dropRate:0.61 },
  { id:'bone-bow',           name:'BONE BOW',             type:'BOW',   rarity:'COMMON',    atk:6,  spd:3,  wil:1,  lore:'Rib-cage of a fallen titan, still seeking the sky it lost.',               dropRate:0.59 },
  { id:'starstring-bow',     name:'STARSTRING BOW',       type:'BOW',   rarity:'ARCANE',    atk:12, spd:8,  wil:5,  lore:'Drawn across constellations, its arrows arrive before they leave.',         dropRate:0.41 },
  { id:'void-bow',           name:'VOID BOW',             type:'BOW',   rarity:'MYTHIC',    atk:20, spd:10, wil:8,  lore:'Fires arrows that cease to exist the moment they find their mark.',         dropRate:0.19 },
  { id:'solar-longbow',      name:'SOLAR LONGBOW',        type:'BOW',   rarity:'LEGENDARY', atk:30, spd:16, wil:10, lore:'Draws power from the dawn itself, blinding friend and foe alike.',          dropRate:0.08 },
  { id:'entropy-string',     name:'ENTROPY STRING',       type:'BOW',   rarity:'SPECTRAL',  atk:35, spd:20, wil:14, lore:"Its bowstring is the fraying cord that binds yesterday to today.",          dropRate:0.05 },
  { id:'glass-orb',          name:'GLASS ORB',            type:'ORB',   rarity:'COMMON',    atk:0,  spd:3,  wil:5,  lore:"A scryer's toy that occasionally looks back.",                             dropRate:0.63 },
  { id:'quartz-sphere',      name:'QUARTZ SPHERE',        type:'ORB',   rarity:'COMMON',    atk:1,  spd:2,  wil:4,  lore:'Holds a single frozen breath from the beginning of the world.',            dropRate:0.57 },
  { id:'rune-orb',           name:'RUNE ORB',             type:'ORB',   rarity:'ARCANE',    atk:7,  spd:6,  wil:8,  lore:'Spins ancient symbols that rewrite the air around them.',                  dropRate:0.39 },
  { id:'abyssal-orb',        name:'ABYSSAL ORB',          type:'ORB',   rarity:'MYTHIC',    atk:14, spd:9,  wil:12, lore:"Swallows candlelight and returns only the dark's secrets.",                dropRate:0.21 },
  { id:'aether-core',        name:'AETHER CORE',          type:'ORB',   rarity:'LEGENDARY', atk:25, spd:11, wil:16, lore:'A heartbeat torn from the chest of a dying god, still pulsing.',           dropRate:0.09 },
  { id:'singularity-orb',    name:'SINGULARITY ORB',      type:'ORB',   rarity:'SPECTRAL',  atk:36, spd:17, wil:19, lore:'Gravity itself bows to the weight of its impossible center.',              dropRate:0.05 },
  { id:'clay-charm',         name:'CLAY CHARM',           type:'RELIC', rarity:'COMMON',    atk:2,  spd:1,  wil:2,  lore:'Molded by trembling hands in the hour before the cataclysm.',             dropRate:0.65 },
  { id:'wooden-idol',        name:'WOODEN IDOL',          type:'RELIC', rarity:'COMMON',    atk:3,  spd:0,  wil:3,  lore:'Watches you with eyes that were never carved.',                            dropRate:0.55 },
  { id:'bronze-sigil',       name:'BRONZE SIGIL',         type:'RELIC', rarity:'ARCANE',    atk:9,  spd:4,  wil:7,  lore:'Stamped with a seal that opens doors in waking dreams.',                   dropRate:0.43 },
  { id:'obsidian-totem',     name:'OBSIDIAN TOTEM',       type:'RELIC', rarity:'ARCANE',    atk:11, spd:6,  wil:6,  lore:'A piece of night made solid, refusing to reflect the day.',                dropRate:0.37 },
  { id:'chaos-relic',        name:'CHAOS RELIC',          type:'RELIC', rarity:'MYTHIC',    atk:16, spd:10, wil:10, lore:'Shifts shape when unobserved, preferring forms that induce madness.',      dropRate:0.23 },
  { id:'void-reliquary',     name:'VOID RELIQUARY',       type:'RELIC', rarity:'LEGENDARY', atk:26, spd:13, wil:15, lore:'Contains what was removed from the world so it could continue.',           dropRate:0.10 },
  { id:'mildew-grimoire',    name:'MILDEW GRIMOIRE',      type:'TOME',  rarity:'COMMON',    atk:0,  spd:1,  wil:5,  lore:'Pages stick together with spores that dream of being spells.',             dropRate:0.60 },
  { id:'rune-tome',          name:'RUNE TOME',            type:'TOME',  rarity:'ARCANE',    atk:5,  spd:3,  wil:8,  lore:'Every page is a contract signed in languages that predate sound.',         dropRate:0.40 },
  { id:'entropy-codex',      name:'ENTROPY CODEX',        type:'TOME',  rarity:'MYTHIC',    atk:13, spd:7,  wil:14, lore:'Its words decay as you read them, leaving only understanding.',            dropRate:0.20 },
  { id:'abyssal-prayerbook', name:'ABYSSAL PRAYERBOOK',   type:'TOME',  rarity:'LEGENDARY', atk:24, spd:10, wil:18, lore:'Prayers written here are answered by something that was never holy.',      dropRate:0.08 },
  { id:'wolf-fang',          name:'WOLF FANG',            type:'FANG',  rarity:'COMMON',    atk:7,  spd:5,  wil:0,  lore:'A tooth that never stopped hunting, even after the wolf fell.',            dropRate:0.56 },
  { id:'serpent-tooth',      name:'SERPENT TOOTH',        type:'FANG',  rarity:'ARCANE',    atk:13, spd:7,  wil:4,  lore:'Dripped with venom from the first lie ever told.',                         dropRate:0.44 },
  { id:'basilisk-fang',      name:'BASILISK FANG',        type:'FANG',  rarity:'ARCANE',    atk:14, spd:6,  wil:5,  lore:'Petrifies the blood before the wound even opens.',                         dropRate:0.40 },
  { id:'dragon-fang',        name:'DRAGON FANG',          type:'FANG',  rarity:'MYTHIC',    atk:22, spd:11, wil:9,  lore:'Sings with the memory of fire that cooked the earth itself.',              dropRate:0.24 },
];

export const RARITY_COLOR: Record<WeaponRarity, string> = {
  COMMON:    '#888899',
  ARCANE:    '#8B5CF6',
  MYTHIC:    '#EC4899',
  LEGENDARY: '#C49A3C',
  SPECTRAL:  '#22D3EE',
};

export function pickWeaponDrop(): Weapon | null {
  const total = WEAPONS.reduce((s, w) => s + w.dropRate, 0);
  let roll = Math.random() * total;
  for (const w of WEAPONS) { roll -= w.dropRate; if (roll <= 0) return w; }
  return WEAPONS[WEAPONS.length - 1];
}
