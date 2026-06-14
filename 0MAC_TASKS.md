# MAC TASKS — Sol App
> Work to do solo between sessions. Ordered by impact.

---

## ART — Enemy Sprites `assets/enemies/`
> Prompt tag for ALL enemies: `dark fantasy entity, void creature, abstract force, black background, dramatic rim lighting, isolated figure, no text, painterly, atmospheric, 512x512`
> Drop PNG into `assets/enemies/` then uncomment the matching line in `ENEMY_IMAGES` in companion.tsx

### Sol enemy names (must match filename exactly — lowercase, underscores):
```
dissolution.png       the_fog.png          forgetting.png
stasis.png            inertia.png          drift.png
static.png            null.png             absence.png
the_hollow.png        the_drain.png        the_veil.png
fracture.png          the_weight.png       corruption.png
the_warden.png        null_sovereign.png   fracture_prime.png
entropy_prime.png     athanors_shadow.png
```

### What each should look like (hand to image gen):
- **Dissolution** — figure unravelling into particles, no solid form
- **The Fog** — humanoid silhouette lost in rolling mist, no face
- **Forgetting** — faded figure with blank space where features should be
- **Stasis** — figure frozen mid-motion, crystallised, cracking
- **Inertia** — heavy shapeless mass, anchored to ground, gravity distortion
- **Drift** — weightless ghost drifting sideways, trailing void smoke
- **Static** — pixelated glitch entity, crackling with white noise
- **Null** — absolute black void in humanoid shape, no detail
- **Absence** — outline only, nothing inside, hollow silhouette
- **The Hollow** — caved-in chest, void visible through torso
- **The Drain** — tentacled mass with suction mouths, draining aura
- **The Veil** — translucent wraith behind a curtain of light
- **Fracture** — shattered geometric form held together by tension
- **The Weight** — enormous compressed figure, crushed downward
- **Corruption** — organic rot spreading across a humanoid host
- **The Warden** — armoured colossus, gate motif, chains
- **Null Sovereign** — crowned void entity, black crown, zero pupils
- **Fracture Prime** — all of Fracture but 3× bigger, shattering space
- **Entropy Prime** — cosmic horror, star-consuming mouth, spiral arms
- **Athanor's Shadow** — inverted version of your companion, mirror dark

---

## ART — Companion Portraits `assets/companions/`
> Naming: `archetype_stage.png` e.g. `vigil_1.png`, `alchemist_3.png`
> Size: 200×280px minimum. Dark/transparent background.
> Do stage 1 and stage 5 first — biggest impact.

| Archetype | Stage 1 feel | Stage 5 feel |
|-----------|-------------|-------------|
| vigil | small hooded scholar, lantern | transcendent librarian, floating books |
| alchemist | apprentice with flask | sovereign alchemist, fire halo |
| sentinel | young armoured guard | crystal colossus |
| wanderer | cloaked traveller, dirt road | horizon walker, cosmic cloak |
| archivist | ink-stained scribe | ancient archivist, ink sea around them |
| helix | restless cat-spirit | chaotic mercurial being, colour-shifting |

---

## ART — Gear Overlays `assets/gear/`
> Size: exactly 120×180px. Transparent background PNG.
> Stacks over companion — keep detail in the zone that matters.

```
crown_ember_circlet.png     body_thread_robe.png
crown_sight_crown.png       body_scholar_robe.png
crown_forge_crown.png       body_void_robe.png
crown_sovereign_halo.png    body_sovereign_robe.png

cape_shadow_cape.png        mantle_dust_mantle.png
cape_drift_cape.png         mantle_aura_mantle.png
cape_void_cape.png          mantle_flame_mantle.png
cape_sovereign_wings.png    mantle_sovereign_mantle.png
```

---

## CONTENT — Build These Files (plain text / JSON)

### Loot item descriptions `LOOT_DESCRIPTIONS.md`
16 loot items already exist in code. Write 1-sentence flavour text for each:
```
NULL SHARD, VOID DUST, ENTROPY INK, FOG FRAGMENT, HOLLOW SEED,
STASIS THREAD, CLARITY LENS, MEMORY ORB, FRACTURE GLYPH,
CORRUPTION DUST, VEIL SHARD, WARDEN'S SEAL, NULL CORE,
SOVEREIGN RUNE, ENTROPY EYE, ATHANOR'S EMBER
```

### Spell names per archetype `SPELLS.md`
Each archetype gets 3 spells (name + 1-line effect). Used in battle SPELL button.
Format:
```
VIGIL: Lantern Flash, Archive Seal, Tower Ward
ALCHEMIST: Acid Flask, Transmute, Forge Burst
SENTINEL: Shield Slam, Crystal Lock, Resonance
WANDERER: Dust Step, Horizon Pull, Wind Strike
ARCHIVIST: Ink Bind, Page Storm, Codex Seal
HELIX: Chaos Spark, Mirror Slash, Entropy Shift
```

### School subject list `SCHOOL_SUBJECTS.md`
22 doors of the school. List all 22 domains with:
- Door name
- 1-sentence description
- 3 example dive topics

---

## CODE — Easy Solo Tasks

- [ ] Set `SHOW_DEV_STAGE = false` before any public build (companion.tsx top of file)
- [ ] Drop enemy PNGs into `assets/enemies/` — they auto-wire into battle
- [ ] Drop companion PNGs into `assets/companions/` — auto-replaces SVG
- [ ] Drop gear PNGs into `assets/gear/` — auto-renders as overlays
- [ ] Uncomment lines in `ENEMY_IMAGES` / `COMPANION_IMAGES` / `GEAR_IMAGES` after adding art

---

## RELEASE CHECKLIST
- [ ] `SHOW_DEV_STAGE = false`
- [ ] Version bump in `app.json` + settings footer
- [ ] All enemy/companion/gear images verified
- [ ] `eas build --profile preview --platform android`
- [ ] Rename APK: `SOL_V{version}.apk`
