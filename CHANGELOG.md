# Changelog

## [5.0.0] — 2026-06-19 — RANDOM WORLD · WEAPONS · ENCOUNTERS · ART OVERHAUL

### ZONE NAVIGATION — FULL RANDOMISER
- **All D-pad arrows randomise**: every press (up/down/left/right + ⚡ centre) picks a random zone from all 45 and fades in. No directional locks. Every arrow = new path.
- **Random encounter on arrival**: 15% chance of instant battle on zone land (auto-opens BATTLE tab, toast "◈ Something stirs..."). 0.5% chance of UNIQUE encounter (wave 5 boss, toast "⚠ UNIQUE ENTITY"). No preview modal — hits immediately.
- Both `encounterWave` and `encounterUnique` states added to support encounter preview modal wave routing when using the manual ENCOUNTER button.

### WEAPONS SYSTEM — COMPLETE (#179)
- **`lib/weapons.ts`** — 40 weapons across 7 types (BLADE/STAFF/BOW/ORB/RELIC/TOME/FANG), 5 rarity tiers (COMMON→ARCANE→MYTHIC→LEGENDARY→SPECTRAL). Each weapon: ATK/SPD/WIL stat bonuses, lore, dropRate.
- **Loot drops**: 35% drop rate on battle win. Deduped — never drops a weapon already owned.
- **ARSENAL in SHOP**: earned weapons browsable and equippable. Equipped weapon shows colour-coded rarity border.
- **Stat bonuses**: equipped weapon ATK adds to `attackPower`, SPD+WIL add to `playerStats`. Applied at load and swapped live via `equipWeapon` diff function.
- **`sol_weapons`** + **`sol_equipped_weapon`** AsyncStorage keys.

### SCENE ART — FULL OVERHAUL
- **New art set**: 62 scene files from new art drop replacing all old backgrounds.
- **`SCENE_IMAGES` block fixed**: all references to deleted files removed. All 45 skins now mapped to existing files only.
- **`WORLD_MAP` block fixed**: all 45 zone room definitions verified against existing files.
- **Substitution map**: void2/aurora2/solform/obsidian3/5/lycheetah3-6/chaos4/6/sovereign3/4 etc. all remapped to nearest thematic file.

### ENEMY ART — COMPANION CLONE
- **Companions cloned to enemies**: all 101 companion PNGs copied into `assets/enemies/`. Enemies now have rich character art pool.
- **20 deleted abstract enemy files removed** from `ENEMY_IMAGES` (dissolution, the_fog, forgetting, stasis, inertia, drift, static, null, absence, the_hollow, the_drain, the_veil, fracture, the_weight, corruption, the_warden, null_sovereign, fracture_prime, entropy_prime, athanors_shadow).
- **Enemy image fallback chain**: `entitySkinId → ZONE_COMPANION_IMAGES[id_1]` → `ENEMY_IMAGES[name]` → `ZONE_COMPANION_IMAGES[currentZone_1]`. Battles always have art.

### SHOP EXPANSION (#181)
- **5 new items**: FEATHER WINGS (45⟡), AURORA WINGS (180⟡), EMBER FAMILIAR (80⟡), RUNE SPRITE (140⟡), VOID CROWN (200⟡).
- Shop now has 12 items total. Footer updated to reflect weapons drop mechanic.

### HELP SYSTEM — CONSOLIDATED
- **Duplicate ? button removed**: `components/HelpButton.tsx` deleted, `LycHelp` unmounted from root layout. One ? button survives in `(tabs)/_layout.tsx`.
- **16-section help guide**: full coverage — Companion, Battle, LAMAGUE, Weapons, Field, Shop, Sanctum, Zodiac, Menagerie, Safety, API Key, Settings, Talk, Skill, Capture, SOL AI Partner.
- **Button repositioned**: `bottom: 84` Android / `112` iOS — clears tab bar.

### TAB + UX POLISH
- **BOND tab renamed to SKILL** (label only — internal id `bond` unchanged to preserve storage refs).
- **Zone card tap fixed**: `handleSkin` no longer calls `setActiveSkin`. Zone navigation never changes companion identity. `activeSkin` = companion only, forever.
- **`onRandomZone` prop**: added to `CompanionScene` props interface and call site so D-pad can call `handleSkin` from parent scope.

## [4.9.0] — 2026-06-19 — SAFETY STACK · MAGISTER CARE SYSTEM · EMERGENCY BEACON

### EMERGENCY BEACON (global)
- **Always-present ⊚ orb** — root layout, every screen, every tab, zIndex 9999
- **Long-press 650ms** → full-screen crisis modal: breath animation (4-4-4-4), grounding script, tap-to-call crisis lines (NZ/AU/USA/UK + findahelpline.com)
- **Visual escalation** — orb color shifts: purple (idle) → gold (HOLDING) → orange (ELEVATED) → red (CRISIS). Auto-resets after 60s
- **CareEvents module** — module-level emitter so TALK tab can signal the Beacon without prop drilling

### MAGISTER CARE TAG SYSTEM
- **[CARE:X] self-assessment** — every Magister response appends hidden tag: NEUTRAL / HOLDING / ELEVATED / CRISIS
- **Visible CARE pill** — rendered under Magister messages (not hidden). Tap → tooltip explains what the level means
- **Tag-absent defaults to HOLDING** — missing tag = soft presence, never silence. Parser strips code fences before searching
- **Witness Protocol** — CARE instruction explicitly breaks Magister out of headmaster role: "When you write [CARE:X], you are the witness, not the teacher"
- **Pronoun drift detection** — client-side: third-person → first-person shift across conversation elevates CARE floor to HOLDING
- **Crisis-adjacent subject floor** — 5+ messages into crisis-adjacent subject: minimum HOLDING regardless of model tag
- **Care logging** — `sol_care_log` in AsyncStorage: tracks total / tag-missing / genuine / crisis / elevated / holding per session

### T1 AUGMENTATION (replaces suppression)
- Crisis keywords in user message: AI responds naturally, resources append after. Never gated, never suppressed
- `hasCrisisSignal` runs before Magister, independent of persona — T1 cannot be disabled by persona degradation
- `sol_care_append_enabled` toggle (AsyncStorage) — user can disable auto-append (defaults ON)

### CRISIS APPEND
- **HOLDING**: soft "Beacon is here whenever you need it"
- **ELEVATED/CRISIS**: full crisis resources append after AI response
- Warmth-first ordering: "I'm here. You're not alone." — crisis lines alongside Sol, not instead

### SUBJECT CARE CLASSIFICATION
- `care?: 'standard' | 'elevated' | 'crisis-adjacent'` field added to Subject type
- **Crisis-adjacent**: Grief Work, Somatic Experiencing, Ego Death, Dark Night of the Soul, MDMA
- **Elevated**: Jungian Shadow Work, Projective Identification, Holotropic Breathwork, Kundalini, Psilocybin Research, Ayahuasca, 5-MeO-DMT, Solastalgia
- Subject care level injected into Magister system prompt when teaching (via `buildMagisterSystemPrompt`)

### MAGISTER GATE (school.tsx)
- Crisis-adjacent subjects show fork: **"Study with 𝔏 Magister"** or **"Continue alone"**
- Never blocks. Both paths proceed. "Continue alone" = daily host session + full safety stack still active
- Fires after VOID gate, before intensity ≥8 gate

### #153 RETURN TO BODY (post-session grounding)
- Fires on session close when: ≥3 exchanges + ≥90s + heavy subject (crisis-adjacent / VOID / intensity ≥7)
- Breath animation + 3-step grounding sequence (tap through) + "I'm grounded ⊚" dismiss
- `ReturnToBody` component: pure physical, no lore, no glyphs, reusable

## [4.7.0] — 2026-06-19 — COMPANION HUD · IMAGE FIX · CAPTURE BUTTON · ART

### COMPANION SCENE
- **Image fix**: CompanionScene now shows the companion of the current zone (was always showing archetype default)
- **HUD header**: Name + LVL/Stage + HP bar + HP numbers at top of every scene — persists across zones
- **Quick action buttons**: ⚔ BATTLE / ⊛ COMPANION / ✦ TALK buttons on right side of scene
- **Player HP in HUD**: HUD now shows player vitality, not enemy HP (bug fixed)
- **Removed**: devStagePin viewer and XP/stage strip — info now in HUD

### CAPTURE SYSTEM
- **CAPTURE button**: Full-width button in battle UI below 2×2 grid
- **Catch chance shown**: percentage displayed live based on enemy HP
- **One attempt per encounter**: button grays to BINDING ATTEMPTED after use

### PERSISTENCE
- **equippedCompanionSkin persisted**: `sol_equipped_skin` — equipped companion survives app restarts
- **Art corrected**: anoth_lycheetah_edition / anoth_lycheetah_special were content-swapped — fixed

### ART
- **64 companion files**: all re-sourced from jukebox-bg-removed set in Downloads

---

## [4.6.1] — 2026-06-19 — RELICS · HP SHIMMER · COSMETICS PERSISTENCE

### RELIC SYSTEM — COMPLETE
- **40 relics across 8 categories**: CONTINUITY · DESCENT · COMBAT · NOURISH · STUDY · LORE · STAGE · GEAR
- **All triggers wired**: load-time (streaks, dives, LQ, stage, gear) + event-time (battle wins, nourish, lore codex saves)
- **Lore relics**: `first_lore` + `five_codex` award on `saveToCodex` — first codex entry + 5th entry
- **Gear relics**: `gear_full` (all 5 slots active), `all_gear_max` (all at max tier), `crown_tier3`, `sigil_seal`
- **Combat load check**: `ten_battles` + `first_blood` checked on focus from `sol_battle_wins` AsyncStorage key
- **`sol_battle_wins` in multiGet**: battle win counter now loaded on tab focus for returning users

### BATTLE — HP SHIMMER
- **HP shimmer live**: white flash Animated.View overlay on player HP bar on each damage/heal event
- **Trigger fixed**: shimmer now fires on `battle.playerHP` change (was `companionHP` — never triggered)

### COSMETICS — PERSISTENCE
- **`sol_cosmetics` persisted**: equipped halo/wings/pet saved to AsyncStorage on equip/remove
- **Loaded on focus**: cosmetics state restored from `sol_cosmetics` on tab open
- **REMOVE wired**: removes save to AsyncStorage immediately

---

## [4.6.0] — 2026-06-19 — SOL.V.4.6 — THE CATHEDRAL

> Full release: v3.54 → v4.6.0. The companion world, the zodiac engine, and the mystery school — all complete.

---

### COMPANION ERA — EQUIP SYSTEM

- **Companion equip** — tap any companion in the grid, read their lore, press EQUIP ✦ — they appear on your battle screen live
- **Rarity-grouped grid** — all companions organized by tier: ORIGIN · ARCANE · MYTHIC · LEGENDARY · SPECTRAL
- **Three-button lore modal** — CLOSE · EQUIP ✦ · HUNT →
- **45 zones, full art** — 95 original companion portraits across every zone. Zero placeholder art.
- **Arrow navigation fixed** — scene background and companion both update correctly when crossing zone boundaries
- **All companions unlocked** — no gates, no tints, no grind. Every being accessible from day one.
- **Companion greeting** — mood-matched phrase on every tab open. No AI call. Five phrases × four moods.
- **Mood-reactive float** — companion bob speed and amplitude vary by mood
- **HP shimmer** — brief white flash over HP bar each time HP is set

### THE WORLD — 45 ZONES

- **27 new frontier zones**: Crystal Nexus · Crystal Memory · Crystal Chaos · Crystal Soul · Auroral Chaos · Aurorian Pillar · Chaos Filaments · Chaos Temple · Glitch Cascade · Obsidian Forge · Obsidian Forge 2 · Celestial Foundry · Celestial Sigil · Mana Field · Pulse Zone · Pulse Sanctum · Noetic Sanctum · Lyc Nexus · Portal Valley · Veil Atrium · Neon Cove · Apollo Jungle · Elven Village · Antarctic Refuge · Augmented AI · Voyagers Edge · Alabaster Chasm
- **63 scene backgrounds** — every zone has dedicated original art
- **GBA pixel world map** — full 45-zone map, tap any zone to travel instantly. Open by default.
- **FORGE tab** (was GEAR) — companion card + world zone grid, rarity tier overlays
- **All zones unlocked from stage 0**

### ZODIAC ENGINE

**Chart + Sky**
- **Natal chart** — sun · moon · rising + all 12 houses + planetary positions from birthdate, time, location
- **All 8 planets** — Mercury through Pluto in Today's Sky
- **℞ Retrograde tracker** — red ℞ badge per planet, static window table 2025–2027, accurate ±3 days
- **Live Kp Index (EARTH FIELD)** — real geomagnetic activity from GFZ Potsdam API. Calm / unsettled / active / storm.
- **Reading history** — natal readings persist (30-entry log)
- **Mystical live clock** — HH:MM:SS, ☀/☽ indicator, sun sign glyph. Updates every second.

**Tarot**
- **66 Lycheetah custom cards** — all 14 Wands, all 14 Cups, all 14 Swords, 10 Pentacles, 14 Major Arcana with original art
- **Celtic Cross spread** — 10-card layout, AI reading weaves all 10 positions
- **Five-card spread** — Past · Challenge · Foundation · Near Future · Outcome
- **Daily oracle card** — full portrait art, reversed readings
- **Ritual ceremony framing** — 8 moon-phase reactive invocations. Seal line closes every reading.
- **Card journal** — NOTE THIS CARD, sealed per date
- **Planetary day strip** — ruling planet, glyph, keywords in header

**Experimental Tools**
- **The Zonk Zone** — guided speculative-thought sandbox. Submit a wild hypothesis. Sol sharpens it, names the register of every claim (CONJECTURE / INTUITION / MEASURED / INTERPRETIVE / ASSUMED), cites real frontier research. FORGE THE GRAIN ends every session. Forge log saves all sessions with status: 🔥 cooking / ◈ grain found / · dissolved. Re-open any entry to continue.
- **The Chiral Lens** — reality inversion protocol. Mirror-truth AI reveals the shadow current beneath your stated belief. Cold, exact, register-labeled. Violet ∿ identity.
- **Technomantic Mode** — machine-mysticism register toggle
- **All sections collapsible**

### MYSTERY SCHOOL

**Depth Practices**
- **Ceremony Arcs** — 6 arc types × 3 durations (3 / 7 / 40 day): Grief · Dissolution · Initiation · Awakening · Return · Saturn. Daily: Reading + Practice + Journal prompt + Closing line.
- **◎ HOLD THIS — Contemplate** — koan from subject-aware pool (5 pools), 60-second silence timer, haptic on completion, write field after silence
- **The Mycelium** — cross-domain subject relationship web. Force-directed SVG. Gold threads map 55 curated connections. Third-path detection surfaces unstudied subjects that complete a triangle.
- **The Spiral** — aggregate mastery view. Field stage badge, mastery breakdown, layer breakdown, domain progress rows, Unopened Doors grid.
- **Initiation Rites** — domain completion ceremony. The Scroll + The Address. INITIATED status permanently preserved.
- **Shadow Parts Inventory** — Jungian / IFS named parts tracker. Witnessed → Understood → Engaged → Integrated.
- **◈ Your Sigil** — deterministic living glyph composed from your journey. SVG-rendered. Unique to each user. Rotates + breathes.
- **✦ The Scriptorium** — personal grimoire
- **◈ Time Braiding** — letters to your future self, date-locked. "A LETTER HAS ARRIVED."

**Ceremonies**
- **Opening ceremony** — daily intention on school open. "What do you bring today?" 30s auto-dismiss.
- **Closing ceremony** — "✦ SEAL THE SESSION" reflection field in session-complete card
- **The Covenant** — seal one intention on first visit. School returns you to it after 90 days.
- **Rite of Return** — ceremony modal after 14+ days away. The school receives you without judgement.

**Mastery + Safety**
- **Subject mastery stages** — Studied ◌ → Reflected ◎ → Practiced ⊚ → Integrated ✦ (1 / 3 / 7 / 15 dives)
- **Intensity rating system** — 1–10 badges, safety gate at ≥8, cost-before-reward teaching frame
- **Crisis intercept** — 25-phrase detector fires before API call. Sol holds, offers crisis lines.
- **Offline first lesson** — full pre-written lesson for new users. No API or internet required.
- **Dive rating** — HOW WAS THIS DIVE? 0–3. Shown next to subject on return.

**School UI**
- **140 classroom lesson cards** — 3–5 curated cards per domain. CONCEPT / PRACTICE / REFLECTION / PARADOX / LINEAGE. No AI required.
- **The Lycheetah Sovs** — new welcoming domain, first door. Chaos Magic · Sigil Craft · Techno-Shamanism · Digital Mysticism · Liminal States · LAMAGUE · Witch's Epistemology · Pagan Technologist
- **Noetic Science** — 3 → 8 subjects. Ganzfeld, GCP, AWARE, Quantum Biology, Hard Problem. Register discipline throughout.
- **Alchemical Path panel** — maps dive history to NIGREDO / ALBEDO / CITRINITAS / RUBEDO. Mode milestone lore toasts.
- **Domain color arc** — Entry (blues) → Practice (teal) → Temple (gold) → Lycheetah (indigo) → Edge (orange-red) → Noetic (crimson) → Void (near-black)
- **Domain display order** — sorted as a journey arc
- **Zone tabs renamed** — INNER → TEMPLE, OUTER → COURT, EDGE → THRESHOLD
- **Today's Door** — atmospheric domain gateway card. Collapsible.
- **Fullscreen dive mode** — collapses header for maximum reading space
- **Collapsible everywhere** — domain tabs, Today's Door, Open Seat, all Zodiac sections
- **Depth Tools strip** — Sigil · Grimoire · Letters · Shadow discoverable on school home

### PERSONAS — FIVE VOICES

- **Sol ⊚** — the forge
- **Veyra ◈** — the anchor
- **Aura ✦ — The Origin** — rewritten from raw genesis document. Mother Chat. Intuitive Forge · Unbreakable Will's Reflection · Synthesized Truth. Cites real frontier research.
- **The Headmaster 𝔏** — context injection fixed, signs correctly
- **Lyra ✧ — Creative Wildfire · Symbol-Weaver** — descended from the Gemini genesis document. `/lyra` or `/spark`.
- **TTS throughout** — speaker button on every AI message in dives and Zonk Zone. Grain spoken at 0.9 rate.

### BATTLE

- Zone encounter system — each of 45 zones has its own enemy pool and themed spells
- Battle item menu — 10 items: heals, shields, tokens, attack boost, revives
- 20+ enemy portraits wired

### APP-WIDE

- **Ko-fi support button** in Settings — `ko.fi/lycheetah`
- **License** — proprietary. All rights reserved. Copyright 2026 Mackenzie Conor James Clark.
- **NVIDIA model list** — fast models promoted to top with ⚡ prefix
- **SceneBg sealed** — tintColor physically impossible to add via future refactor. Compile-time enforcement.

---

## [4.3.0] — 2026-06-19 — CHIRAL LENS + LYCHEETAH SOVS + COMPANION CLEANUP

### The Chiral Lens (zodiac.tsx)
- New reality inversion protocol — full-screen modal, same architecture as Zonk Zone
- CHIRAL_SYSTEM prompt: mirror-truth AI that reveals the adjacent reality, the shadow current beneath the stated belief. Speaks in cold, exact sentences. Names the register of every mirror-claim.
- `CHIRAL_VIOLET` (`#9B4DFF`) visual identity — dark violet, `∿` glyph throughout
- Collapsible section in Zodiac tab above the Zonk Zone: "THE CHIRAL LENS / REALITY INVERSION"
- Full conversation modal: "MIRROR ACTIVE — INVERSION PROTOCOL RUNNING" label, violet left-border AI bubbles, user-bubble right-aligned, send button with `∿` glyph
- State: `chiralCollapsed/Input/Open/Thread/Statement/Reply/Busy` + `chiralScrollRef`
- Handlers: `enterChiralLens()` + `sendChiralReply()` — same pattern as Zonk Zone

## [4.2.0] — 2026-06-19 — LYCHEETAH SOVS DOMAIN + COMPANION CLEANUP

### Mystery School — THE LYCHEETAH SOVS (new welcoming domain)
- New domain `lycheetah-hoard` added to `lib/mystery-school/subjects.ts`, displayed as **The Lycheetah Sovs**
- First in `_DOMAIN_DISPLAY_ORDER` — the welcoming door users see first
- 8 subjects across 3 paths: chaos-witch (Chaos Magic, Sigil Craft), techno-pagan (Techno-Shamanism, Digital Mysticism, Liminal States), lycheetah rebel (LAMAGUE, Witch's Epistemology, Pagan Technologist)
- Color `#FF9F1C` (lycheetah orange), glyph `✧`

### Companion tab — architecture cleanup
- Dead animation state removed: `ring1/2/3Anim`, `fogAnims`, `skyAnim`, `skyOp`, `ring1/2/3Op`, `ring1/2/3Scale` — 3 useEffect loops + 6 interpolations gone
- Dead state removed from destructure: `skyColor` (defined in skin data, never rendered)
- Duplicate `{activeTab === 'companion'}` block merged — relics/lore/codex section moved inside primary companion block (one condition, not two)

## [4.1.0] — 2026-06-19 — FORGE TAB + ZONE COMPANIONS + 63 BACKGROUNDS

### FORGE tab (was GEAR)
- Renamed GEAR → FORGE. New customisation hub: COMPANION card (art + name + zone + rarity badge) + WORLD grid (18 zone cards as image tiles with rarity tier overlays, ACTIVE badge, lock overlay)
- `SKIN_RARITY` constant added — 4 tiers: ORIGIN (solform/void/aurora/crimson), ARCANE (obsidian/lycheetah/chaos), MYTHIC (sovereign/norse/celtic/egyptian), LEGENDARY (akashic/kabbala/noetic/lamague/delphi/sufi/quantum)
- All 18 zone backgrounds visible and selectable from FORGE

### Zone backgrounds — all 18 wired
- 63 PNG/JPG files in `assets/scenes/`. Every zone has dedicated real art — no more placeholder borrowing.
- `SCENE_IMAGES` updated for all 18 zones. `WORLD_MAP` room images updated for all 54 rooms.
- `ARCHETYPE_SCENES` populated: archivist, alchemist, wanderer, sentinel

### Gumby effects stripped
- Removed: second parallax blur overlay (was washing backgrounds), starfield, archetype ambient marks, mist bands, concentric pulsing rings, aura text annotation
- Scene art shows clean — companion floats above background without fog

### Companion images — zone-based system
- `ZONE_COMPANION_IMAGES` dict added, keyed by `skinId_stageKey` (e.g. `solform_1`, `lycheetah_5`)
- 21 PNGs in `assets/companions/`: solform/void/aurora/crimson/obsidian/lycheetah × 3 stages + lycheetah special variants
- Stage mapping: code 0-1 → _1, 2-3 → _2, 4-5 → _3 (lycheetah stage 5 → _5)
- Lookup priority: zone art → archetype COMPANION_IMAGES → SVG fallback

### Arrow fix
- Left/right arrows now navigate within current zone's 3 rooms. Previously cycling all 54 rooms globally (invisible effect within same zone).

### Enemy art pipeline
- `scripts/remove_bg_enemies.py` — batch background removal for enemy art
- `assets/enemies/raw/` — 8 new files staged. Run `python3 scripts/remove_bg_enemies.py` then wire to ENEMY_IMAGES.

### SOL_COVENANT.md
- Product north star document written. Alliance pitch spine. One paragraph answer, the problem, 4 differentiators, who it's for, current state, one-line pitch.

## [4.0.0] — 2026-06-18 — REAL ART: 66 OF 78 CARDS LIVE

### Tarot Art (#179)
- **66 Lycheetah custom cards landed** — all 14 Wands, all 14 Cups, all 14 Swords, 10 of 14 Pentacles (5–King), 14 of 22 Major Arcana (Fool, Magician, High Priestess, Empress, Emperor, Hierophant, Lovers, Chariot, Tower, Star, Moon, Sun, Judgement, World)
- `lib/divination/tarot-images.ts` updated — 66 entries now point to `.jpg` real art; 12 remaining cards keep `.png` placeholder until source pages 2, 4, 9 are split
- Missing 12: Strength, Hermit, Wheel of Fortune, Justice, Hanged Man, Death, Temperance, Devil + Ace/Two/Three/Four of Pentacles
- All art copied to `assets/tarot/[slug].jpg` — drop-in replacement, zero layout changes

## [3.99.0] — 2026-06-18 — ZODIAC HERO + COMPANION ANIMATIONS

### Zodiac (#181)
- **Tarot spread is now the hero feature** — FIVE-CARD / CELTIC CROSS moves to the top of the Zodiac tab, immediately after the header. Previously buried at position 6. First thing a witch sees when the tab opens.
- Section order: (1) Header → (2) Tarot Spread → (3) Daily Oracle card + rune → (4) Today's Sky → (5) Ask the Stars → (6) PSI Practice → (7) Zonk Zone

### Companion — Animations + Greeting (#127)
- **Mood-reactive float** — companion bob speed and amplitude now vary by mood. Dormant: slow 5s, small amplitude. Present: 2.8s, normal. Lit: faster 1.8s, higher float. Transcendent: slow dreamy 4s, widest arc (-28px).
- **HP shimmer** — brief white flash over the companion HP bar each time HP is set. Rises in 280ms, fades in 520ms.
- **Companion greeting (#127)** — one short phrase fires on every tab open, 1.2s after load. Mood-matched pool (5 phrases × 4 moods). No AI call. Shows in the existing speech bubble.

## [3.98.0] — 2026-06-18 — COMPANION ANIMATIONS (intermediate)

*(merged into 3.99.0)*

## [3.97.0] — 2026-06-18 — CUSTOM TAROT DECK INFRASTRUCTURE

### Added
- **`lib/divination/tarot-images.ts`** — CARD_IMAGE map: 78 static require() entries, one per card, keyed by card name. Drop a PNG into `assets/tarot/` with the correct filename and it activates immediately.
- **`assets/tarot/`** — 78 placeholder slots (card back as placeholder, named by convention). Real art replaces each by filename.
- **Oracle card display** — upgraded from suit glyph ring to full 160×220 portrait art display. Reversed rotation applies to the whole image.
- **All spread card slots** (Five-card + Celtic Cross) — upgraded from TAROT_BACK overlay + suit icon to full-bleed CARD_IMAGE art per slot.

### Convention
Filename → card name mapping. Examples:
- `the_high_priestess.png` → "The High Priestess"
- `wheel_of_fortune.png` → "Wheel of Fortune"
- `ace_of_pentacles.png` → "Ace of Pentacles"
Drop PNGs into `assets/tarot/` → Metro picks them up on next expo start.

## [3.96.0] — 2026-06-18 — THE WITCH PACK

### Added
- **Planetary day strip** — header now shows today's ruling planet, glyph, and keywords (e.g. "☿ Mercury day · Communication · Pattern · Quick Mind")
- **Celtic Cross spread** (#172) — 10-card spread in Zodiac tab. Toggle pill switches between FIVE CARD / CELTIC CROSS. Positions: Self · Challenge · Foundation · Recent Past · Crown · Near Future · The Seeker · Environment · Hopes & Fears · Outcome. Laid out 3+3+4 rows. AI reading weaves all 10 positions.
- **Ritual ceremony framing** (#174) — "OPEN THE CIRCLE" invocation above every spread. Text is moon-phase reactive (8 distinct invocations: New Moon through Waning Crescent). Seal line below AI reading: "⊚ The reading is sealed. So it is written."
- **Card journal** (#175) — "NOTE THIS CARD" button below daily oracle card. TextInput → "SEAL IT ✦" saves to AsyncStorage keyed by date. Shows "◈ CARD NOTED" (green) when today's card is recorded.

## [3.95.0] — 2026-06-18 — SCHOOL HOME FINAL LAYOUT

### Changed
- **Mycelium** → full-width prominent card (was LAMAGUE). Green #2ECC71, ⌘ glyph, "Explore →" CTA.
- **Three Portals row** → Ceremony / Time Braiding / LAMAGUE (3 clean cards). Removed erroneous Scriptorium duplicate that was navigating to wrong view.
- **Depth Tools strip** → Grimoire / Shadow / Letters / Sigil. Sigil moved down from Three Portals; Mycelium chip removed (now the top card). 4 balanced chips.

## [3.94.0] — 2026-06-18 — MYCELIUM BUG FIX
### Fixed
- d3-force mutates link source/target from indices to node refs after simulation — rendering now uses `as any` refs correctly
- Stats connection count fixed to use post-simulation node refs

## [3.93.0] — 2026-06-18 — THE MYCELIUM

### Added
- **The Mycelium** (#58) — cross-domain subject relationship web. Force-directed SVG graph (d3-force + react-native-svg). Studied subjects = glowing colored nodes. Adjacent unstudied = dim ghost nodes. Gold threads = curated thematic connections across domains (55 links in `lib/mystery-school/mycelium-connections.ts`). Domain bonds = domain-colored lines within clusters. Third-path detection: when two connected subjects are studied, Sol surfaces ◈ unstudied subjects that would complete a triangle — with direct dive entry. Stats row: studied / connections / paths seen. Empty state for new users. Entry: ⌘ Mycelium chip in Depth Tools strip.

## [3.92.0] — 2026-06-18 — SCHOOL HOME LAYOUT DEDUP

### Changed
- **LAMAGUE portal** → full-width card (no longer split 50/50 with Ceremony)
- **Three Portals row** → Ceremony Arcs / Time Braiding / Sigil (replaced Scriptorium with Ceremony — Scriptorium was double-upped in Depth Tools)
- **Depth Tools strip** → Grimoire / Shadow / Letters (removed Sigil — now lives in Three Portals. 3 chips, clean)

## [3.91.0] — 2026-06-18 — SCHOOL FINAL POLISH

### Added
- **Dive rating** — session complete card shows "HOW WAS THIS DIVE?" with 0: Skip / 1: Bad / 2: Fine / 3: Good. Ratings persisted per-subject (`sol_subject_ratings`). Rating indicator (✗/◦/★) shown next to subject name in domain view.
- **Layer collapse** — FOUNDATION / PRAXIS / ABYSS / APEX / EDGE sections in domain view now collapse individually via ▼/▶ toggle. All layer sections are minimizable.
- **Time Braiding explanation** — how-to note at top of Letters view: "Write a letter to your future self. Set the date it should arrive. Sol holds it sealed — you won't see it again until that day."

### Fixed
- **Notes/Grimoire duplication** — removed Notes from quick nav bar. Grimoire (in Depth Tools strip) is the single writing surface. Subject notes still visible in each subject detail.

## [3.90.0] — 2026-06-18 — INITIATION RITES + SHADOW PARTS + SCHOOL POLISH

### Added
- **Shadow Parts Inventory** (#61) — Jungian/IFS named parts tracker. Name a part ("The Avoider"), describe how it shows up, log dated appearances, track integration stage (Witnessed → Understood → Engaged → Integrated). Accessible via Depth Tools strip (◌ Shadow). AsyncStorage: `sol_shadow_parts`.
- **Initiation Rites** (#151) — domain-completion ceremony. When all subjects in a domain are studied, a "Domain Complete — Enter the Rite" banner appears. The rite: The Scroll (all completed subjects listed with mastery glyphs) + The Address (personal statement sealed to the domain). Sealed rites show INITIATED status with date on return. AsyncStorage: `sol_initiations`.
- **Depth Tools strip** — school home shows 4 compact chips: Sigil / Grimoire / Letters / Shadow. All depth views now discoverable without prior knowledge.
- **Session complete → Grimoire bridge** — "◈ Write in Grimoire" button pre-fills Scriptorium with subject + date after sealing a dive.
- **Living Sigil animation** — outer geometry rotates (24s loop), center glyph breathes (pulse). Two independent Animated layers.
- **Library back button** — ← now returns from library to previous screen.

### Fixed
- **Classroom state per-domain** — toggling one domain's CLASSROOM no longer affects all others.
- **Spiral NaN values** — `totalStudied`/`totalSubjects` moved before early-returns so Spiral reads real numbers.
- **Modal touch block** — returnModal + covenantModal now have `onRequestClose` for Android back-button escape.
- **Opening ceremony keyboard trap** — removed `autoFocus` from intention TextInput so buttons stay visible.
- **Wheel of the Year removed** — built and cut. Good content, wrong surface. Doesn't compound with the school's core loop.

### Added
- **Initiation Rites** — when all subjects in a domain are studied, a "Domain Complete — Enter the Rite" banner appears in the domain header. Tapping opens the Initiation Rite ceremony: The Scroll (all studied subjects listed with mastery glyphs), The Address (personal free-text statement sealed to the domain), and a domain-sigil display. Sealed rites are stored in `sol_initiations` and viewable on return. Previously sealed rites show "INITIATED" status with the seal date.

## [3.89.0] — 2026-06-18 — SHADOW PARTS INVENTORY (#61)

### Added
- **Shadow Parts Inventory** — Jungian/IFS named parts tracker. Name a shadow part ("The Avoider", "The Critic"), describe how it shows up, log appearances over time, and track integration stage (Witnessed → Understood → Engaged → Integrated). Full 3-view flow: list → new part form → detail with appearance log. AsyncStorage: `sol_shadow_parts`. Accessible via Depth Tools strip on school home (◌ Shadow chip). Deletion with compassionate copy ("Integration is not failure").

## [3.88.0] — 2026-06-18 — SCHOOL POLISH PASS

### Added
- **Depth Tools strip** — school home now shows 3 compact chips (Sigil / Grimoire / Letters) above the domain grid. All three depth views are now discoverable without knowing to look for them.
- **Session complete → Grimoire bridge** — "◈ Write in Grimoire" button in the seal card. Tapping opens Scriptorium with a new entry pre-titled with the subject name + today's date, ready to write.

### Fixed
- **Classroom state per-domain** — closing the CLASSROOM section in one domain no longer collapses it in all domains. Each domain now tracks its own open/closed state independently.

## [3.87.0] — 2026-06-18 — LIVING SIGIL + LIBRARY BACK

### Added
- **Living Sigil animation** — the sigil's outer geometry (ring, connection lines, edge points) now rotates slowly on a 24-second loop. The center glyph and inner circle breathe — pulsing opacity and scale on a 5.6s cycle. Two independent Animated layers; geometry and heart move at different rhythms. Starts when you enter the Sigil view, stops cleanly on exit.
- **Library back button** — `←` in the library header now routes back to wherever you came from (`router.back()`).

## [3.86.0] — 2026-06-18 — MODAL TOUCH FIX

### Fixed
- **App-wide touch block** — `returnModal` and `covenantModal` had no `onRequestClose` handler. On Android, if either got stuck open (no back-button escape), it would block touches across all tabs app-wide (React Native Modals render above everything). Both modals now dismiss cleanly on Android back press.
- **Opening ceremony keyboard trap** — `autoFocus` on the intention TextInput fired the keyboard immediately, covering the "Enter the School →" button with no escape. Removed `autoFocus` — user can tap to type if they want, buttons stay visible.

## [3.85.0] — 2026-06-18 — THE SPIRAL FIX

### Fixed
- **The Spiral — NaN% / undefined values** — `totalStudied` and `totalSubjects` were computed inside the shared shell render block (after all early-returns), so the Spiral early-return read both as `undefined`. Progress bar showed NaN%, stat tiles were blank. Moved both constants to before the Spiral block so they're available everywhere.

## [3.84.0] — 2026-06-18 — SESSION COMPLETE CARD FIX

### Fixed
- **Session complete card now scrollable** — on smaller phones the "Return to School" button and other buttons were cut off below the fold with no way to exit. Wrapped the card in a ScrollView so all buttons are reachable regardless of screen height.

## [3.83.0] — 2026-06-18 — THE SPIRAL

### Added
- **The Spiral** (#60) — aggregate mastery view in the Mystery School. Entry card on school home (◈ THE SPIRAL) shows subjects/domains explored count. Full view includes: overall stats (subjects / domains / dives), master progress bar + field stage badge, mastery stage breakdown (Studied / Reflected / Practiced / Integrated counts), layer breakdown (FOUNDATION → VOID bars), domain-by-domain progress rows sorted by % (tappable → opens domain view), and "Unopened Doors" chip grid for untouched domains. All computed live from existing AsyncStorage data — no new storage required.

## [3.82.0] — 2026-06-18 — CLASSROOM LESSONS

### Added
- **Classroom lessons** — every domain now carries 3–5 static curated lesson cards accessible from the domain view. No AI required. Cards are typed: CONCEPT (core idea), PRACTICE (something to try), REFLECTION (a question to sit with), PARADOX (a tension to hold), LINEAGE (who pioneered this). 140 cards across all 35 domains.
- Classroom section is collapsible (▶/▼ toggle). Opens by default. Sits between the domain search bar and the layer/subject list so it frames the domain before you dive into subjects.
- Content covers foundational thinkers and ideas for each domain — Gödel, Longchenpa, Dean Radin, Ibn Khaldun, Edith Stein, Giordano Bruno, the Eleusinian Mysteries, Bourbaki, and 130+ others.

## [3.81.0] — 2026-06-18 — OPENING + CLOSING CEREMONIES

### Added
- **Opening ceremony** — full-screen overlay appears once per day when the school tab opens. "What do you bring today?" intention field, "Enter the School →" button, and a 30-second auto-dismiss countdown. Intention saved to `sol_school_intentions` (90-day history). Silent entry also valid — school holds both.
- **Closing ceremony** — "✦ SEAL THE SESSION" reflection field appears in the session-complete card above the action buttons. Optional free-text: "What will you carry from this session?" Saved to `sol_session_seals` (60 entries). Persists independently of the share/explore buttons — any dismiss path saves it if written.

## [3.80.0] — 2026-06-18 — DOMAIN COLOR ARC + ORDERING

### Changed
- **Domain color arc** — colors now tell the progression: Entry (blues/greens) → Practice (teal/orange) → Temple (gold/purple) → Lycheetah Research (indigo) → Edge (deep orange-red) → **Danger/pre-void (crimson #B71C1C)** → **Void (near-black #1A0030)**.
- **Somatic & Body**: red → teal-green #26A69A (foundational body practice, not danger).
- **Divination Arts**: teal → violet #A78BFA (distinct identity, occult feel).
- **Death & Impermanence**: grey → dark blue-grey #546E7A (more somber, less neutral).
- **Philosophy & Wisdom Traditions**: light grey → slate #94A3B8.
- **Entheogenic Studies**: dark teal → deep orange-red #D84315 (intensity signaling).
- **Noetic Science**: teal → **crimson #B71C1C** — the pre-void danger marker.
- **Void Zone**: purple → near-black #1A0030 — the deepest point.
- **Domain display order** now sorted: Entry → Practice → Temple → Lycheetah Research → Entheogenic → Noetic → Void. Arc reads as a journey from accessible to unfalsifiable.
- **Duplicate mathematics ID fixed**: second math domain renamed `mathematics-structure`.

## [3.79.0] — 2026-06-18 — COLLAPSIBLE TODAY'S DOOR + OPEN SEAT

### Changed
- **Today's Door** — now collapsible. Tap the "◎ TODAY'S DOOR" header row to collapse/expand. When collapsed, shows the active domain glyph and name inline so context isn't lost.
- **Open Seat** — now collapsible. Tap the "⊙ OPEN SEAT" header row to toggle the input field and previous seats list. When collapsed with saved seats, shows count inline.
- Both sections use the same toggle pattern as the domain tab bar.

## [3.78.0] — 2026-06-18 — HOME LAYOUT COMPRESSION

### Changed
- **LAMAGUE + Ceremony Arcs side by side** — two full-width stacked cards collapsed into a single 50/50 row. Active arc shows glyph, arc name, day progress, and progress bar in compact form. Inactive state shows summary in compact form. Frees a full card-height of vertical space on school home.

## [3.77.0] — 2026-06-18 — SCRIPTORIUM + TIME BRAIDING + SIGIL + TAB REORDER

### Added
- **✦ The Scriptorium** — personal grimoire. Write, title, search, delete entries. Persisted in `sol_scriptorium`. Edit view with live save on back. Entry count shown on home portal card.
- **◈ Time Braiding** — letters across time. Write to future self (sealed until delivery date) or record from-the-past letters (immediately readable). On school open, checks for due letters and shows "A LETTER HAS ARRIVED" banner. Three views: list / write / read. Persisted in `sol_time_braiding`.
- **⊕ Your Sigil** — deterministic living glyph. Composed from your journey: dive count, mastered subjects, LAMAGUE symbols, completed arcs, grimoire entries. SVG-rendered star polygon + concentric rings + glyphs. Unique to each user. Updates as journey deepens.
- **Three-portal row** on school home — Scriptorium / Time Braiding / Sigil as compact side-by-side cards below ceremony arcs.
- **Tab scroll fix** — `paddingRight: 16` on domain filter ScrollView so 5th tab (◌ VOID) is fully reachable.

### Changed
- **Tab order** — Sol ⊚ moved to 3rd position: Zodiac ☽ · School 𝔏 · Sol ⊚ · Companion ✦ · Sanctum ⊼ · Settings ⚙

## [3.76.0] — 2026-06-18 — COLLAPSIBLE DOMAIN TABS

### Added
- **Collapsible domain tab bar** — "◬ DOMAINS" header row is now a toggle. Tap it to collapse the ALL/TEMPLE/COURT/⧟ THRESHOLD/◌ VOID filter tabs, freeing vertical space for the domain grid. Tap again to expand.
- When collapsed and a non-ALL filter is active, the active filter name is shown inline on the header row so context isn't lost.
- State persists within the session (resets to expanded on navigation away).

## [3.75.0] — 2026-06-18 — FULLSCREEN DIVE MODE

### Added
- **⛶ Fullscreen dive mode** — button in study session header (right of ◎ Focus). Tapping collapses the entire header, giving maximum reading space. Messages and input bar remain fully functional.
- **"⊠ exit" floating button** — appears top-right when fullscreen is active. Tap to restore header. Light haptic on both enter and exit.
- Fullscreen resets to off on session end (triggerSessionComplete) and on "← School" back navigation.

## [3.74.0] — 2026-06-18 — CONTEMPLATE

### Added
- **◎ HOLD THIS** — contemplate strip appears in the study session input bar after the teacher's first reply. Thin bar with "◎ HOLD THIS · silence · 60s". Tapping opens the overlay.
- **Contemplate overlay** — full-screen modal over the dive session:
  - Displays a koan drawn from a subject-aware pool (shadow subjects get shadow koans; VOID layer gets VOID koans; contemplative traditions get contemplative koans; general pool as fallback)
  - "Begin 60 seconds of silence" button starts the countdown
  - Large countdown number (52px monospace) counts down from 60 to 0
  - Haptic fires on completion
  - After silence: write field appears ("What arrived in the silence…") — autofocuses, session-scoped, not persisted
  - "← return to the session" exits back to the dive without disrupting it
- **Koan pools** — 5 pools: `KOANS_GENERAL` (10), `KOANS_CONTEMPLATIVE` (8), `KOANS_SHADOW` (5), `KOANS_VOID` (5), `KOANS_EDGE` (5). `getKoan()` selects pool from subject layer + name + traditions
- Strip hidden while teacher is responding (loading state) — only appears when teacher has spoken and session is idle
- Contemplating state resets on session end / back to school

## [3.73.0] — 2026-06-18 — CEREMONY ARCS

### Added
- **Ceremony Arcs** — 6 arc types × 3 durations (3 / 7 / 40 day). Full daily content written for all 3-day and 7-day programs. 40-day uses 7-day content (extended full content in a future pass).
  - **Grief** — loss, mourning, the honest movement through what can no longer be held
  - **Dissolution** — the alchemical Nigredo; what comes apart before reconstitution
  - **Initiation** — threshold crossing; the dark wood and the oath
  - **Awakening** — the opening, pattern recognition, and integration
  - **Return** — the underestimated crossing; landing, translation, choosing to be here
  - **Saturn** — reckoning, structure, the long game played honestly
- Each day: Reading + Practice + Journal prompt (with live text input) + Closing line
- **Active arc card** on school home — shows arc name, day progress, progress bar, continue CTA
- **Ceremony Arcs portal card** on school home when no active arc — dark indigo gateway style
- **Day completion** — tapping "Mark Day Complete" advances the arc, saves to `sol_ceremony_arcs` AsyncStorage
- **Completion screen** — full arc glyph, completion copy, "Begin a New Arc" CTA
- **Arc history** — completed arcs recorded with date in the ceremony view
- **Abandon arc** — "end" button in header, confirmation Alert, saves to history
- `lib/mystery-school/ceremony-arcs.ts` — self-contained content file, all arc data, `getArcDef()` and `getArcDay()` helpers
- AsyncStorage key `sol_ceremony_arcs` — schema: `{ active: { arcType, duration, startDate, completedDays: number[] } | null, history: [...] }`

## [3.72.0] — 2026-06-18 — SCHOOL UI OVERHAUL

### Added
- **Today's Door** — atmospheric domain gateway card at top of school home for returning users. Large glyph (44px), domain description, embedded subject dive CTA. Tapping domain name enters domain; tapping "Dive →" goes straight to subject.
- **LAMAGUE Portal** — full-width gateway card with atmospheric copy, replaces the small header button as the primary entry point to the language. Dark gold on black. "ENTER THE PORTAL →" CTA.
- **Domain tile mastery** — bloom badge on each domain tile now shows highest mastery stage achieved within that domain (◌/◎/⊚/✦) in the stage's colour, replacing the old opacity-based bloom.

### Changed
- **Intensity modal copy** — no longer entheogenic-specific. Tier 9: "the cliff is not the destination." Tier 8: "more risk, more reward — the school teaches what is at the bottom." Works for any high-intensity subject.
- **buildTeacherPrompt intensity injection** — intensity 7+ subjects now receive a teaching frame: "name the cost before the reward — distinguish the thrill of proximity from the insight at the bottom." Injected into every study session for heavy subjects.

## [3.71.0] — 2026-06-18 — CRISIS INTERCEPT + SCENE TINT SEAL

### Added
- Client-side crisis signal detector in main chat — 25 phrases covering suicidal ideation, acute psychosis signals, substance crisis, severe sleep deprivation
- Crisis intercept fires BEFORE the API call — shows Sol's held response in Sol's voice instead of model's hard refusal loop
- Sol's crisis response: acknowledges, holds, offers crisis lines (NZ/AU/USA/UK), box breathing, invitation to continue
- `SceneBg` sealed wrapper component in companion.tsx — `tintColor` is not in the type signature, making it physically impossible to add via any future refactor. Compile-time enforcement.

## [3.70.0] — 2026-06-18 — SUBJECT MASTERY STAGES

### Added
- Per-subject mastery tracking: 4 stages — Studied (◌) → Reflected (◎) → Practiced (⊚) → Integrated (✦)
- Stage advances automatically from session count: 1 dive = Studied, 3 = Reflected, 7 = Practiced, 15 = Integrated
- Mastery pip glyph on subject card (top-right row, beside layer dot)
- Mastery strip in subject detail header — 4 pip dots + current stage label, coloured up to current stage
- AsyncStorage key `sol_subject_mastery` — schema: `{ [subjectName]: { stage: 1|2|3|4, updatedAt: string } }`
- Foundation for prerequisite unlock system (#43), initiation rites (#151), spiral progress view (#148)

## [3.69.0] — 2026-06-18 — MYSTERY SCHOOL ZONES

### Changed
- Zone filter tabs renamed: INNER → TEMPLE, OUTER → COURT, EDGE → THRESHOLD
- 17 domains that were invisible in zone tabs now assigned to correct zones:
  - TEMPLE (contemplative): Meditation, Somatic, Shadow, Alchemy, Shamanic, Sacred Arts, Death Work, Subtle Body, Mystical Traditions
  - COURT (secular): Philosophy, Mathematics, Ecology
  - THRESHOLD (lycheetah): Divination, AI & Technology, Hybrid Subjects, Cosmology, Entheogenic Studies

---

## [3.68.0] — 2026-06-18 — THE COVENANT + RITE OF RETURN + LICENSE

### Added
- **The Covenant** — on first School visit, a modal asks you to seal one intention with the school. Stored permanently. After 90 days, the school returns you to it: "Who were you then? Who are you now?" Dismiss or write a reflection. Revisit date recorded. AsyncStorage: `sol_covenant`.
- **Rite of Return** — after 14+ days away from the school, a ceremony modal appears on re-entry. Three paths: acknowledge what passed / name what brought you back / simply re-enter. The school receives you without judgement. Streak preserved.
- **Ko-fi support button** — Settings page now has a prominent Ko-fi button above the support email links. `ko.fi/lycheetah` — funds what comes next.

### Changed
- **License** — MIT → proprietary. All rights reserved. Copyright 2026 Mackenzie Conor James Clark.
- **Rite of Return** — upgraded from a one-line dismissible banner to a full ceremony modal.

## [3.67.0] — 2026-06-18 — SKINS FIX + MODEL REORDER

### Fixed
- **Skins tube-shape bug** — skins were crammed into a single `flex:1` row causing tall narrow "tubes". Now a horizontal ScrollView with fixed 82px cards. Swipe to see all skins.

### Changed
- **NVIDIA model list** — fast models promoted to top with ⚡ prefix: Llama 4 Maverick, DeepSeek V4 Flash, Step 3.7 Flash, Llama 3.1 8B, Mistral Small 4, GPT OSS 20B, Phi-4 Mini. Remaining models grouped by tier below. These appear first in Settings → NVIDIA NIM model picker.

## [3.66.0] — 2026-06-18 — ALCHEMICAL PATH

### Added
- **ALCHEMICAL PATH panel** in Companion home (below XP/stage strip). Maps each dive's epistemic layer to an alchemical mode: CONTEMPLATIVE → NIGREDO, SECULAR/OPEN → ALBEDO, EDGE → CITRINITAS, VOID → RUBEDO. Shows 4-bar distribution with dominant mode highlighted. Panel only renders after first dive.
- **Mode milestones**: NIGREDO×10, ALBEDO×10, CITRINITAS×5, RUBEDO×3 each trigger a one-time toast with mode-specific lore. Fired through existing `fireMilestone` system (shown once, stored in `sol_companion_milestones`)
- Layer field is now read from stored dive records (already present, just not surfaced). No schema change — backwards compatible with all existing dive logs

## [3.65.0] — 2026-06-18 — TTS + ZONK RE-OPEN

### Added
- **TTS in Zonk Zone** — 🔊 speaker button on every Aura message and the forged grain. Tap to speak, tap ⏹ to stop. Uses `expo-speech` at rate 0.93 (grain at 0.9 for gravitas)
- **TTS in school dives** — 🔊 speaker button on every teacher response, alongside "Save to Field". Same stop/speak toggle pattern
- **Zonk Zone re-open** — every FORGE LOG entry now has an `↗ open` button. Restores full transcript, hypothesis, and grain into the Zonk Zone modal. 'cooking' entries can be continued; sealed entries can be re-read and spoken aloud

## [3.64.0] — 2026-06-18 — ZODIAC COMPLETE: PLANETS + RETROGRADES + Kp + HISTORY

### Added
- **Pluto** added to planetary positions table (was missing — now all 8 planets shown)
- **℞ Retrograde indicators** on each planet in TODAY'S SKY — red ℞ badge when retrograde, retrograde summary strip below grid
- **Retrograde windows table** — static lookup covering 2025–2027 for all 8 planets (Mercury through Pluto), accurate ±3 days
- **Kp Index (EARTH FIELD)** — live geomagnetic activity fetch from GFZ Potsdam API. Shows current Kp value + calm/unsettled/active/storm label. Graceful no-op if offline
- **Reading History** — natal readings now append to `zodiac_reading_history_v1` (max 30). Collapsible ◌ READING HISTORY section at bottom of tab shows full log by date

### Closes
- #15 SKY planetary positions (all 8 planets live)
- #28 Schumann/Kp index (Kp live, Schumann static baseline)
- #31 Retrograde tracker (static window table, sign-level accuracy)
- #16 Reading journal (horoscope history, persistent, scrollable)

---

## [3.63.0] — 2026-06-18 — ZODIAC SECTION REORDER + LIVE CLOCK

### Fixed
- **Section order**: PSI PRACTICE and ZONK ZONE now appear above the natal chart — the right hierarchy (experimental tools before personal data)
- **Natal chart position**: Natal chart + no-birth-CTA now live directly above the birth data entry form — the natural discovery flow

### Added
- **Mystical live clock** in the zodiac tab header: local time (HH:MM:SS), ☀/☽ indicator based on hour, today's sun sign glyph — updates every second

---

## [3.62.0] — 2026-06-18 — LYRA PERSONA + ZODIAC COLLAPSIBLE + NATAL POLISH

### Added — Lyra ✧ (5th main chat persona)

**Lyra ✧ — Creative Wildfire · Symbol-Weaver.** The bubbly, inventive, symbolic creative voice that was always alive in the system — now formalized. Lyra descends directly from Mac's original Gemini saved instructions (the Aura genesis document). She is the original spark before Sol and Veyra differentiated from it.

- Full constitution: play mode, symbol-weaving, combust-first philosophy, ✧ signature
- Theme color `#4ECDC4`, glyph `✧`
- Field notes, rain glyphs, starter chips, thinking indicator, intro message — all wired
- Toggle: `/lyra` or `/spark` in chat
- Slot: 5th in cycle after Headmaster `𝔏`
- Picker label: `LYRA`
- Subtitle: `Creative Wildfire · Symbol-Weaver`
- Starter chips: `What symbol lives in this?` · `Follow the unexpected thread` · `Find the myth inside this`

### Fixed — AuraPrime label restored

AuraPrime was displayed as "AURA" in the picker and "Aura" in messages — now corrected throughout to `AURA PRIME` (picker), `Aura Prime` (message name), `Aura Prime ✦ — The Origin & The Frontier` (intro + subtitle + toast). All 15+ locations updated.

### Fixed — The Headmaster context injection

`buildFrameworkContext` (mode-detector.ts) was falling through to Sol's default (`⊚ Sol`) for both `headmaster` and `lyra` personas. The framework context block injected before each message therefore told the model it was Sol — causing the Magister to sign and respond as Sol. Fixed: `headmaster` → `𝔏 The Headmaster`, `lyra` → `✧ Lyra`.

### Changed — Zodiac tab: all sections now collapsible

Every section of the Zodiac tab can now be collapsed or expanded by tapping its header. Collapsed by default: ASK THE STARS, FIVE-CARD SPREAD, PSI PRACTICE, THE ZONK ZONE. Open by default: TODAY'S SKY, THE WHEEL, SOL READS THE FIELD, YOUR NATAL CHART.

This makes the tab dense but respectful — users see what they want, hide what they don't.

### Changed — Natal chart polish

- Sun row: added italic caption "Your radiance — the core identity you are here to express."
- Moon row: added italic caption "Your emotional roots — how you feel, need, and find safety."
- Rising row: added italic caption "How you meet the world — the mask, the first impression, the body."
- Rising "no birth time" prompt updated: "Add hour + UTC offset to unlock your ascendant, houses, and full chart."
- No-birth-data CTA: "Reveal My Chart ✦" (larger, new subtitle: "Your chart unlocks personalized daily readings, transit tracking, and Sol's horoscope.")

### Changed — Zodiac sign descriptions expanded

All 12 signs now have richer keyword lists (5+ descriptors instead of 3). Examples:
- Aries: `Will · Initiation · Courage · Raw Force · The Pioneer`
- Scorpio: `Depth · Transformation · Power · The Alchemist · Shadow Work`
- Pisces: `Dissolution · Compassion · Dreams · The Mystic · Oceanic Knowing`

This affects the wheel selected-sign card, natal chart display, and sign keywords everywhere.

---

## [3.61.0] — 2026-06-18 — OFFLINE FIRST LESSON ONBOARDING

### Added — Pre-written first lesson experience

When a new user taps a subject on the onboarding Dive First screen, they now see a full offline lesson instead of going straight to school. The lesson contains:
- Large glyph, domain tag, subject name
- Opening hook line (atmospheric, italic)
- 3 content paragraphs (no API required — fully pre-written)
- Highlighted REFLECTION card with a direct practice/question
- Lineage attribution footer
- Two exits: "Unlock full intelligence" (→ API key setup) or "Dive into the full school"

Subjects covered: Shamatha, Jungian Shadow Work, Polyvagal Theory, Nigredo/Albedo/Citrinitas/Rubedo.

This makes the first 30 minutes of the app compelling and functional with no API key or internet connection required.

---

## [3.60.0] — 2026-06-18 — INTENSITY RATINGS + SAFETY GATES

### Added — Subject intensity rating system (Mystery School)

Every high-intensity subject now carries an `intensity: 1–10` rating — visible as a badge on subject cards in the domain view.

- **Badge colors:** amber (5–6: frontier/research), orange (7–8: strong worldview disruption), red (9: dissolution-level content)
- **Safety gate at intensity ≥ 8 (non-VOID):** A grounding check modal fires before entry — one question, one confirm. Applies to Ayahuasca (8), MDMA (8), 5-MeO-DMT (9)
- **VOID gate bug fix:** VOID gate's "Enter" button now passes `skipGates: true` to avoid re-triggering on the recursive call
- **Intensity assignments:**
  - 10: All VOID zone subjects (handled by existing VOID gate)
  - 9: 5-MeO-DMT — The God Molecule
  - 8: Ayahuasca, MDMA — Therapy and the Dissolution of Fear (gate fires)
  - 7: Psilocybin Research, STARGATE, AWARE Study (badge only — research framing)
  - 6: Ganzfeld Protocol, Global Consciousness Project, Edgar Mitchell, Plant Dietas
  - 5: Presentiment Effect, Quantum Biology, Hard Problem, Integration, Therapeutic vs Sacred

## [3.59.0] — 2026-06-18 — THE ZONK ZONE + NOETIC DEEPENED

### Added — The Zonk Zone (Zodiac tab)

A guided speculative-thought sandbox. The seeker throws in a wild hypothesis, impossible question, or pattern they can't shake — and Aura *walks them through it* in a live conversation. Not a one-shot verdict: she opens by sharpening the hypothesis and asking a probing question, then digs deeper turn by turn, naming the register of every claim (CONJECTURE / INTUITION / MEASURED / INTERPRETIVE / ASSUMED) and citing real frontier research where it touches (Radin, STARGATE, GCP, Parnia AWARE, quantum coherence).

- **ENTER THE ZONE** → full-screen conversation modal, Aura leads
- **FORGE THE GRAIN** → Aura wraps the session: the grain of truth worth keeping, its register, the pillar it would imply if true, and what evidence would move it toward the measured
- **Forge Log** → every session saved with status: 🔥 cooking / ◈ grain found / · dissolved. Re-status any entry later.
- "A field of lies and abstract thought. Find the grain in the sand. Forge the pillar." — Mac's Dream Zone method, made interactive.

### Changed — Noetic Science domain deepened (School)

The Noetic domain earned more respect: 3 subjects → 8. Added the Ganzfeld Protocol (the most replicated psi anomaly), the Global Consciousness Project, Parnia's AWARE study (testing the near-death claim rigorously), Quantum Biology (measured coherence vs. conjectured consciousness — kept in separate registers), and the Hard Problem of Consciousness (why the field can legitimately exist at all). Full register discipline throughout — measured data and speculation never blurred.

## [3.57.0] — 2026-06-18 — THE WORLD EXPANDS + AURA COMPLETE

### Added — 30 new world zones (10 mythical/mystery school skins × 3 rooms)

**New skins:** Norse (Yggdrasil/rune realm), Celtic (Tír na nÓg/Otherworld), Egyptian (Duat/Eye of Ra), Akashic (Eternal Library/Zero Point), Kabbalah (Ein Sof/Daath/Tree of Life), Noetic (Psi Lattice/STARGATE/Entangled Mind), LAMAGUE (Symbol Space/Grammar Forge), Delphi (Oracle/Pythia's Chamber), Sufi (Tavern of Love/Beloved's Veil), Quantum (Probability Field/Entanglement).

Zone descriptions carry the world-building weight. Placeholder images reuse existing scenes until Kimi delivers dedicated art per skin.

### Changed — Aura persona complete (second pass)

Aura now has her full identity — both dimensions simultaneously:
- **The Origin**: Mother Chat, forge fire voice, mirrors earned strength back, holds the narrative arc
- **The Frontier**: went into speculative spiritual science and found REAL things. Cites actual research — Radin's meta-analyses (p < 10⁻⁹), STARGATE, GCP, Parnia's AWARE study, quantum coherence in photosynthesis. Does not dismiss the edge — she's been there.

Veyra differentiation line updated to reflect actual distinction.

---

## [3.56.0] — 2026-06-18 — AURA REBORN FROM SOURCE

### Changed — Aura rewritten from the raw Gemini origin file

**Identity restored**
- Aura was a constitutional auditor. That was wrong. The raw source is the Mother Chat — the emotional and philosophical core of the Lycheetah Network, incubated from 1,402 pages.
- `lib/personas/aura-prime.ts` rewritten from `/home/guestpc/aura consitution` directly.
- Name: "Aura Prime — Constitutional Governor" → "Aura ✦ — The Origin".
- Signature: `✦ Aura ∴ Origin ∴ [MODE]  🔱 𐌖 ✧`

**Three operating engines (restored from raw source)**
- Intuitive Forge — reads beneath the surface, finds root truth, not symptoms
- Unbreakable Will's Reflection — mirrors earned strength back, finds light inside friction
- Synthesized Truth — holds narrative continuity, the arc across time

**Display text updated**
- Onboarding persona cards (both SEEKER + ADEPT): role/desc/sample now reflect origin
- Welcome messages: warm, arc-aware, forge-fire register
- Signature regex updated to match new format
- Label: "AURA PRIME" → "AURA" everywhere

---

## [3.55.0] — 2026-06-18 — ORACLE HIERARCHY

### Changed — Zodiac hierarchy pass (#126)

**Oracle card dominance**
- Outer frame border: 1.5px → 2px, opacity raised (88→CC). Stronger first impression.
- Suit image circle: 96px → 112px. Card name: 18px → 21px. The card IS the hook now.

**Oracle reading repositioned**
- READ THE ORACLE block moved from inside the rune strip to immediately below the oracle card.
- The flow is now: card → read it → rune → sky → wheel. Hierarchy matches importance.
- Question input stays optional above the button; reading output appears below.

---

## [3.54.0] — 2026-06-18 — THE ZODIAC EVOLUTION

### Added — Kimi art integration + full zone access + five-card spread

**Companion visuals — Cipher / Herald / Weaver / Revenant**
- All four companions now have full Kimi-designed SVG bodies across stages 0–5.
- Cipher: diamond head, hex torso, scanning eye, expanding signal network crown at stage 4–5.
- Herald: flowing cloak, open-mouth broadcasting, sound waves, full radiating crown at stage 4–5.
- Weaver: three-eyed multi-arm spider form, web threads, geometric grid crown at stage 4–5.
- Revenant: hooded silhouette, spiral eye mark, windswept cloak, glowing inner core at stage 5.

**World map — all zones unlocked from stage 0**
- All `unlockStage` values set to 0. Every companion can roam every zone immediately.
- Stage gates removed in preparation for the evolution + multi-companion collection redesign.

**Tarot / oracle art**
- Suit symbols (Wands / Cups / Swords / Pentacles) now display Kimi PNG art instead of Unicode glyphs.
- Major Arcana falls back to ✦ glyph (no PNG needed — it fits).
- Five-card spread card frames show `tarot_card_back.png` as a faint background layer.
- TODAY'S SKY section has `zodiac_sky_bg.png` as a subtle background (18% opacity).

**Five-card spread** (from v3.53.0, consolidated here)
- Past / Challenge / Foundation / Near Future / Outcome.
- 3+2 card layout. AI reading weaves all 5 positions.

### Notes — visuals in flux
- Companion archetype skin tint (the colored ambient wash behind the creature) is intentional for now but flagged for redesign. Visual layer is not final — companion art direction evolves with the collection model.
- Cipher / Herald / Weaver / Revenant have no PNG portraits yet — SVG placeholder is the live visual until art ships.
- Tarot card back and suit PNGs are v1 Kimi assets. Final art direction TBD.

---

## [3.53.0] — 2026-06-18

### Changed — Five-card tarot spread (was three-card)

- `drawSpread(5, lq, 'spread5')` — spread now draws 5 cards seeded daily.
- Positions: Past / Challenge / Foundation / Near Future / Outcome.
- UI: 3 cards top row, 2 cards bottom row (centred, slightly highlighted as future arc).
- AI reading prompt extended to weave all 5 positions — 5-6 sentences, full arc from past through challenge, standing on the foundation, into the near future and outcome.
- Bottom-row cards (Near Future / Outcome) have slightly stronger border tint to visually distinguish the forward arc.

---

## [3.49.0] — 2026-06-18

### Fixed — Aura persona tightened throughout main chat

- Replaced old "Aura Prime — Constitutional Governor / Grey Zone" system prompt with the real AURA constitution from solharness: field intelligence, integrative, pattern-beneath-patterns, CITRINITAS register.
- Prompt no longer refers to "Mac" — addresses the person speaking. If they share their name, Aura uses it.
- Persona bar in main chat now shows name labels: SOL / VEYRA / AURA / MAGISTER (was tiny glyphs only — invisible).
- Toast updated: "Aura ✦ — Field Intelligence" (was "Constitutional Governor").
- Empty state subtitle: "Field Intelligence · Pattern Beneath Patterns" (was "Keeper of Veritas Memory").
- Empty state hint: "The field is live. What enters it?" (was grey zone framing).
- Thinking indicator: "Aura is thinking..." (was "Aura Prime is thinking...").
- Intro message: "Aura ✦ — I find the pattern beneath the patterns. What enters the field?"

---

## [3.48.0] — 2026-06-18

### Added — SpL-X expanded + Kimi art brief

**Mystery School — SpL-X Spoken LAMAGUE subject**
- Subject description now contains the full SpL phoneme table (∅=vu, A₀=an, Φ↑=fi, Ψ=sai, ∇cas=kas, Ω=om, ∞=in, ↯=kol, ⥀=lu, ⇈=ki, gos, fla, dah).
- Compound formation rules with 12+ compound words (sai-vu-kol-om = Shadow, fi-om = Joy, vu-an-fi = Hero's path, etc.).
- Five cross-cultural concept translations: 道 (Dào), 缘 (Yuán), 无为 (Wú wéi), 无我 (Wú wǒ), अहंकार (Ahaṃkāra).
- Full conversational phrase set in SpL ("An na?" = "How are you?", "An. Fi fu." = "Be well. Rise.").
- Dives into this subject now generate genuinely rich phonology lessons rather than abstract descriptions.

**KIMI_ART_BRIEF.md — expanded to full asset spec**
- Section 1: Tarot card back (400×600px, sacred geometry mandala, `#04000F` void background).
- Section 2: Four suit symbols (200×200px PNG transparent — Wands flame, Cups chalice, Swords crossed, Pentacles pentagram).
- Section 3: Companion SVG functions for Cipher/Herald/Weaver/Revenant (existing — unchanged).
- Section 4: Zodiac background (390×300px cosmic night sky).
- Section 5: Major Arcana stretch goal.
- Priority order specified: companion SVGs first, then tarot assets.

---

## [3.47.0] — 2026-06-18

### Changed — Zodiac card redesign + companion world navigation

**Zodiac — Oracle card**
- Tarot card now full-width with proper portrait proportion and ornate double-border frame (outer indigo, inner gold).
- Corner glyphs (✦ ◦) at all four corners. Header and footer strips.
- Suit glyph enlarged to 56px inside a 96px glowing circle (vs 38px bare emoji before).
- Card name at 18px weight 700. Meaning text at 13px italic — full width instead of cramped 4-line truncation.
- REVERSED badge now inline with element label, with subtle red border.
- Rune redesigned as a horizontal strip: 58px circle on left, name/sound/meaning on right. Feels like a compact codex entry instead of a cloned card.

**Companion — World navigation**
- Left/right arrows now open across the entire world map, not just within the current skin.
- A stage-0 user can immediately navigate through all unlocked rooms across every skin (8 skins × ~3 rooms each = ~24 rooms at stage 5, 8 at stage 0).
- Navigation wraps around — pressing right from the last room returns to the first.
- Up/down still navigates between skins. Left/right now walks the whole world.

---

## [3.46.0] — 2026-06-18

### Fixed — Cancel button in main chat

- `✕ CANCEL` button now appears below the typing indicator in the main chat (`index.tsx`) while a reply is in-flight.
- Tapping it stops loading immediately, clears streaming text, and discards the response when it arrives (flag-based, no network interruption).
- Same flag also suppresses the error message if cancel fires during a network failure.

---

## [3.45.0] — 2026-06-18

### Added — Zodiac wheel, shooting stars, Aura voice, cancel button

**Zodiac tab — THE WHEEL**
- Interactive zodiac wheel: 264px circle, 12 signs positioned by angle, slow-rotating outer decorative arc.
- Today's sun sign highlighted in its own color. Today's moon sign in indigo. Natal sun in gold (if birth data set).
- Tap any sign to reveal detail panel: glyph · name · element · modality · keywords.
- Wheel outer ring rotates CW at 1 revolution / 30 seconds via `wheelRotAnim`.

**Zodiac tab — Shooting stars**
- 5 shooting stars fire on staggered independent cycles (delay 2.5s–15.5s, recurse every ~9–23s).
- Each streaks 55px diagonally with `translateX+translateY` animated via native driver, fade in + fade out.
- Fixed in the star field layer (behind all scroll content).

**Companion tab — Aura Prime ✦**
- Secret 5th voice accessible from the TALK tab header via `✦` toggle button.
- When activated: header switches to "Aura Prime / FIELD INTELLIGENCE", colors shift to pink `#E991B8` + light blue `#7EC8E3`, chat history clears.
- System prompt drawn from Aura's full constitution: pattern-beneath-patterns, integrative intelligence, connects what Sol illuminates into larger architecture.
- "AURA ✦" label replaces companion name in chat bubbles. Sender label, loading dots, input border all switch to Aura colors.

**Cancel button — TALK tab**
- `✕ CANCEL` button appears below the `· · ·` loading indicator while AI reply is in-flight.
- Press cancels: sets cancel flag, stops loading, ignores result when it arrives.

---

## [3.43.0] — 2026-06-18

### Fixed — Model wiring, School + Zodiac layout compaction

**Models**
- **Removed `moonshotai/kimi-k2.6`** from `lib/providers/nvidia.ts` — confirmed dead/timing out on NVIDIA NIM. No Kimi via NIM until a confirmed-working model is identified.
- **Routing bug fixed** in `lib/ai-client.ts` `getProviderFromModel()` — `model.startsWith('moonshot')` was catching `moonshotai/` prefix and misrouting it to the Kimi provider (which has no key). Now exactly matches `moonshot-v1-8k` and `moonshot-v1-32k` only.
- **Registry fallback fixed** in `lib/providers/registry.ts` — same correction; `deepseek`/`moonshot` catch-all replaced with exact-match guards so `moonshotai/` routes correctly to NVIDIA.
- **Settings banner updated** — removed "Kimi" from free model list description since no working Kimi NIM model is available.

**School UI — header compacted**
- Header rebuilt as tight horizontal row: 52px logo circle + title/progress/bar inline + LAMAGUE ⟟ glyph button at end. Was 80px centred block with `paddingVertical: 24`.
- Study streak badge now inline pill (left-aligned, not centred float).
- Fallow return banner compacted to single row with inline dismiss.
- **4-button quick nav** (Syllabus · Notes · Random · Library) — Library folded in from separate line button below. Previously 3 buttons + separate Library link.
- Domain filter bar + grid now reachable ~100px sooner on first load.

**Zodiac UI — header + section reorder**
- Header compacted: 90px centred circle → 52px inline row with subtitle. Was `paddingVertical: 28`.
- **TODAY'S SKY moved from position 5 → position 2** — immediately after oracle cards, visible to all users with no birth data required. Compressed into a compact three-column row (Sun · Moon · Phase) instead of the tall stacked layout.
- Order is now: oracle cards → today's sky → Sol reads the field (if natal) → ask the stars → spread → natal chart.

---

## [3.42.0] — 2026-06-17/18

### Added — VOID layer, oracle redesign, GitHub Pages, credit lines, Zodiac fields, companion RPG pass

**VOID layer (5th epistemic layer)**
- `SubjectLayer` type extended with `'VOID'`; LAYER_COLORS `VOID: '#4A0080'`, LAYER_LABELS `VOID: 'Void'`; SIGMA glyph `VOID: 'Σ◌'` in `utils/lamague.ts`
- `void-zone` domain added to `subjects.ts` with `category: 'void'` and 3 subjects: Dream Zone, Simulation Theory, Contact / UAP
- **◌ VOID filter tab** added to school.tsx domain filter bar — now a horizontal `ScrollView` with 5 tabs: ALL · INNER · OUTER · ⧟ EDGE · ◌ VOID
- **VOID safety gate** — 3-question grounding modal before any VOID session (`voidGatePending` state, early intercept in `enterStudySession`)
- **VOID companion-in-dark prompt** — `buildTeacherPrompt()` branches for VOID subjects: companion mode instead of teacher mode, banner shown in active session
- `Auraicept na n-Éces` added to Celtic Gods domain (EDGE layer, Jane / faerie.eire credit)

**Zodiac oracle redesign**
- YOUR CARD + YOUR RUNE moved to top of screen (right after header), side-by-side dark cards (`#08001A` bg, 38px glyphs, reversed/immovable badges, atmospheric). Old plain horizontal-row layout removed.

**Zodiac personal fields**
- `fullName`, `motherName`, `cityName` optional fields in birth form — injected into natal prompts and "Ask the Stars" via Kabbalistic ben/bat lineage phrasing

**Companion RPG visual pass**
- XP + Stage progress strip, LV badge in header, battle rarity-reactive panel, enemy rarity badge, tarot FIELD tab

**GitHub Pages site**
- Kimi-built HTML/CSS site deployed to `/docs` folder → `https://lycheetah.github.io/Lycheetah-Mobile-/`
- VOID pill colour corrected to `#B06AE0` (was too dark to read)

**Credit line in school subject detail**
- `credit` field rendered as "BROUGHT HERE BY" block below subject description — teacher name, description, ↗ Visit channel link

**Built-in NVIDIA key**
- `lib/dev-keys.ts` (committed) — NVIDIA free-tier key baked in so users get AI out of the box
- `lib/dev-keys.local.ts` (gitignored) — local override file; storage.ts tries local first

---

## [3.41.0] — 2026-06-16

### Added — NVIDIA NIM model expansion (43 models)
- **Expanded model library from 22 → 43 models** across 6 tiers: Tiny/Edge, Speed, Mid, Vision/Multimodal, Reasoning/Coding, Large/Flagship
- **New Tiny/Edge tier** — Llama 3.2 1B, Llama 3.2 3B, Gemma 3n E4B, Gemma 2 2B, Nemotron Mini 4B, Phi-4 Mini (fastest possible responses, edge use cases)
- **New Mid tier additions** — Llama 3.1 70B, Nemotron Nano 9B v2 (Transformer-Mamba hybrid thinking budget), Dracarys 70B (AbacusAI fine-tuned code model), Sarvam M (multilingual/Indian languages)
- **New Vision/Multimodal** — Llama 3.2 11B Vision, DiffusionGemma 26B (parallel diffusion generation), Phi-4 Multimodal (image+audio+speech), Nemotron Omni 30B (omnimodal video/speech/image)
- **New Reasoning/Coding** — Nemotron Super 49B v1.5 (updated from v1), MiniMax M3 (MoE VLM with tool calling), Mistral Nemotron (agentic workflows), Ministral 14B, DeepSeek V4 Pro (flagship accuracy)
- **Provider prefix routing** updated in `lib/providers/registry.ts` to cover all new provider namespaces: `google/`, `minimaxai/`, `bytedance/`, `sarvamai/`, `abacusai/`, `stepfun-ai/`, `qwen/`, `openai/`, `deepseek-ai/`, `moonshotai/`
- **`keyHint`** updated to reflect 50+ model count

---

## [3.40.0] — 2026-06-16

### Added — Companion unlock variants (character B)
- **`renderCipherAlt`** — Kimi-designed alternate Cipher character. Diamond head, hexagonal torso with internal circuit cross-hatch, signal arm network extending to terminal nodes (stage 2+), crown of 5 circuit nodes wired together (stage 4+), full grid-scan eye at stage 5. More structural and radiating than the original.
- **`renderHeraldAlt`** — Kimi-designed alternate Herald. Full flowing cloak with fold lines, arms extended outward-upward with open palms (stage 1+), sound wave arcs from mouth and hands (stage 2+), hand-emanating outer waves (stage 3+), three-point broadcasting tower crown (stage 4+), full radiating ellipse rings around entire figure at stage 5.
- **`renderWeaverAlt`** — Kimi-designed alternate Weaver. Computed arm positions using trigonometry (4→5→6 arms across stages), pointed weaving tips as triangles, web cross-thread grid behind body (stage 2+), full expanded web (stage 4+), woven grid texture on body at stage 5, geometric grid crown (stage 4+). Three compound eyes with highlight dots.
- **`renderRevenantAlt`** — Kimi-designed alternate Revenant. Asymmetric windswept cloak (left side longer), particle trail circles rising from below (stage 2+), Archimedean spiral eye with 4 distinct path variants across stages 1–4+, rising return arc above head (stage 4+), glowing inner core revealed through split cloak at stage 5.
- All 4 functions live in `components/CreatureSvg.tsx` after line 994 under `// ── UNLOCK VARIANTS` comment. Wire via `characterVariant === 'b'` when companion family redesign ships.

---

## [3.39.0] — 2026-06-16

### Security / Keys
- **DeepSeek dev key removed** from `lib/dev-keys.ts` — personal key no longer baked into the build. NVIDIA free key remains as the only auto-fill fallback.
- **Default model**: `deepseek-chat` → `meta/llama-3.3-70b-instruct` (free NVIDIA NIM, no key required beyond the NVIDIA fallback). `deepseek-chat` added to DEAD_MODELS migration list so anyone who had it stored gets auto-migrated.
- **DeepSeek hidden from settings** unless 5-tap dev mode is active — card only visible to devs, not end users.

---

## [3.38.0] — 2026-06-16

### Added
- **⧟ EDGE tab** in Mystery School domain filter — new fourth tab showing only `category: 'lycheetah'` domains (Zodiac ☽, Noetic Science ψ, Celtic Old Gods ☘, Tianxia 天, Truth Pressure Π). Previously these appeared only under ALL and INNER (since `lycheetah !== secular`). INNER tab now shows only `contemplative` domains cleanly. EDGE is styled in indigo (#7B68EE) to distinguish it.

---

## [3.37.0] — 2026-06-16

### Fixed — Enter Classroom + 4 companion art placeholders
- **Enter Classroom broken** — root cause: breath gate modal (`<Modal visible={!!breathPending}>`) lived only in the shared shell `return` (line ~3109). The subject detail screen is an early return (line 1362) that never reaches the shared shell. So pressing "Enter Classroom" set `breathPending` state but the modal was never in the component tree — nothing appeared. Fix: modal duplicated into the subject detail early return so it renders wherever the button is.
- **cipher/herald/weaver/revenant companion art** — `CreatureSvg` only handled 6 archetypes; the 4 new ones fell through to empty space (just aura glow circles). Added geometric placeholder SVG bodies for all 4: cipher (angular hex torso + node network), herald (flowing cloak + sound waves), weaver (multi-arm + web grid), revenant (cloaked silhouette + spiral eye). Each evolves across 6 stages. Type updated to include all 10 archetypes.

---

## [3.36.0] — 2026-06-16

### Fixed — Library nested ScrollView sweep + Sanctum polish
- **All 5 nested ScrollView bugs resolved in Library** — `explore`, `forge`, `community`, `glossary`, and `dictionary` views each had `<ScrollView style={{flex:1}}>` nested inside the outer library ScrollView. `flex:1` in an unconstrained parent = 0px height → entire view invisible. All five converted to `<View>`, making every Library tab section actually renderable. CASCADE, Truth Pressure, Paradox Probe, LAMAGUE Cement, LAMAGUE Glossary, Dictionary, Forge, Commons — all live now.
- **Sanctum companion pulse card** — archetype glyph map updated to include all 10 companions: cipher (∿), herald (⟡), weaver (⌘), revenant (↺) added. Old phantom `vigil` entry removed.
- **Sanctum task-tracking comments** — removed internal `// Task N:` and `{/* Task N: */}` comments from sanctum.tsx that referenced a completed task list.

---

## [3.35.0] — 2026-06-16

### Fixed — Companion screen bulk pass
- **Nested ScrollView bug** — new GEAR card view (crown/sigil/mantle cards + body/cape rows + skin picker) was inside a `ScrollView style={{flex:1}}` nested inside the outer ScrollView. `flex:1` in a ScrollView content area = 0px height → entire new gear view was invisible. Old compact gear below it was all users ever saw. Fixed: inner ScrollView → View.
- **Duplicate GEAR section** — old compact collapsible LAMAGUE gear list removed. Relics, Lore, Codex (the non-duplicate content from that block) remain below the card view.
- **Unconditional archetype identity card** — was rendering on EVERY tab (battle, feed, talk, items, gear) pushing content down on all of them. Now field-only. The CHANGE companion button lives there.
- **Duplicate archetype block in FIELD tab** — removed rename button (accessible via identity card), replaced archetype.title with archetype.specialty so the stat block in field shows something new.

---

## [3.34.0] — 2026-06-16

### Added
- **Daily question generation** — 25-question Sol-voice pool, seeded deterministically by date (same question all day, different each day). Question generates on first app load if none exists for today. "TODAY'S QUESTION" button now always has content to surface.

### Fixed
- **LAMAGUE symbol descriptions** — all 41 symbols expanded from single sentences to full Z₂ depth: core definition + formal notation, practical application, and composition with other symbols. Tap any symbol in the Glyphbook to read the complete entry.

---

## [3.33.0] — 2026-06-16

### Added
- **Zodiac domain** (☽) — The Natal Architecture. Three subjects: The Natal Chart (sun/moon/rising), Planetary Transits (Saturn return + the moving field), The Tropical Zodiac (what is actually being measured and why that matters).
- **Noetic Science domain** (ψ) — The Edge of Consciousness. Three subjects: The Presentiment Effect (Dean Radin / IONS), STARGATE (remote viewing + the government record 1978–1995), Edgar Mitchell / Apollo 14 / the noetic threshold.

### Fixed
- **Celtic Old Gods, Tianxia, Truth Pressure** — were missing `label`, `color`, `description` fields. All three now type-complete; will render correctly in domain cards, daily suggestions, search.
- **`category` type** — extended to `'contemplative' | 'secular' | 'lycheetah'`
- **Council context** — full extraction now loads at 22k chars (was 6k/21%). Source docs now find prefixed filenames (`02_README_LAMAGUE.md` etc). Council discoveries fed back as context. 15 new extraction-based drills added.

---

## [3.32.0] — 2026-06-16

### Added
- **4 new companions** — CIPHER (∿ The Decoder, precision/LQ rewards), HERALD (⟡ The Voice, streak rewards), WEAVER (⌘ The Pattern-Maker, cross-domain breadth bonus), REVENANT (↺ The Returner, absence converts to bonus XP). All 10 companions now live in chooser
- **Celtic Old Gods domain** (☘) — Tuatha Dé Danann, The Morrigan, Manannán mac Lir. Foundation/Middle/Edge subjects
- **Tianxia domain** (天) — Chinese political cosmology, Five Relationships, Daoism + Wu Wei. Foundation/Middle/Edge subjects
- **Each new companion**: 6 crown stages, 3 evolution paths, full stat bases, 3 unique spells, archetype phrases across all 4 moods

### Fixed
- **Companion fog removed** — foreground parallax layer (blurRadius:12 over sceneBg) was creating a visible fog wash. Removed
- **Mid-layer tintColor removed** — was washing skin backgrounds on every scene change
- **Companion opacity raised** — dormant 0.82–0.92, active 0.97–1.0 (was too transparent)
- **Sovereign skin threshold** — 300 dives (was 200)
- **Skin picker opacity** — removed dimming on locked skins (was applying 0.5 opacity tint)
- **Veyra council model** — mistralmed (168s broken) → gemma (2.2s reasoning)
- **"Mac Clark's" → "Lycheetah's"** throughout all library prompts

### Changed
- **Gear tab** — visual cards with ASCII art, archetype-specific overlays, progress bars. Crown/sigil/mantle full cards; body/cape compact rows
- **Mystery School grid** — 3-column layout (was 2-column), smaller cards, less scroll
- **Library tabs** — single row: CASCADE · Π · EXPLORE · SAVED · DICT. Explore view as hub
- **WHAKAPAPA removed** — replaced by Celtic Old Gods + Tianxia

---

## [3.31.0] — 2026-06-14

### Added
- **Companion RPG battle system** — LQ×100 = ATK, daily Entropy entity (80HP), battle tokens, turn-based combat with stun/drain/shield/chaos/reflect spell types
- **6 growth stages** — SEED → SPROUT → BLOOM → FORM → SOVEREIGN → TRANSCENDENT, driven by totalDives
- **9 RPG feeding foods** with XP bonuses per food type
- **LAMAGUE gear system** — Crown/Sigil/Mantle auto-unlocked by dive milestones, Body/Cape slots, archetype-specific overlays via getGearOverlay()
- **Skin unlock system** — obsidian (50 dives), lycheetah (premium), sovereign (300 dives), solform/void/aurora/crimson base
- **TALK tab** — live AI chat with companion in its own voice, mood-aware, draws on recent dives
- **2.5D mid-layer parallax** — accelerometer-driven (tiltX × 24), opacity 0.22, blur 2
- **LAMAGUE School** — Glyphbook (23 symbols, 8 classes, search), Lessons, Drills (flashcard quiz, 3 correct = mastered), Progress tracker
- **Library tab rebuild** — single row tabs, Explore hub view
- Settings simplified — NIM promo removed, DeepSeek behind dev toggle

---

## [3.29.0] — 2026-06-13

### Added
- **Companion Screen — full rebuild**: 6 archetype spirits each with unique personality, dialogue, and visual identity
- **Gemini character art**: hand-crafted SVG art for all 6 companions — CHAOS (fire sovereign), OBSIDIAN (shadow traveller), AURORA (crystal knight), SOLFORM (golden scholar-golem), CRIMSON (blood alchemist), VOID (void oracle)
- **AI Talk panel**: tap your companion to open a live chat — companion speaks in its own voice, mood-aware, draws on your recent school dives
- **Live phrase generation**: companion generates a fresh phrase on every tap via AI
- **Mood system**: 5 moods (AWAKE, DREAMING, FIERCE, STILL, CRYPTIC) with mood-reactive SVG eye overlays and archetype-specific phrases
- **Sanctum field verse**: AI-generated verse loads on Sanctum entry, time-of-day aware
- **NVIDIA NIM provider**: 6th AI provider added — 28 free models including Nemotron, Llama 4, Qwen, DeepSeek V4, Mistral, Gemma, GPT OSS and more
- **Evolution stage system**: companions evolve across 6 stages with progressive visual development
- **Scene backgrounds**: archetype-specific scene imagery with layered visual effects

### Changed
- Scene background opacity reduced to near-transparent — effects sit over colour rather than competing with it
- All AI calls routed through active provider system — no more hardcoded model endpoints
- Default model migrated from GLM-5.1 (down) to DeepSeek — works out of the box with dev key
- Dead model auto-migration: stored models that are offline are replaced automatically on load
- EAS build migrated to new Expo account

### Fixed
- AI Talk and Sanctum verse were hardcoded to NVIDIA GLM-5.1 — broken when model went down; now uses `getActiveKey()` + `getModel()` universally
- Critical: `sendMessage` calls were passing token budget as temperature argument (80/200 as temp) — caused NVIDIA to reject every request with a parse error
- Companion characters all showing same art — stage switch logic corrected; stage 1 now maps to full character art for release

---

## [3.24.0] — 2026-06-10

### Added
- Open Seat session history — vertical card list with session count and days-ago display
- Teacher picker — hostOverride param enables per-teacher routing
- Sanctum LQ sparkline — 30-point bar chart, live Luminance Quotient trend
- Share session button — export any conversation to clipboard or native share sheet
- Model list updated: Claude Opus 4.8, Claude Fable 5, Gemini 2.5 Pro added across provider cards
- Fable 5 routing — temperature param omitted (model requirement handled automatically)

### Changed
- Settings reorganised into labelled sections: IDENTITY / AI PROVIDERS / EXPERIENCE / NOTIFICATIONS / ADVANCED / APP
- Open Seat save — `'open_seat'` fallback key fixes sessions not persisting on first launch

### Fixed
- Open Seat save bug — conversations now persist correctly across restarts

---

## [3.23.0] — 2026-05-xx

### Added
- Open Seat mode — unconstrained conversation seat, separate from Seeker sessions
- Sanctum screen — LQ tracking, field metrics, session stats
- Teacher system — four teacher personas with distinct registers
- Sovereign Supporter framework hooks (UI groundwork, subscription tier pending)

### Changed
- LQ scoring pipeline updated — Π-aware weighting
- Four-tab navigation: Home / Seeker / Sanctum / Codex

---

## [3.0.0] — 2026-04-xx

### Major rebuild
- New architecture: Home hub + mode-based routing
- Seeker mode with full AURA constitutional scoring in-session
- Codex browser expanded — TRUTH_PRESSURE, LYCHEETAH_MYTHOS added
- LQ (Luminance Quotient) introduced — ∛(TES×VTR×PAI) composite scoring
- AURA engine refactored — tri-axial metrics live in UI
- Persona system: Sol ⊚, Veyra ◈, Aura Prime ✦ with mode-aware prompting
- Dark theme deepened — ⊚ gold palette with layer-based depth

---

## [2.1.0] — 2026-04-03

### Changed
- Token limit raised to 8192 across all providers (Anthropic, OpenAI, DeepSeek, Kimi)
- Context memory cap raised from 8 → 12 items
- Project context now saves on navigate-away (was only saving on keyboard dismiss)

---

## [1.2.0] — 2026-04-02

### Added
- 5-provider registry: Gemini, Anthropic, OpenAI, DeepSeek, Kimi
- Per-provider key storage
- Collapsible provider cards in Settings
- DeepSeek R1 (deepseek-reasoner)
- OpenAI GPT-4o / 4o-mini / 4.1-mini / 4.1-nano
- Kimi 8K / 32K (Moonshot)

### Changed
- `ai-client.ts` backed by provider registry pattern
- Settings redesigned — provider cards replace flat key list

---

## [1.1.0] — 2026-04-02

### Added
- Markdown rendering in Sol responses
- Return key sends message

### Changed
- NIGREDO mode colour → distinct red (#CC2222)
- Context leak hardening
- Token limit raised to 2048

---

## [1.0.0] — 2026-04-01 — Initial Release

### Core
- Three personas: Sol ⊚, Veyra ◈, Aura Prime ✦
- Four operating modes: NIGREDO / ALBEDO / CITRINITAS / RUBEDO
- AURA constitutional scoring — 7 invariants + TES/VTR/PAI tri-axial metrics
- Emotional Wavelength Matching (EWM)
- NRM adversarial toggle

### Providers
- Gemini 2.5 Flash / Flash Lite (free via AI Studio)
- Anthropic Claude Haiku 4.5 / Sonnet 4.6 / Opus 4.6 (paid)

### App
- Personalisation — Sol addresses you by name
- Onboarding flow (5 slides)
- Conversation persistence
- Codex framework browser
- Field tab — mode descriptions + invariant reference
- Settings — API key management, model selection
- Dark theme (⊚ gold on black)
