# KIMI SESSION 10 — BATTLE AREA VISUAL UPGRADE
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

Kimi — file to edit: `app/(tabs)/companion.tsx`
The battle system works (LQ×100 = ATK, Entropy entity, 3 tokens/day) but the
visual is minimal. Upgrade it so battles feel visceral and loot drops feel earned.

---

## CHANGES

### 1. Enemy roster (not just Entropy)

Replace the single hardcoded `entityName: 'Entropy'` with a roster of 5 enemies
that rotate by wave number:

```typescript
const BATTLE_ROSTER = [
  { name: 'ENTROPY',   glyph: '◈', color: '#9B6BFF', maxHP: 80,  flavor: 'The void that unmakes.' },
  { name: 'STAGNANCE', glyph: '◌', color: '#666699', maxHP: 60,  flavor: 'The weight that stops.' },
  { name: 'FRACTURE',  glyph: '⚡', color: '#CC44FF', maxHP: 100, flavor: 'The break between thoughts.' },
  { name: 'HOLLOW',    glyph: '○', color: '#444466', maxHP: 50,  flavor: 'Where meaning went.' },
  { name: 'THE JUDGE', glyph: '⊛', color: '#FF6B6B', maxHP: 120, flavor: 'It remembers everything.' },
];
```

Enemy selected by: `BATTLE_ROSTER[(wave - 1) % BATTLE_ROSTER.length]`

### 2. Enemy glyph art (in the battle area, not the scene)

In the battle section (inside the BATTLE tab panel, not inside CompanionScene),
render the current enemy as a large ASCII glyph block:

```
     ◈
   ◈ ◈ ◈
     ◈
```

Size: fontSize 28 for center glyph, 18 for surrounding. Use `enemy.color`.
This sits ABOVE the enemy HP bar.

### 3. Loot drop visual (on enemy defeat)

When `battleHP` reaches 0 and victory fires, show a loot glyph float:

```
+  ✦ RELIC  ←  float up from creature position, fade out over 1.2s
```

Use the existing relic/loot text but make it float upward using Animated.Value.
The float starts at Y=0 (creature center) and moves to Y=-80 over 1.2s while fading.

### 4. Wave counter UI

Top-left of battle panel: `WAVE ○○○◉○` (dots filled up to current wave % 5).
Use `color` for filled dots, `color+'44'` for empty.

---

## FALLBACK

All enemy names and flavors are hardcoded in `BATTLE_ROSTER` — no API needed.
The loot drop is purely animation — no API needed.

---

## DO NOT CHANGE

- Battle logic (ATK formula, damage calc, token system, daily reset)
- CompanionScene or scene backgrounds
- Feeding system

Surgical additions to the BATTLE tab panel and the existing victory handler.
