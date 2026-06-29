# Changelog

## [5.29.0] — 2026-06-29 — Audit pass: UI depth, de-bloat, encounter fixes

### UI Architecture
- **CompanionScene minimize strip** — tap `▲ hide` to collapse scene to 32px glyph+zone strip; tap to re-expand
- **ADVENTURE mode** — Venture + Campaign merged. QUICK (3) / DEEP (5) / CAMPAIGN (7 beats, saved). `adventureLengthRef` controls resolution + progress bar
- **Field Note → Chronicle** — removed from WORLD tab, lives at top of Chronicle in COMPANION tab with ↺ refresh. One AI reflection surface.
- **SHEET + TALK buttons removed** from battle tab (filler)
- **Void Entities collapsed** by default — tappable header to expand

### Battle / Encounter
- **ENCOUNTER button** (companion tab) → direct to battle, no overlay
- **Random zone travel encounters** → `setPendingBattle` overlay (player can retreat)
- **Menagerie zone bonus** — captured entities grant passive +ATK in home zone (max +5), shown as `+n⚔` in battle header

### Fixes
- Background zoom (`+`/`−`) fixed — `bgZoom` converted to `Animated.Value` + ref
- Void Entities hook-safe — `voidEntitiesOpen` at component level

---

## [5.23.0] — 2026-06-28 — Privacy screen, Thoth attributions, AETHER removed

### Privacy
- Privacy Policy screen (`/privacy`) wired from Settings — tap "Privacy Policy" to open
- `PRIVACY_POLICY.md` added for Play Store submission

### Zodiac / Divination
- `thoth-attributions.ts` — full Crowley/Harris Thoth system: Hebrew letters, astrological paths, Kabbalistic correspondences, decan rulers, all 78 cards
- AETHER element removed from Gem Forge — back to 4 classical elements (EARTH/WATER/FIRE/AIR); real data only
- Real chart builder functions added to zodiac.tsx (mean longitude for Mercury–Pluto, corrected Sun/Moon series)

---

## [5.22.0] — 2026-06-27 — Deep prompt pass: all AI voices now character-specific

All AI prompt generators that were still using generic archetype.name/title/desc now inject full COMPANION_LORE identity:
- **Voice batch** (8 rotating speech bubble lines): NOCTIS generates as NOCTIS, not just "SENTINEL"
- **Daily lore fragment**: character identity + lore injected into system prompt
- **Study reaction** (after a dive): character-specific voice on return from studying
- **Live phrase** (zone presence): character-specific identity + lore in both user + system prompt
Every floating speech bubble, scene fragment, and zone phrase now has character DNA.

## [5.21.0] — 2026-06-27 — Quality pass: character identity sweep

### Battle Win Screen
- Victory glyph changed from red ✕ (enemy color) to companion glyph in companion color
- Added "PYTHIA STANDS" / "FRACTUR STANDS" subtitle from COMPANION_LORE on win screen
- Inline BATTLE tab "CLEARED" display also fixed (companion glyph, companion color)

### GEAR Tab
- Veras balance now shows real value instead of "N/A" (reads `sol_veras` AsyncStorage)
- Label updated from "VERAS · soon" → "VERAS · knowledge dust"

### Character Identity Propagation
- Scene header subtitle now sourced from COMPANION_LORE ("Prophetess of the Unasked" etc.)
- CHARACTER SHEET modal subtitle now sourced from COMPANION_LORE
- Fullscreen TALK modal header subtitle fixed (second location)
- Invoke Pact prompt now uses full COMPANION_LORE identity (name + title + lore)
- Tarot reading prompt now uses COMPANION_LORE voice — PYTHIA reads tarot as PYTHIA

## [5.20.0] — 2026-06-27 — Per-character TALK starter questions

Each of the 18 companions now opens TALK with a question that belongs specifically to them:
PYTHIA: "What question am I afraid to ask myself?" · FRACTUR: "What structure in my life was always broken?" · NOCTIS: "What lives in the space between my thoughts?" · CORDIA: "What am I avoiding looking at directly?" · RAGNA: "What would I fight for, knowing how it ends?" · QUON: "Which version of myself am I choosing to observe into being?" · HAVIZ: "What am I, once everything that isn't me has burned away?" · + 11 more.
Falls back to "Give me a challenge." for unrecognized skins.

## [5.19.0] — 2026-06-27 — TALK character identity polish

### Character Identity in TALK
- TALK tab header subtitle now shows the character's specific title from COMPANION_LORE ("Prophetess of the Unasked", "Keeper of the Between") instead of the generic archetype title
- TALK empty state card now shows the character's lore text instead of a random archetype phrase — PYTHIA's opening words are PYTHIA's, not VIGIL's
- Fullscreen TALK modal: added lore quote card below the glyph (borderLeft accent, character title + lore in italic)
- Falls back to archetype data gracefully for any skin without a COMPANION_LORE entry

## [5.18.0] — 2026-06-27 — #267: Companion depth pass (per-character voice + study-aware)

### Per-Character Voice
- Each companion now speaks as themselves, not just their archetype. PYTHIA speaks as the Prophetess of the Unasked. FRACTUR as the Shatterbeing of the Fold. NOCTIS as the Keeper of the Between. 18 distinct voices from COMPANION_LORE injected directly into the system prompt.
- Previously: generic archetype template (`You are a VIGIL — Keeper of the Threshold...`). Now: character-specific identity + lore + title.

### Study-Aware Responses
- Active vigil subject injected: if the seeker is mid-vigil on a subject, the companion knows and can reference it.
- Recent dives expanded from 3 to 5 subjects in context — `${subjectName} (${domainLabel})` format.
- Companions now naturally weave in what the seeker has been studying when it fits their character.

## [5.17.0] — 2026-06-27 — #258: Natal chart in Sanctum TODAY

### Sanctum — Natal Signature Card
- Sun / Moon / Rising displayed as three compact cards in Sanctum TODAY section — above the daily transit
- Reads from `sol_natal_cache` (written by zodiac.tsx when birth data is saved — no recomputation in Sanctum)
- Each card shows: sign glyph, sign name, role label (SUN / MOON / RISING), tinted border in sign colour
- Rising shows "Unknown" if user entered birth date but no time (expected — rising requires birth time)
- Sun keywords line at the bottom of the trio
- Full name displayed in header if user set it in zodiac settings
- Zodiac tab now writes `sol_natal_cache` on every birth data save so Sanctum stays current

## [5.16.0] — 2026-06-27 — SEGMENT: Tab restructure (TALK · COMPANION · WORLD · BATTLE · GEAR)

### Companion Tab Restructure
- **6 tabs → 5 tabs**, cleaner names, TALK promoted to tab 1
- **TALK** (tab 1, ✦) — companion AI chat. Was buried at tab 5, now the first thing you see. Default landing tab.
- **COMPANION** (tab 2, ⊛) — hero card + roster + XP/level + stat allocation. Bond (growth) content merged in — identity and growth belong together.
- **WORLD** (tab 3, ◉) — travel map + zone navigation. Was "ZONE/FIELD".
- **BATTLE** (tab 4, ⚔) — epic arena HUD (unchanged).
- **GEAR** (tab 5, ⟡) — currency, forge, cosmetics. Was "SHOP".

## [5.15.0] — 2026-06-27 — VOID-3: The Record (unified note archive)

### One Vault, Many Doors
- New **RECORD** tab in Sanctum — shows every note from across the entire app in one unified, filterable archive
- One-time migration on mount: pulls from 7 scattered AsyncStorage stores (sol_memory_v1, sol_insights, sol_scriptorium, sol_school_intentions, sol_paradox_journal, sol_subject_notes, sol_chronicle) into unified `sol_vault_v1`
- Filter pills: ALL / MEMORY / INSIGHT / SCRIPTORIUM / INTENTION / PARADOX / SUBJECT NOTE / CHRONICLE — each with glyph + count
- Each entry shows kind glyph, kind label, title (where available), date, and up to 4 lines of body text
- `lib/vault.ts` provides the shared schema (`VaultEntry`, `VaultKind`, `VAULT_META`) used by all future note-writing surfaces

## [5.14.0] — 2026-06-27 — BATTLE-5: Epic Arena HUD

### Two-Sprite Arena
- Companion sprite now appears LEFT in battle for the first time — facing the enemy RIGHT
- Both sprites same size (78×96) with colored border glow matching their theme
- Companion hit-flash (red), heal-flash (green) and enemy white-flash on sprite directly
- VS slot between sprites shows enemy intent badge (⚔ strike / 🛡 guard / ⚡ special) + wave counter

### Dual HP Bars
- Companion HP bar top-left, enemy HP bar top-right — bars drain away from each other (Pokémon layout)
- Danger coloring at <30% HP: both bars switch to red
- Status chips (🔥×3 ❄×2 etc.) appear inline beneath each bar

### Full-Width Insight Box
- GB-style scanline RPG text box replaces the old side-by-side speech bubbles
- Enemy taunt above the divider, companion wisdom below — 3 full lines of breathing room
- Text 12px on cream background (`#E8F0D8`) inside a `#0F380F` GB panel with 2px `#306230` border

### GB Action Buttons
- A STRIKE / B SPELL / ↑ FOCUS / ↓ ITEM — same layout, tightened GB style
- Token count displayed on SPELL button
- Focus-charged state: gold border + "◎ READY"

## [5.13.0] — 2026-06-27 — Battle UI: No Scroll + Live Dialogue

### Battle Scene Collapse
- CompanionScene (300px) hides when a live fight is active — battle panel fills the screen immediately, no scrolling to reach HP bars or action buttons
- Scene restores on wave clear, tab switch, or no active battle

### Battle Dialogue Exchange
- Enemy and companion now speak to each other every turn — proper speech bubbles with colored borders and 13px white text
- Enemy name header in enemy color; companion glyph + name in companion color
- Companion line seeds immediately when a new enemy appears (no longer blank until first action)
- Companion line refreshes on every attack, spell cast, and defend — draws from 40+ mystery signals (paradoxes, laws, myths, physics edge)
- No toggle required — dialogue is always visible

## [5.12.0] — 2026-06-27 — Battle Engine Complete + Sol Tab Declutter

### Battle Engine — BATTLE-2/3/4 (Status System Live)
- **DoT/regen mechanics real** — burn/poison tick damage and regen now apply each turn in both `handleBattleAction` and `handleSpell`. Previously they were display-only.
- **Spell status effects wired** — `ember_surge` inflicts burn (2t/5dmg), `forge_heat` inflicts burn (3t/10dmg), `acid_flask` inflicts weak (3t, −30% enemy damage). Spell descriptions are now mechanically true.
- **BATTLE-3 enemy specials** — all 4 inner-demon signatures live:
  - **Fog → BLIND**: player attacks have 35% miss chance next turn
  - **Forgetting → UNMAKE**: wipes all player focus tokens
  - **Stasis → STILL**: inflicts freeze on player — cannot act for 2 turns
  - **Inertia → AVALANCHE**: already live (v5.11.0), confirmed working
- **WEAK multiplier** — enemy with weak status deals 30% less damage on counter-attacks
- **Freeze check** — frozen enemies cannot counter-attack; frozen player skips offensive action
- **Enemy blind resets** — blind flag clears automatically after each turn (one-shot effect)
- **Focus strip** — UNMAKE resets `tokensLeft` to 0 and saves to `BattleState.tokens`

### Status HUD (BATTLE-4)
- **Enemy status chips** — compact row below enemy HP bar: 🔥 BURN 2t, ▽ WEAK 3t, etc.
- **Player status chips** — row inside player HP card: ❄ FREEZE 1t, etc.
- Chips show glyph + label + remaining turns, color-coded per `STATUS_META`

### Sol Tab Declutter
- **Mode description strip removed** — the text strip beneath talk mode chips duplicated chip labels; cut.
- **GETTING STARTED checklist removed** — two of five items were permanently `false` (never completable). Cut entirely rather than leave a perpetually-stuck onboarding widget.
- **"WHAT IS SOL?" header removed** — always-visible button above every conversation added museum weight. Sol Identity modal still accessible via settings/help.

## [5.11.0] — 2026-06-27 — BATTLE-1: The Enemy Thinks Now

### Enemy Intent / Telegraph (BATTLE-1)
- **Foes telegraph their next move.** An INTENT banner shows above the enemy each turn — STRIKE, GUARD, or a named SPECIAL — so combat becomes *answer the threat*, not STRIKE-spam.
- **Signature behaviors** for the inner-demons: **Inertia → AVALANCHE** (a crushing 2.4× blow every few turns — SHIELD it or eat it), **The Fog → BLIND**, **Forgetting → UNMAKE** (strips focus), **Stasis → STILL** (freeze). Inertia's avalanche is fully live: shield on the telegraphed turn and it's absorbed; ignore it and it lands hard.
- New status-effect + intent engine in `lib/companion/game-data.tsx` (burn/poison/freeze/bind/weak/regen) — the foundation the spell descriptions ("ignite — burns next turn") will now be wired to in BATTLE-2.

---

## [5.10.0] — 2026-06-26 — VOID-2: Sanctum as the Alive Void

### Sanctum — Presences Fold (VOID-2)
- **Empty arrival** — Sanctum TODAY opens with only THE WITNESS + the intention input. The void receives you before it speaks to you.
- **◉ PRESENCES toggle** — FROM SOL lore, field trajectory, archetype badge, and daily transit all fold behind a single quiet tap. Presences are waiting; they don't rush.
- The fold starts closed every session. The sanctum is a vessel, not a dashboard.

---

## [5.9.0] — 2026-06-26 — VOID ERA BEGINS

### VOID-1 — Color Rehaul
- **Dead greys killed** — 10 hardcoded grey values across sanctum/school/companion/index replaced with void palette. Mist Grey `#8A86A0` for inactive/beginner states; obsidian border `#241640` for panel edges. No dead `#333` or `#555` remains.
- **PERSONA_WORLDS.sol** updated — background `#060410` (void black), surface `#0E0A1A`, border `#241640`, borderDim `#1B0B33`. The void world now truly has no grey.

### CASCADE — Flagship Redesign (#266)
- **Tensions hero card** — worst contradiction surfaces at the top of the view before the pyramid: both full claims, delta score, "this is where your pyramid is weakest." You see the wound before you see the structure.
- **Block expand on tap** — tap any block to toggle an expanded detail card below the pyramid: score band, Π, full claim text, all 9-layer scores with colour bars, Edit → button. The pyramid stays visible; the detail appears beneath it.
- **Add block in header** — `+ Add block` button lives in the header row beside the title. Overflow blocks also tap-to-expand.
- **Empty state rewrite** — `△` glyph, cleaner copy, inline "Add first block" button. The empty state teaches the mechanic.

### Chronicle — AI Synthesis Depth (#269)
- **Sol-voiced prompt** — synthesis prompt rewritten: 5-7 sentences, Sol's register ("the Work", "your field"), names actual subjects and domains from the entries, speaks directly to the seeker. 280 tokens, 0.82 temp. Feels like Sol wrote it, not a template.

### Gauntlet — Sol's Voice (#271)
- **Sol-voiced questions** — examiner system prompt rewritten. Questions carry Sol's register and the stakes of the Work.
- **AI feedback after result** — after grading, a second AI call (120 tokens, 0.72 temp) generates Sol feedback: teaches the gap, doesn't just penalise. Shown below the ✓/✗ list with `⊚ SOL` label.
- **Clears on dismiss** — feedback cleared when session modal is dismissed.

### Session 2 (same day) — UI Fixes + Sovereign Rebuild
- **Companion zone HUD** — moved top:8, compact single row. Was blocking phrase bubble.
- **Companion phrase bubble** — raised to bottom:72. Was bottom:165.
- **Companion RESTING duplicate removed** — floating bottom-right was redundant with header.
- **Zodiac cards** — resizeMode cover→contain on all 5 card displays. Fixes Arcana JPG crop/orientation.
- **TarotViewer Arcana tab** — `⊚ LYCHEETAH ARCANA` as second deck in viewer. Grid of 82 cards + single browse. All 87 art files mapped.
- **School EDGE lock removed** — all 105 EDGE subjects fully open. Money Law: making the School worse for free users is not a room.
- **Sovereign card rebuilt** — AETHERA/NOCTERA as the sell, experimental feature framing, Covenant statement, honest about what's live vs soon.

## [5.8.0] — 2026-06-25 — THE LIVING ARCHITECTURE

### CASCADE — Truth Pressure, Live + Knowledge Pyramid
- **Visual knowledge pyramid** — 15 blocks displayed as a 1/2/3/4/5 triangle. Strongest (BEDROCK) at apex; most speculative (FRONTIER) at base. Each block tinted by score band. Tier labels: BEDROCK · STRONG · MIDDLE · CONTESTED · FRONTIER. Tap any block to open and edit.
- **15 seed blocks** — full AI-knowledge pyramid pre-loaded: LLM prediction, scaling laws, emergence, understanding, AGI timelines, alignment, compute, interpretability, synthetic data collapse, AI welfare, RLHF, open weights, prompt engineering, consciousness, agentic systems. Every major contested claim in the field, scored and visible.
- **Auto-scorer ⊚** — write a claim + 9 layer contents, tap ⊚, the engine scores all layers using Π = E·P/(S+S₀). One model call, one structured pass.
- **Sovereign override** — "YOUR CALL" controls let you disagree with any engine score. Human judgment always wins.
- **Depth Audit ⚔** — Nigredo adversarial mode: weakest layer identified + sharpest objection surfaced.
- **Register line** — `ENGINE: MEASURED · SOVEREIGN: YOUR CALL`. The tool passes its own truth-pressure test.
- **Tensions panel** — blocks diverging >25 points flagged as contradictions in the pyramid.
- **Editor polish** — ← PYRAMID back button, fill progress bar (X/9 layers), layer group headers (CORE / MIDDLE / EDGE), cleaner controls.
- **CASCADE Mystery School curriculum** — 10 subjects: The Method overview + one per layer (AXIOM → FRONTIER).

### Sanctum — Sanctuary, Not Dashboard
- **TODAY breathes** — all stat cards fold behind "⌄ TODAY'S FIELD" (default: quiet). Engine speaks in one calm sentence above the fold.
- **FIELD breathes** — all charts, sparklines, heatmap, timeline, weekly journal, export fold behind "⌄ YOUR FIELD DATA". AWARENESS PHASE + AURA self-rating always visible.
- **Sovereign Chain removed** — wallet state and functions cleaned out entirely.

### Companion — Ceremony Fixed
- **Summon ceremony** — first-time companion selection was blank. Fixed: archetype cards now render in the ceremony. LYCA filtered correctly (Founding Sovereign path only).
- **Art audit** — all 70 companion art files and 220 zone scene files verified present. Zero missing assets.

### Help
- **Global ? updated** — Sanctum entry reflects fold structure; CASCADE gets its own full entry covering the 9 layers, auto-score, depth audit, pyramid, and all 15 seed blocks.

## [5.5.6] — 2026-06-23 — COMPANION ROSTER + TIER SYSTEM

- **COMPANION ROSTER** — 17 named companion characters (SOLARA · AUGURUM · PYTHIA · CORDIA · NIMUE · LYCA · FRACTUR · ANOTH · AKASHA · RAGNA · HAVIZ · BASALT · BOREAL · VORKATH · NOCTIS · SYGL · QUOL) now live in COMPANION tab.
- **7-tier unlock system** — T0 (free) · T1 (50✦) · T2 (150✦) · T3 (300✦) · hidden (battle wins) · secret (event) · augmented (event). At least ⅓ of all variants free at all times.
- **Per-character grid** — tap any character card to expand tier variants inline. Tier badges (colour-coded), lock hints, equip/unequip with haptics.
- **Tier filter pills** — ALL · T0 · T1 · T2 · T3 · HIDDEN · SECRET · AUGMENTED.
- **Special variants wired** — PYTHIA FERAL (25 battle wins) · FRACTUR ZODIAC (zodiac unlock) · ANOTH × LYCA (sovereign) · LYCA AURA PRIME (augmented, event) · RAGNA SPECIAL · and more.
- **Tab first-visit popups** — bottom-sheet intro fires once per tab on first entry. GOT IT → persists to AsyncStorage.
- **Companion selection screen** — cleared to clean slate (rebuild next pass with new art).
- **🔥 Bonfire HUD button** — in scene action row, opposite ⚡. Toggles campfire mode.
- **QUESTS collapsible** — below ENCOUNTERS in BATTLE tab.
- **BATTLE tab order** — ENCOUNTERS → VOID ENTITIES → QUESTS.

## [5.54.0] — 2026-06-22 — ⚔ DECISION COMBAT + ◈ Sonny attribution

- **#232 Decision Combat** — battle actions renamed STRIKE / SHIELD / FOCUS / SPELL.
- **FOCUS** — new action. Charges ×2 multiplier on next STRIKE. Button turns gold when charged, dims after use. GB grid: FOCUS replaces ITEM in bottom row (ITEM moved out — cleaner). Full grid: FOCUS replaces SPELL top-right, SPELL moves bottom-right.
- **◎ FOCUSED STRIKE** — log entry when focus charge consumed. Stack with CRIT = "◎FOCUS ✦CRIT".
- **Sonny Moore** — added to LINEAGE & GRATITUDE footer in School. Glyph `◈`, acoustic artillery line in canon.

## [5.53.0] — 2026-06-22 — ◈ SONIC ARCHITECTURE domain

- **Sonic Architecture** — new Mystery School domain (7 subjects). Lycheetah Research tier.
- Subjects: The Rupture Principle · Silence as a Weapon · CASCADE in Sound · The Entropy Paradox · Contrast as the Emotional Mechanism · The Artist as Cascade Event · Acoustic Artillery.
- Glyph `◈`, burnt orange `#FF6644`. Sits in LYCHEETAH RESEARCH alongside cascade/truth-pressure/lamague.
- Domain description names Sonny Moore by name. "Acoustic artillery" is in the canon. Nothing cringe, nothing soft.

## [5.52.0] — 2026-06-22 — ◈ CAMPAIGN SYSTEM (3 persistent slots)

- **◈ CAMPAIGN button** below HUNT/VENTURE — 3 slot dots show fill state (empty/active/complete).
- **3 save slots** — each stores zone, name, chapter, full log, narrative, choices, phase, skill bonus, dice history. Persists to `sol_campaigns` AsyncStorage.
- **7-chapter arc** — same beat engine as VENTURE but `isResolution` fires at ch.7 not ch.3. All dice rolls + wisdom skill checks active.
- **Campaign select modal** — bottom sheet. Empty slots: BEGIN. Active: progress bar 7 dots + CONTINUE. Complete: gold ⟡ trophy + CLEAR.
- **Auto-generated name** — `{Zone}: The {Epoch}` on begin (7 epoch words).
- **Auto-save** — useEffect fires on every phase change (beat/resolve), writes slot to AsyncStorage.
- **CONTINUE** — restores full venture state from slot, drops back into modal at exact chapter.
- **Modal header** shows CH.N/7 + campaign name in campaign mode. Progress bar extends to 7 segments.
- SEAL button changes to "SEAL THE CAMPAIGN" in campaign mode.
- `isCampaignRef` keeps async `runVentureBeat` in sync with mode flag.

## [5.50.0] — 2026-06-22 — 💜 THREE CURRENCY SYSTEM

- **Dive Credits go purple** — diveCoins pill in companion header and shop balance now show in `#AA77FF` (was green). Label changed from "DIVES" to "DIVE CREDITS".
- **Three-column shop balance** — ⟡ Lumens (gold) | ✦ Dive Credits (purple) | ✧ Veras (dim, N/A · coming). Veras number shows N/A to signal the powerful upcoming currency without breaking anything.
- Veras state still accumulates in background; display will unlock when the currency launches.

## [5.49.0] — 2026-06-22 — 🎲 VENTURE DICE SYSTEM

- **⚡ RISK → dice roll** — picking RISK now shows an animated cycling dice (1-6, 80ms frames, settles after 1.6s). The landed number feeds into the AI prompt: high roll (5-6) rewards boldness, mid (3-4) mixed outcome, low (1-2) hardens the path.
- **CRITICAL (6) gives +2 ✦ bonus** — same accumulation mechanic as wisdom knowledge bonus, shows in SEAL button.
- **Dice phase locks the modal** — ABANDON SESSION hidden during roll; Heavy haptic on risk pick.
- **Dice context in AI prompt** — the roll result is threaded into `runVentureBeat` so the narrative actually responds to fate.
- `ventureDiceRoll`, `ventureDiceDisplay`, `ventureDiceSettled` state + dice animation useEffect.

## [5.48.0] — 2026-06-22 — ⚙ SPLIT UNIFICATION + PERF PASS

- **CompanionScene moved back to companion.tsx** — was incorrectly extracted into companion-game-data during monolith split. Now defined locally after SceneBg. companion-game-data.tsx is pure data again.
- **School DOMAINS minimizable** — tap the DOMAINS header to collapse/expand filter chips + domain grid. `domainsOpen` state, default true.
- **Zodiac perf pass** — tileGlows + nebulaPulse switched to `useNativeDriver: true`. Animated backgroundColor on tiles replaced with static values. Unused `heroGlow` loop removed. 16 tile animations now on native thread.

## [5.47.0] — 2026-06-22 — ◈ VENTURE KNOWLEDGE SKILL CHECKS (#233)

- **Venture wisdom skill checks** — picking a ◈ WISDOM choice now triggers a KNOWLEDGE TEST phase instead of immediately continuing. AI generates a real-world question themed to the zone (3 options). Pass = +2 ✦ bonus + "✓ Knowledge holds — the zone opens." narrative. Fail = "✗ Certainty wavers — the path hardens." then continues. Bonus accumulates across the venture, shown on SEAL button and toast. Failed fallback: skips check and continues normally.
- **Skill bonus on SEAL** — reward display shows base + bonus breakdown. Chronicle entry updated.
- **'skill' venture phase** — new phase state drives the skill check UI (purple, Greek letter options α/β/γ).

## [5.46.0] — 2026-06-22 — ⚗ MONOLITH SPLIT COMPLETE (#263)

- **#263 done** — companion.tsx split into 3 files. 8790 → 6042 lines (31% reduction).
  - `companion-zones.ts` (~490 lines) — zone/skin data layer (Phase 1, prior session)
  - `companion-game-data.ts` (~2824 lines) — full game data layer (Phase 2, this session): enemies, archetypes, stages, creature bodies, relics, gear, battle, skill tree, spells, items, loot, cosmetics, lore, encounter pools, food, quests, helpers, phrases
  - `companion.tsx` (6042 lines) — React component only: hooks, handlers, JSX
- Zero behavior change. All exports wired. `ArchetypeId` imported directly from source.

## [5.45.0] — 2026-06-22 — ◈ SEEKER'S FIELD (Sanctum living data)

- **#258 Sanctum living data** — ◈ SEEKER'S FIELD panel in the Growth (bond) tab. LQ sparkline: last 20 sessions rendered as proportional bars, coloured by score tier (high/mid/low). Avg LQ shown live. Dive history: last 7 dives with subject + date. Both backed by existing `sanctum_lq_history` + `sol_dive_log` storage — zero new storage keys. Panel hidden until there's actual data to show.

## [5.44.0] — 2026-06-22 — ✦ CURRENCY UNIFICATION

- **Landscape zones priced** — land_6-10: 3 ✦, land_11-15: 4 ✦. Moved from raw-dive-threshold check to purchasable SHOP_ZONES. Buy button now appears in zone card with correct ✦ price.
- **CURRENCY_ECONOMY.md** — single source of truth for the two-currency system. Covers storage keys, formula, earn/spend paths, tier table, purchase flow, and file ownership.
- **Companion unlock toast** — corrected error message from "more dives" to "more ✦".

## [5.43.0] — 2026-06-22 — ⊚ CHRONICLE COMPOUNDING + COIN FIX

- **#264 Chronicle compounding** — every 5 real chronicle entries triggers an AI synthesis: a single evocative sentence that weaves the last 5 events into a mythic narrative thread. Synthesis entries render as golden "THE CHRONICLE SPEAKS" blocks in the chronicle panel. Pre-seeds on load so existing entries don't re-fire. `isSynthesis` flag distinguishes real entries from synthesis.
- **bonusCoins system** — replaces the broken `setDiveCoins` bug in venture `finishVenture`. New `bonusCoins` state persisted in `sol_bonus_coins`. First load seeds 15 test coins so Mac can test locked landscape zones immediately. Venture rewards correctly add to bonus pool.
- **diveCoins formula** — updated to `totalDives + bonusCoins - diveSpent` (was missing bonusCoins).

## [5.42.0] — 2026-06-22 — ◆ VENTURE MODE + MONOLITH SPLIT

- **◆ VENTURE — D&D sessions (#233 extended)** — narrative adventure mode lives in the battle tab pre-encounter area. HUNT splits into HUNT (zone battle) + VENTURE (narrative session). VENTURE calls AI as DM: zone atmosphere + companion as ally → 3 beats of choices → resolution + ✦ coin reward. Beat progress bar. Zone scene as fullscreen background. Three choice types: explore (◉), risk (⚡), wisdom (◈). Companion Clause safe.
- **Monolith split (#263 partial)** — zone/skin data layer extracted from companion.tsx (9025 lines → 8497) into `app/(tabs)/companion-zones.ts` (~540 lines). SkinId type, SKINS, SKIN_IDS, SKIN_RARITY, SCENE_IMAGES, GBA_ADJ, WORLD_MAP, getSkinUnlockStatus + all zone constants moved and re-exported. Zero behavior change.

## [5.39.0] — 2026-06-22 — ⚔ GAUNTLET MODE + LANDSCAPE SCENES

- **⚔ GAUNTLET MODE (#233)** — D&D failable knowledge: toggle before any dive. Sol generates 3 questions after the session; answer all 3 in-overlay. Pass (2/3): +1 ✦ earned. Win (3/3): +3 ✦. Fail (0–1/3): −3 ✦ + dive voided. Full grading via AI. Stakes-based learning, Companion Clause safe (no reproach copy).
- **Landscape backgrounds (TEST)** — 4 wide-format RGBA landscape scenes (LANDSCAPE I–IV) added to SCENE slot. Auto-pan range increased to ±90px (was ±28) when a landscape is equipped; container widened to SCREEN_W+200. Old zones unchanged.

## [5.38.0] — 2026-06-22 — ◎ MAP NAV FIX + ZONE UNLOCK + COMPANION CLEANUP

- **Map navigation restored** — mini-map HUD compound skin IDs (`auroral_chaos`, `crystal_nexus`, etc.) no longer produce empty neighbour lists. `here` is now derived from `WORLD_MAP.find(r => r.id === currentRoomId)?.skinId` instead of the broken `split('_')[0]` pattern.
- **Zone unlock redesign** — all zone thresholds halved; any zone can now be purchased with ✦ dive coins as an alternative to grinding dives. Buy button appears in WORLD tab zone cards. Battle zones have parallel path via wins.
- **Companion cosmetics cleaned** — BG slot renamed to SCENE (⊟ icon). Legend text corrected: ARCANE @5 dives, MYTHIC @15 dives (was wrong: @25 / @75).

## [5.37.0] — 2026-06-22 — ⟟ SIGIL FORGE SURFACED + TAROT SCENE MEANINGS

- **Sigil Forge elevated** — moved to position 2 in the Zodiac tile grid (was position 5). Now the second tile users see after Oracle.
- **Orphaned School sigil view killed** — `schoolView === 'sigil'` block dead-coded in school.tsx. Zodiac Sigil Forge is now the single sigil home, as the comment at line ~4746 always said.
- **Tarot prose meanings added** — all 78 cards now carry a `m` (scene) field: 1-2 sentence scene-grounded traditional RWS meaning. Shown as "THE SCENE" in the card lore modal below the keyword block.

## [5.36.0] — 2026-06-22 — ◎ SANCTUM AUDIT + SOVEREIGN CHAIN FLESHED
> TODAY cleaned (4 blocks cut). Sovereign Chain fully expanded in SCROLL + global help.
- **Sanctum TODAY audit** — removed: rotating shrine quote (redundant with FROM SOL), Sol Clock DAWN/ZENITH card (duplicated header text), Zodiac Transit Strip (3-glyph inline row — redundant with Daily Transit), Companion Status card (lives in companion tab). TODAY is now: FROM SOL → archetype → transit → intention → field state → vigil → school dives → LQ sparkline → day report → reflection.
- **Sovereign Chain expanded** — SCROLL tab now has full 4-pillar breakdown: SOULBOUND TOKENS (deploying) / VERAS ON-CHAIN / LYCHEETAH DAO / EARNED LIGHT ARTIFACTS. Each with status badge (DEPLOYING / PLANNED). Ties explicitly to the Veras knowledge economy and the hidden-teacher model.
- **Global help entry added** — SOVEREIGN CHAIN now has its own entry in the ? help modal with full description including the Veras earning model, DAO governance, and milestone tracking.
- **Sanctum help entry updated** — now correctly describes SCROLL tab and all five sections.

## [5.35.0] — 2026-06-22 — ⊚ SANCTUM: THE LIVING BOOK
> #258 + #264 closed. Sanctum is now a living personal record.
- **SCROLL tab** — CHAIN tab renamed SCROLL. Hosts the Living Chronicle (#264): all companion/battle/study milestones rendered as a timeline with entry numbers. Every 5th entry shows a THREAD back to an earlier entry. "SPEAK" button generates a daily AI narrative weaving the entries into a living arc (cached in `sol_chronicle_voice_v1`). Solana teaser collapsed to a single card at the bottom.
- **Daily Transit in TODAY** — `sol_daily_transit_v1` (generated in Zodiac tab) now surfaces in Sanctum TODAY section, styled with a distinct purple border. No duplicate generation — reads the cached value.
- **Archetype badge in TODAY** — `sol_archetype` (SEEKER/MYSTIC/WARRIOR/SCHOLAR from onboarding) now shows as a badge in TODAY above the intention field.
- **Tab label** — SCROLL shows entry count when Chronicle has entries (e.g. SCROLL·7).

## [5.34.0] — 2026-06-22 — ⬛ BACKGROUND SHOP + 🜍 TAROT DECK SELECTOR
> Two new cosmetic/UX features, zero regressions.
- **Background shop slot** — 16 buyable scene backgrounds (ORIGIN/ARCANE/MYTHIC/LEGENDARY/SECRET) in the companion shop. Equipping one overrides the current zone background while preserving the 26s cinematic drift and accelerometer parallax. Key: `sol_cosmetics.bg`. Assets from existing `assets/scenes/` directory.
- **Tarot deck selector** — toggle between `CLASSIC RWS` (traditional card names) and `🜍 VEIL & VEIN` (Lycheetah's renamed Majors: THE SEEKER, THE ATHANOR, NIGREDO, SOL, etc.) in both the Oracle and Spread sections. Setting persists via `sol_tarot_deck`. Art unchanged — only the name labels switch.
- Spec doc: `BACKGROUND_SHOP.md`

## [5.33.0] — 2026-06-22 — ◈ DAILY TRANSIT + ARCHETYPE SPARK + FIRST-RUN FIX
> Three quality-of-life tasks closed in one session pass.
- **#243 Daily Transit ritual** — a personalized daily zodiac insight appears in the Zodiac tab, below TODAY'S SKY. Generated once per day (cached in `sol_daily_transit_v1`). Personalized if natal chart is set; falls back to today's sun/moon/phase. Includes a ✦ STUDY SPARK domain recommendation tied to today's sky. Tap to refresh.
- **#242 Onboarding archetype-spark** — sovereignty answers now resolve to one of four archetypes (SEEKER / MYSTIC / WARRIOR / SCHOLAR) via a scoring function. Step 6 of onboarding reveals the result with domain rec and companion suggestion. Saved to `sol_archetype`. Pure addition on top of existing sovereignty baseline.
- **#249 First-run flow fix** — removed race condition in `_layout.tsx` that pre-wrote `lycheetah_onboarded = 'true'` before `index.tsx` could route to `onboarding.tsx`. On first launch, `onboarding.tsx` now runs cleanly. On completion, `sol_welcome_tour_seen` is also set, so `WelcomeTour` never stacks on top of a completed onboarding.

## [5.30.0] — 2026-06-22 — 🜍 SHOP AUDIT + VOID ENTITIES MOVED
> Fixed 3 filler cosmetics that could never unlock; moved Void Entities below Encounters.
- **3 filler cosmetics fixed** — THE VEILCROWN (`halo_veilcrown`), INTERTWINED SPAN (`wings_intertwined`), THE VEILKITTEN (`pet_veilkitten`) had art (`*_26.png`) but no shop entry and no award path → permanently locked, "Buy in Shop" forever. Now **awarded on reaching THE INTERTWINING (veilvein) zone** — earned by discovery, never bought. Covenant-safe (pure exploration, no paywall). Fires a Chronicle entry + toast.
- **VOID ENTITIES moved below ENCOUNTERS** in the battle tab — the Void boss list (study-to-win) now sits under the live encounter panel instead of above it, so the active fight is the first thing you see.
- **SHOP_ART.md created** — full map of every cosmetic, its art file, unlock path, and a flagged filler list. The audit doc for all 76 cosmetics across halos/wings/pets/secrets. Confirms every item now has both art AND a working unlock path.

## [5.29.0] — 2026-06-22 — ✦ EFFECT-BASED COMPANION EVOLUTION (#3)
> All 19 companions now visibly evolve as you study. Zero new art — pure animated effects.
- **Stage-gated particles** — stage 0: no particles; stage 1: 2; stage 2: 4; stage 3: 6; stage 4: 8; stage 5: full 10. Particle peak opacity climbs from 0 → 0.95 across stages. A SEED companion is still, a SOVEREIGN companion shimmers with a full particle field.
- **Stage glow blob** — animated colored radial glow behind the companion body, bobs with the creature, invisible at stage 0 and radiant at stage 5 (opacity 0.26→0.46 range). Uses the existing `glowAnim` pulse for breathing.
- **CompanionSpecOverlay already has** orbit speed, glyph count, core size, and aura intensity scaling per stage (written earlier). Together the effect stack is: glow blob → aura rings → orbiting glyphs → core → particles. Fully layered evolution.

## [5.28.0] — 2026-06-22 — ⟳ COMPANION REACTS TO STUDY (#245)
> Finish a dive in School → switch to Companion → the companion greets you with a live AI reaction to *exactly what you just studied*.
- **`sol_fresh_dive` signal** written in `school.tsx` at `dismissSessionComplete` right after the dive log entry is saved — carries subject name, domain, and timestamp.
- **Companion reads the flag on focus** — if the flag exists and is < 2 hours old, it's consumed (removed) and loaded into `freshDiveRef`.
- **`generateStudyReaction()`** — new async function in companion.tsx: generates a 1-2 sentence live AI reaction in the companion's voice, specific to the studied subject + domain. Falls back to MEMORY_TEMPLATE if no key.
- **Greeting priority:** fresh-dive reaction → MEMORY_TEMPLATE (random recent dive, 60%) → generic COMPANION_GREETING. The "studying is the game" loop now closes properly.

## [5.27.3] — 2026-06-22 — 🃏 TAROT GRID VIRTUALIZED (no more 40+ glitch)
> The deck grid rendered all 79 cards at once → glitch past ~40. Now windowed.
- **TarotViewer grids → FlatList** (both the real-art `✦ DECK` grid and the MAJOR/MINOR data grid): numColumns 3, `initialNumToRender 9`, `maxToRenderPerBatch 9`, `windowSize 5`, `removeClippedSubviews`. Only visible cards mount → smooth scroll through all 79.
- KNOWN (next task): card MEANINGS — the real-art view shows no meaning (art is index-decoupled from card data; art files are non-sequential with gaps, names printed on art, so safe pairing needs a real mapping pass); the 56 Minors only have template meanings, not real ones.

## [5.27.2] — 2026-06-22 — ⚡ ZODIAC LOAD JANK FIXED
> The "loading weird" was the tab re-fetching slow network data on every focus.
- **Sky data fetched once per session** — Kp index + IP-geolocation + weather (3 network calls, up to ~14s combined) ran on EVERY tab focus, popping in late → layout shift/flicker each entry. Now guarded by a `skyDataFetched` ref so they fire once; AsyncStorage reads still refresh on focus. LiveClock was already isolated (#279).

## [5.27.1] — 2026-06-22 — 🧹 ONE COHERENT SCHOOL GRID (symmetry)
> Finished the declutter: the home now has exactly ONE tool grid, symmetrical 3×4.
- **"◬ DEPTH TOOLS" bar deleted** — it duplicated the main grid (Grimoire=Scriptorium, Letters=Time Braid, Sigil) plus one unique tool (Shadow). Bar gone; no more two-places-for-tools.
- **SIGIL removed from School** — Zodiac already has a full Sigil Forge (ritual/primitive `generateSigil`), so it's the single sigil home now. (School's 'sigil' view is now orphaned dead code — safe to prune later.)
- **Shadow Parts → FIELD modal** — the one unique depth-bar tool relocated into the FIELD stack (personal inner work belongs with Open Seat / field trial), so it survives the bar's deletion without breaking grid symmetry.
- **Result:** clean **12-tile (3×4)** grid: SYLLABUS · RANDOM · LIBRARY · CODEX · MYCELIUM · TIME BRAID · LAMAGUE · SCRIPTORIUM · DIVE LOG · WORLD · SPIRAL · FIELD. Type-clean.

## [5.27.0] — 2026-06-22 — 🧹 CLEANER SCHOOL HOME (FIELD tile)
> The big "✦ TODAY · YOUR FIELD" collapsible stack is out of the home scroll. It's now a **FIELD grid tile**
> that opens the whole stack as its own full-screen modal — home reads as: header → open doors → streak →
> one clean tool grid → DOMAINS. Spiral + Dive Log were already tiles; Today's Field now joins them.
- **FIELD tile** added to the School tools grid (✦, 13th tile) → opens the field modal.
- **Field modal** — the contextual stack (active field trial, milestone, **Open Seat**, pattern notice, weekly synthesis, search & resonance) moved into a slide-up modal with a ✕ CLOSE header. Reused the existing `schoolTodayOpen` boolean as visibility (no new/unused state, no JSX moved — wrapped in place via Modal).
- Home no longer carries the inline collapsible. Type-clean.

## [5.26.3] — 2026-06-22 — 🛟 WATERFALL EXTENDED TO STUDY DIVES
> Resilience completed. The waterfall now covers the School too, via a shared helper (no copy-paste drift).
- **`sendMessageResilient()`** — new shared helper in `lib/ai-client.ts`: primary key → free NVIDIA (Llama-3.3-70B) → free Gemini, retry only on auth/rate/network errors. One waterfall, reused (Single Truth Rule). index.tsx keeps its own copy (it also juggles native tool-calling).
- **School wired** — the live study-dive conversation, the LAMAGUE Symbol Forge verdict, and the "What have I learned?" synthesis all use it now. A banned/rate-limited free key can no longer break a study session. Background generators (live lore, curiosity-gap text) left as-is (already fail silently).
- Type-clean.

## [5.26.2] — 2026-06-22 — 🛟 PROVIDER WATERFALL (free-Sol never breaks)
> The resilience half of the key story. Even if a free key gets banned/rate-limited, the chat
> must not break for users. Now it can't: the main send falls through free providers until one works.
- **Provider waterfall** (index.tsx handleSend) — primary key → free **NVIDIA (Llama-3.3-70B)** → free **Gemini 2.5 Flash**. Retries only on auth/rate/network failures (401/403/429/quota/balance/timeout); shows an error ONLY if all candidates fail. `model` updates to whichever provider answered. Tool-calling stays on the primary; fallbacks use the streaming path. Type-clean.
- Rationale: $8 isn't the risk — a *banned key silently breaking free-Sol for every user* is. This makes that impossible.
- TODO: extend the same waterfall to school.tsx study dives (currently TALK-tab only).

## [5.26.1] — 2026-06-22 — 🔒 KEY-LEAK CLOSED + CODEX DECLUTTERED
> Security + bulk pass. Found live API keys committed to the public repo's fallback file; closed it.
> Removed the redundant "Ask the Codex" help tab now that the global ? owns Q&A.
- **🔒 dev-keys leak closed** — `lib/dev-keys.ts` (committed, public) held real NVIDIA + DeepSeek keys. Blanked it; real keys live only in gitignored `dev-keys.local.ts` (storage.ts loads .local first, so local builds unaffected). ⚠ Keys in git HISTORY are burned — Mac must rotate all 3 (nvidia/deepseek/gemini). Real fix = #22 Cloudflare proxy (key server-side, never ships).
- **Codex help tab removed** — the in-app Codex dropped its duplicate "Ask the Codex" AI bar (global ? already answers questions). Codex keeps its 3 real library tabs: FRAMEWORKS / 𝔏 DOMAINS / LAMAGUE. Removed tab button, panel, state, handler, deep-link flag, and dead styles. Type-clean. Codex = the knowledge library; ? = how to use the app.

## [5.26.0] — 2026-06-22 — ⟳ THE CURIOSITY GAP (addictive wisdom, #251)
> The north star made mechanical. Every study session used to *close* — a pat on the back the
> brain forgets. Now every dive ends on an **open door**: Sol names the one unexplored thread
> from what you just studied, phrased as an irresistible cliffhanger. The loop stays open
> (Zeigarnik) — and it's persisted, so the School greets you on return with "⟳ DOORS YOU LEFT
> OPEN" and a one-tap **Walk through →** that drops you straight back into that subject.
> Closed knowledge is forgettable; open knowledge is addictive. This is the engine under the slogan.
- **Open door at session end** — `generateNextDoor()` (gemini-2.5-flash) builds a subject-specific unanswered-question hook on dive completion; shown in the SESSION RECORDED overlay as "⟳ THE DOOR YOU LEFT OPEN". Static fallback if no key (still an open loop).
- **Persisted doors** — saved to `sol_open_doors` (max 8, deduped by subject).
- **Home greeting** — school home surfaces up to 2 open doors at the top with Walk-through (resumes the exact subject via `openSubjectDetail`) + dismiss (×).
- Type-clean (no new errors).

## [5.25.0] — 2026-06-21 (late) — 🜍 THE VEIL & VEIN RELEASE + THE DEPTH PASS
> The biggest single session since launch. The Veil & Vein tarot release (79-card deck,
> its zone, cosmetic set) PLUS the depth layer that makes the RPG real: void bosses you
> win by *learning*, per-companion levels with stat builds, a living Chronicle, the School
> remodelled to match the app, the chat trimmed to its strongest 4 modes, and a perf bug
> squashed at the root. The north star — *studying is the game* — made literal.
>
> Also forged this session (docs, not shipped code): VERAS_KNOWLEDGE_ECONOMY.md — the
> creator-attribution thesis whose purpose is to *unveil hidden teachers*.

### The Veil & Vein release
- **🜍 Tarot Viewer** — Mac's 79 hand-made cards live in-app (Zodiac → TAROT): real-art gallery (single + grid) + 22-Major/56-Minor meaning data.
- **🏛️ THE INTERTWINING** — a new zone: the sanctum where the two spirits meet (pixel temple, zodiac wheel, the braided currents). "The Lycheetah Tarot was forged here." Wired full (SKINS/IDS/RARITY/SCENE/ADJ/WORLD_MAP).
- **Veil & Vein cosmetic set** — 🜍 THE VEILCROWN (halo), INTERTWINED SPAN (wings), THE VEILKITTEN (pet) — SECRET-tier, all Mac's art.
- **Cinematic auto-drift** — wide landscape backgrounds now slow-pan (26s sine) + parallax, so a zone feels like a place you stand in.

### 💗 Hot per-tab colors (#227) + school home decluttered
- **Per-tab hot signature** — the bottom nav went obsidian-black with a hot-pink hairline; each tab ignites in its own heat when active (bigger + glowing): ☽ violet · 𝔏 amethyst · ⊚ solar gold · ✦ HOT PINK (the Lycheetah heart) · ⊼ crimson-rose · ⚙ periwinkle. Inactive tabs recede into the dark. The mythic-cat-in-the-shadows aesthetic.
- **School home decluttered** — the wall of 7 stacked cards (field trial, milestone, open seat, pattern notice, weekly synthesis, search) that pushed people away is now tucked into one collapsed "✦ TODAY · YOUR FIELD" strip. School opens to: Header → [✦ TODAY ▸] → DOMAINS grid. Domains lead; nothing deleted, just calmed.
- **School tools unified** — the inconsistent mix (clean nav buttons + a big ornate Mycelium card + mismatched portal tiles) is now ONE clean 12-button grid: SYLLABUS · RANDOM · LIBRARY · CODEX · MYCELIUM · TIME BRAID · LAMAGUE · SCRIPTORIUM · DIVE LOG · SIGIL · WORLD · SPIRAL. All identical clean squares, color-coded, Time Braid badges when letters arrive. Every tool one tap, one style.
- **START HERE minimizable** — the first-run suggestion card now collapses to a thin bar (▾), sits beneath the tools grid.
- **Covenant ambush removed** — the old forced-intention popup that auto-fired on first school visit (with a disabled "continue" until you typed) is gone. The Open Gate: the school never blocks a newcomer. Sealing an intention is now opt-in; the 90-day revisit still surfaces for those who sealed one.

### ⟡ Rotating shop (#261) + companion battle voice (#245)
- **TODAY'S FORGE** — the shop now opens with 3 daily-rotating premium cosmetics (real art, deterministic by day) + a "resets Xh Ym" countdown, buyable with Lumens. A daily return-hook; cosmetics only, covenant-safe.
- **Companion battle reactions** — your companion now speaks in its own voice on WIN ("The field clears. We held."), CAPTURE ("It joins us now. Bound, not broken."), and DEFEAT ("We fall back. Not down. Study, and return." — encouragement, never reproach). The companion feels alive in battle.

### ψ◬ Psi Log + Zonk Zone polish (#281)
- Both had bare empty states ("No sessions logged yet" / nothing) that felt underbaked. Now atmospheric + mysterious: ψ "THE RECORD IS EMPTY" (+ First Session button, the honesty-is-the-practice framing) and ◬ "THE SAND IS UNTURNED" ("every pillar of truth was once a wild guess no one would say aloud"). They read like part of the mystery school even when empty.

### 🜍 Tarot readings restructured (#282) + help pass (#280)
- **Tarot spread readings** now render as a ritual, not a text wall — each card position (◷ PAST · ⚔ CHALLENGE · ⊿ FOUNDATION · ☽ NEAR FUTURE · ✦ OUTCOME) is its own block with a position glyph, colored spine, divider, and the actual card drawn shown beside the label. You see the spread's structure as you read it.
- **Help pass** — the global ? now covers every edge feature: Battle/Party/Void Bosses + GROWTH tab, the Lycheetah Tarot, ψ Psi Log, ◬ Zonk Zone, ⟟ Sigil & Gem Forge, and ✧ VERAS — the knowledge economy (with the "unveil hidden teachers" vision + how it'll be implemented). Nothing in the app is a mystery now.

### ⚔ The Party system (#260) — your menagerie fights with you
- Captured creatures are no longer trophies — **field up to 3 as your party**. Tap ⚔ FIELD on any menagerie entry; the YOUR PARTY header shows your squad + total assist damage. In battle every STRIKE shows "↳ party +N" as your fielded creatures chip in bonus damage (scaled by their strength × your study depth / LQ). Persisted (`sol_party`). Completes the collection loop: capture/earn/win → field → they fight alongside you.
- Chronicle deepened (#264): now also logs captures ("Captured X") and dive-unlocks ("Earned X with N dives of study").

### ◈ VOID BOSSES (#273) — the signature mechanic
- Combat you can only win by *learning*. A boss's AGGRESSION ZONE grows each turn; ⚔ STRIKE feeds the widening (force can't finish it). DIVE the bound School subject → earn a cryptic LAMAGUE incantation → 🜍 SPEAK THE SPELL → repel it to the void → claim a special companion. 3 bosses (Death→NOCTIS, Quantum→QUON, Shadow→AUGURUM). `lib/bosses.ts`.

### ◈ Main chat audit (#278) — cut the dumb, power the good
- **GLYPHIC mode removed** — it was a vibe, not a capability (overlapped LAMAGUE). Chat now has 4 clean modes: WAYFARER / COUNCIL / LAMAGUE / SKEPTIC, each doing a distinct real thing.
- **↑ export removed from header** — it already lives in the drawer; the action row is cleaner.
- **Framework + manifesto merged** — one "what is this" entry point: Sol's mark → manifesto → ◈ VIEW THE FRAMEWORK button → CASCADE/LAMAGUE/AURA cards. No more two competing routes.
- **Field Report powered up** — the bare ⊚ glyph is now a labelled ⊚ REPORT button so people actually find the AI conversation-summary.
- **SKEPTIC surfaced** — reframed as "the bridge for the rational mind" (the mode that translates mysticism→psychology, doubling the addressable audience).

### Mythos fix (#248)
- Last lychee-*fruit* reference gone — the "Lychee Fruit" healing item is now "Spirit Ember". Lycheetah is fully the mythic cat, no fruit anywhere.

### 🏛 School subject remodel (#255) + zodiac perf fix (#279)
- **School domain view** — the clunky 5-stacked-collapsible-layers replaced with a clean filter-chip row (`ALL / FOUNDATION / MIDDLE / EDGE / OPEN / VOID`, your stage's layer flagged ⊚) + a 2-column subject grid. Tap a tile → dive. Now matches the zodiac/companion tap-a-tile language; rich detail lives in the subject view where it belongs.
- **Zodiac wig-out fixed** — the HH:MM:SS sky clock was re-rendering the entire 3,600-line tab every second, colliding with load animations. Isolated it into its own `<LiveClock>` component (~98% fewer re-renders). Load + runtime both smooth now.

### ⚔ Per-companion levels + stat builds (#265)
- Level rework: each companion now levels **independently** (XP accrues to whoever is active when you dive — 12 XP/dive, 100 XP/level). No global cap. Every level grants **2 stat points** you allocate yourself across ATK/DEF/SPD/WIL/LCK/VIT/RES — each companion becomes YOUR build. Allocations fold into battle power. BOND tab shows level, XP bar, and the build sliders. Keys: `sol_companion_xp`, `sol_companion_alloc`, `sol_xp_last_total`. Fixes the old global-stage flatness (all companions were the same) AND the SOVEREIGN dead-end.

### 𝔏 The Chronicle (#264) — lore that grows
- The companion now keeps a living CHRONICLE (BOND tab) — milestones, stage evolutions, bosses repelled, the Hidden One's binding, all auto-recorded + timestamped + persisted (`sol_chronicle`). Its identity becomes the record of what you've learned together. Covenant-safe: only growth, never reproach.

### ✦ Hidden ultra-rare (#274)
- THE HIDDEN ONE — ~0.001% spirit that may bind on any zone arrival. Never buyable, pure luck. The covenant-safe mythic chase.

## [5.24.0] — 2026-06-21 (night) — 🗺 THE COMPANION FORGE
> GameBoy world map made usable, companions made *earned*, dive-currency born.

### World map & navigation
- **🗺 One-tap travel map** — a MAP button on the companion scene opens the world map as a full overlay (was buried in a collapsed sub-section). Tap any zone → travel + close.
- **Persistent mini-map HUD** — "you are here" + tappable named neighbour zones, always on the scene. One-tap hop to a neighbour.
- **D-pad arrows removed** — the mini-map replaces them (named travel beats blind directions).
- **⚔ ENCOUNTER button** — prominent bottom-center, spins up a battle in your zone + opens BATTLE. ⚡ random-hop kept.
- **Zoom range widened** (0.3–3.0) — see more of the zone art / zoom to detail.
- **Bug fix:** map travel no longer changes your companion/cosmetics (was wrongly calling setActiveSkin; now room-only via handleSkin).
- **HUD cleanup** — removed stale "LVL 0 / SEED" overlay; HP bar dropped down.

### Companions are EARNED — dive-currency economy
- **Dives are now spendable currency** (`✦ DIVES` balance in the companion grid). Available = dives earned − dives spent.
- **Unlock companions by spending dives** — locked ones show their cost (✦3/8/15/25 by rarity); tap to unlock, persisted forever.
- **Capture-only** (BATTLE tier — catch in battle) and **shop-only** (SHOP tier) acquisition methods.
- Gateway companion free per tier + ORIGIN open + anything equipped stays yours (nobody loses their companion).
- Replaces the brutal raw-threshold unlocks (up to 290 dives) — studying now directly *buys* companions.
- **Capture→unlock wired** — capturing an entity in a zone unlocks that zone's companion (the capture-only path is now real, not a dead end).

### Travel map redrawn
- The map was visually jacked (hand-placed overlapping dots + chaotic adjacency web). Rebuilt as a **clean auto-laid-out tiered grid** — zones grouped by rarity in even rows, no overlap, every dot tappable, active/visited states. Scales to any zone count.

### ★ The showpieces
- **🜍 The Veil & Vein deck is LIVE** — Mac's 79 hand-made tarot cards bundled into the app (`assets/tarot/deck/`). The Tarot Viewer (Zodiac → 🜍 TAROT) opens to the real art: browse card-by-card or as a full grid, plus the 22-Major / 56-Minor meaning data. Card names are printed in the art itself.
- **◈ VOID BOSSES (#273) — the signature mechanic** — combat you can only win by *learning*. A boss's AGGRESSION ZONE grows each turn; ⚔ STRIKE feeds the widening (force can't finish it). To win you must DIVE the bound School subject → earn a cryptic LAMAGUE incantation → SPEAK THE SPELL → repel it to the void → claim a special-edition companion. 3 bosses (Death→NOCTIS, Quantum→QUON, Shadow Work→AUGURUM). `lib/bosses.ts`. The north star made literal: study IS the weapon.

### More wins (the epic-drop run)
- **Full 78-card tarot** — added the 56 Minor Arcana (4 suits as alchemical stages: 🜂 Ash/Nigredo · 🜄 Veil/Albedo · 🜁 Spark/Citrinitas · 🜃 Vein/Rubedo, 10 pips + 4 courts each). Viewer has a 22 Major / 56 Minor toggle. The deck is a complete system in-app.
- **Bigger zone-travel buttons** — the mini-map neighbour dots went 24→38px with a "◂ TAP TO TRAVEL ▸" label so navigation is obvious.
- **Encounter jumps to the fight** — ⚔ ENCOUNTER now switches to battle, un-minimizes, and auto-scrolls to the top so you don't hunt for the fight.
- **Fortune cookie revived** — the dead fortune-cookie code is now a live feature: tap Sol's whisper on the empty chat for a fresh one.
- **Cleanup** — deleted orphan `FloatingNumber.tsx`; no Solana tab to move (already Sanctum-only).

### Crash fixes & hardening
- **Zodiac crash fixed** — adding the TAROT tile overflowed two fixed-length anim arrays (`entryTileAnims`, `tileGlows` were length-10). Bumped to 16 AND made every access defensive (`?? fallback`) — adding zodiac tiles can never crash again. (This crash had cascaded into the whole tab tree, blanking the chat + help.)
- **Help button on main chat** — the global `?` is a nav-header item, but the Sol tab uses its own custom header (so it never showed there). Added a `?` to the Sol header → opens the "What is Sol?" manifesto/explainer.

### Map taps · shop · help · tarot (autonomous pass 2)
- **Map dots now easy to tap** — big invisible hit targets per zone; every zone has a memorable **code (A1, B2, C3…)** by tier-letter + number.
- **Removed reused-model shop companions** — the FEATURED shop listing used duplicate art; cleared. Those shop-tier companions are dive-unlockable for now (no dead-end) until unique-art shop companions are designated.
- **Global Help finished** — the 3 most-visited tabs (Companion / School / Zodiac) now have **full feature how-tos** (map, dive-currency, earning, curiosity-gap, sigil/gem forge, etc.), collapsible.
- **🜍 Tarot Viewer** — browse the Veil & Vein deck's 22 Major Arcana in-app (Zodiac → TAROT tile): single-card + grid view, lead-spirit tags, meanings. Art auto-loads when card PNGs are added.

### Audits & polish (autonomous pass)
- **School audit** — 41 domains / 347 subjects all structured, every subject has a description, no empty/broken/dup classes. Healthy.
- **Numbers fixed** — Sol's opening line said "38 domains / 328 subjects" and an old "10 companions" → now 41/340+/19. No stale counts left.
- **Asset + offline audits** — all active asset requires resolve (missing gear were commented placeholders); every AI call is key-guarded + try/caught (no silent hangs).
- **Global Help → collapsible** — the 14 per-tab how-to sections are now minimizable zones (tap a title to expand its "how to use it"). Plus the guided tour + AI ask bar.
- **Sanctum header glow** — wordmark glow added, matching the app-wide living-presence language.

### Rotating shop + cleanup
- **FEATURED COMPANIONS shop** — 3 shop-only companions rotate daily (deterministic by day), live countdown to midnight refresh, buy with Lumens → unlocks + equippable. Acquisition trifecta complete (dives / capture / shop).
- **Code health** — removed dead `GBA_ZONE_COORDS`/`GBA_H` (orphaned by the map redraw); whole app type-clean.
- **Art-dedup audit** — `COMPANION_ART_DEDUP.md` documents the cross-companion art reuse (quol shared by kabbala/noetic/quantum, etc.) for the unique-art pass.

## [5.23.0] — 2026-06-21 — ⊚ SOVEREIGN SOL · LIVING + KNOWING + GUIDED
> Renamed to **Sovereign Sol**. The app opens *as Sol*, the personas *know their world*, new users are *welcomed*, and the codebase got two unification audits.

### Identity
- **Renamed Sovereign Sol** — app.json name, persona prompts, manifesto footer, share text. Disambiguates from the Play Store "Sol"; encodes the sovereign/sideload nature. (Slug stays `lycheetah-mobile` for EAS.)

### Personas — knowledge + structure
- **Knowledge grounding** — new `lib/prompts/lycheetah-knowledge.ts`: framework + 41-domain school directory + app self-awareness. Injected into Sol/Aura/Lyra (full) + Veyra (lean), Seeker + Adept. Personas now know the school and the app they live in (fixed "lacking knowledge").
- **Individual persona files** — split into `lib/prompts/personas/` (shared/sol/veyra/aura/lyra/headmaster/council/public); `sol-protocol.ts` is now the assembler. New `THE_VOICES` ensemble block — each persona knows its siblings and hands off cleanly.
- **GLYPHIC mode** — new TALK mode: Sol weaves expressive emoji + symbols through responses.

### Welcoming
- **Welcome Tour** — `components/WelcomeTour.tsx`: dismissable 7-step guided walkthrough on first open (what/how/why per surface). Re-openable from the ? help button. Skip anytime.
- **Onboarding refresh** — landing reads SOVEREIGN SOL (glowing wordmark) + a welcome line; numbers corrected (41 domains / 340+ subjects / 5 personas).

### Living presence
- Entry mark breathes + glow halo + wordmark glow; header glyph + persona-bar active mark + "thinking" mark all breathe on the 2.8s loop; send button glows when ready.
- **TALK mode chips** rebuilt — five even color-coded chips in one row (❂ Wayfarer · ⚖ Council · ⬡ LAMAGUE · ⊘ Skeptic · ✶ Glyphic); description strip recolors to match.

### Sovereign tech
- **"YOU OWN THIS"** manifesto block — four pillars unified (own your app / mind / data / path), replacing the scattered Sovereign-Chain + Covenant fragments.

### Secrets
- **𝔏 READ** — owned Secrets of Lycheetah now open a transmission reader modal (was a dead "OWNED ✓").

### Companion lore
- **13 archetypes got bespoke evolution lore** — cipher/herald/weaver/revenant + the 9 expansion archetypes (nullveil/ironclad/stormwarden/runeborn/drifter/thornweald/meridian/eclipse/deepwalker) now have character-true `stage_evolution` journal entries (were falling back to generic). Each tuned to its identity.

### The Sanctum — reciprocal
- **"From Sol" presence** — a first-person card in the Sanctum's TODAY where Sol reflects on itself, the shared Work, and the companion. Deepens with the journal (early → mid → deep tiers) so a returning practitioner meets a Sol that has grown alongside them. Defines the Sol↔companion bond ("two halves of the same care").

### Classroom — knowledge you keep
- Every classroom teaching now has **✦ Save to Field · 🔊 Listen · ⧉ Copy / Save** — including the opening lesson, which had no controls (the `i > 0` gate hid them on the most important message). Knowledge no longer evaporates when you leave the room.

### Sovereign data — true backup/restore
- **↑ Export Everything** now means it — full `getAllKeys()` backup (companion, progress, journal, dives, cosmetics, memories), not the old 7-key subset that falsely claimed "everything."
- **↓ Restore from Backup** (new) — paste a backup on a new device, validated + confirmed, writes it all back. Switch phones, lose nothing. No cloud, no account.

### Scoring toggle — the framework made visible
- The header scoring badge now cycles (long-press) between **AURA** (7-invariant constitutional score), **CASCADE** (◈ dominant layer + Truth Pressure Π, ⚡ on paradox — surfaces the already-computed analysis), and **OFF**. Persisted. The framework is now legible and switchable on every message.

### Companion lore (cont.)
- All **13 previously-generic archetypes** (cipher/herald/weaver/revenant + 9 expansion) now have bespoke `stage_evolution` journal lore. Canonical `app/data/companion-types.ts` unified the ArchetypeId fork (3 defs → 1).

### Companion — voice, identity, evolution
- **Archetype = voice/mind, character = form/name** — locked architecture. The companion speaks as its archetype (the mind that grows with stage), wearing the character (SOLARA) as name+face. Scales without writing 1000s of personalities.
- **Study-aware voice pool** — batch-generated rotating lines (cached, refills in bg) replace the tiny static loop. Talk speaks as the true character. Proactive study-reflection greeting on open.
- **Effect-based evolution** — all 19 companions visibly evolve across 6 stages (aura brightness, +glyphs, growing core) with zero new art.

### Knowledge-addictive (north star)
- **Curiosity gap** — every classroom lesson now ends by opening a door it doesn't walk through (names the next mystery). Open-loop pull = the cleanest retention lever.

### Classroom / Sanctum / data
- Classroom teachings (incl. the opener) get **✦ Save · 🔊 Listen · ⧉ Copy/Save** — knowledge you keep.
- **Sanctum FIELD humanized** — TES/VTR/jargon labels → plain language ("WHAT YOU'VE GATHERED", "WHAT YOU'RE DRAWN TO", "CLARITY OVER TIME", "HOW OFTEN YOU RETURN", "YOUR JOURNEY"). A sanctum shouldn't confuse.
- **Backup / Restore** — Export Everything is now a true full backup (all keys); Restore writes it back on a new device. Own your data.

### Accessibility
- Baseline text contrast raised (textMuted → #A2A6AE, WCAG-passing); **global font scaling** (device font size scales the whole app); High Contrast toggle now bolds all text app-wide.

### Cleanup
- **First-run pruned** — deleted the stale v3.4 "Living Field" What's-New popup + the Initiation modal (component removed). First run = onboarding → Welcome Tour, one clean flow.
- **Settings → collapsible menu** — 16 flat sections grouped into 5 collapsible categories (IDENTITY/AI PROVIDERS/EXPERIENCE/NOTIFICATIONS/APP), default-collapsed. Accessibility minimizes with its group.
- **3 unification audits** — code type-clean, no forks, no ghost imports.

### Unification audits (2 passes) — 5 real bugs fixed
- Ghost import (`task1_companion_specs` deleted, still imported) → canonical `app/data/companion-types.ts`.
- `ArchetypeId` fork (defined 3×, 10 vs 19 members) → unified to the real 19.
- **Crash fixed** — journal generation hit `undefined.title` for 4+ archetypes on stage evolution → archivist fallback.
- `RARITY_COLORS` missing BATTLE/SHOP keys → added. `savePersona`/`getPersona` missing `lyra` → widened.
- Markdown `selectable` overload + dead TextInput `onLongPress` → resolved. **Result: our code is type-clean.**

## [5.22.6] — 2026-06-21 — 🚀 LAUNCH BUILD · SHOP EXPANSION · SECRETS OF LYCHEETAH
> Shipped to GitHub Releases (tag `SOL.V.5.2.2.6`). First public APK. Site live in Twitter bio. DeepSeek default — everyone gets full Sol free.

### Cosmetics — 75 items total (25 each)
- **Halos 18–25** (8 new): IRON CIRCLET, THORN RING, LUNAR BAND, ALCHEMIST'S CROWN, RUNIC WREATH, PHILOSOPHER'S HALO, OUROBOROS CROWN, THE ABYSS
- **Wings 17–25** (9 new): IRON PLUMES, SERPENT WINGS, TIDAL FINS, ASH WINGS, BONE LACE, CELESTIAL SPAN, ENTROPY WINGS, NULL EXPANSE, THE MERCURY
- **Pets 16–25** (10 new): DUSKWREN, THORNPUP, FERROCRAB, GLASSFOX, MISTVEIL, SUNCRAWLER, VOIDMOTH, FRACTURE, ECHO
- ATHANOR pet (pet_12) art generated + wired (was `file:null`)
- All art sourced from new jukebox set — no placeholders, every catalogue item maps to real art
- Shop expanded: +5 halos, +3 wings, +4 pets purchasable

### 𝔏 Secrets of Lycheetah (new feature)
- Three mythic transmissions at 100 ⟡ each: THE FRUIT THAT HIDES · TWO FIRES, ONE FORGE · THE QUESTION IS THE KEY
- Each unlocks a SECRET-tier cosmetic + the full written teaching
- New SECRET rarity tier (`#CC2222` crimson), distinct shop section
- Data: `lib/mystery-school/lycheetah-secrets.ts` · canon registry: `LYCHEETAH_SECRETS_REGISTRY.md` (10 future themes queued, none repeat)

### Cosmetics now properly earned
- Lock tiers restored: ORIGIN free · ARCANE @25 dives · MYTHIC @75 dives · LEGENDARY/SPECTRAL/SECRET bought with in-game coins (earned, not real money — covenant-safe)
- Every locked-tier item is obtainable in the shop (added THE MERCURY wing; held 2 unreleased secrets)
- Shop rows now show the cosmetic art thumbnail (no more text-only list)
- Shop sections collapsible (HALOS / WINGS / PETS / SECRETS) — default collapsed, taps to expand
- Stale "COMING" label on the cosmetics picker → "LIVE"

### Chat focus mode
- ⤢ button in the TALK header collapses persona bar + mode chips + description strip for a near-fullscreen chat

### Capture fixed
- CAPTURE now gives loud on-screen feedback on both success and failure (was silent — looked like it did nothing). Saves to Menagerie correctly

### Fixes
- **Build fix**: pet_12.png was a JPEG mislabeled as PNG (FLUX output) — re-encoded to real PNG. Was causing AAPT/Gradle failure
- Full asset sweep — zero mislabeled images across the tree
- Shop audit — 111 catalogue items, 35 shop refs, zero broken references

### Site
- `lycheetah.github.io/Lycheetah-Mobile-/` rebuilt as minimal APK host: glowing 𝔏 sigil, star field, single gold download button, one "what is this" link

---

## [5.22.3] — 2026-06-20 — CRYSTAL LORE · IRISH DEPTHS · SCHOOL GATE

### Mystery School Header — The Gate
- New dark atmospheric header: `#06060E` background, 11 constellation stars, giant `𝔏` watermark at opacity 0.09
- Gold sigil ring + "LYCHEETAH · Mystery School" label + tagline "for inquiry, not belief · the door is always open"
- 3px progress bar showing `{studied}/{total} STUDIED` across all domains
- Double-rule border frame, gold glow shadow

### #219 Sources Drawer (new feature)
- `sources?` field added to Subject type: `{ title, author, type: 'primary'|'secondary', note? }[]`
- Collapsible `📚 PRIMARY SOURCES` drawer in every subject detail view — triangle toggle, shows source count badge
- Primary sources render with filled gold dot; secondary with muted dot + grey `SECONDARY` pill
- Classroom section shows hint row when any subject in that domain has sources: "N primary sources available · tap any subject card to see reading list"
- Sources populated across: Celtic Old Gods (10+ subjects), Irish Mythology (8 subjects including Dindshenchas), Irish Literature (4 subjects: Yeats/Heaney/Joyce/Ní Dhomhnaill)

### Crystal & Gem Lore domain (new)
- 6 subjects: Crystallography (FOUNDATION) · Mineral Kingdom (FOUNDATION) · Gem Traditions Across Cultures (MIDDLE) · Piezoelectricity (OPEN) · Lapidary Arts (MIDDLE) · Your Personal Gem (EDGE)
- Each subject carries primary + secondary sources (Wenk & Bulakh, Kunz, Nassau, etc.)
- Domain color `#7ED6DF`, glyph `⬡`, category: lycheetah
- Classroom lessons: 4 entries (concept/practice/reflection/lineage)
- Domain display order updated

### ⬡ Gem Forge (in-classroom feature, crystal-lore only)
- Name your gem + describe it → FLUX generates a photorealistic gemstone image
- `generateGemImage()` function: macro photography style, centered jewel, black background, no text
- Rendered only inside the crystal-lore classroom accordion
- `gemName/gemDesc/gemImage/gemLoading` state

### Dindshenchas subject added to Irish Mythology
- "The Dindshenchas — Lore of Sacred Places" as EDGE layer
- Full description: the 11th–12th century onomastic mythology corpus, Old Irish place-name lore
- 3 primary sources: Gwynn edition (5 vols), Rennes Dindshenchas (Stokes 1894), O'Rahilly secondary

### CHAIN tab → Sovereign Vision teaser
- Replaced interactive Solana wallet UI with vision/teaser card (no RPC calls, no live queries)
- Purple `#9945FF` aesthetic, ◎ SOVEREIGN CHAIN header
- 4 planned feature cards: SBTs, DAO, On-Chain Proof, Earned Light NFTs
- Footer note: "CONTRACT DEPLOYING SOON · KEEP WALKING THE PATH"

### Onboarding (#191 / #161 partial)
- Domain chips expanded: Irish Mythology (#1ABC9C) + Irish Literature (#9B59B6) + Crystal & Gem Lore (#7ED6DF) + Folklore & Place (#27AE60) added
- Badge counts updated: 38→40 DOMAINS, 10→19 COMPANIONS
- Irish Mythology dive-first subject added (Tuatha Dé Danann, glyph ⟁)
- Step 5 no-key warning rewritten: warm, not gating — "The Mystery School, Gem Forge, LAMAGUE glyphs, Zodiac, and Sanctum all work immediately"

### lycheetah-web landing page — full rewrite
- Dark atmospheric mystery school page (not a corporate landing page)
- Animated gold 𝔏 sigil, procedural 80-star field, giant watermark
- 12 domain pills in hero showing subjects by colour
- 4 Doors section: Mythology & Folklore / Living Companion / Mystery School / Zodiac & Sanctum
- Stats bar: 40 domains · 19 companions · 400+ subjects · 4 personas
- Covenant section: payment/mind rule, companion clause, epistemic register
- Install section with prominent "Android will say Install unknown app — tap Allow" explanation block
- Single gold CTA button throughout

## [5.22.0] — 2026-06-20 — SOVEREIGN CHAIN + SOVEREIGN MODE

### #193 SOVEREIGN CHAIN (Sanctum → CHAIN tab)
- New CHAIN tab in Sanctum with ◎ purple Solana aesthetic
- Wallet connection: paste Solana public key → live balance query via mainnet RPC
- Phantom deep link button (opens Phantom app or web)
- 4 SBT Milestones: SEEKER (10 dives) · ADEPT (25) · SOVEREIGN (75+LAMAGUE) · ASCENDANT (150+25LAMAGUE)
- Milestones unlock CLAIM button once wallet connected
- DAO note: contract deploying soon, milestones tracked on-chain once live
- Sol Identity screen: SOVEREIGN CHAIN (no longer "COMING")

### SOVEREIGN MODE
- All cosmetics (LEGENDARY/SPECTRAL) free for all users until payment system live
- Gate logic preserved in code — SOVEREIGN_MODE=true bypasses it cleanly
- Users can equip any halo/wing/pet immediately

### #218 LAMAGUE Glyph Unlock Ceremony
- MARK READ triggers a full-screen dark Modal with glowing GOLD glyphs
- `◈ GLYPHS UNLOCKED` with the lesson's symbols appearing at large scale
- Haptic success feedback + CONTINUE button
- Auto-dismiss after 3.2s or immediate tap

### #215 Sanctum Zodiac Transit Strip
- Live sky strip always visible in Sanctum TODAY view
- Sun sign (♈→♓ from date) · Moon phase (◐◑◕○ from synodic calc) · Day planet (Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn)
- No API call — computed from astronomical constants inline

### #160 TALK Mode Chips (from v5.20.0)
- WAYFARER / COUNCIL / LAMAGUE / SKEPTIC chips with mode description strip below

## [5.20.0] — 2026-06-20 — COSMETICS UNLOCK SYSTEM

### SHOP — COMPREHENSIVE COSMETICS CATALOGUE
- **22 new shop items** organized into 3 sections: ◯ HALOS / ◁ WINGS / ✧ PETS
- Each section sells LEGENDARY and SPECTRAL tier items with rarity-coloured price badges
- HALOS: 4 LEGENDARY (180–250⟡) + 3 SPECTRAL (350–450⟡)
- WINGS: 4 LEGENDARY (200–280⟡) + 5 SPECTRAL (350–500⟡)
- PETS: 3 LEGENDARY (200–250⟡) + 3 SPECTRAL (320–450⟡)
- Each item has evocative desc copy (not just "cosmetic unlock")
- Purchase stores cosmetic ID directly (`item.unlockId`) — backwards-compatible check for old items
- STARTER PACK (free, +200⟡) stays as its own styled block

### COSMETICS PICKER — UNLOCK GATES
- **ORIGIN rarity** → always free (3 halos, 1 wing, 3 pets)
- **ARCANE rarity** → unlocks at 25 total dives (earned by studying)
- **MYTHIC rarity** → unlocks at 75 total dives (deep practitioner gate)
- **LEGENDARY rarity** → Shop purchase only
- **SPECTRAL rarity** → Shop purchase only
- Locked items show `⊜` glyph at 40% opacity + hint text (`25dv`, `SHOP`, etc.)
- Tapping a locked item shows toast: "Buy in Shop to unlock" or "Xdv more dives needed"
- CosmeticSlot now receives `shopUnlocks` + `totalDives` props; `isUnlocked` + `lockHint` helpers inside

### TASK #211 CLOSED — STALE
- cipher/herald/weaver/revenant naming was from prior archetype system. 19 new archetypes (nullveil/ironclad/etc) have their own art pipeline. Task closed.

## [5.19.0] — 2026-06-20 — 13 FRONTIER ZONES (BATTLE + SHOP)

### ZONES — 13 NEW FRONTIER ZONES (58 total)

**7 BATTLE ZONES** — unlock by winning battles (`sol_battle_wins`):
- `iron_maw` (10 wins) · `crucible_heart` (25) · `phantom_citadel` (50)
- `bone_archive` (75) · `void_colosseum` (100) · `war_sanctum` (150) · `sovereign_forge` (200)

**6 SHOP ZONES** — unlock by spending coins or veras (`sol_zone_unlocks`):
- `amber_vault` (500⟡) · `crystal_spire` (750⟡) · `golden_library` (1000⟡)
- `veras_garden` (200✧) · `deep_market` (300✧) · `lycheetah_spire` (500✧)

Each zone has: SKINS entry, SKIN_IDS, SKIN_RARITY (tier BATTLE/SHOP), WORLD_MAP room, SCENE_IMAGE (existing art as placeholder), ZONE_COMPANION_IMAGE (existing companion as placeholder).

### UNLOCK SYSTEM EXPANDED
- `getSkinUnlockStatus` now accepts `battleWins: number` and `purchasedZones: string[]`
- BATTLE lookup table maps zone → wins required; SHOP list checks `sol_zone_unlocks` array
- All call sites updated; `navigateRoom` skips locked battle/shop zones the same as dive-gated zones
- New state: `battleWins` (from `sol_battle_wins`) + `purchasedZones` (from `sol_zone_unlocks`)
- `sol_zone_unlocks` added to multiGet keys array

### SHOP — FRONTIER ZONES SECTIONS
- **◈ FRONTIER ZONES** section: 6 purchasable zones, buy with ⟡/✧, affordability check, instant unlock
- **⚔ BATTLE ZONES** section: 7 battle zones showing wins progress and unlock status

### ART — PLACEHOLDERS (Mac generating via Grok)
Companion art placeholders use existing characters. Replace with dedicated art when ready:
- Battle zones: `{zone}_1` → swap to `iron_maw_1.png` etc. in assets/companions/
- Shop zones: `{zone}_1` → swap to dedicated art files

## [5.18.0] — 2026-06-20 — ARCHETYPES × ZONE UNLOCK × COMPANION DIALOGUE

### COMPANION — 9 NEW ARCHETYPES
- **19 total archetypes** — free-pick, no zone binding. New: NULLVEIL / IRONCLAD / STORMWARDEN / RUNEBORN / DRIFTER / THORNWEALD / MERIDIAN / ECLIPSE / DEEPWALKER
- Each has unique glyph, accentColor, stat profile, specialty, paths A/B/C, phrases, battle cry, and ASCII creature body (stages 0–5)
- ARCHETYPE_IDS updated, ARCHETYPE_STAT_BASES expanded, CREATURE_BODIES expanded, CreatureSvg.tsx type expanded
- All freely accessible in the archetype picker (same UI, no gate — pick any, change any time)

### ZONE NAVIGATION — D-PAD FIXED
- **Left/right/up/down arrows now navigate directionally** through all 45 zones in SKIN_ORDER sequence. Was: all 5 buttons called `onRandomZone` (random jump, often same zone)
- **⚡ centre remains** as random encounter trigger
- All 45 zones traversable sequentially — no zone is unreachable

### ZONE UNLOCK SYSTEM — FULL TIER GATES
- **ORIGIN** (solform/void/aurora/crimson) — free from start
- **ARCANE** (obsidian/chaos/auroral_chaos/mana_field/etc) — 25–60 dives
- **MYTHIC** (norse/celtic/egyptian/apollo_jungle/etc) — 70–120 dives
- **LEGENDARY** (akashic/kabbala/noetic/lamague/quantum/etc) — 130–200 dives
- **SPECTRAL** (augmented_ai/chaos_temple/glitch_cascade/etc) — 200–290 dives
- `navigateRoom` now checks dive-based lock and shows toast with remaining dives needed
- Discovering zones becomes a genuine reward at each milestone

### COMPANION TALK — RICHER DIALOGUE
- `generateLivePhrase` now allows 2–3 sentences (was: max 12 words)
- Zone-aware: prompt includes current zone name + description so companion speaks from within it
- System prompt updated: companion IS the intelligence of the zone, not a generic spirit
- max_tokens: 80 → 180
- MEMORY_TEMPLATES enriched — more evocative, longer, reference zone/lineage/mystery

## [5.17.0] — 2026-06-20 — SCHOOL HOME RESTRUCTURE

### MYSTERY SCHOOL — HOME
- **Ceremony → streak pill** — compact `◌ CEREMONY` / arc-glyph `Day N/T` pill inline with streak row; taps to ceremony view. Was a full-height portal card.
- **Portals 2-card** — Ceremony removed from portals row; Time Braiding + LAMAGUE remain.
- **Spiral → inline collapsible** — `◈ SPIRAL ▶/▼` expandable section replaces nav button. Shows stat chips, overall bar, domain rows, `FULL SPIRAL →` link. Collapsed by default.

## [5.16.0] — 2026-06-20 — SANCTUM WITNESS + SCHOOL DOMAIN POLISH

### SANCTUM — LIVING BOOK / WITNESS
- **Witness button elevated** — larger glyph (14→16), subtitle showing entry count, taller button (13→14 paddingV), 1.5 border, glow shadow when active, removed when loading
- **Witness response card** — bigger padding (16→18), 1.5 border, `accentColor + 0C` bg, 16px radius, shadow elevation 4, large `⊚` watermark behind text, DISMISS styled as pill, text size 13→14, line-height 23
- Feature was already implemented (state + AI call + rendering existed). This pass elevated the visual to match the feature's importance.

### SCHOOL — DOMAIN DETAIL
- **Back button** styled as pill `← DOMAINS` with domain colour tint (was plain text `← All Domains`)
- **Domain search bar** matches domain colour on border/icon (was generic SOL_THEME.border)
- **Domain header** — glyph size 44→48 with textShadow glow, shadow elevation 5, 1.5 border, progress bar 3→4px with glow

## [5.15.0] — 2026-06-20 — SKILL TREE UNLOCK ANIMATION

### COMPANION — SKILL △ TAB
- **Node unlock pulse** — when a skill node is unlocked, the node circle pulses: scale 1→1.14→1 (triple), inner colour overlay flashes at 28% opacity and fades. 940ms total. Uses single `unlockPulseAnim` Animated.Value shared across all nodes; `justUnlockedId` state gates which node renders the pulse. Clears to null after animation completes.
- **State added**: `justUnlockedId: string | null`, `unlockPulseAnim: Animated.Value`
- All triggers use Haptics.notificationAsync(Success) — no change to haptic behaviour.

## [5.14.0] — 2026-06-20 — BATTLE HIT ANIMATIONS

### BATTLE — GB MODE
- **Enemy hit flash** — white overlay blinks on enemy sprite when player lands a hit (attack or spell). Works for all damage types including chaos/drain/reflect/boost.
- **Player HP panel flash** — red overlay on player HP panel when enemy lands a hit. Green overlay on heal (item use, drain spell). Uses Animated.parallel alongside existing entityShakeAnim and screenFlashAnim — no new state flags needed.
- Flash durations: enemy 40ms in / 220ms fade · player hit 50ms / 300ms fade · heal 60ms / 350ms fade.

## [5.13.0] — 2026-06-20 — MYSTERY SCHOOL VISUAL OVERHAUL + TALK PERSONA BAR

### MYSTERY SCHOOL
- **Header** — larger 𝔏 watermark (08→14 opacity), second ⧟ accent bottom-left, bigger title (22→26), deeper glow shadow, progress bar 3→4px with glow, removed duplicate MAP/LAMA header buttons
- **Portals section** — left-bar `PORTALS` label replaces `⌘ PORTALS`, Mycelium card taller with elevation shadow and wider glyph watermark, 3-card row (Ceremony / Time Braiding / LAMAGUE) taller with individual shadows
- **Domain grid** — added `DOMAINS` left-bar section header, wing filter pills tighter with active-pill glow shadow, darker inactive pill bg
- **Domain detail** — back button styled as pill (`← DOMAINS`), domain header shadow + larger glyph + 4px glowing progress bar, search bar matches domain colour
- **Section headers** — `SAVED`, `RECENT DIVES` now use left-bar pattern (was `⌘/★/⊚` prefix)
- **Streak pill** — `🔥` emoji replaced with `◆` mono glyph

### TALK TAB
- **Persona bar** — active persona expands (`flex:2`), glows, shows name label. Inactive personas shrink to icon-only. Darker bar bg (`#06060E`). Tighter gaps and rounder buttons.
- **AI bubbles** — `#0D0D16` bg (was surface), `borderLeftWidth:3` subtle purple accent, `padding:14`, `borderRadius:16`
- **Input bar** — darker bg `#08080F`, deeper border, input field `#0D0D18`, more padding
- **Mode chips** — `borderRadius:6` (was 4), slightly more padding

### QUICK NAV (School)
- Buttons taller (9→13 paddingVertical), no emoji, clean mono glyphs (◫ ◈ ◬ 𝔏)
- Domain cards height 130→145, touched cards get domain-colour shadow, mastered cards elevated, progress bar 2→3px with glow

## [5.11.0] — 2026-06-20 — GAME BOY ENCOUNTER MODE + ENCOUNTER FLOW REHAUL

### BATTLE SYSTEM
- **GB mode always-on** — battle panel is now permanently the DMG Game Boy palette: `#0F380F` bg, thick `#306230` border, scan-lines, block HP bars (`▓▓▓░░`), A FIGHT / B SPELL / ↑ GUARD / ↓ ITEM buttons. No toggle needed.
- **Encounter preview modal removed** — RETREAT/ENGAGE step gone. All encounter entry points fire battle instantly.
- **Cinematic battle modal auto-open removed** — was popping over the GB screen on every encounter. Battle panel is the encounter screen.
- **ENCOUNTER button** reskinned GB-style (green border, dark green bg) — fires `freshZoneWave` directly, switches to BATTLE tab, expands panel.
- **Random zone encounters** (D-pad navigation, 15% chance / 0.5% unique) now expand battle panel fully (`setBattleMinimized(false)`) and toast `◈ ENCOUNTER — check BATTLE tab` / `⚠ UNIQUE ENTITY — ENGAGE`.
- **Enemy name** always uppercase GB.hi mono.
- **Enemy HP + Player HP** always block-char style — no conditional branches left.

### GLOBAL HEADER
- **Veras ✧ + Lumens ⟡ currency pills** — persistent in tab bar header on all screens. Refreshes every 5s + on app foreground.

### CHAT / TTS
- **Global TTS stop pill** — floating `■ STOP READING` button in chat when audio is playing. Fixed root bug: `speechFallback` was void (resolved immediately), keeping speakingId alive now through full playback.

### SCHOOL
- **Today's Door minimize** — ▸/▾ toggle, label still navigates to domain.
- **Recommended for You minimize** — full block collapse toggle.

### SANCTUM
- **Warmth pass** — amber radial glow, slower orbital animations, journal cards coloured by first tag, save button polish.

## [5.7.0] — 2026-06-20 — BATTLE DIALOGUE + COSMETICS LAZY

### BATTLE MODAL
- **Sol voice in battle log** — mechanical text replaced with atmospheric narration. Attack: "Strike bites deep. 37 damage." Enemy counter: "▼ The Sentinel retaliates. 12." Crit: "✦ CRIT — 54 damage." Chaos: "✧ CHAOS ×2.1 — 79." Defend: "◈ Guard raised. Foe holds back." Spells: "✦ NAME — tears through. 42."
- **Battle log** — 3 entries (was 2). First entry 11px / lineHeight 17 (was 9px). Color-coded: attack=white, defend=blue, spell=companion color, item=green. Older entries fade.
- **Victory screen** — rotating Sol line above WAVE CLEARED (8 lines cycling by wave).
- **Enemy header** — name + rarity pill + STUNNED in one compact row (was 2 separate rows).
- **Action buttons** — 2-word descriptor sub-label: FIGHT "direct strike", GUARD "reduce damage", SPELL "spend tokens", ITEM "use from pack". Padding 18→14.

### COSMETICS — LAZY LOAD (#200)
- **Halo / Wings / Pet slots** collapse by default. Tap to expand catalogue. Images only load on expand. ▼/▲ chevron on each slot. Eliminates heavy image load at tab open.

## [5.6.0] — 2026-06-20 — ZODIAC RESTRUCTURE + UI FIXES

### ZODIAC
- **THE CELESTIAL FIELD header** rebuilt: 3 clean rows — (1) orb + title + live clock, (2) SUN/MOON/PHASE trio pill bar, (3) weather pill + planet day + icon toggles. Fixed cramped layout where orb+title+buttons all fought in one row.
- **THE SKY demoted** from full-width hero tile to 9th regular grid tile (bottom of 2-col grid). No longer blocking grid access.
- **Sky section content** always visible — removed collapse toggle that was hiding all content on tap.
- **Weather removed** from sky section (API unreliable). Main header retains weather pill when available.
- **Tile grid**: now 9 tiles (SKY added last). `tileGlows` extended to 9 entries.
- **Each tile**: unique watermark glyph (large, low opacity) + constellation dot pattern (unique per section).
- **Tile size**: `aspectRatio 1.85` (was 1.6) — more compact.

### LAYOUT
- **Floating ? button** removed entirely. Purple button gone.
- **School quick nav** gets 4th button: 𝔏 CODEX (direct route to domain codex).
- **School "school is open" banner** simplified to compact suggestion card.
- **Codex deep-link routing**: AsyncStorage flags `codex_open_domains/frameworks/lamague` handled on focus.

## [5.5.0] — 2026-06-20 — DOMAIN LORE CODEX (#187)

### CODEX — 𝔏 DOMAINS TAB
- **New DOMAINS tab** in the Codex screen (Library → 𝔏 CODEX). Shows all 24 Mystery School domains as expandable lore cards.
- **Domain cards**: glyph, label, category badge (CONTEMPLATIVE/SECULAR/LYCHEETAH/VOID), description, studied count (X/N done), colour-coded layer mini-bar (FOUNDATION/MIDDLE/EDGE/OPEN/VOID proportions).
- **Progress header**: total subjects explored out of full school count + animated progress bar.
- **Search**: filters by subject name, description, or domain label simultaneously.
- **Layer filter chips**: ALL / FOUNDATION / MIDDLE / EDGE / OPEN / VOID — filter across all domains.
- **Expanded domain view**: subjects grouped by layer, each tappable to reveal full description, intensity badge (≥5 shows badge, ≥8 shows warning), credit attribution line, care classification pill (ELEVATED / CRISIS-ADJACENT) where present.
- **Studied state**: subjects the user has explored show ✦ glyph, bold name, and tinted border. Unvisited show ◌.
- Reads from `getStudiedSubjects()` on focus so it's always live.

## [5.4.1] — 2026-06-20 — ZODIAC VISUAL PASS
- Zodiac zone life animations: heroGlow (golden border breathe 3.2s), tileGlows (8 staggered tile borders), nebulaPulse (deep atmosphere 5s), glyphDrift (4.5s sine on watermark/scatter).
- Hero tile: constellation micro-dots, animated starfield opacity, nebula colour washes, animated sun/moon glyphs, animated ENTER THE SKY footer.
- Tile grid: each tile wrapped in glowing Animated.View border, glyph opacity-animates.
- Header: nebula orbs behind content, animated watermark drift, animated constellation scatter (✦ in gold/blue/violet).
- BACK button pulses opacity with glyphDrift.

## [5.4.0] — 2026-06-20 — ZODIAC EXPANSION (#196)

### ZODIAC — THE SKY HERO + 9 TILES + ASPECTS + OVERLAY
- **THE SKY → full-width hero tile** — dramatic starfield header (ZODIAC_SKY_BG at 18% opacity), live sun glyph + name, moon glyph + name, pulsing moon phase, today's ruling planet, retrograde glyphs. ENTER THE SKY prompt arrow. Replaces the old 31.5% grid slot.
- **2-column tile grid** — remaining 8 tiles now fill two columns at 47.5% width × 1.6 aspect ratio. Cleaner, taller, more legible.
- **ASPECTS tile (new, 9th)** — `⟐ ASPECTS · Planet angles · conjunctions` in `#88AAFF` blue. Opens the aspects section.
- **ASPECTS section** — Computes all planet–planet angular aspects for today's sky. Sun + Moon + Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto. Detects: ☌ Conjunction (≤10°), ✶ Sextile (60° ±6°), □ Square (90° ±8°), △ Trine (120° ±8°), ☍ Opposition (180° ±10°). Grouped by aspect type with colour-coded rows. Shows planet glyphs, aspect symbol, body names, and orb in degrees.
- **Sky Overlay strip** — OVERLAY toggle button inside the hero tile. When on, a persistent strip appears at the top of the zodiac screen showing live sun/moon/phase even when browsing other sections. Tapping it jumps to THE SKY.
- **`getPlanetLongitude()`** + **`getAspectBetween()`** helpers added at module level.

## [5.3.0] — 2026-06-20 — CINEMATIC BATTLE MODAL (#186)

### BATTLE — FULL-SCREEN CINEMATIC MODE
- **Cinematic battle Modal** auto-opens when an encounter starts (any path: HUNT button, D-pad random encounter, manual ENCOUNTER).
- Full-screen dark background (rarity-tinted: legendary = deep amber, epic = deep purple, common = black).
- **Large enemy art** — 200×240px centred in the top half (up from 90×110px inline). Rarity-coloured glow border + shadow.
- **Glyph fallback** — if no art exists, shows the rarity glyph (⊛/✦/⊚/◈/◌) at large scale with colour.
- **Enemy HP bar** — full-width, thick (16px), shimmer highlight stripe, rarity-colour tinted.
- **Red screen flash** — `screenFlashAnim` Animated.Value fires a brief full-screen red overlay when player takes damage.
- **Player HP bar** — full-width (18px) with shimmer, critical warning, shield/braced status pills.
- **2×2 action grid** — FIGHT/GUARD/SPELL/ITEM buttons enlarged (paddingVertical:18, fontSize:24).
- **CAPTURE button** — full-width below action grid.
- **Spell + Item overlays** — work identically inside cinema as in the inline panel.
- **Companion signal** — ◈ bubble shows when dialogue mode is on.
- **Battle log** — 2-line rolling log at bottom of actions.
- **AUTO + dialogue toggles** in top bar alongside token count.
- **✕ button** — exits cinema back to inline panel without ending battle.
- **VICTORY SCREEN** — full-screen: big ✕ glyph, WAVE CLEARED, XP, loot pill, enemy lore, NEXT WAVE + EXIT buttons.
- `battleCinemaOpen` state wired to `useEffect` on `battle.entityName + wave` — opens on each new encounter.

## [5.2.0] — 2026-06-20 — ZODIAC TILE GRID · COSMETICS RESIZE

### ZODIAC — 3-COLUMN TILE GRID (#184)
- Zodiac tab now opens to an 8-tile 3×3 grid: ORACLE · THE SKY · SPREAD · SOL READS · SIGIL FORGE · CHIRAL LENS · ZONK ZONE · PSI LOG.
- Tap any tile → expands that section only, with ← ALL SECTIONS back button in header.
- CHIRAL and ZONK show entry forms before opening their full-screen Modals.
- All sections hidden in grid mode — one clean landing page instead of a scroll of expanded accordions.
- Uses existing `fullscreenSection` state with zero new state variables.

### COSMETICS RESIZE
- Halo enlarged: 560×280 → 680×360, opacity 0.55→0.75, repositioned to top:-82, left:-278 (centered).
- Wings enlarged: 280×240 → 320×275, repositioned left:-95.
- ATHANOR pet art → wings (wing_16.png), `pet_athanor` art set null.
- Companion body shrunk: 150×220 → 130×190; container updated; outer View marginLeft:18 (shifted right).
- 16 wings total (wing_1–16).

## [5.1.0] — 2026-06-20 — ART EXPANSION · IMAGE GEN EVERYWHERE · WITCHAIL DRAW in ZODIAC

### COSMETICS EXPANSION
- **17 halos** (was 5) — 11 new + halo_6 orphan wired. Adds PRISM/EMBER/FROST/DAWN/SIGIL/CHAOS/ASTRAL/QUANTUM/NEON/VOID BAND/BOSS/RADIANT.
- **15 pets** (was 7 with files, 8 null) — all 8 null entries (VEILCAT through NEBULOX) now have art (pet_8–pet_15).
- **15 wings** (was 10) — 5 new: STORM BLADES/NEON WINGS/CHAOS WINGS/AURORA WINGS/RIFT WINGS (wing_11–15).
- All art moved from Downloads with clean filenames; source directory empty.

### IMAGE GEN — now on all 3 surfaces
- **Zodiac SIGIL FORGE WITCHAIL tab**: TYPE | DRAW toggle added. DRAW → describe glyph → NVIDIA FLUX generates → preview → oracle evaluates → SAVE TO LEXICON button saves with image. Resets on save.
- **TALK tab**: ◈ Image button in `···` tools row → inline panel → prompt → 240×240 result. No chat-list injection; self-contained panel.
- **school.tsx refactored**: inline FLUX fetch replaced with `generateImage()` from `lib/image-gen.ts`. Single Truth Rule — one implementation everywhere.

### LIBRARY CLEANUP
- `getProviderKey` removed from school.tsx imports (was unused after refactor).

## [5.0.0] — 2026-06-20 — WITCHAIL FORGE · IMAGE GEN · ZODIAC REHAUL

### WITCHAIL FORGE — new LAMAGUE primitive creation (school + zodiac)
- **School LAMAGUE → WITCHAIL tab**: forge new LAMAGUE primitives. Assign any glyph a meaning the grammar doesn't hold yet → the oracle evaluates against 5 tests → RATIFIED symbols join your personal lexicon (`sol_lamague_lexicon`).
- **Zodiac SIGIL FORGE**: mode toggle RITUAL SIGIL | WITCHAIL FORGE — same creation flow in the mystical context.
- **GLYPH input has TYPE | DRAW modes**: TYPE = any Unicode/emoji; DRAW = describe a glyph in words → AI generates it.

### IMAGE GEN — NVIDIA FLUX.1-schnell (WORKING, free tier)
- **`lib/image-gen.ts`** — shared `generateImage()` + `saveImageToDevice()`. One implementation, all surfaces (closes #70 foundation).
- FLUX.1-schnell on NVIDIA NIM: `cfg_scale: 0` (schnell is guidance-distilled), 4-step, 1024². Free on existing NVIDIA key.
- **LIVE in school WITCHAIL DRAW mode** — confirmed generating. Ratified glyphs store the generated image in the lexicon.
- Google Imagen path abandoned (billing-gated even for "free" quota).

### VERSION + MODELS
- **Version drift fixed**: package.json + app.json → 5.0.0, `versionCode: 5` added (was 1.0.0 / 4.1.0 — EAS landmine).
- **+4 free Gemini models**: 3.5 Flash, 3 Flash, 3.1 Flash, Gemma 4 31B (1500/day, unlimited tokens). 8 total in picker.

### ZODIAC
- **Section reorder**: SOL READS → SIGIL FORGE → CHIRAL LENS → ZONK ZONE → PSI PRACTICE → NATAL CHART.
- **SPREAD block restored** (5-card + Celtic Cross).

### PENDING (scaffolded, not yet wired — next session)
- Zodiac SIGIL FORGE DRAW image gen (lib ready, UI not wired)
- Main chat image gen (lib ready, not wired)
- Save-to-gallery button (lib ready; needs `expo-media-library` install)
- school.tsx still uses inline FLUX call — refactor to `lib/image-gen.ts` pending

---

## [5.0.0-pre] — 2026-06-19 — RANDOM WORLD · WEAPONS · ENCOUNTERS · ART OVERHAUL

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
