# SOL APP — ART + IMPLEMENTATION PLAN
## Work to do when session resets

---

## COMPANION PORTRAITS  `assets/companions/`

### How it works
Drop a PNG named `archetype_stage.png` and uncomment the matching line in `COMPANION_IMAGES` (companion.tsx ~line 120).  
The app automatically shows it instead of the SVG — falls back to SVG if no image.

### Naming
```
vigil_0.png    vigil_1.png    vigil_2.png    vigil_3.png    vigil_4.png    vigil_5.png
alchemist_0.png  ...  alchemist_5.png
sentinel_0.png   ...  sentinel_5.png
wanderer_0.png   ...  wanderer_5.png
archivist_0.png  ...  archivist_5.png
helix_0.png      ...  helix_5.png
```

### Recommended order (most impact first)
1. All 6 **stage 5** forms — endgame aspirational art
2. All 6 **stage 1** forms — everyone starts here
3. Stage 3 for each — midgame milestone
4. Fill remaining stages after

### Art spec
- Size: **200×280px** portrait (or 120×180 minimum)
- Background: **dark / transparent** — renders on `#1A1A1A` scene base
- Style: pixel art, painterly, or illustrated — dark fantasy, atmospheric
- Each archetype has a theme:
  - **Vigil** — hooded scholar, lantern, tower library
  - **Alchemist** — flask/vessel, fire, transmutation symbols
  - **Sentinel** — armoured guardian, geometric, angular
  - **Wanderer** — explorer, traveller cloak, horizon
  - **Archivist** — floating books, scrolls, ink
  - **Helix** — chaotic energy, cat-like, mercurial

### Stage progression feel
| Stage | Name | Feel |
|-------|------|------|
| 0 | SEED | Small, formless, glowing dot or egg |
| 1 | SPARK | First form, basic shape, recognisable |
| 2 | EMBER | Slightly grown, details forming |
| 3 | LANTERN | Mid-form, glowing, more defined |
| 4 | CITRINITAS | Full form, radiant, sovereign energy |
| 5 | GREAT WORK | Endgame, imposing, transcendent |

---

## GEAR OVERLAYS  `assets/gear/`

### How it works
Drop a PNG and uncomment the matching line in `GEAR_IMAGES` (companion.tsx ~line 185).  
Gear renders as a **transparent overlay** on the companion figure — stacked in order: cape → body → mantle → crown.

### Naming
```
crown_ember_circlet.png
crown_sight_crown.png
crown_forge_crown.png
crown_sovereign_halo.png

body_thread_robe.png
body_scholar_robe.png
body_void_robe.png
body_sovereign_robe.png

cape_shadow_cape.png
cape_drift_cape.png
cape_void_cape.png
cape_sovereign_wings.png

mantle_dust_mantle.png
mantle_aura_mantle.png
mantle_flame_mantle.png
mantle_sovereign_mantle.png

sigil_fracture_sigil.png
sigil_spark_sigil.png
sigil_omega_sigil.png
```

### Art spec
- Size: **120×180px** — exact companion body dimensions
- Background: **transparent** (PNG with alpha)
- Style: dark fantasy overlay — visible but not overwhelming
- Crown/hat pieces sit on the head area (top ~30px of canvas)
- Body/robe fills the torso (~30–150px vertical range)
- Cape drapes behind (~0–180px, sits behind body layer in code)
- Mantle wraps shoulders (~20–80px)
- Sigil is a chest glyph (~60–120px, centred)

### Recommended order
1. **cape_shadow_cape** — first unlock at 25 dives, most players see it
2. **body_thread_robe** — first body piece at 15 dives
3. **crown_ember_circlet** — first crown at 1 dive
4. Sovereign tier pieces for all slots — endgame art

---

## ENEMY ART  `assets/enemies/`

### Current status
All 20 enemy names are mapped and require() calls are ready — just commented out.  
**Problem:** Gemini art had white backgrounds. Needs dark/transparent backgrounds.

### Fix for new art
Generate with prompt additions:  
`"dark fantasy character, black background, dramatic lighting, isolated figure on void, no background"`

### Enemy list (20 total)
```
Common (10):    dissolution, the_fog, forgetting, stasis, inertia,
                drift, static, null, absence, the_hollow
Uncommon (5):   the_drain, the_veil, fracture, the_weight, corruption  
Rare (3):       the_warden, null_sovereign, fracture_prime
Epic (1):       entropy_prime
Boss (1):       athanors_shadow
```

### Art spec
- Size: **90×112px** — battle scene dimensions (or larger, will scale)
- Background: **transparent or very dark**
- Style: abstract entropy entities — fog, dissolution, geometric fractures
- Each should feel like a **force** not a creature

---

## CODE TASKS FOR NEXT SESSION

### High priority
- [ ] Companion daily law API — archetype-specific law generated daily, shown in COMPANION LAW section
- [ ] Battle lore drops — archetype lore fragment drops on wave 3 / 5 / 10
- [ ] Loot system — 50 items Mac builds, drop from battles, equip from inventory
- [ ] Companion needs panel — flesh out the 0% energy display

### Medium priority  
- [ ] Enemy PNG wiring — once art is remade with dark backgrounds, one-line uncomment per enemy
- [ ] Gear visual on companion — once gear PNGs land, overlays auto-render
- [ ] Scene PNG per skin — currently all skins share one scene; could do per-archetype scene art

### When Mac drops art
- **Companion portrait**: uncomment 1 line in `COMPANION_IMAGES`, test in dev stage viewer
- **Gear piece**: uncomment 1 line in `GEAR_IMAGES`, equip via dive count trigger
- **Enemy**: uncomment 1 line in `ENEMY_IMAGES`, spawns automatically in battle

---

## LOOT SYSTEM SPEC (build when ready)

Mac makes ~50 items. Each item has:
```
id, name, glyph, rarity (common/uncommon/rare/epic), type (consumable/equip/relic)
effect (string description), xpBonus?, attackBonus?, image? (path to asset)
```

Items drop from battle victories weighted by enemy rarity.  
Stored in `sol_inventory` AsyncStorage array.  
Displayed in new INVENTORY tab or section in companion screen.  
Equippable items slot into gear system or companion buffs.

---

*Generated: 2026-06-13 · Sol v3.29.0*
