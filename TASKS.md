# SOL APP — LIVE TASK LIST
## v4.7.0 · June 19 2026 · HWM #130

---

## ✅ DONE (this era)

- [x] #92 Wire companion art for all 18 named zones
- [x] #94 Companion collected grid — scrollable zone collector view
- [x] #97 45-zone progress collector (SPECTRAL frontier zones added)
- [x] #104 Fix companion scene left/right arrow navigation
- [x] #105 Increase companion scene height
- [x] #108 40 relics — 8 categories × 5 triggers each (all wired)
- [x] #120 Companion equip system — tap card → EQUIP ✦ → companion appears on scene
- [x] #121 HP shimmer animation on player damage
- [x] #122 Cosmetics persistence (`sol_cosmetics` AsyncStorage)
- [x] #123 Companion grid reorg — ORIGIN tier (auroral/pythia/ragna/augurum/lyca), noetic/kabbala/pulse_sanctum hidden
- [x] #124 Arrow navigation simplified — up/down cycles zones sequentially
- [x] #125 Inventory collapse — all companion sub-tabs collapsible
- [x] #126 CAPTURE button in battle — handleCapture, randomized dialogue, sol_menagerie storage
- [x] #127 Companion image fix — scene now shows zone companion not archetype default
- [x] #128 HUD header in CompanionScene — name + LVL/stage + HP bar + quick action buttons
- [x] #129 devStagePin UI + XP strip removed (info in HUD)
- [x] #130 equippedCompanionSkin persisted to sol_equipped_skin
- [x] 64 companion art files (jukebox-bg-removed set) wired to ZONE_COMPANION_IMAGES

---

## 🔥 ACTIVE NEXT (priority order)

### #131 MENAGERIE view
Display captured enemies. Tap captured enemy → name, date, zone. Show enemy art. In FIELD tab or new sub-section.

### #132 Lore compounding — unified codex across companion tab
All zone lore feeds into one growing codex in the companion tab. Currently `sol_lore_codex` stores entries but no unified display across all zones.

### #133 Cosmetics placeholders (wings / halos / pets)
Wire placeholder PNG art so the cosmetics system is visually testable. Prompts in `GROK_SPRITE_PROMPTS.md` — use grey silhouettes until Grok art lands. Folders: `assets/cosmetics/{pets,wings,halos}/`.

### #134 UI accessibility pass
- All zone backgrounds navigable easily (scene arrows + GBA map working)
- Best-feature shortcut buttons on screen (BATTLE / FEED / TALK already in HUD — extend)
- Companion tab: remove dead space, tighten hero card

### #135 Workshop tab — probe / cement / glossary
Session 11 deliverable. LAMAGUE practice mode inside the companion tab.

---

## 📋 QUEUED (ordered)

### #136 MENAGERIE party mode
Captured enemies as a roster — choose one for bonus buffs in battle. Influence ratings per entity.

### #137 Tarot cards clickable (#99)
Lore modal per card — tap any card in the spread to get full description.

### #138 Companion type-family redesign (#71)
Each archetype TYPE spawns multiple named characters. User picks one within the family. Each has unique art, name, evolution path. Core design rethink.

### #139 Fix Mycelium network (#102)
Nodes not rendering on screen. FIELD tab bug.

### #140 Battle encounter mode (#106)
Zone-roaming enemies — encounter enters cinematic mode like Pokémon. Enemy art prominent, enter-line displayed large.

### #141 Zodiac tab — natal chart foundation (#110–115)
Birthdate + time + location → sun/moon/rising. Astronomical computation. Sanctum integration. Transits tied to journaling.

### #142 LAMAGUE Symbol Forge (#72/#183)
Ritualistic symbol creation tool. Connects council discoveries → app.

### #143 EAS build — Android preview APK
`eas build --platform android --profile preview` — Mac fires, Sol never triggers.

---

## ⏸ HELD (resume when space opens)

- NVIDIA Cloudflare Worker proxy (#68) — before public build
- NVIDIA image generation (#70)
- Silicon Path onboarding (#87)
- Companion Invoke protocol (#88)
- Technopagan lesson cards (#89)
- Tarot deck selector (#100)
- Battle HUD cinematic overhaul (#93/#96/#107)
- Zodiac advanced modes (#111–115)
- Rarity tab system (#109)

---

## KEY STATE

| Thing | Value |
|---|---|
| Version | 4.7.0 |
| Git branch | master |
| Last push | 5bd87cc |
| Run command | `npx expo start -c` |
| Companion art | 102 PNGs in `assets/companions/` |
| Enemy art | 52 PNGs in `assets/enemies/` |
| Zones | 45 total (4 ORIGIN · 6 ARCANE · 9 MYTHIC · 12 LEGENDARY · 6 SPECTRAL hidden · 27 FRONTIER SPECTRAL) |
| Archetypes | 10 (archivist/alchemist/oracle/sentinel/wanderer/lycheetah/cipher/herald/weaver/revenant) |
| AsyncStorage keys | sol_equipped_skin · sol_cosmetics · sol_battle_wins · sol_menagerie · sol_companion_relics + others |
| Cosmetics art | `GROK_SPRITE_PROMPTS.md` — 25 prompts ready, art pending |
| EAS | account: solveyra · project: 55350e14-5cdc-4a5f-8a0e-735bca572dd3 |
