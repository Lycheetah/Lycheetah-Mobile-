# THE UNCLE GAME
## Tap-tap idle RPG for Mac + Uncle (Dunedin)
## Build: one session, pure AI coding, Play Store when good

---

## CONCEPT

Tap-tap idle with dungeon layers, tower progression, and loot with stats.
Uncle loves both cookie-clicker exponential numbers AND Clicker Heroes dungeon layers.
He is critical — that's the QA loop. He plays, he destroys it, we fix it.

---

## CORE LOOP

```
TAP → gold
gold → hire units / buy towers
units → auto-clear dungeon floors
floors → drop loot (weapons, armour, relics — all with stats)
loot → equip → better stats → deeper floors
deeper floors → more gold / min → prestige
prestige → rebirth bonus → start again faster
```

---

## LAYERS / PROGRESSION

- **Dungeon floors** — infinite, get harder, enemy art per zone (Kimi makes this)
- **Towers** — passive income structures, upgradeable, pixel art
- **Heroes** — hireable fighters, each with class + stats, level up with gold
- **Loot system** — weapons / armour / relics, rarity tiers (common → legendary), stats (ATK / DEF / CRIT / GOLD%)
- **Prestige** — "descend deeper" rebirth, keeps relics or a % of upgrades

---

## TECH STACK

- Expo / React Native (same stack as Vael — zero new tooling)
- Kimi generates all pixel art: heroes, enemies, towers, loot icons
- AsyncStorage for save state
- Pure offline — no server needed for v1

---

## ART DIRECTION

- 16-bit pixel art, same style as companion sprites
- Dungeon zones: Forest → Cave → Underworld → Void → ??? (prestige zone)
- Enemy art per zone (5–6 enemies each)
- Hero classes: Warrior / Archer / Mage / Rogue (start with 4)
- Tower types: Ballista / Mana Spire / Gold Shrine / Trap Floor

---

## PLAY STORE

- Free, no paywalls on core loop
- Optional: cosmetic skins for heroes (Money Law applies — no power gates)
- Uncle gets early access build

---

## BUILD PLAN (one session)

1. Core tap → gold loop
2. Hero hire + auto-attack
3. Dungeon floor progression (infinite)
4. Basic loot drop + equip system
5. Prestige button
6. Kimi art pass (heroes + enemies + towers)
7. Play Store prep

---

## FEATURE RESEARCH

Before building: scrape top 3–5 tap-idle dungeon games on Play Store (Clicker Heroes, Tap Titans 2, Idle Dungeon, etc) — list their best features, steal the good ones, skip the dark patterns.

---

## UNIQUE FEATURES (ours, not theirs)

- **Paradox Tower** — a tower that works against you at first, then becomes your strongest asset once you understand it. Teaches the paradox inversion mechanic from CASCADE.
- **Mac + Uncle characters** — two named characters that exist in the same world. When you're both online (or have synced saves), your characters can interact — trade loot, co-attack a boss floor, leave messages on floors. Async multiplayer via a simple shared save file or cloud sync.
- **AI dungeon events** — rare floors generate a unique event via AI (enemy has a backstory, loot has a curse description, a merchant says something strange). Small but makes it feel alive.
- **Lore layer** — each dungeon zone has a one-paragraph story that unfolds as you clear floors. AI-written, Lycheetah Framework flavoured.

---

## WHY THIS MATTERS (beyond the game)

Getting out to show Uncle a build, jamming on what to fix over coffee — that's real. The game is the excuse for the time together. Build it right and it becomes a reason to leave the desk.

---

## STATUS: parked — build when Mac has a free half-day session
