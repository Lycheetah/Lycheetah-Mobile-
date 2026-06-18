# GROK IMAGE ASSET SPEC
## Sol by Lycheetah — Asset Generation Brief
### Date: June 19 2026 | App: v4.x | Platform: Android (React Native / Expo)

---

## STYLE GUIDE

All art lives in a single visual universe:
- **Tone**: dark, luminous, painterly-to-pixel. Deep blacks with glowing colour.
- **Palette**: each zone/character has ONE dominant accent colour (listed per asset).
- **Backgrounds**: wide-aspect (landscape). Atmospheric, layered depth. No hard edges.
- **Companion characters**: portrait orientation, transparent background (PNG). 
  Floating, slightly stylized — NOT photorealistic, NOT cartoon. Painterly/vector hybrid.
  The character should read as a being, not an icon.
- **Enemies**: smaller, more abstract/conceptual. They are psychological forces made visible.

---

## 1. COMPANION ART — 27 NEW ZONES (pending)

Each zone needs a companion character at 3 stages (base / evolved / final).
Companion PNGs: transparent background, 300×440px minimum, portrait orientation.
Key: `{zone_id}_{stage}.png` (stage 1 = base, 2 = evolved, 3 = final form)

Drop finished art into: `assets/companions/raw/` then run `python3 scripts/remove_bg.py`

### New Zones — Companion Character Briefs

| Zone ID | Zone Name | Accent Colour | Character Concept | Stage Arc |
|---------|-----------|---------------|-------------------|-----------|
| `auroral_chaos` | AURORAL CHAOS | `#8855FF` | A being of fractured light — part aurora, part lightning. Wings made of shattered spectrum. | Shard → Storm-wing → Prismatic sovereign |
| `chaos_temple` | CHAOS TEMPLE | `#6600CC` | A robed figure whose silhouette dissolves at the edges. Holds a staff of recursive chaos glyphs. | Acolyte → High priest → Chaos-sovereign |
| `apollo_jungle` | APOLLO JUNGLE | `#88CC44` | Half sun-deity, half jungle cat. Gold-dappled, leaf-crowned. Barefoot on glowing moss. | Cub-god → Jungle-sovereign → Solar panther |
| `celestial_sigil` | CELESTIAL SIGIL | `#88AAFF` | A transparent humanoid woven entirely from celestial script. Runes orbit like electrons. | Glyph-sketch → Sigil-bound → Living constellation |
| `crystal_nexus` | CRYSTAL NEXUS | `#44DDCC` | A researcher in crystalline armour. Carries a staff that ends in a floating data-crystal. | Apprentice → Crystal-sage → Nexus-keeper |
| `mana_field` | MANA FIELD | `#4488FF` | A serene figure sitting cross-legged in a field of rising blue mana streams. Calm, old, vast. | Channeler → Mana-sage → Field-sovereign |
| `neon_cove` | NEON COVE | `#FF44AA` | A sleek being of hot pink neon light, like a bioluminescent deep-sea creature walking upright. | Flicker → Neon-form → Radiance |
| `alabaster_chasm` | ALABASTER CHASM | `#E8E0CC` | Ancient, white-stone figure. Like a Greek god eroded by millennia — half face missing, beautiful. | Fragment → Form → Colossus |
| `antarctic_refuge` | THE REFUGE | `#88CCEE` | A small, compact figure in layered ice-blue robes. Eyes like frozen stars. Quiet. Enduring. | Exile → Refuge-keeper → Ice-sovereign |
| `augmented_ai` | AI ZONKZONE | `#44FF88` | A digital entity made of cascading code and circuit-glow. Eyes are green binary streams. | Glitch-form → Augmented → Full-sentience |
| `aurorian_pillar` | AURORIAN PILLAR | `#44EEC8` | Tall, willowy, made of pillar-light — an aurora made solid. Ribbons of light trail from every gesture. | Aurora-thread → Pillar-formed → Celestial spire |
| `celestial_foundry` | CELESTIAL FOUNDRY | `#FFAA22` | A smith in a forge that floats in space. Hammer of condensed starlight. Glowing forge-mask. | Apprentice-smith → Star-forger → Celestial master |
| `chaos_filaments` | CHAOS FILAMENTS | `#FF44CC` | Made of chaotic threadwork — thousands of magenta filaments that form a shape but never settle. | Unraveling → Filament-bound → Woven-chaos |
| `crystal_chaos` | CRYSTAL CHAOS | `#CC44FF` | A crystal golem mid-fracture — every shard glows a different purple hue. Beautiful destruction. | Shard → Golem → Crystal-titan |
| `crystal_memory` | CRYSTAL MEMORY | `#8866FF` | A hooded figure carrying a large memory crystal that plays fragmented scenes. Melancholy archivist. | Memory-echo → Crystal-keeper → Living-archive |
| `crystal_soul` | SOUL TEMPLE | `#FFEEAA` | A being of pure warm light, barely a silhouette, surrounded by floating golden soul-fragments. | Soul-spark → Soul-form → Eternal |
| `elven_village` | ELVEN VILLAGE | `#44BB66` | A tall, forest-elf figure. Ancient lineage visible in face — not Tolkien, more druidic/mystical. Bark-armour. | Forest-born → Wood-sage → Elder-kin |
| `glitch_cascade` | GLITCH CASCADE | `#FF4466` | A figure that constantly glitches — parts of the body displaced, flickering. Error-being. Red/static aesthetic. | Glitch-seed → Error-form → Cascade |
| `lyc_nexus` | THE NEXUS | `#FF8822` | An orange-amber entity at the centre of a web of glowing connections. Spider-like but regal — the hub. | Node → Nexus-mind → Lycheetah-hub |
| `pulse_sanctum` | PULSE SANCTUM | `#AA44FF` | A meditating figure surrounded by concentric violet pulse rings, like sonar or a heartbeat made visible. | Initiate → Pulse-keeper → Sanctum-sovereign |
| `pulse_zone` | PULSE ZONE | `#44AAFF` | An active, kinetic being — always mid-motion, trailing blue pulse-light with every movement. | Pulse-born → Wave-rider → Frequency |
| `noetic_sanctum` | NOETIC SANCTUM | `#44CCFF` | A figure whose head is a translucent sphere containing a miniature cosmos. Consciousness made form. | Psi-seed → Noetic-form → Mind-sovereign |
| `obsidian_forge` | OBSIDIAN FORGE | `#CC2222` | A massive, deep-red forge-titan. Arms are forge-hammers. Eyes burn with obsidian fire. Ancient. Terrifying. Beautiful. | Forge-born → Iron-giant → Obsidian-sovereign |
| `obsidian_forge2` | VOID FORGE II | `#AA1111` | A quieter counterpart to the Forge — a dark alchemist who works at the void-edge of the forge. Shadow energy. | Shadow-smith → Void-forger → Dark-master |
| `portal_valley` | PORTAL VALLEY | `#22FF88` | A portal-keeper with rings of gateway energy orbiting the body. Between-places being. | Gate-child → Portal-keeper → Threshold-sovereign |
| `veil_atrium` | VEIL ATRIUM | `#AABBCC` | A silver-grey figure half-visible through a semi-transparent membrane. Exists between states. | Veil-thread → Atrium-form → Membrane |
| `voyagers_edge` | VOYAGER'S EDGE | `#5544CC` | A deep-space explorer archetype. Indigo cloak, navigation instruments, star-map on the chest. Seasoned, vast. | Scout → Voyager → Edge-sovereign |

---

## 2. ENEMY ART — Battle System

Enemy PNGs: transparent background, 200×200px minimum, square aspect.
Drop into: `assets/enemies/raw/` then run `python3 scripts/remove_bg_enemies.py`
Key: `{enemy_id}.png`

These are PSYCHOLOGICAL FORCES made visible — not monsters. Abstract, dark, conceptual.

| Enemy ID | Name | Accent | Visual Concept |
|----------|------|--------|----------------|
| `dissolution` | DISSOLUTION | `#6633AA` | A humanoid figure actively dissolving — like sand in wind or smoke dispersing. Edges undefined. |
| `the_fog` | THE FOG | `#556677` | A dense grey-blue cloud mass that has vaguely human proportions. No face. Presence without clarity. |
| `forgetting` | FORGETTING | `#443344` | A figure with an eraser where the head should be. Parts of the body are blank/white. Quiet horror. |
| `stasis` | STASIS | `#334455` | A humanoid encased in a thick crystalline shell. Still. Frozen. The shell cracks slightly at the edges. |
| `inertia` | INERTIA | `#222233` | An impossibly heavy stone figure. Sinking. Gravity distorts around it. Nothing moves near it. |
| `drift` | DRIFT | `#445566` | A diffuse figure pulled in multiple directions simultaneously — no centre of gravity. Scattered. |
| `static` | STATIC | `#334433` | A TV static pattern given crude humanoid form. Buzzing. No clear features, just noise. |
| `null` | NULL | `#111122` | Perfect void shape. Humanoid silhouette cut from pure darkness. Light bends away from it. |
| `absence` | ABSENCE | `#221122` | A figure-shaped hole in the air. The background is visible through it but wrong — inverted, warped. |
| `the_hollow` | THE HOLLOW | `#331133` | A tall, thin figure, skin paper-thin over an empty interior. Hollow chest shows through. Echoes when moved. |
| `the_drain` | THE DRAIN | `#222211` | A whirlpool-adjacent figure — everything near it spirals inward. Depicted as a vortex with arms. |
| `the_veil` | THE VEIL | `#334455` | A figure wrapped entirely in layered grey veils. No face visible. Draped in forgetting. |
| `fracture` | FRACTURE | `#553311` | A cracked humanoid — the cracks glow from within, but the glow is cold. Like broken bone-china. |
| `the_weight` | THE WEIGHT | `#221100` | A humanoid bent double under a mass of grey stones that float magnetically around it. |
| `corruption` | CORRUPTION | `#330011` | Organic dark matter spreading from a core figure. Tendrils. Decay. Beautiful in its own terrible way. |
| `the_warden` | THE WARDEN | `#222244` | An armoured figure of compressed shadow, holding chains made of frozen time. Boss aesthetic. |
| `null_sovereign` | NULL SOVEREIGN | `#110022` | The Null at its apex — a towering void-king, crown of anti-light. Supreme enemy. |
| `fracture_prime` | FRACTURE PRIME | `#441100` | The Fracture fully manifested — a shattered colossus held together by nothing but habit. |
| `entropy_prime` | ENTROPY PRIME | `#220033` | Everything ending simultaneously in one figure. The heat-death of a being. Absolute boss. |
| `athanors_shadow` | ATHANOR'S SHADOW | `#111111` | The companion's shadow given form. Most personal enemy. Mirrors the player's own archetype. |

---

## 3. ZONE SCENE ART — Additional Backgrounds (existing zones)

These zones could use more scene variety (currently have limited backgrounds):

| Zone ID | Need | Notes |
|---------|------|-------|
| `egyptian` | 2-3 more scenes | Currently only 1. The Duat needs more depth. |
| `kabbala` | 2-3 more scenes | Currently only 1. Ein Sof needs the Tree of Life + Ain |
| `delphi` | 2-3 more scenes | Oracle cave, vapour columns, the Omphalos stone |
| `sufi` | 2-3 more scenes | Whirling hall, rose garden, divine tavern |
| `chaos` | Could use more | Already has 6, but the Chaos Temple art opens new angles |
| `sovereign` | Could use more | Already has 4, but more throne-room variety helps |

---

## 4. FILE DELIVERY FORMAT

```
assets/
├── companions/
│   └── raw/           ← drop new companion PNGs here (white bg ok, script removes it)
│       └── {zone_id}_{stage}.png
├── enemies/
│   └── raw/           ← drop new enemy PNGs here
│       └── {enemy_id}.png
└── scenes/            ← zone backgrounds go directly here (already processed)
    └── {zone_id}.png
```

**Scripts:**
```bash
python3 scripts/remove_bg.py        # companion art → assets/companions/
python3 scripts/remove_bg_enemies.py # enemy art → assets/enemies/
```

---

## 5. PRIORITY ORDER

1. **Enemy art** (20 enemies) — unblocks battle system
2. **New zone companions** (27 zones × 3 stages = 81 PNGs, do in batches by zone)
3. **Additional scene backgrounds** for thin zones

---

*Sol by Lycheetah — every pixel a living symbol*
