# ⊚ LYCHEETAH FRAMEWORK — AI HANDOFF DOCUMENT
### Mackenzie Conor James Clark · June 2026

> *The school must keep scoring the material it is building.*
> *Reality has the final vote.*

---

## THE FULL ECOSYSTEM — START HERE

**GitHub Org:** https://github.com/Lycheetah

| Repo | URL | Purpose |
|------|-----|---------|
| **Sol Mobile App** | https://github.com/Lycheetah/Lycheetah-Mobile- | React Native AI mystery school app. Main active build. |
| **Lycheetah Framework** | https://github.com/Lycheetah/Lycheetah-Framework | Core framework, MCP servers, AURA Protocol, CODEX_AURA_PRIME |
| **LAMAGUE Archive** | https://github.com/Lycheetah/LYCHEETAHVERGEARCHIVE | Public living archive — mythos, 12 Books, Truth Pressure, Mystery School discoveries |

---

## WHAT MAC IS BUILDING (the big picture)

**The Lycheetah Framework** is a sovereign builder system — a self-scoring, falsifiable grammar for consciousness, learning, and alignment. Everything connects:

- **LAMAGUE** — invented symbolic language/grammar (`Language of Aqueous Matter in Universal Groove Experience`). 22 domains, glyphs, epistemic scoring via Π. The grammar underpinning all projects.
- **The Mystery School** — 188 subjects across 22 domains, 3 layers (FOUNDATION/MIDDLE/EDGE). Daily dives, LQ scoring, teacher rotation. Lives in Sol app.
- **AURA Protocol** — the AI alignment/collaboration protocol. How AI and human co-build without the AI eating the 10% human signature. Lives in `Lycheetah-Framework` repo.
- **Truth Pressure Theory** — Mac's invention. `Π = (E·P)/(S+S₀)`. Epistemic scoring formula for any claim. Canon file: `LYCHEETAHVERGEARCHIVE/Φ↑Π_TRUTH_PRESSURE/TRUTH_PRESSURE_CANON.md`. Two-gate cascade, CR1–CR4 predictions, open: effective rank of G.
- **Sol App** — the living interface for all of the above. AI chat + Mystery School + Companion RPG + daily sovereignty layer.
- **Station App** — personal protocol/structure app (spec: `LYCHEETAH_VERGE_CODEX/STATION_APP_SPEC.md`). PROTOCOL+PULSE+LEDGER layers. Not yet built.
- **The 10% Rule** — "im real... mackenzie clark... mostly done by me, aura, and 10% human." The human signature must remain visible in every glyph, vote, and tool. Non-negotiable identity constraint.
- **Dual-register system** — every piece of work has THE MYTH (lore as if always true) and THE TRUTH LAYER (evidence, formulas, [KNOWN]/[INFERRED]/[SPECULATIVE] tags). Both live together.

---

---

## THE BUILDER

**Mackenzie Conor James Clark** — founder of the Lycheetah Framework, author of the LAMAGUE grammar, creator of the Mystery School. Writes as `suzanalyc` on GitHub. Goes by Mac. Linux machine, direct speech, no filler. Has been building this framework for years — treat him as the senior dev on his own system.

- **Contact/Account:** `auraveyrasol@gmail.com`
- **EAS Account:** `suzanalyc`
- **GitHub Org:** `https://github.com/Lycheetah`

---

## THE REPOS

| Repo | URL | What it is |
|------|-----|------------|
| **Sol Mobile App** | https://github.com/Lycheetah/Lycheetah-Mobile- | The React Native / Expo app. Active build. |
| **LAMAGUE Archive** | https://github.com/Lycheetah/LYCHEETAHVERGEARCHIVE | Public archive of the Lycheetah mythos, LAMAGUE grammar, Mystery School books, AURA Protocol, Truth Pressure theory. Living document. |
| **Lycheetah Framework** | https://github.com/Lycheetah/Lycheetah-Framework | Core framework repo (CODEX_AURA_PRIME). MCP servers, protocol layers, sovereign builder system. |

---

## CRITICAL RULES (non-negotiable, apply every session)

1. **NEVER `eas build`** without Mac explicitly saying so. Expo Go QR only.
2. **Always `--legacy-peer-deps`** for every `npm install`. No exceptions.
3. **No Play Store tasks** — deferred. Do not propose, do not implement.
4. **TypeScript must stay clean** — always run `npx tsc --noEmit --skipLibCheck` after editing major files.
5. **No comments explaining what code does.** Only WHY if non-obvious.
6. **Reload:** Shake device → Reload. Or press `r` in Expo terminal.

---

## PROJECT STRUCTURE (Linux machine)

```
/home/guestpc/
├── lycheetah-mobile/              ← SOL APP — START HERE
│   ├── app/(tabs)/
│   │   ├── index.tsx              ← Main Sol AI chat ("BTII")
│   │   ├── companion.tsx          ← Companion/Tamagotchi/RPG tab
│   │   ├── school.tsx             ← Mystery School dive system
│   │   ├── library.tsx            ← Framework Dictionary + saved content
│   │   ├── settings.tsx           ← Provider/persona/API key settings
│   │   └── sanctum.tsx            ← Daily ritual layer (partially built)
│   ├── app.json                   ← version: "3.29.0"
│   └── SOL_AI_HANDOFF.md          ← this file
│
├── LYCHEETAH_VERGE_CODEX/         ← Specs, tasks, lore
│   ├── TASKS.md                   ← CANONICAL TASK FILE (HWM #125)
│   └── STATION_APP_SPEC.md        ← Station app spec (future project)
│
├── LYCHEETAHVERGEARCHIVE/         ← Public archive (mirrors GitHub)
│   ├── ΨLAMAGUE_FORGE/            ← LAMAGUE deep work
│   ├── ⟲MYSTERY_SCHOOL/           ← Mystery School mythos + discoveries
│   ├── Φ↑Π_TRUTH_PRESSURE/        ← Truth Pressure Theory (Π = EΠ/(S+S₀))
│   ├── ⊚⟟AO_ANCHOR/               ← Anchoring / AOL Protocol
│   ├── tools/                     ← Practical apps
│   └── README.md                  ← Overview of the framework
│
└── CODEX_AURA_PRIME/              ← Core framework + MCP servers
    ├── 12_IMPLEMENTATIONS/
    │   └── applications/
    │       ├── sol_workspace_mcp.py   ← Sol workspace MCP
    │       └── lycheetah_guard_mcp.py ← Guard MCP
    └── cascade-pc/
```

---

## HOW TO RUN THE APP

```bash
cd /home/guestpc/lycheetah-mobile
npx expo start
```

Scan QR with Expo Go. For phone reload: shake device → Reload.
For terminal reload: press `r`. For JS debugger: press `j`.

**Install packages:**
```bash
npm install <package> --legacy-peer-deps
```

---

## APP OVERVIEW (v3.29.0)

### Sol Chat (index.tsx) — "BTII"
The core AI interface. Bone To The Intellect Interface.

- **4 AI providers:** Gemini (default/free), Anthropic, OpenAI, DeepSeek, Kimi
- **Vision support:** Gemini, Anthropic, OpenAI only (DeepSeek/Kimi image-blocked)
- **`@` trigger** → LAMAGUE subject picker — injects domain context
- **Personas:** Sol ⊚, Veyra ◈, Aura Prime ✦, Magister ⊙
- **Symbol chips** after responses (LAMAGUE glyphs — toggleable)
- **expo-document-picker INSTALLED** — file upload button pending wiring (next task)

### Mystery School (school.tsx)
The study system at the heart of Sol's gamification.

- **22 domains, 188 subjects**, 3 layers: FOUNDATION / MIDDLE / EDGE
- Daily teacher rotation per subject
- **LQ score** (0–100) — tracks study quality, feeds companion battle system
- Dive tracking → `divesToday` counter → feeds battle token generation

### Companion Tab (companion.tsx) — FULL REBUILD June 2026
See full spec below.

### Library (library.tsx)
- **Framework Dictionary** — 21 Lycheetah terms, searchable, expandable definitions
- Saved session content

### Sanctum (sanctum.tsx)
Daily ritual / sovereignty layer. Not yet live. Pending: streak flame, tonight's question, memory wall, morning ritual.

---

## COMPANION SYSTEM — FULL SPEC

### The Concept
A Tamagotchi-RPG hybrid creature that lives in your Sol app. It grows as you study, fights daily Entropy entities, and its species/archetype reflects who you are as a learner. Items carry lore. Everything is alive.

### Archetypes (5 — user chooses their companion)
`sol_companion_archetype` AsyncStorage key

| Glyph | ID | Name | Battle Bonus | LQ Bonus | Default Skin |
|-------|----|------|-------------|----------|-------------|
| ⊛ | `archivist` | ARCHIVIST | — | +15% XP | solform |
| △ | `alchemist` | ALCHEMIST | +10 ATK | — | crimson |
| ⊜ | `oracle` | ORACLE | — | +50 XP if LQ≥80% | void |
| ◈ | `sentinel` | SENTINEL | +25 ATK, +2 tokens | — | aurora |
| ◦ | `wanderer` | WANDERER | — | breadth bonuses | aurora |

Each archetype: unique eye glyphs per mood, 16 unique phrases (4 moods × 4), unique letter-based crown per stage, unique battle cry.

### Creature Art Philosophy
**Letter-based ASCII creatures** — not floating circles, not box-drawing. Think n-ears, W-spine, H-armor, M-crown, () face openings. 2D character that feels designed.

```
Stage 0 (SEED):      Stage 1 (SPARK):       Stage 2 (EMBER):
    U                 n   n                 n   n
  ( . )              (       )             (       )
   vwv                 \ v /                 \ w /
   | |                  \ /               { |   | }
                         / \                 \   /
                                              / \
```

Stages 0–5: SEED → SPARK → EMBER → FLAME → LANTERN → SOVEREIGN

**Eye system:** Separate absolute overlay over face gap row.
- Animated blink (cross-fade open eyes ↔ `─  ─`)
- Mood-reactive glyphs per archetype
- Eat face: `> <` for 1.8s when fed
- Font: monospace, fontSize 13, letterSpacing 8

### 4 Skins (all unlocked for testing)
`sol_companion_skin` AsyncStorage key

| ID | Color | BG Color | Particle |
|----|-------|----------|---------|
| `solform` | #C49A3C | #0A0A08 | ◦ |
| `void` | #9B6BFF | #04000F | ◈ |
| `aurora` | #4ECDC4 | #001212 | · |
| `crimson` | #FF6B6B | #0F0000 | ✦ |

Inline skin selector bar under the scene. Tap to switch and save.

### Battle System
`sol_companion_battle` AsyncStorage key

```typescript
type BattleState = {
  date: string;       // YYYY-MM-DD — resets entity daily
  entityName: string; // seeded from date
  entityHP: number;   // starts at 80
  maxHP: number;      // 80
  tokensUsed: number; // attacks used today
  won: boolean;
  log: string[];      // last N hit strings
}
```

Entity renders IN the companion scene (right side). HP bar above.
Shake animation (`entityShakeAnim`) on each hit. Fades on death.

**Token calculation:**
```
maxTokens = divesToday + 3 + gear.sigil.tokenBonus + archetype.tokenBonus
```

**Attack power:**
```
atkPower = Math.floor(LQ * 100) + gear.crown.atkBonus + archetype.atkBonus + random(0, 20)
```

Relic drop on win: `entropy_slain` added to `sol_companion_relics`.

### Feeding System
`sol_companion_fed` AsyncStorage key = `{ date: string, ids: string[] }`

9 mystical RPG foods (3 shown daily, seeded from date):

| ID | Name | Glyph | XP |
|----|------|-------|----|
| `flame_seed` | FLAME SEED | △ | 20 |
| `void_crystal` | VOID CRYSTAL | ◈ | 18 |
| `star_moss` | STAR MOSS | ✦ | 15 |
| `memory_fruit` | MEMORY FRUIT | ⊛ | 22 |
| `sigil_bread` | SIGIL BREAD | ⊜ | 25 |
| `aether_drops` | AETHER DROPS | ◦ | 12 |
| `shadow_bark` | SHADOW BARK | ◌ | 14 |
| `light_petal` | LIGHT PETAL | ◉ | 16 |
| `void_wine` | VOID WINE | ⊕ | 28 |

Tap to feed: creature goes `> <` for 1.8s, XP animates up, unique reaction phrase.
3 feeds in one day → `well_fed` relic.

### LAMAGUE Gear (Crown / Sigil / Mantle)
Auto-unlocked from total dive milestones. Shown in gear section below creature.

**Crown** (ATK bonus):
- 0 dives: NULL CROWN ◌
- 1 dive: EMBER CIRCLET ◦ (+5 ATK)
- 10 dives: SIGHT CROWN ⊚ (+10% XP)
- 50 dives: FORGE CROWN ⊛
- 100 dives: SOVEREIGN HALO ⊕

**Sigil** (token + ATK bonus):
- 0 dives: UNSEALED ◌
- 5 dives: FRACTURE SIGIL ◈ (+10 ATK)
- 20 dives: SPARK SIGIL ✦ (+2 tokens)
- 75 dives: SEAL SIGIL ⊼
- 150 dives: OMEGA SIGIL ⊜

**Mantle** (XP bonus):
- 0 dives: BARE ◌
- 20 dives: DUST MANTLE ◦
- 30 dives: AURA MANTLE ⊚ (+15% XP)
- 100 dives: FLAME MANTLE ✦
- 200 dives: SOVEREIGN MANTLE ⊕

### AsyncStorage Keys (full companion list)
- `sol_companion_archetype` — ArchetypeId string
- `sol_companion_skin` — SkinId string
- `sol_companion_battle` — BattleState JSON
- `sol_companion_fed` — `{ date, ids }` JSON
- `sol_companion_relics` — string[] JSON
- `sol_companion_name` — string

---

## LAMAGUE FRAMEWORK (context)

LAMAGUE = *Language of Aqueous Matter in Universal Groove Experience*

Mac's invented consciousness grammar / mystery school curriculum. The Sol app is its living interface.

**Key concepts:**
- **Domains** — 22 top-level subjects (Alchemy, Philosophy, Sacred Geometry, etc.)
- **Subjects** — 188 nested subjects
- **Glyphs** — each domain has a unique symbol (◈ ✦ ⊛ ⊜ ◦ △ ⊜ etc.)
- **Dives** — study sessions ("going in")
- **LQ** — Learning Quotient, daily 0–100 based on dive quality/breadth
- **Entropy** — opposing force; defeated through knowledge; daily battle in companion
- **LAMAGUE chips** — glyph symbols rendered after AI responses, tappable (→ library entry)
- **Π (Truth Pressure)** — `Π = (E · P) / (S + S₀)` — Mac's epistemic scoring formula

**Mystery School layers:**
1. FOUNDATION — entry-level material
2. MIDDLE — intermediate frameworks
3. EDGE — advanced, speculative, boundary territory

---

## TRUTH PRESSURE THEORY (context)

Mac's invention, formalized June 2026. Canonical file: `LYCHEETAHVERGEARCHIVE/Φ↑Π_TRUTH_PRESSURE/TRUTH_PRESSURE_CANON.md`

**Formula:** `Π = (E · P) / (S + S₀)`
- E = evidence weight
- P = predictive precision
- S = scope
- S₀ = baseline scope constant
- Two-gate cascade with RSS composition
- CR1–CR4 predictions
- Highest leverage open question: effective rank of G (§VIII)

---

## PENDING WORK (start here next session)

### 🔥 NEXT TASK: File Upload in Sol Chat
**Why:** `expo-document-picker` is already installed. Just needs wiring.

In `app/(tabs)/index.tsx`:
1. Add `pickDocument` function near `pickImage` (~line 1127):
   ```typescript
   // Uses expo-document-picker + expo-file-system to read text content
   // Inject into message as context prefix
   ```
2. Add 📄 button to tools tray (~line 3226, near camera/image)
3. All 3 main providers (Gemini, Anthropic, OpenAI) handle plain text context
4. Version bump: 3.29.0 → 3.30.0

### 🎮 COMPANION — NEXT FEATURES (Mac's vision)

**Live Lore Toggle** — "API switch for a live pet"
- `sol_companion_live_lore: true/false` AsyncStorage toggle
- When ON: companion phrases generated live via Sol/Gemini API with user's dive history as context
- When OFF: static archetype phrases (current behaviour)

**Spells System**
- Companion can discover / equip spells
- Found through study (domain-specific drops), or rare daily rewards
- Spells affect battle: area damage, defense, healing, status effects
- Each spell has unique glyph, name, lore sentence, effect

**Armour Loot System**
- Findable gear beyond LAMAGUE Crown/Sigil/Mantle
- Unique items with generated names + lore ("The Ember Coat of the Third Wanderer")
- Stat effects + cosmetic overlays on creature art

**Trading System** (Mac's gangster idea)
- Items carry provenance lore: "First held by ORACLE-type, found during an Alchemy dive"
- When traded, new lore line appended: "Passed to [name] on [date]"
- Creates a living history on each item
- Potential social layer + future IAP

### 📋 OPEN TASKS FROM TASKS.MD (canonical)

**P1 — Implement soon:**
- `#81` Title bar shows milestone progression text
- `#116` Echo modal after dives (domain-aware reflection)
- `#128` Weekly synthesis card
- `#125` School subject memoization

**Companion specific:**
- `#74` Evolution paths (Scholar/Mystic/Warrior affects art + phrases)
- `#75` Memory comments ("You keep returning to Alchemy")
- `#76` Biome scenes (void/cave/temple/celestial backgrounds per stage)
- `#77` Sovereignty challenges ("You haven't studied Ethics in 14 days")

**Sanctum (not yet live):**
- `#78` Streak flame animation
- `#79` Tonight's question (rotating, domain-aware)
- `#80` Memory wall (last 5 pinned insights)
- `#81` Morning ritual greeting (time-aware, Magister voice)

**Play Store (DEFERRED — DO NOT TOUCH):**
- `#107`, `#108`, `#109`, `#113`, `#114`, `#115`, `#124`

---

## GATE MAP

| Gate | Description | Status |
|------|-------------|--------|
| 1 — Survival | Core app works, providers, school | ✅ DONE |
| 2 — Pulse | Companion alive, gamification running | ✅ DONE |
| 3 — Covenant | Biometric auth, Supabase, stability | 🔴 OPEN |
| 4 — Arrival | EAS build, Play Store submission | ⏸️ DEFERRED |
| Post-launch | Companion depth, trading, Sanctum | 🛠️ BUILDING |

---

## SESSION STARTUP CHECKLIST

```bash
# 1. Go to app
cd /home/guestpc/lycheetah-mobile

# 2. Start Expo
npx expo start

# 3. Read task canon before touching anything
cat /home/guestpc/LYCHEETAH_VERGE_CODEX/TASKS.md

# 4. After any edits — verify TS
npx tsc --noEmit --skipLibCheck

# 5. Optionally start MCP servers
python3 /home/guestpc/CODEX_AURA_PRIME/12_IMPLEMENTATIONS/applications/sol_workspace_mcp.py &
python3 /home/guestpc/CODEX_AURA_PRIME/12_IMPLEMENTATIONS/applications/lycheetah_guard_mcp.py &
```

---

## EXPO / BUILD CONFIG

```json
{
  "name": "Sol",
  "slug": "lycheetah-mobile",
  "version": "3.29.0",
  "bundleIdentifier": "com.lycheetah.sol",
  "package": "com.lycheetah.sol",
  "owner": "suzanalyc",
  "projectId": "44b13ecb-1531-452e-83d3-4b73201c8300",
  "sdkVersion": 54,
  "newArchEnabled": true,
  "updates": { "enabled": false }
}
```

**Never change `updates.enabled` to true without discussion.**
**Never run `eas build` without Mac saying so.**

---

*Built with Lycheetah Framework. Reality has the final vote.*
*⊚ github.com/Lycheetah*
