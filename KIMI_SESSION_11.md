# KIMI SESSION 11 — FIELD TAB: DIVE STATS + COMPANION LINK
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

Kimi — file to edit: `app/(tabs)/companion.tsx`
The FIELD tab (◉) exists but shows minimal content. This is where the
connection between Mystery School dives and the companion becomes visible.
Make it feel like a living dashboard: the companion's growth IS the dives.

---

## WHAT TO BUILD

The FIELD tab panel (when `activeTab === 'field'`) should show:

### Section 1 — Companion Growth Stats

```
◈  LQ SCORE        87.4
⊹  TOTAL DIVES     142
✦  CURRENT STAGE   LANTERN  (Stage 3)
◦  STREAK          4 days
```

Data sources (already available in CompanionScreen state):
- `lq` — the LQ score
- `diveLog.length` — total dives
- `stage` / `STAGES[stage].name`
- `streak` — the study streak

Style: 4-row stat grid. Each row has a glyph, label (muted), and value (skin color).
Background: `SOL_THEME.surface`, border in `color+'22'`.

### Section 2 — Domain Activity (last 7 dives)

Show the last 7 dive domains as a horizontal glyph strip:

```
[✦] [◈] [◦] [⊹] [✦] [◈] [◦]   ← glyphs
phi  log  alc  her  phi  log  alc  ← domain short names (4 chars max, muted)
```

Use `diveLog.slice(-7)` to get the recent domains. Each domain has a glyph from
the existing domain system (use `DOMAINS[domain]?.glyph ?? '◦'`).

If fewer than 7 dives: show what exists, pad empty slots with `·`.

### Section 3 — AI-generated Field Note

A short 1-sentence insight about the user's recent learning pattern.
Generated from: recent domains, LQ, stage.

Prompt: `"In 1 sentence, give an insight about someone who recently studied [domains] and has an LQ of [lq] with a [archetype] companion at stage [stage]."`

**Fallback pool** (hardcoded, shown while AI loads or if API fails):
```typescript
const FIELD_FALLBACKS = [
  'Your pattern suggests depth over breadth — the companion is responding.',
  'Three domains in the last seven dives. The field is forming a shape.',
  'High-pressure study at stage ' + stage + ' — the entropy you fight is real.',
  'The dives are feeding something. It shows.',
  'Consistency is compounding. The creature knows.',
];
```

Show a random fallback immediately, replace with AI note when it arrives.
Refresh button (small `↺` icon) triggers a new AI call.

---

## DO NOT CHANGE

- Battle, feeding, gear, scene, navigation
- The dive logging logic itself (only READ from diveLog)
- Archetype selector

Surgical additions to the FIELD tab panel only.
