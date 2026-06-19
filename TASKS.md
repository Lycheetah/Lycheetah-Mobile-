# SOL APP — LIVE TASK LIST
## v4.8.0 · June 19 2026 · HWM #150

---

## 🔥 ACTIVE NEXT (priority order)

### #131 MENAGERIE view
Display captured entities. Tap entry → name, date, zone, art. `sol_menagerie` key exists, no UI yet. Add as sub-section in COMPANION tab under BATTLE.

### #132 Lore compounding — unified codex
`sol_lore_codex` stores entries per zone but no single unified view. One scrollable codex across all zones in COMPANION tab.

### #133 Cosmetics placeholders
Wire grey silhouette PNGs so cosmetics system is visually testable. Prompts in `GROK_SPRITE_PROMPTS.md`. Folders: `assets/cosmetics/{pets,wings,halos}/`.

### #134 UI accessibility pass
- Tighten hero card, remove dead space between sections
- Best-feature shortcut buttons on main scene (BATTLE / FEED / TALK already in HUD — verify all live)
- Companion tab: section headers consistent weight/colour

### #135 Workshop tab — probe / cement / glossary
Session 11 deliverable. LAMAGUE practice mode inside the companion tab.

---

## 📋 QUEUED (ordered)

### #136 MENAGERIE party mode
Captured entities as a roster — choose one for bonus buffs in battle. Influence ratings per entity.

### #138 Companion type-family redesign
Each archetype TYPE becomes a family of distinct named characters. User picks one within the family. Unique art, name, evolution path per character. Core design rethink — big build.

### #140 Battle encounter cinematic mode
Zone-roaming enemies → encounter enters cinematic mode (Pokémon-style). Enemy art prominent, enter-line displayed large.

### #141 Zodiac tab — natal chart foundation
Birthdate + time + location → sun/moon/rising. Astronomical computation. Sanctum integration. Transits tied to journaling.

### #142 LAMAGUE Symbol Forge
Ritualistic symbol creation tool. Council discoveries → app.

### #143 EAS build — Android preview APK
`eas build --platform android --profile preview` — Mac fires, Sol never triggers.

---

## ⏸ HELD (resume when space opens)

- NVIDIA Cloudflare Worker proxy (#68) — before public build
- NVIDIA image generation (#70)
- Silicon Path onboarding (#87)
- Companion Invoke protocol (#88)
- Technopagan lesson cards (#89)
- Battle HUD cinematic overhaul (#93/#96/#107)
- Tarot deck selector (#100)
- Zodiac advanced modes (#110–115)
- Rarity tab system (#109)

---

## ✅ SHIPPED THIS ERA (v4.6 → v4.8)

| # | Feature |
|---|---|
| #92 | Companion art wired — 18 named zones |
| #94 | Companion collected grid — scrollable zone collector |
| #97 | 45-zone progress collector (SPECTRAL frontier) |
| #99 | Tarot cards clickable — lore modal per card |
| #102 | Fix Mycelium network nodes |
| #104 | Companion scene arrow navigation fixed |
| #105 | Companion scene height increased |
| #108 | 40 relics — 8 categories × 5 triggers wired |
| #120 | Companion equip system — tap → EQUIP ✦ → appears on scene |
| #121 | HP shimmer animation on player damage |
| #122 | Cosmetics persistence (sol_cosmetics) |
| #123 | Companion grid reorg — ORIGIN tier, hidden exclusions |
| #124 | Arrow navigation simplified — up/down cycles zones |
| #125 | Inventory collapse — all sub-tabs collapsible |
| #126 | CAPTURE button — handleCapture, sol_menagerie storage |
| #127 | Companion image fix — scene shows zone companion |
| #128 | HUD header in CompanionScene — name/LVL/HP/quick actions |
| #129 | devStagePin UI + XP strip removed |
| #130 | equippedCompanionSkin persisted to sol_equipped_skin |
| #144 | Companion filter pills — ALL/ORIGIN/ARCANE/MYTHIC/LEGENDARY/SPECTRAL |
| #145 | Floating ? help button — all tabs, 8-section help sheet |
| #146 | ⚔ floating battle button — Sol tab → companion tab |
| #147 | Unified encounter system — companions appear as entities in home zones |
| #148 | Battle panel minimize + AUTO mode (2.5s auto-attack) |
| #149 | Onboarding rehaul — cinematic landing, Solara art, 6-step flow |
| #150 | All companion tab sections start collapsed |

---

## KEY STATE

| Thing | Value |
|---|---|
| Version | 4.8.0 |
| Git branch | master |
| Last push | 9f7291d (v4.8.0) + 7f527ea (collapse) |
| Run command | `npx expo start -c` |
| Companion art | 102 PNGs in `assets/companions/` |
| Enemy art | 52 PNGs in `assets/enemies/` |
| Zones | 45 total (4 ORIGIN · 6 ARCANE · 9 MYTHIC · 12 LEGENDARY · 6 SPECTRAL hidden · 27 FRONTIER SPECTRAL) |
| Archetypes | 10 (archivist/alchemist/oracle/sentinel/wanderer/lycheetah/cipher/herald/weaver/revenant) |
| AsyncStorage keys | sol_equipped_skin · sol_cosmetics · sol_battle_wins · sol_menagerie · sol_companion_relics + others |
| EAS | account: solveyra · project: 55350e14-5cdc-4a5f-8a0e-735bca572dd3 |
