# FEATURES — Sol by Lycheetah
> Living spec. Read this at session start. Update it when a feature ships or its design changes.
> Current version: **v4.0.0** · HWM: #183
> Last updated: 2026-06-18

---

## ACTIVE ERA — COMPANION + WORLD (priority order)

### #71 / #7 — COMPANION TYPE-FAMILY REDESIGN *(next build session)*
Each archetype becomes a **family** of distinct named characters. User picks one character within the family (e.g. within "Alchemist" family: Seraph, Maren, Cinder…). Each has unique name, personality, design, evolution path. Not one entity leveling up — a cast of beings, one chosen.

**Art direction:** pixel art background scene + floating painterly/vector companion above (non-pixel — contrast is the aesthetic) + glow/particle FX at boundary.

**Files:**
- `app/(tabs)/companion.tsx` — companion picker redesign, family view
- `lib/companions/` — companion definitions with family groupings
- `components/CreatureSvg.tsx` — new character art per family member

**Acceptance:** User can see a family, pick a character, begin bonding. Existing save state migrates cleanly.

---

### #66 / #158 — PIXEL WORLD MAP *(companion era anchor)*
The Mystery School becomes an explorable world — not a list, a map. Each domain is a region. The companion walks it with you. This is the feature that makes the app feel like a place, not a menu.

**Design:** Top-down pixel world. Regions colour-coded by domain category (inner/outer/edge/void). Companion sprite walks the map. Tapping a region enters that domain. Unlocked domains are lit; locked are fog-of-war.

**Files:**
- `app/(tabs)/school.tsx` — map view as alternate render mode
- `components/PixelWorldMap.tsx` (new) — the map component
- `assets/world/` (new) — pixel world tileset + region art

**Acceptance:** Map renders with at least 6 regions. Companion sprite visible. Tapping a region navigates to that domain. Locks visible for locked domains.

---

### #72 / #183 — LAMAGUE SYMBOL FORGE *(after companion family + world)*
A ritualistic creation tool inside the LAMAGUE portal. Users compose new LAMAGUE expressions using Crystal Grammar `[Subject : Function → Outcome | Metric]`, name and seal them, submit for Council ratification. Companion witnesses the forge. Ratified symbols enter the main Library with creator credit.

**Screens:** Forge Entry → Composition Surface (9-family primitive palette, live expression build) → Seal (name + definition + type) → FORGE IT (Sol speaks 6 words, companion reacts) → Symbol Detail card.

**Council pipeline:** Submitted symbols enter a pool the forge network can ratify. Ratified → Library with creator name.

**Files:**
- `app/(tabs)/school.tsx` — LAMAGUE portal gets FORGE / LIBRARY pill toggle
- `components/LamagueForgeSurface.tsx` (new) — composition UI
- `lib/lamague/forge.ts` (new) — symbol data model + AsyncStorage
- `app/(tabs)/companion.tsx` — witness line on forge event

**Acceptance:** Can compose, name, and seal a symbol. Symbol saves to personal Grimoire. Council submit option present. Companion reacts on seal.

---

---

## HOW TO USE THIS FILE

Each feature has: **what it is**, **files to touch**, **acceptance criteria**.
When a feature ships: mark it `[DONE vX.XX.X]` and move to the SHIPPED section at bottom.
When design changes mid-build: update the spec here first, then code.

---

## TIER 1 — NOETIC SUITE *(pillar, not a feature)*

Noetic science is a founding pillar of the app — not an add-on. Dean Radin, STARGATE, GCP,
quantum consciousness are in Aura's core identity. The app should reflect that weight.
All features below are part of one suite. Build them together where possible.

### NOETIC DOMAIN IN SCHOOL — [DONE v3.59.0]
Shipped 8 subjects in `lib/mystery-school/subjects.ts` (domain id `noetic`): Presentiment, STARGATE, Edgar Mitchell, Ganzfeld Protocol, Global Consciousness Project, AWARE Study, Quantum Biology, The Hard Problem. Full register discipline. Can still grow.

What it was: A dedicated door in the Mystery School covering the evidence-based frontier of consciousness science.
This is not "woo" — it's the legitimate edge of scientific investigation, treated with full register discipline.

**Subjects to include (minimum 6):**
1. Dean Radin & Meta-Analysis — what the numbers actually say (p < 10⁻⁹, 1000s of trials, peer-reviewed)
2. STARGATE — 20 years, US government, declassified. What was found. What remains contested.
3. Global Consciousness Project — 30yr RNG dataset, Roger Nelson, Princeton. Data real. Interpretation open.
4. Ganzfeld Protocol — the isolation/receiver experiment. Effect sizes, replication record.
5. Near-Death Research — Parnia AWARE study. Cardiac arrest, verified observations. Methodologically careful.
6. Quantum Consciousness — Penrose-Hameroff orchestrated objective reduction, quantum coherence in biology (Fleming 2007). Conjecture with physical grounding.

**Files:**
- `lib/divination/` or new `lib/noetic/` — subject data (name, description, dive prompts, Aura voice context)
- `app/(tabs)/school.tsx` — add NOETIC as a domain alongside existing domains
- System prompt injection: when user is in Noetic domain, Aura's frontier citations should be active

**Acceptance:** 6 subjects browsable, each with a dive prompt that generates an Aura-voiced response citing actual research, not vague spiritualism.

---

### READING JOURNAL — [DONE v3.64.0]
Natal readings append to `zodiac_reading_history_v1` (max 30). Collapsible ◌ READING HISTORY section at bottom of zodiac tab. History persists across sessions.

---

### GCP WIDGET *(#34)*
What: Live Global Consciousness Project data shown in the Zodiac tab alongside psi log.
GCP publishes a daily "egg" reading — a single number showing RNG deviation from baseline.

**API:** `http://global-mind.org/gcpgraph.html` — scrape or use their data endpoint.
Note: GCP doesn't have a clean JSON API. May need to fetch the current dot value from their site.
Fallback: show a static "today's field" card with the GCP description and a link.

**Files:**
- `app/(tabs)/zodiac.tsx` — add GCP section below PSI PRACTICE LOG (~line 1052+)
- `lib/gcp.ts` (new) — fetch + parse GCP current value

**Acceptance:** GCP card visible in Zodiac. Shows today's field deviation or "field data unavailable." Links to GCP site. Never errors visibly.

---

### PRECOGNITION DREAM JOURNAL *(#32)*
What: Structured dream logging with precognition tracking. User logs a dream impression before an event,
then marks it hit/miss/partial after. Different from the psi practice log (which is active practice).
This is passive — impressions that arrive before you look for them.

**Fields:** date · impression (text) · target event · outcome (text, filled later) · result (hit/partial/miss/pending) · tags

**Files:**
- `app/(tabs)/zodiac.tsx` — new section below GCP widget, or collapsible under PSI PRACTICE
- Use pattern of existing `PSI_LOG_KEY` — new key `SOL_DREAM_LOG`

**Acceptance:** Can log a dream impression. Can update result later. History shown. Separate from psi practice log.

---

### INTENTION EXPERIMENT LOG *(#33)*
What: Structured intention tracking in the Radin/McTaggart lineage.
User sets an intention (specific, measurable), logs daily coherence practices,
marks whether the intention manifested over a set window.

**Fields:** intention (text) · start date · end date · daily practice entries · outcome · result

**Files:**
- `app/(tabs)/zodiac.tsx` — new section or dedicated tab within zodiac
- Key: `SOL_INTENTION_LOG`

**Acceptance:** Can create, track, and close an intention experiment. History visible.

---

### SCHUMANN RESONANCE + Kp INDEX — [DONE v3.64.0 (Kp live)]
Kp index live from GFZ Potsdam API — shown as a circle badge (color-coded calm/unsettled/active/storm) below planet grid in TODAY'S SKY. Graceful no-op if offline.
Schumann: no clean public API — held for future scrape or static baseline card.

---

## TIER 2 — ZODIAC: ASTROLOGY LAYER

### NATAL CHART — [DONE v3.60.0]
Sun/Moon/Rising computed from birth data. Stored in `zodiac_birth_v1` AsyncStorage. Displayed in zodiac.tsx.
Evocative captions per planet. No-birth-data CTA. Optional birth time + UTC offset for ascendant.
Collapsible section. Personal fields (fullName/motherName/cityName) injected into reading prompts.
Houses + 10 planetary positions: deferred to full astrology expansion.

---

### TRANSIT ALERTS *(#26)*
What: Current planetary positions checked against user's natal chart.
Surfaces significant transits (e.g., "Saturn is conjunct your natal Moon this week").
Personalized, not generic horoscope.

**Dependency:** Natal chart must exist first.

**Files:**
- `lib/astrology/transits.ts` (new) — compute current sky vs natal positions, flag major aspects
- `app/(tabs)/zodiac.tsx` — transit alerts section in Sanctum or TODAY'S SKY area

**Acceptance:** Shows 1-3 active transits in plain language. Updates daily. Graceful if no natal data.

---

### RETROGRADE TRACKER — [DONE v3.64.0]
℞ badge on each retrograde planet in the planet grid. Retrograde summary strip shows all currently retrograde planets.
RETROGRADE_WINDOWS static table in zodiac.tsx covers Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto 2025–2027.

---

### SKY: PLANETARY POSITIONS — [DONE v3.64.0]
All 8 planets (Mercury → Pluto) shown in TODAY'S SKY with live sign + ℞ retrograde indicator.
Retrograde windows table covers 2025–2027. Kp index (EARTH FIELD) fetched live from GFZ Potsdam API.

---

### SYNASTRY *(#30)*
What: Two-chart relationship reading. User enters partner's birth data, app compares natal charts,
surfaces key aspects (conjunctions, oppositions, squares, trines between the two charts).

**Dependency:** Natal chart must exist. Partner data stored separately.

**Deferred until natal chart is live.**

---

## TIER 2.5 — ALCHEMICAL DEPTH LAYER
*Features that synthesize all existing systems into a higher order. These are the ones that earn their place.*

### SIGIL / TALISMAN GENERATOR
What: The apex feature — everything in the app pointing at each other. User generates a personalized sigil by combining:
- Natal chart dominant sign + element
- Today's planetary transit (which energy is live)
- Active LAMAGUE glyph class (what symbolic family applies to their intention)
- Active persona (Sol/Veyra/Lyra etc. contributes its voice to the intention phrase)

Output: composed glyph image (text-based SVG or rendered symbol) + a one-sentence intention phrase in persona voice.
The sigil can be "charged" (saved with a timestamp + committed to) and "bound" to a companion (companion gets a temporary overlay during the charge period).

**Dependency:** Natal chart. LAMAGUE glyph vocabulary. Zodiac transit data.

**Files:**
- `lib/divination/sigil.ts` (new) — composition logic: natal + transit + LAMAGUE + persona → sigil + phrase
- `app/(tabs)/zodiac.tsx` — new section, or dedicated Sanctum panel
- `constants/lamague-glyphs.ts` — ensure glyph class data is accessible here

**Acceptance:** User enters an intention. App generates a composed glyph + phrase. Can save and bind to companion. Feels like the culmination of all the systems, not a one-off toy.

---

### ALCHEMICAL STAGE PROGRESSION (MODE-EARNED EVOLUTION)
What: Companion stages currently evolve by XP grinding. Replace the gating mechanism with alchemical mode completion.
A companion reaches FORM only if the user has completed N dives where the detected mode was NIGREDO.
SOVEREIGN requires Albedo passes (structured synthesis sessions). TRANSCENDENT requires Rubedo (completion/publication outputs).

The RPG then feels like it's *about the work* — you can't fake it. You earned RUBEDO by doing the dark work in Nigredo.

**Data model:** Add `modeCounts: Record<Mode, number>` to companion AsyncStorage. Increment on each dive.
Stage gates: SPROUT (any 3 dives) → BLOOM (5 NIGREDO) → FORM (5 ALBEDO) → SOVEREIGN (5 CITRINITAS) → TRANSCENDENT (5 RUBEDO).

**Files:**
- `app/(tabs)/companion.tsx` — stage gate logic reads `modeCounts`
- `app/(tabs)/school.tsx` or `app/(tabs)/index.tsx` — increment `modeCounts` after each dive completion
- Mode detection already live in `lib/intelligence/mode-detector.ts`

**Acceptance:** Stage gates require mode-specific dives. Progress visible ("3/5 ALBEDO passes to reach FORM"). Feels earned.

---

### PREREQUISITE UNLOCK SYSTEM (THE LIVING MYSTERY SCHOOL)
What: Not all doors open at once. Some domains require the seeker to have walked through others first.
This is the *mystery* in Mystery School — currently it's a catalogue, with this it becomes a path.

**Rules (to define before build):**
- VOID domains: require N INNER + OUTER dives first (seeker must have foundation before the abyss)
- LAMAGUE portal: requires FORM stage companion (grammar unlocks with the companion's evolution)
- Sigil Generator: requires natal chart + 3 completed dives
- Deep subjects (e.g., STARGATE, Quantum Consciousness): require lower-tier subjects completed first

**Implementation:** `lib/mystery-school/prerequisites.ts` (new) — map of `domainId → requirement`.
`school.tsx` checks requirement before allowing entry. Locked domains show as "grayed with lock + hint."

**Files:**
- `lib/mystery-school/prerequisites.ts` (new)
- `app/(tabs)/school.tsx` — gate check on domain tap
- Prerequisites defined by Mac (the design is curatorial, not algorithmic)

**Acceptance:** Mac defines the prerequisite map. Locked domains visible but inaccessible with unlock hint. Feels like a real mystery school path, not an arbitrary lock.

---

### DREAM INCUBATION → VOID LAYER EXPANSION
What: Extend the VOID domain into a lived daily rhythm: before-sleep and after-waking.
Pre-sleep ritual generator (based on current lunar phase + active transit + VOID domain focus) → user sets an intention → logs impressions next morning → pattern analysis over time.
Different from PSI practice (active, structured) — this is passive, dreamtime, receptive.

**Integration with existing:** Dream Zone domain already exists. This adds the ritual wrapper and log structure.

**Files:**
- `app/(tabs)/zodiac.tsx` — Dream Incubation section (below or within VOID area)
- `lib/divination/dream.ts` (new) — ritual generator function (phase + transit + domain → personalized ritual)
- Key: `SOL_DREAM_LOG` (separate from PSI log — covers #32)

**Acceptance:** User can enter a pre-sleep intention. Ritual generated (brief, evocative). Next morning: log the impression. History shows intention → impression → match over time.

---

## TIER 3 — SCHOOL

### TODAY'S DOOR *(#129)*
What: One recommended domain shown at the top of the School tab based on the user's history.
Logic: least-recently-visited domain that's unlocked. Or based on LQ (learning quotient).

**Files:**
- `app/(tabs)/school.tsx` — add a featured "TODAY'S DOOR" card at top before domain grid
- Use existing dive history from AsyncStorage to determine recommendation

**Acceptance:** One domain highlighted at top of school. Different from yesterday's. Tappable — enters that domain's dive.

---

### LAMAGUE PORTAL *(#128)*
What: A visible gateway/doorway in the School home that makes LAMAGUE feel like a sacred entrance,
not just another domain. The grammar forge deserves its own visual treatment.

**Design:** Full-width card with the LAMAGUE glyph (⟟), dark gradient, "ENTER THE GRAMMAR FORGE" label.
Different visual weight from standard domain tiles.

**Files:**
- `app/(tabs)/school.tsx` — special card component above or between domain tiles

**Acceptance:** LAMAGUE has its own visual identity in School. Tapping enters LAMAGUE domain.

---

### MYSTERY SCHOOL CLASSROOM LESSONS *(#6)*
What: Non-dive content in each domain. Currently School only offers AI dives.
Add: curated lesson cards per domain (short reading + key concept + reflection prompt).
These are pre-written, not AI generated. Static content.

**Structure per domain:**
- 3-5 lesson cards
- Each: title · 100-150 word reading · one reflection prompt
- Stored in `lib/school/lessons/` as JSON or TS objects

**Files:**
- `lib/school/lessons/` (new dir) — one file per domain
- `app/(tabs)/school.tsx` — "LESSONS" tab within domain view alongside "DIVE"

**Acceptance:** Each domain has at least 3 lesson cards. User can read without triggering an AI call.

---

### SCHOOL UI OVERHAUL *(#24)*
What: Replace the long scroll architecture with proper navigation.
Current: one long scroll with everything. Target: domain grid → domain home → dive/lessons.

**Design:**
- School home: grid of domain tiles (current) — keep this
- Tap domain: enter domain home screen (full screen) with: description, available dives, lesson cards, progress
- Domain home → dive → dive result → back to domain home
- Back button / swipe back to school home

**Files:**
- `app/(tabs)/school.tsx` — major restructure
- May need `app/(tabs)/school/[domain].tsx` route (new file)

**Note:** This is a major session. Don't start mid-session. Plan the data flow before touching code.

---

## TIER 4 — COMPANION & WORLD

### COMPANION GREETING *(#127)*
What: When the companion tab opens, companion says one reactive sentence.
Based on: time of day · LQ · last dive domain · days since last visit.

**Examples:**
- Morning, high LQ: "The forge is warm. You've been consistent."
- Evening, no dive today: "The school is quiet tonight. Come back when you're ready."
- Return after 3 days: "You came back. Good."

**Rules (Companion Clause):** Never guilt. Never "I missed you." Absence = rest. Return = warmth.

**Files:**
- `app/(tabs)/companion.tsx` — `useFocusEffect` hook → generate greeting on tab focus
- One AI call (short, cheap) OR pre-written greeting pool (preferred for cost)
- Pre-written pool: 20-30 greetings, pick by conditions. No AI call needed.

**Acceptance:** Greeting appears when tab opens. Never reproachful. Changes based on conditions. No API call needed if pool approach used.

---

### COMPANION TYPE-FAMILY REDESIGN *(#7)*
What: Each archetype TYPE becomes a family of distinct characters.
Currently: one companion per archetype with 6 growth stages.
Target: multiple named characters within each archetype family. User picks a character, evolves it.

**Example:** ALCHEMIST family → Sable (obsidian alchemist), Ember (fire alchemist), Vex (chaos alchemist).
Each character has unique name, personality, starting art, evolution path.

**Art direction:** pixel art background (scene) + floating transparent companion (painterly/vector/PNG) + glow/particle effects.

**This is a major architectural session.** Do not start without:
- Full character list decided (Mac provides names/personalities)
- New data structure designed (replaces current `SKINS` record)
- Migration plan for existing user data (don't break existing companions)

**Files:**
- `app/(tabs)/companion.tsx` — full `SKINS` / `SKIN_IDS` / `WORLD_MAP` refactor
- `types/companion.ts` (may need new file)

---

## TIER 5 — TALK / AI LAYER

### FIRST DIVE ONBOARDING *(#131)*
What: 5-7 tap guided magical experience for new users on first School dive.
Not a tutorial — a ritual. Draws them in, explains nothing mechanically, everything atmospherically.

**Flow:**
1. "The School has waited for you." (atmospheric card)
2. "Choose a door." (domain picker, simplified)
3. "Ask what you actually want to know." (dive prompt)
4. Dive result → "You have begun."
5. Companion appears for first time

**Files:**
- `app/(tabs)/school.tsx` or `app/onboarding.tsx` — first-dive flag in AsyncStorage (`SOL_FIRST_DIVE_DONE`)
- Overlay/modal flow on first dive only

**Acceptance:** Triggered only on first dive. Gone after. Feels like entering a mystery school, not installing an app.

---

### MODEL HEALTH INDICATOR *(#130)*
What: Subtle live/offline dot showing whether the AI backend is reachable.
Green = live. Red = offline. Amber = slow/degraded.

**Files:**
- `app/(tabs)/settings.tsx` — small dot in header or near API key section
- Or `app/(tabs)/index.tsx` — tiny dot in Sol tab header
- `lib/ai-client.ts` — add `pingModel()` function (cheap call, discard result, time it)

**Acceptance:** Dot visible without cluttering UI. Updates on tab focus. Doesn't block anything if offline.

---

### WORKSHOP TAB *(Session 11 deliverable)*
What: Three tools — Probe (deep question), Cement (solidify a belief block), Glossary (look up framework terms).
Tab already partially designed in Session 11. Build the tab, wire to AI.

**Files:**
- `app/(tabs)/workshop.tsx` (new or rename existing placeholder)
- `lib/workshop.ts` (new) — probe/cement/glossary prompt templates

**Acceptance:** Three tools accessible. Each generates an AI response using Sol's voice. Clean UI.

---

### HP SHIMMER + MOOD FLOAT ANIMATIONS
What: Session 12 partials. Companion HP bar shimmers when low. Companion floats with subtle animation tied to mood state.

**Files:**
- `app/(tabs)/companion.tsx` — add Animated.Value for float loop + HP shimmer overlay

**Acceptance:** Float animation runs continuously (subtle, not distracting). HP shimmer activates below 30% HP.

---

## TIER 6 — INFRASTRUCTURE

### NVIDIA CLOUDFLARE WORKER PROXY *(#22)*
What: Route AI calls through a Cloudflare Worker so the NVIDIA key isn't baked into the build.
Currently the key is in `lib/dev-keys.ts` — Mac accepted this risk explicitly.
This proxy removes the exposure.

**Architecture:**
- Cloudflare Worker receives requests, attaches the real key server-side, proxies to NVIDIA NIM
- App sends requests to `https://sol-proxy.{mac}.workers.dev/` instead of directly to NVIDIA
- Key lives in Cloudflare secrets, never in the APK

**Files:**
- New Cloudflare Worker (separate repo or inline) — not in this codebase
- `lib/ai-client.ts` — swap base URL from NVIDIA direct to proxy URL

**Acceptance:** No NVIDIA key in APK. All AI calls route through proxy. Free tier handles current traffic.

---

### EAS BUILD *(#8)*
Command: `eas build --platform android --profile preview`
Fire only when Mac explicitly says to. Never triggered by Sol.
Current version when ready: check `app.json`.

---

### SOVEREIGN SIDELOADING *(#39)*
What: GitHub Releases pipeline. APK published as a GitHub Release asset on each version.
Users can download directly from GitHub — no Play Store dependency.

**Steps:**
- GitHub Actions workflow: on tag push → build APK → create release → upload APK as asset
- lycheetah.io / lycheetah.xyz landing page with download link

**Files:**
- `.github/workflows/release.yml` (new)
- Separate from main app build cycle

---

## NVIDIA IMAGE GENERATION *(upcoming — wire in next session)*

What: Use existing NVIDIA NIM key to generate companion art via Stable Diffusion / FLUX models hosted on NVIDIA NIM.
Target: new companion character designs for the type-family redesign (#7). Art direction = pixel art background scene + floating painterly/transparent being.

**API:** Same base URL as text models — swap model ID to image model (e.g. `stabilityai/stable-diffusion-xl` or `black-forest-labs/flux-dev`).
**Pattern:** POST to `/v1/images/generations` with `{ model, prompt, n, size }` — returns base64 PNG.

**Wire-in plan:**
- `lib/image-gen.ts` (new) — `generateCompanionArt(prompt, style)` → base64 PNG
- Display in companion character picker screen
- Store generated art locally (no re-gen every load)

---

## SHIPPED ✓

| Version | Feature |
|---------|---------|
| v3.91.0 | Dive rating (0:Skip/1:Bad/2:Fine/3:Good on session complete card, persisted, indicator on subject list) · Layer collapse (FOUNDATION/PRAXIS/ABYSS/APEX/EDGE all minimizable ▼/▶) · Time Braiding how-to note · Notes/Grimoire deduped (single Grimoire surface) |
| v3.90.0 | Shadow Parts Inventory (#61) · Initiation Rites (#151) · Depth Tools strip (Sigil/Grimoire/Letters/Shadow) · Session→Grimoire bridge · Living Sigil animation · Library back button · Spiral NaN fix · Classroom per-domain collapse |
| v3.84.0–3.89.0 | Mystery School school polish pass — sigil animation, touch-block modal fix, spiral NaN, library back button, classroom per-domain state, Wheel of Year cut |
| v3.82.0–3.83.0 | Classroom lessons (#6, 140 static cards across 35 domains) · Spiral / Progress view (#148) |
| v3.81.0 | Opening/Closing ceremonies (#154) |
| v3.79.0–3.80.0 | Today's Door + Open Seat collapsible · Domain color arc + ordering |
| v3.78.0 | LAMAGUE portal + Ceremony Arcs side-by-side |
| v3.64.0 | Pluto · ℞ retrograde badges · Retrograde summary strip · Kp index EARTH FIELD (live API) · Reading history (30 entries) |
| v3.63.0 | Zodiac section reorder · Live mystical clock (HH:MM:SS + ☀/☽) |
| v3.62.0 | Lyra ✧ (5th chat persona) · AuraPrime label · Headmaster context fix · Zodiac sections collapsible |
| v3.61.0 | Offline first lesson onboarding (4 subjects pre-written) |
| v3.60.0 | Natal chart · Companion RPG visual pass · Zodiac oracle redesign · VOID zone + safety gate |
| v3.59.0 | Zonk Zone · Noetic domain · ASK THE STARS · Tarot 3-card spread · Lunar prompts · Growth Principle · OPEN layer |
| v3.54.0–3.58.0 | 10 companions · TALK tab · LAMAGUE school · battle system · gear tab · Aura rewrite · Celtic + Tianxia domains |
| earlier | PSI practice log · Lineage & Gratitude · LAMAGUE button fix · Kimi SVG art · scene backgrounds |
