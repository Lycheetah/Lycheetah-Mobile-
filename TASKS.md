# SOVEREIGN SOL — LIVE TASK LIST
## v5.26.0 · June 22 2026 · 🚀 LAUNCHED · type-clean
**Name locked: Sovereign Sol** · Run: `npx expo start -c` → QR → phone

> **June 22 shipped:** ⟳ **#251 THE CURIOSITY GAP** (addictive wisdom / north star) — dives end on an
> AI-generated open door, persisted to `sol_open_doors`, surfaced as "DOORS YOU LEFT OPEN" on school
> home with one-tap resume. Type-clean. ⚠ untested on device — Mac: `npx expo start -c` to confirm.

---

## ✅ SHIPPED June 21 — DAY MARATHON (→ v5.23.0)
Living entry (breathing mark + glow) · persona **knowledge** + **8-file split** + `THE_VOICES` ensemble ·
**GLYPHIC** mode · **chips** rebuilt (5 colour, 1 row) · **secret reader** (𝔏 READ) ·
**YOU OWN THIS** sovereign manifesto · **Welcome Tour** (7-step) · onboarding refresh ·
**13-archetype** evolution lore + `companion-types.ts` · Sanctum **"From Sol"** reciprocal presence ·
**classroom** save/copy/listen · **backup/restore** (true full) · **scoring toggle** (AURA⇄CASCADE⇄off) ·
2 **unification audits** (5 bugs incl. a crash → code type-clean) · **tarot deck spec** (Veil & Vein) ·
**Sovereign Knowledge Economy** crypto thesis · **Soul Forge Vault** (8 full soul-docs)

## ✅ SHIPPED June 21 — NIGHT: "THE COMPANION FORGE" (v5.24.0)
**GameBoy map** — 🗺 one-tap overlay + mini-map HUD (you-are-here + neighbour hops) + ⚔ ENCOUNTER button (D-pad arrows removed) + zoom 0.3–3.0 + clean tiered map redraw + **map-travel bug fix** (room-only handleSkin) ·
**DIVE-CURRENCY economy** — dives spendable (`companionAcquire`: ORIGIN free / dives buy / capture catches / rotating daily shop); replaced brutal 290-dive thresholds ·
**Tarot Viewer** (#277) · per-tab collapsible **help zones** · audits passed (school 41/347, numbers, assets, offline)

## ✅ SHIPPED June 21 — NIGHT: "THE DEPTH PASS" (v5.25.0) — biggest session since launch, ~35 tasks
**VOID BOSSES** (#273, `lib/bosses.ts`) — study-to-win: aggression-zone grows, can't out-fight → dive subject → earn incantation → SPEAK THE SPELL → repel. *The signature mechanic.* ·
**PARTY system** (#260, `sol_party`, field of 3) · **per-companion LEVELS + stat builds** (#265, `sol_companion_xp/alloc`) · **CHRONICLE** (#264, `sol_chronicle`) ·
**THE HIDDEN ONE** (#274, ~0.001% on zone arrival, never buyable) · **battle voice** (#245) · rotating shop **TODAY'S FORGE** (#261) ·
**79-card Veil & Vein tarot deck** (real PNGs + viewer, Major/Minor) + **THE INTERTWINING** zone (`veilvein`) + Veil&Vein cosmetics (SECRET tier) (#282) ·
**per-tab HOT colours** (#227, companion=hot pink) · **school home rebuild** (12-button tools grid + collapsed TODAY + minimizable START HERE) (#255) · covenant ambush removed ·
**chat audit** 4 modes (#278) · psi/zonk **empty states** (#281) · zodiac perf **LiveClock** (#279) · **help pass** (#280) · **VERAS** economy spec'd
Release notes: `RELEASE_NOTES_5.22-5.25.md` (app root) — shareable 5.22.6→5.25.0.

---

## 🔥 BUILD QUEUE — reordered by viability × usefulness

### 🟢 NEXT (high value, viable solo, serve the north star)
| # | Task |
|---|---|
| ✅ **#251** | **★ NORTH STAR — curiosity gap SHIPPED v5.26.0** (open door at dive-end + persisted + home greeting). Next layers: tie door to a return-*streak*; "threads pulling" badge for open-door count; Walk-through pre-loads the door's question into the dive. |
| **#249** | **Fix wack first-run flow** — two 7-step flows stacking (onboarding + WelcomeTour) + TALK living-field. Dedupe/reorder to ONE clean first run. ⚠ CONFIRM with Mac which screen is "the living field" first. Then: per-section first-time onboarding. |
| **evo** | **Effect-based companion evolution** — universal, no new art: glow/particles/aura/crown/eyes intensify per stage. (Per-companion LEVELS shipped v5.25 — this is the *visual* evolution layer on top.) Ships for all 19. |
| **#245** | **Companion reacts to study** — comments/evolves dialogue from domains actually engaged. (Battle voice shipped v5.25; this is the *study-reaction* half.) Small code, huge "alive" payoff. |
| **#243** | **Daily Transit** ritual (personalized zodiac insight + study-spark on open) — extends existing daily/streak. Companion-Clause safe. |
| **#242** | **Onboarding archetype-spark** — 3-Q Seeker/Warrior/Mystic/Scholar → starter stage + domain rec. Extend existing sovereignty baseline. |

### 🟢 DEPTH-PASS FOLLOW-ONS (from June 21 night — most need Mac design input, don't slam)
| # | Task |
|---|---|
| **#263** | **Split the monolith** — `companion.tsx` is 8327 lines. Carve into modules (map / battle / shop / scene). Pure refactor, viable solo, lowers every future risk. |
| **#262** | **Companion art dedup** — VERIFIED June 22: 10 shared faces. **quol×3 (kabbala/noetic/quantum) — files don't exist, worst offender, do FIRST.** Also: noctis→void/phantom_citadel/void_colosseum · akasha→akashic/crystal_spire · anoth→egyptian/bone_archive · augurum→sovereign/sovereign_forge · nimue→celtic/veras_garden · pythia→delphi/deep_market · ragna→norse/war_sanctum · lycheetah→lycheetah_spire. Drop unique PNG at key → fallback auto-picks (no code). Full list: `COMPANION_ART_DEDUP.md`. |
| **#264** | **Lore that grows** — Chronicle shipped; make it *compound* (entries reference past, deepen with depth). |
| **#258** | **Make Sanctum compelling** — HELD, do NOT cut. Zodiac chart + LQ sparkline + dive history + transit readings. |
| **#250** | **GameBoy → main background** + fix world-zone access (currently needs scroll). (Map overlay shipped v5.24; this is the *background* treatment.) Needs Mac's eyes. |
| **#248** | **Lycheetah = mythic CAT mythos** — needs Mac's canon call before build. |

### 🟡 WORTH IT (useful, more design/effort)
| # | Task |
|---|---|
| **#233** | **D&D failable knowledge mode** — the differentiator; knowledge runs with stakes/fail states. Bigger build. |
| **#232** | Decision-based combat (choice + consequence, not attack-spam) |
| **#228** | **Stars grimoire** — natal wheel as illustrated hero object + FLUX celestial art + grimoire frame (Veil&Vein palette). Needs Mac's eyes. |
| **#244** | Community — exportable **Sanctum Card** PNG (extends DiveShareCard) + journey gallery |
| **#229** | redundancy/weak-writing scan · **#240** splash refresh · **#247** Sanctum Lite + privacy analytics · **#220** Sanctum header glow polish |
| ~~#227~~ | ✅ per-tab colours — SHIPPED v5.25 · ~~#238~~ ✅ help audit/per-tab zones — SHIPPED v5.24–25 |

### 🔵 STRATEGIC (right, but bigger/later)
| # | Task |
|---|---|
| **#241** | Crypto creator economy (Sovereign Knowledge Economy) — **paper done**; build post-funding |
| **#235** | "AI Mac" surface + CASCADE Library mobile app — own eras, don't cram |

### 🟠 HOLD (low priority / needs heavy guardrails)
| # | Task |
|---|---|
| **#231** | Auto-posting/auto-lore — posting *as Mac* needs deep consent + Companion-Clause guardrails. Hold. |
| **#246** | Monetization-light — keep on ice until traction. Covenant-careful. |

---

## 🔥 MAC FIRES (Sol prepares, Mac pulls trigger)
- Update **Twitter bio + site header** → "Sovereign Sol"
- **Fire posts** (`~/Desktop/SOVEREIGN_SOL_POSTS.md`) · grab **@Vael** handle (email: Lycheetahsol@gmail.com)
- `npx expo install expo-clipboard` (true 1-tap copy) · `expo-media-library` (save-to-gallery)
- **EAS build** — `eas build --platform android --profile preview` when tight on phone

## 🎨 ART DROPS (Mac generates via FLUX/Grok → Sol wires, no code wait)
| Art | Status | Wire-in |
|---|---|---|
| **Veil & Vein HERO character** `veilvein_1.png` | ⬜ MISSING — brief ready `~/Downloads/VEIL_VEIN_DROP_ART_BRIEF.md` | → `assets/companions/` + COMPANION_LORE + SKINS entry (tarot-drop exclusive skin). Cosmetics (halo/wing/pet_26) already shipped — only the totem creature is missing. |
| **#262 quol×3** kabbala/noetic/quantum `_1.png` | ⬜ MISSING — wearing quol | drop at key, fallback auto-picks (no code) |
| **#262 other doubles** (8 more, see above) | ⬜ shared faces | same — drop PNG at key |

## ⏳ OUTREACH
- **Simon / Alliance** — reconnect message DRAFTED + ready (in `project_alliance_moment` memory). NOT yet sent. Rec: send the low-risk door-opener while launch is fresh (asks next deadline + if interview-help stands, commits to nothing). Next cohort ALL18 = Sept 7, early deadline ~July → weeks not days. Kit: `~/Desktop/ALLIANCE_PITCH_KIT/`. **Mac fires.**
- **Angel (X)** — Mac fired "Addictive wisdom". Follow-up loaded if he bites.

---

> Below: detailed feature specs (GEM FORGE etc) + audit archive. ⚠ May reference shipped items — not a clean queue, reference only.

---
## 🔥 FORGE NOW (priority order) — ⚠ contains shipped items, audit pending

### #206 — GEM FORGE + Crystal Domain (Zodiac 10th tile + School domain)

**The vision:** Gemstones as belief objects. No scientific claims — pure intentional meaning-making.
One day we may have the ability to produce actual artificial gems for users. This is the start.

**GEM FORGE — Zodiac 10th tile (◆ GEMS)**
A forge for making personal, meaningful, potentially powerful artificial gems.
Not random — requires the user to fill in specific fields before anything generates:
- INTENTION — what is this gem for? (protection / clarity / love / grief / power / transition)
- FEELING — what emotion or state should it carry?
- ELEMENT — earth / water / fire / air / aether
- ASTROLOGICAL BOND — which sign or planet does it resonate with?
- COLOUR PULL — what colour does the user feel drawn to for this gem?
- NAME — user names their gem (or Sol proposes one from the inputs)

Sol then generates:
- A prose invocation (the gem's identity in Sol's voice — not science, pure belief)
- A care ritual (how to work with it, cleanse it, activate it)
- A FLUX image — photorealistic artificial gem matching the colour/element/feel
- Saved to the user's GEM COLLECTION (persistent, viewable, shareable)

**LAMAGUE encoding — user-sovereign, never assigned:**
Sol surfaces 6–8 symbols that *could* fit the gem based on inputs.
User taps to accept, reject, or swap each one. User can open full symbol library
and pull any symbol they feel. They can use a symbol they forged in WITCHAIL.
What the user ratifies becomes the gem's encoding — Sol never overwrites it.

The more LAMAGUE the user knows (from the school), the richer the gem they can make.
School feeds the forge. The forge makes the school meaningful.
A gem with borrowed symbols is hollow. A gem built from earned vocabulary is a talisman.

**Design principle:** The specificity of the input is what makes it powerful.
A gem made in 10 seconds means nothing. A gem where the user sat and named their grief means everything.
The form IS the ritual. Filling it in IS the first act of belief.
The symbols ARE theirs — Sol provides vocabulary, the user speaks.

**Crystal Study Domain — Mystery School**
A new school domain: LITHIC ARTS or CRYSTAL LORE
- History of gem belief across cultures (Egyptian lapis, Aztec jade, Celtic quartz)
- Crystal systems (actual mineralogy — no healing claims, just the science of structure)
- Metaphysical traditions — chakra mapping, planetary gem correspondences, colour theory
- LAMAGUE integration — what symbols naturally encode gem properties?
- Psi angle — object-focused meditation, programmed intention objects, belief + consciousness
- Dean Radin adjacent — can intentional objects affect outcomes? (held as open question, never claimed)
- User notes section — gems they own, what they use them for, personal lore

**Future:** If we ever build physical production (resin/mineral casting), the GEM FORGE
output becomes the spec sheet. The digital gem IS the design file.

### #205 — Sanctum: The Living Book
The Sanctum becomes a living memory archive — not a diary, a book you're writing with Sol.
- Journal entries stored as pages: text + optional image (FLUX-generated or photo)
- A dedicated agent: Aura's warmth + Lyra's expressiveness + Sol's depth + Veyra's structural precision
  — builds you up when morale is low, holds your story when you need to remember who you are
- Agent reads your history before responding — knows your arc, your wins, your hard sessions
- Entries tagged automatically: memory / insight / grief / breakthrough / intention
- "Living" because the agent can reference past entries unprompted: "Three weeks ago you wrote..."
- Image memories: describe a feeling → FLUX generates it → stored as a visual memory tile
- Mood-aware: if recent entries skew dark, agent shifts to builder mode — raises, doesn't console
- The one agent in the app that is purely yours. Not a teacher. Not a battle partner. A witness.

### #202 — Global ? Help Button (Codex Agent)
Single help surface that takes all weight off every other help thing in the app.
- Floating ? button (bottom-right, above tab bar) — tap = opens full help modal
- Powered by Codex AI agent — user can ASK questions, not just read static cards
- Sections: tab-by-tab guide, API key setup, bug report (mailto), crisis support link
- Replaces all scattered help content across tabs (audit and remove them)
- Should feel instantly helpful — first question gets a real answer in <3s

### #203 — Onboarding: First 60 Seconds Must Feel Magic
Non-interruptible 30-60s first-run tour. Fires once on fresh install.
- Tab-by-tab: when user first enters each tab, a one-time tooltip/overlay explains it
- Not a modal wall — a subtle animated label that floats in and fades after 4s
- TALK tab: Sol speaks first — personalised greeting, asks your name, sets the tone
- Mystery School: "38 doors. Choose one." — nothing else. ✅ DONE
- Companion: entity appears with a birth animation the first time
- Battle: first encounter gets a cinematic intro overlay "FIRST ENCOUNTER"
- Zodiac: stars animate in, constellation forms, then fades to the grid ✅ DONE
- Goal: someone who has never seen the app feels the magic in the first minute

### ✅ #204 — Full App Audit — SHIPPED (June 20 2026)

### #204 — Full App Audit (run today)
Complete sweep of all tabs. Goal: every screen earns its space.
- Remove or hide all decorative-only UI with no function (companion + zodiac carry visuals)
- All collapsible sections default to COLLAPSED — user expands what they want
- Remove outdated copy, dead buttons, placeholder text, orphaned features
- Zodiac: visual pass — currently looks basic, needs atmospheric depth
- Update HELP_SECTIONS data to match actual current app state
- Each tab: one job. Cut anything that doesn't serve it.
- Report: per-tab findings, what was removed, what needs a build pass

### #201 — UI symmetry + sizing audit (OCD pass)
Full-screen symmetry sweep. Goal: someone with OCD can breathe.
- Consistent card padding (16px everywhere)
- Consistent border-radius (14px cards, 20px hero blocks, 8px chips)  
- Consistent font sizes per role (glyph labels 8-9px, body 12-13px, headers 10px caps)
- Tile grid: uniform sizes, clean 2-col alignment, no orphan tiles with different heights
- Header elements vertically centred
- Section spacing consistent throughout (12-16px gaps, not mixed)
Files most likely to need work: zodiac.tsx, school.tsx, companion.tsx, sanctum.tsx

### #187 — Lore compounding + unified codex view (#132)
All 38 domains have lore. Surface it: scrollable codex view, domain lore cards,
cross-domain resonance links visible. The mystery school has a library — show it.

### #188 — Accessibility pass (#134)
Font scaling, contrast ratios, touch target sizes (min 44px), screen reader labels.
Dark mode is fine — make sure it's actually readable at all font sizes.

### #189 — Workshop tab (#135)
PROBE / CEMENT / GLOSSARY mode tabs.
Probe: user inputs a concept → Sol stress-tests it with LAMAGUE pressure.
Cement: drill a symbol until it's embodied.
Glossary: full browsable LAMAGUE symbol reference with search.

### #190 — Reality Anchor check-in (#156)
After 3+ deep sessions: soft interstitial. "This is a tool, not a replacement."
Gambling-style session awareness: time in session visible, gentle nudge to pause.
Dismissable, non-guilt, never blocks. Max once per 3 days.

### #191 — Onboarding complete rehaul
Full cinematic first-run: Sol speaks, companion appears, first ritual, first win.
Sovereignty baseline (3 questions) → immediate lumen reward.
No skippable walls — make every step feel earned. Under 5 min total.

### #192 — Contrast / dark mode audit
Ensure every screen passes WCAG AA contrast at system font size +2.
Purple-on-black sections: check zodiac, school, sanctum specifically.
Fix any illegible text — beauty means nothing if it can't be read.

### #193 — Solana integration (#167–#173)
Wallet connect → SBT (Soulbound Token) for sovereignty milestones.
Earned Light NFT artifacts. Lycheetah DAO seed.
Ref: /home/guestpc/Desktop/SOLANA INTEGRATION TO SOL SOVERIENG
This is a flex — integrate it properly. Post-EAS but plan the architecture now.

### #194 — System Bridge (experimental developer panel)
"⚠ EXPERIMENTAL — DEVELOPER BRIDGE" panel in Settings.
Official sandboxed system APIs only (core Linking + Vibration + Share — NO install):
open Settings screens · dial/SMS/email/Maps · launch apps by scheme · vibration patterns · share sheet · open URLs.
HONESTY RULE: warning is flavor only — these APIs CANNOT brick a phone (OS sandbox).
No dishonest "may damage device" copy. Frame as "experimental developer surface."
Each action wrapped in try/catch with visible failure. Shows the framework respects the sandbox.

### #165 — AdMob integration
`react-native-google-mobile-ads`. Banner: BATTLE + SCHOOL tabs only.
Rewarded ads: bonus school content, extra tokens.
HARD RULES: no ads in Sanctum or TALK. Max 1 ad per 3 sessions.

### #185 — EAS build (Mac fires)
`eas build --platform android --profile preview`
Sol never triggers this. Mac fires when zodiac grid + battle rehaul confirmed tight on phone.

---

## 📋 QUEUED (ordered, not tonight)

### Save-to-gallery button
`npx expo install expo-media-library` first. Then add SAVE button UI in school WITCHAIL + zodiac SIGIL FORGE. `saveImageToDevice()` in lib/image-gen.ts is ready.

### #157 — Journal export
Export journal entries as plain text or PDF. Clean formatting, no branding.
SANCTUM → Journal → Export button.

### #159 — Sanctum warmth pass
Amber/gold accents replace purple in Sanctum. Slower animations.
Colour + timing pass only — no structural changes.

### #162 — Epistemic layer background tagging
Every AI response tagged in background: register + confidence tier.
Powers #154 pills. Stored per-message in session state.

### #154 — Register tag pill on AI responses
Tiny pill: PROJECTIVE / PSYCHOLOGICAL / SPECULATIVE / EVIDENCE.
One-tap tooltip explains register system.

### #155 — Skeptic Mode toggle
Settings toggle. Reframes mystical → psychological utility language.
Badge in Sanctum header when active.

### #160 — TALK tab mode chips
WAYFARER / COUNCIL / LAMAGUE / SKEPTIC quick-switch at top of TALK.

### #161 — Onboarding quick-win (post-onboarding flow)
5-min guided first experience after current onboarding.

### #138 — Companion type-family redesign (#71)
Each archetype TYPE → family of distinct named characters.
User picks character within ALCHEMIST / SENTINEL family etc.
Art: pixel bg + floating painterly companion + glow at boundary.

### #163 — Sovereign Sideloading in-app guide
3-step install guide, Obtainium setup, GitHub releases link.

### #164 — GitHub Releases + lycheetah.io APK hosting

### #166 — NVIDIA key migration plan

---

## ⏸ HELD

- Advanced zodiac modes (#110–#115) — zodiac visual rehaul first
- Silicon Path onboarding (#87) — after main onboarding rehaul
- Rarity tab system (#109)
- Tarot deck selector (#100)
- Pixel World Map (#66)

---

## ✅ SHIPPED THIS ERA (v4.6 → v5.3)

| # | Feature |
|---|---|
| **#202** | **Global ? Help Button** — top-right on every tab, AI-powered ask bar, full guide cards, bug report + crisis links |
| **#189** | **Workshop tab** — PROBE (AI stress-tester) / CEMENT (flashcard drill) / GLOSSARY (full LAMAGUE symbol browser). Entry from LAMAGUE header button |
| **#160** | **TALK mode chips** — WAYFARER / COUNCIL / LAMAGUE / SKEPTIC. Persisted to AsyncStorage. Drives system prompt and councilMode |
| **#159** | **Sanctum warmth pass** — Living Book header, moon phase prompt card, Witness button + response card visual upgrade, entry cards |
| **#206** | **Gem Forge + Crystal Domain** — task locked, spec complete |
| **#205** | **Sanctum Living Book** — task locked, agent spec complete |
| **session** | **Voice (TTS)** — lib/tts.ts, OpenAI→Gemini→expo-speech waterfall, persona voices, ▶ LISTEN inline on all messages |
| **session** | **Zodiac atmosphere** — aurora sweep, domain tints, 2-layer star drift, entry sequence, 9 SVG icons, driver conflict fixed |
| **session** | **Onboarding overlays** — Zodiac "THE FIELD IS OPEN", School "38 DOORS. CHOOSE ONE.", TALK first message updated |
| **session** | **Audit** — school/specials collapsed, library dead section removed, 38 domains/328 subjects everywhere |
| **#207** | **Veras currency** — ✧ knowledge dust alongside ⟡ Lumens. +200L +50V on onboarding, +5V per journal entry. Shop balance shows both |
| **#203** | **First 60s magic** — FIRST ENCOUNTER overlay on battle tab (4s auto-fade), detectRegister() register pills on all AI messages |
| **#191** | **Onboarding rehaul** — 7 steps, sovereignty baseline (3 questions), lumen+veras founding gift, animated companion landing, updated numbers (38/328) |
| **#190** | **Reality Anchor** — after 3rd dive, modal check-in, max once per 3 days, AsyncStorage gated |
| **#155** | **Skeptic Mode toggle** — Settings toggle + ⊗ badge in Sanctum header, persisted to sol_skeptic_mode |
| **#154** | **Register tag pill** — detectRegister() on AI messages: EVIDENCE/PSYCHOLOGICAL/PROJECTIVE/SPECULATIVE |
| **#157** | **Journal export** — ↑ export button on Living Book header, Share.share() plain text |
| **#194** | **System Bridge** — ⚠ EXPERIMENTAL dev panel in Settings: open Settings/vibrate/share/email/GitHub |
| **TS** | **TypeScript clean** — fixed tabBarScrollEnabled error + SendResult.trim() → .text.trim() |
| **#201** | **#201 queued** — UI symmetry + sizing audit |
| **#200** | **Cosmetics lazy load** — Halo/Wings/Pet sections collapse by default, expand on tap, images only load when open |
| **#198** | **Battle dialogue rehaul** — Sol voice in log, 3-entry log at 11px, victory Sol line, compact enemy header, action button descriptors |
| **#198** | **Zodiac weather + tile visuals** — Open-Meteo live weather in THE SKY section; each tile gets unique watermark glyph + constellation dot pattern; tiles shrunk (aspectRatio 1.85); floating ? button removed; School quick nav CODEX button; Codex flag routing; school "open" banner simplified |
| **#197** | **Zodiac visual life pass** — heroGlow/tileGlows/nebulaPulse/glyphDrift animations; constellation dots; nebula colour washes behind header; pulsing tile borders with staggered phases |
| **#187** | **Domain lore codex** — 𝔏 DOMAINS tab in Codex: 24 domain cards, search, layer filter chips, expand to subjects grouped by layer, full descriptions, intensity badges, care pills, credit attribution, studied state (✦/◌), live progress bar |
| **#196** | **Zodiac expansion** — THE SKY as full-width hero banner (live sun/moon/phase/ruling planet/retrograde), 2-col tile grid (8 tiles), ASPECTS as 9th tile, sky overlay strip, full aspects section with live planet-pair angular computation (☌/✶/□/△/☍), `getPlanetLongitude` + `getAspectBetween` helpers |
| **#195** | **Sol Identity Screen** — persistent "WHAT IS SOL?" pill on home TALK tab, full manifesto modal (mystery school / 5 personas / RPG / truth engine / Solana / The Covenant) |
| **#186** | **Cinematic battle modal** — full-screen on encounter start, 200×240 enemy art, rarity-tinted bg, red screen flash on hit, enemy + player HP bars, 2×2 action grid, spell/item overlays, CAPTURE, battle log, WAVE CLEARED victory screen |

| # | Feature |
|---|---|
| #184 | **Zodiac tile grid** — 8-tile 3×3 grid, tap → section expands, ← back, all sections hidden in grid mode |
| session | **Cosmetics resize** — halo 680×360 (0.75op), wings 320×275, companion 130×190 +right shift, ATHANOR→wings |
| session | **ART EXPANSION** — 17 halos / 15 pets / 16 wings (ATHANOR added as wing_16) |
| session | **Image gen — all 3 surfaces**: school WITCHAIL (refactored to lib), zodiac SIGIL FORGE DRAW, TALK ◈ Image button |
| session | Zodiac WITCHAIL FORGE: TYPE/DRAW toggle + SAVE TO LEXICON (saves with glyphImage) |
| session | TALK image gen panel — ◈ in tools row → prompt → 240×240 FLUX result |
| session | lib/image-gen.ts — single canonical FLUX impl, all surfaces use it |
| session | WITCHAIL FORGE — DRAW mode (describe glyph → NVIDIA FLUX → oracle ratifies) |
| session | Zodiac reorder: SIGIL → CHIRAL → ZONK → PSI → NATAL |
| session | SPREAD block restored (5-card + Celtic Cross) |
| session | LAMAGUE Symbol Forge dual-location (school WITCHAIL tab + zodiac SIGIL FORGE) |
| session | Version drift fixed: 5.0.0 everywhere, versionCode: 5 |
| session | +4 free Gemini models (8 total — Gemma 4 31B at 1500/day) |
| #178 | Full App Coherence Audit — 10 passes complete |
| #179 | Weapons system — 40 weapons, 7 types, 5 rarities, loot drops, ARSENAL |
| #180 | Enemy art — companion PNGs cloned to battle pool, fallback chain |
| #181 | Shop expansion — 12 items, wings/familiars/void crown |
| #182 | Zodiac atmospheric block cards — Oracle/PSI/SIGIL/CHIRAL/ZONK converted |
| #183 | Main chat fullscreen — ⛶ button, FlatList Modal, autoFocus, keyboard-aware |
| #176 | lycheetah.io static site — dark, gold/purple, APK download hero |
| #177 | Sol AI agent on website — NVIDIA NIM chat widget |
| safety | Emergency Beacon — ⊚ orb, long-press crisis modal, breath timer, crisis lines |
| safety | Magister CARE tag system — self-assess, visible pill, Witness Protocol |
| safety | ReturnToBody — 4-4-4-4 breath after deep school sessions |

---

## KEY STATE

| Thing | Value |
|---|---|
| Version | 5.25.0 (launched; versionCode 8 — APK still on 5.22.6, rebuild = Mac fires) |
| Git | master · committed 74a9297 (depth pass + release notes) · tree clean |
| Run command | `npx expo start -c` |
| Distribution | Sovereign Sideloading → GitHub Releases + lycheetah.io |
| Halos | 17 (halo_1–17, enlarged: 680×360, opacity:0.75) |
| Pets | 15 (pet_1–15; pet_athanor→file:null, art moved to wings) |
| Wings | 16 (wing_1–16; wing_16 = ATHANOR WINGS) |
| Companion art | 102 PNGs in `assets/companions/` |
| Enemy art | 100+ PNGs in `assets/enemies/` |
| Zones | 45 total · Archetypes | 10 |
| EAS account | solveyra · project: 55350e14-5cdc-4a5f-8a0e-735bca572dd3 |
| Solana spec | /home/guestpc/Desktop/SOLANA INTEGRATION TO SOL SOVERIENG |
