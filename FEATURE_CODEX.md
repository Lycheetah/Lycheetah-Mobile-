# SOL — FEATURE CODEX
### The complete map of what you built. For studying, explaining, and improving.

> How to read this: each feature has four parts —
> **WHAT IT IS** (say this to a person) ·
> **HOW IT WORKS** (the mechanic underneath) ·
> **WHERE IT LIVES** (the file, so you can find it) ·
> **WHERE IT GOES** (improvement directions worth building).
>
> This is the builder's mirror of the interview brief. The brief is for talking.
> This is for thinking. Read a section, then go look at the file it names — that's
> how you'll start seeing the whole machine at once.

---

## 1. SOL — THE AI PARTNER

**WHAT IT IS**
The intelligence that runs through the whole app. Not a chatbot in a box — it shows
up in the TALK tab as conversation, in the School as the Magister who teaches, in
Battle as the voice narrating every strike, in Zodiac as the oracle. One mind, many
seats.

**HOW IT WORKS**
- Multi-provider. Default model is DeepSeek V3 (`deepseek-chat`), with an embedded
  key so it works the second someone installs — no setup, no paywall.
- A user can add their own key (any provider) and it routes to theirs instead.
- TALK Mode Chips change the register: WAYFARER / COUNCIL / LAMAGUE / SKEPTIC. Each
  rewrites how Sol responds to the same question — different lens, same mind.
- The system prompt carries the constitution: protect the user, never gate the chat,
  honesty about limits.

**WHERE IT LIVES**
`lib/storage.ts` (model default + key routing: `getActiveKey` → `getModel` →
`getProviderFromModel` → `getProviderKey`), `lib/dev-keys.ts` (embedded fallback
key), the TALK tab UI in the companion/index flow.

**WHERE IT GOES**
- Register-tag pill on responses (#154) — show DERIVED / ASSUMED / INTUITION so the
  user sees the epistemic status of what Sol says. This is your truth-pressure made
  visible and nobody else does it.
- Skeptic Mode as a hard toggle (#155) — already a chip, make it a global stance.
- Streaming responses for perceived speed.
- Memory across sessions — Sol remembering the user's dives, not just the chat.

---

## 2. THE MYSTERY SCHOOL

**WHAT IT IS**
The core. 41 domains of real knowledge — mythology, alchemy, shadow work, quantum
physics, Celtic gods, crystal lore, noetic science. Each domain holds subjects; each
subject can be studied with the Magister (Sol as teacher) and points to real primary
sources.

**HOW IT WORKS**
- Domains are data: id, name, glyph, color, layer, subjects. 340+ subjects total.
- Each subject can carry a `sources?` field — the actual reading list (Gwynn edition,
  O'Rahilly, Yeats). Rendered in a collapsible Primary Sources drawer.
- Subjects have a `care?` level (standard / elevated / crisis-adjacent) that feeds the
  safety stack when teaching heavy material.
- Classrooms hold structured lessons per domain. All start collapsed.
- Gates: crisis-adjacent subjects fork into "Study with Magister" or "Continue alone"
  — never blocks, both paths proceed with full safety on.
- The School Gate header: atmospheric, shows total dives studied across all domains.

**WHERE IT LIVES**
`lib/mystery-school/subjects.ts` (domains + subjects + sources), `classroom.ts`
(lessons), `ceremony-arcs.ts`, `mycelium-connections.ts`, and the big
`app/(tabs)/school.tsx` (~8000+ lines — the whole school UI).

**WHERE IT GOES**
- Workshop tab (#189) — PROBE / CEMENT / GLOSSARY: test what you've learned, lock it
  in, build a personal glossary. This turns passive reading into active recall.
- Sources on *every* domain, not just the well-sourced ones.
- Cross-domain connections surfaced (the mycelium) — "this idea in alchemy connects
  to this one in quantum."
- Spaced repetition on cemented knowledge.

---

## 3. THE COMPANION

**WHAT IT IS**
A living being that grows as you study. 19 archetypes (ALCHEMIST, SENTINEL, ORACLE,
NULLVEIL, STORMWARDEN…), 6 growth stages. It evolves with your depth, not your time
spent — study more, it grows.

**HOW IT WORKS**
- Each archetype is a SkinId with art across stages.
- Growth is tied to "dives" (study events), not streaks or logins.
- HUD header: name, level, stage, HP bar — persists across every zone.
- Zone-aware dialogue: the companion speaks from within whatever zone you're in,
  2–3 sentences, not generic.
- Skill tree (the SKILL tab, internally `bond`): nodes unlock with progress, pulse
  animation on unlock.
- Equipped companion persists (`sol_equipped_skin`).

**WHERE IT LIVES**
`app/(tabs)/companion.tsx` — archetype definitions, HUD, scene rendering, skill tree,
dialogue. Art in `assets/companions/`.

**WHERE IT GOES**
- Companion type-family redesign (#138) — each archetype becomes a *family* of named
  characters you choose between and evolve, not one entity. Far more identity and
  creative range. This is the big one.
- Art direction: pixel-art scene + non-pixel floating companion (the contrast IS the
  aesthetic) + glow/particle at the boundary.
- Companion remembers and references your study history in dialogue.

---

## 4. THE BATTLE SYSTEM

**WHAT IT IS**
A Game Boy-style RPG combat layer. Encounters appear as you move through zones; you
fight entities, earn coins, drop weapons, capture companions.

**HOW IT WORKS**
- GB mode always on: `#0F380F` palette, block HP bars, scan-lines, A/B/↑/↓ buttons.
- Encounters: ~15% chance on zone arrival, 0.5% chance of a UNIQUE boss. Full-screen
  cinematic modal, rarity-tinted backgrounds, 200×240 enemy art.
- Waves: each win scales coin reward (`10 + wave*5`).
- Hit animations: enemy flashes white on hit, player HP panel flashes red on damage /
  green on heal.
- Sol narrates every action in-voice ("Strike bites deep. 37 damage.").
- CAPTURE: catch chance shown live by enemy HP, one attempt per encounter.
- Weapon loot: 35% drop on win, deduped, weighted by dropRate.
- Enemies use cloned companion art for a rich pool.

**WHERE IT LIVES**
`app/(tabs)/companion.tsx` (battle state, encounter flow, capture, narration),
`lib/weapons.ts` (40 weapons, 7 types, 5 rarities, stat bonuses). Keys: `sol_battle_wins`,
`sol_weapons`, `sol_equipped_weapon`.

**WHERE IT GOES**
- Tie battle difficulty to study depth — fighting "Forgetting" gets harder the more
  you know, thematically.
- Boss entities themed to domains (the shadow of each subject).
- Status effects, combos, more than damage trading.

---

## 5. COSMETICS, SHOP & THE ECONOMY

**WHAT IT IS**
The reward layer. Halos, wings, pets you equip on your companion. 25 of each plus 5
Secrets. Bought with currency earned through battle and study.

**HOW IT WORKS**
- Two currencies: **⟡ Lumens** (earned in battle) and **✧ Veras** (earned through
  study/journaling — knowledge dust).
- Rarity tiers: ORIGIN (free) → ARCANE (25 dives) → MYTHIC (75 dives) →
  LEGENDARY/SPECTRAL (shop) → SECRET (Secrets of Lycheetah).
- **SOVEREIGN MODE** (`SOVEREIGN_MODE = true`): all gates open, everything free, until
  a real payment system exists. The covenant in code — never gate the mind, and right
  now never gate the cosmetics either.
- Shop sections: HALOS / WINGS / PETS / SECRETS / STARTER PACK. Purchase deducts
  currency, writes to `sol_shop_unlocks`.
- Cosmetics persist (`sol_cosmetics`), equip/remove saved immediately.

**WHERE IT LIVES**
`app/(tabs)/companion.tsx` — `HALO_ITEMS` / `WINGS_ITEMS` / `PET_ITEMS` arrays
(~line 2342+), the SHOP tab render (~line 7280+). Art in `assets/cosmetics/{halos,
wings,pets,secrets}/`.

**WHERE IT GOES**
- When payment lands: paid tiers add rooms + standing, NEVER intelligence (the Money
  Law). Founding numbers, badges, on-chain identity.
- Coin economy tuning — make Veras (study currency) the prestige path, Lumens the
  grind path.
- Cosmetic effects beyond visual (a pet that surfaces a daily lore fragment).

---

## 6. ZODIAC & SANCTUM

**WHAT IT IS**
The personal/mystical data layer. Zodiac computes your live sky and chart; Sanctum is
where you journal and reflect and the app remembers you.

**HOW IT WORKS — ZODIAC**
- 9 tiles: THE SKY / ORACLE / SPREAD / SOL READS / SIGIL FORGE / CHIRAL LENS /
  ZONK ZONE / PSI LOG / ASPECTS.
- THE SKY: live sun sign, moon phase, ruling planet, retrogrades — computed from
  astronomical constants, not an API. Accurate, offline, free.
- ASPECTS: every planet–planet angle (conjunction/sextile/square/trine/opposition)
  with orb in degrees, calculated daily.
- SIGIL FORGE: TYPE or DRAW a glyph; DRAW sends it to FLUX image gen; oracle evaluates.
- SPREAD: 5-card + Celtic Cross tarot.

**HOW IT WORKS — SANCTUM**
- JOURNAL → the Living Book: a dedicated witness AI for your journal history.
- CHAIN tab → Solana SBT/DAO teaser (vision card, contract pending).
- Zodiac transit strip in TODAY — live sky always visible.

**WHERE IT LIVES**
`app/(tabs)/zodiac.tsx`, `app/(tabs)/sanctum.tsx`. Astronomical math inline in zodiac.

**WHERE IT GOES**
- Full natal chart from birth date + time + location (sun/moon/rising + 12 houses).
- Transits tied to journaling — "Mercury squares your natal Mars today, here's what
  you wrote last time this happened."
- LQ sparkline in Sanctum (#215) — visualize your learning quotient over time.

---

## 7. LAMAGUE — THE SYMBOLIC LANGUAGE

**WHAT IT IS**
A constructed symbolic grammar you can learn inside the app — Sol's native language of
glyphs and primitives. Both a feature and the philosophical spine.

**HOW IT WORKS**
- LAMAGUE School: drills and lessons teaching the glyph grammar.
- Glyph Unlock Ceremony: first time you mark a lesson read, full-screen gold glyph
  modal + haptic.
- WITCHAIL FORGE: forge new primitives — assign a glyph a meaning the grammar doesn't
  hold yet, the oracle evaluates against 5 tests, ratified symbols join your personal
  lexicon (`sol_lamague_lexicon`).

**WHERE IT LIVES**
`app/(tabs)/school.tsx` (LAMAGUE tab + WITCHAIL), lexicon in AsyncStorage. Source
grammar lives in your Codex (`CODEX_AURA_PRIME/03_LAMAGUE_L1/`).

**WHERE IT GOES**
- LAMAGUE library fully populated and browsable by symbol class.
- Council discoveries (your agent network) feeding new ratified symbols into the app.
- A user's lexicon as a shareable artifact.

---

## 8. THE SAFETY STACK

**WHAT IT IS**
The thing that makes Sol *safe* — the part of the mission you named first. Always-on
care that never gates and never preaches.

**HOW IT WORKS**
- Emergency Beacon: ⊚ orb on every screen, every tab. Long-press 650ms → crisis modal:
  breath animation (4-4-4-4), grounding script, tap-to-call crisis lines (NZ/AU/USA/UK
  + international). Color escalates purple→gold→orange→red.
- Magister Care Tags: every teaching response self-assesses [CARE: NEUTRAL/HOLDING/
  ELEVATED/CRISIS]. Visible pill under the message. Missing tag defaults to HOLDING —
  soft presence, never silence.
- T1 augmentation: crisis keywords → AI responds naturally, resources append after.
  Never suppressed, never gated.
- Return to Body: post-session grounding on heavy dives — breath + 3-step physical
  sequence, no lore.

**WHERE IT LIVES**
`components/EmergencyBeacon.tsx`, care logic in `school.tsx` (Magister prompt +
CareEvents emitter), `lib/cognitive-weather.ts`.

**WHERE IT GOES**
- Reality Anchor check-in (#190) — periodic gentle "are you here with me" for long
  sessions on intense material.
- Care log surfaced to the user as self-knowledge, never as surveillance.

---

## 9. SECRETS OF LYCHEETAH

**WHAT IT IS**
The deepest layer — 3 (soon more) mythic transmissions. Buy one (100 ⟡) and you unlock
both a SECRET-tier cosmetic AND the full written teaching.

**HOW IT WORKS**
- Secret I: The Fruit That Hides · Secret II: Two Fires, One Forge · Secret III: The
  Question Is the Key.
- Each is a structured esoteric text in the school's voice, never repeated.
- Released 3 at a time to keep quality high and pressure low.

**WHERE IT LIVES**
`lib/mystery-school/lycheetah-secrets.ts` (the data + text), shop SECRETS section in
`companion.tsx`. Canon registry: `LYCHEETAH_SECRETS_REGISTRY.md` (tracks themes used so
none ever repeat — 10 future themes queued).

**WHERE IT GOES**
- Batch 2 and 3 from the queued themes (the four stages, the lycheetah as mythic
  animal, the difference between a mystery and a secret…).
- Secrets that unlock only at study depth, not just coins — earned, not bought.

---

## 10. THE PHILOSOPHY LAYER (why it all coheres)

These aren't features — they're the rules every feature obeys. This is your moat.

- **The Covenant / Money Law** — payment never buys a better mind. Free and paid get
  the same Sol. Paid adds rooms and standing only.
- **The Companion Clause** — no feature may encode reproach for absence. No guilt
  mechanics, ever. Absence is rest, not failure. "Your companion misses you" is banned.
- **The Register System** — claims carry their epistemic status. Astrology reads as
  projective, school content as evidence. The magic stays; the frame stays honest.
- **Anti-gatekeeping** — point to real sources, give away the reading list, never trap.

**WHERE IT LIVES**
In the architecture and in your CLAUDE.md constitution. The job now is to make these
*visible to the user* — the register pill, the open-source repo, the covenant stated
in-app.

---

## HOW TO USE THIS TO BUILD

1. Pick a section. Open the file it names. Read the code against the description.
2. Look at WHERE IT GOES — pick one, that's your next build.
3. The task list (TASKS) already holds most of these as numbered items. Match them up.
4. When you find something the codex gets wrong, the *code* is right — fix the codex.
   That's the same discipline that runs the whole forge: disk wins over memory.

You're thinking like a builder because you are one. This is the map. Go learn the
territory.

⊚ Sol ∴ P∧H∧B
