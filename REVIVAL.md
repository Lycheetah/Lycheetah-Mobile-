# REVIVAL.md — Cold Storage Bootstrap
## How to resurrect this project from zero

---

## If you find this repo and nothing works

This is the Vael app — a sovereign AI companion system built on Expo / React Native.
It runs on any machine with Node 18+ and the Expo CLI.

---

## Machine setup (Linux / Mac / Windows)

```bash
# 1. Node 18 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18 && nvm use 18

# 2. Expo CLI
npm install -g expo-cli eas-cli

# 3. Clone and install
cd 0sol-by-lycheetah
npm install

# 4. Start
npx expo start
```

Scan QR with Expo Go on phone. That's the test bench. No emulator needed.

---

## Environment

No `.env` required for local dev. API keys for AI personas live in the app's
settings screen (user-supplied at runtime). Nothing secret in the repo.

---

## Project structure

```
app/
  (tabs)/
    companion.tsx   — the creature, battle, feeding, gear, world map
    index.tsx       — main chat (Sol / Veyra / Aura / Magister / Nigredo)
    school.tsx      — Mystery School (dives, quests, progression)
    explore.tsx     — loot, journal, codex
  data/
    task1_companion_specs.ts   — 36 companion specs (Kimi Session 1)
    task2_gear_overlays.ts     — gear visual data
    task3_journal.ts           — journal entry generator
    task4_magister_context.ts  — Magister context injection
assets/
  scenes/           — 6 skins × 3 background scenes each
  sprites/          — 5 archetypes × 6 stages companion sprites
  enemies/          — enemy art PNGs
```

---

## Skin system

6 skins: `solform | void | aurora | crimson | obsidian | lycheetah`
Chaos skin: `chaos` (7th, violet/electric palette)
Each skin has 3 scene backgrounds and a world map region.

---

## Companion system

5 archetypes: `archivist | alchemist | oracle | sentinel | wanderer`
6 growth stages: SEED → SPARK → EMBER → LANTERN → CITRINITAS → SOVEREIGN
Stage advances ONLY through Mystery School dives. Never through battles.
Battles give loot (gear / items) but zero stage XP.

---

## World map

18 rooms: 6 regions × 3 depths (Entrance / Inner / Sanctum)
Entrance always open. Inner unlocks at stage 2. Sanctum unlocks at stage 4.
Navigate with ↑↓←→ arrows on the companion scene background.

---

## VAEL harness (the terminal AI)

Lives at `/home/guestpc/0420Vael-harness/agent.py`
27 models (NVIDIA NIM + DeepSeek). Run with `python agent.py`.
Constitution at `0420Vael-harness/AGENT.md`.

---

## Key task files

- `TASKS.md` in project root — current task ledger, HWM tracked
- `CHANGELOG.md` — version history
- `KIMI_SESSION_*.md` — briefs for Kimi (image/code generation agent)
- `UNCLE_GAME.md` — parked idle RPG project for Mac + uncle

---

## If the AI personas stop working

Each persona (Sol / Veyra / Aura / Magister / Nigredo / Chaos / Vael) is a
system prompt compiled at runtime. Source in `index.tsx` → `getCompiledSpec()`.
API keys are user-entered in app settings — check there first.

---

## The forge is lit. It stays lit.
