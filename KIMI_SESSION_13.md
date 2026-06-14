# KIMI SESSION 13 — SANCTUM TAB LIVENESS
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

Kimi — file to edit: `app/(tabs)/sanctum.tsx` (or wherever the Sanctum tab lives)
The Sanctum tab currently exists but is mostly a placeholder. Build it out as the
**user's personal archive** — a living record of their companion journey, LQ history,
and earned artifacts. No new data needed — it's all already in AsyncStorage.

---

## WHAT TO BUILD

### Section 1 — LQ History Chart (simple bar chart)

Show the last 14 LQ scores as a horizontal bar chart:

```
LQ HISTORY — last 14 sessions
│
│     ██
│   █████
│ ███████████
│─────────────────
     ↑ oldest        newest ↑
```

Use View components as bars (no charting library needed).
Bar height = `(lq / 100) * MAX_BAR_HEIGHT` where MAX_BAR_HEIGHT = 80.
Bar color = skin `color`. Width = 14px each, gap = 3px.
Data from: `sanctum_lq_history` AsyncStorage key (already populated).

### Section 2 — Earned Artifacts

Show gear earned so far as a grid of 3 slots:

```
[ Crown ⊛ ]    [ Sigil ◈ ]    [ Mantle ✦ ]
 UNLOCKED       UNLOCKED       LOCKED
```

Unlocked: colored border in `color`, glyph visible, label below
Locked: gray border, `?` glyph, `LOCKED` label

Data from: `sol_gear_crown`, `sol_gear_sigil`, `sol_gear_mantle` (already loaded in companion tab — pass as props or reload here).

### Section 3 — Companion Identity Card

```
┌─────────────────────────────────────────────────┐
│  ◈  EMRYN THE ARCHIVIST                        │
│     Stage: LANTERN  ·  Path: A                 │
│     Dives: 142  ·  LQ: 87.4  ·  Streak: 4d    │
│                                                 │
│  "Bound to the field. Growing with every dive." │
└─────────────────────────────────────────────────┘
```

AI-generated companion quote on load.
Prompt: `"You are [companionName], a [archetypeId] companion at stage [stage]. Write one line about yourself that sounds like a creature who has grown from [diveCount] dives of study."`

**Fallback pool:**
```typescript
const SANCTUM_QUOTES = [
  'I am what your curiosity built.',
  'Every dive left something behind. I am what remained.',
  'Stage [stage]. I remember when I was smaller.',
  'The dives are mine as much as yours.',
  'I have learned what you have learned. And more.',
];
```

### Section 4 — Milestones Timeline

Vertical timeline of key events (from journal entries):
```
◉  SEED → SPARK     Jun 10
◉  10 dives         Jun 11
◉  SPARK → EMBER    Jun 12
◌  (next milestone pending)
```

Use journal entries with `entry.type === 'stage_evolution'` or `'milestone'`.
Empty if no journal entries yet.

---

## STYLE

Match the companion tab aesthetic:
- Dark backgrounds (`SOL_THEME.bg` / `SOL_THEME.surface`)
- Skin `color` accents
- Mono font for all labels
- Same card/border style as companion panels

---

## DO NOT CHANGE

- The companion tab
- Any existing sanctum content if present
- Data generation logic

Build new, read existing data.
