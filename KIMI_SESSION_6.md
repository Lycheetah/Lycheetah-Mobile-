# KIMI SESSION 6 — GEAR VISUAL OVERLAY ON CREATURE
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

You are Kimi, coding assistant for the Vael app (Expo / React Native / TypeScript).
File to edit: `app/(tabs)/companion.tsx`

The companion creature earns gear through Mystery School milestones:
- **Crown** — unlocks at first dive milestone
- **Sigil** — unlocks at second dive milestone  
- **Mantle** — unlocks at third dive milestone

The gear is already tracked in AsyncStorage (`sol_gear_crown`, `sol_gear_sigil`, `sol_gear_mantle`).
The `task2_gear_overlays.ts` data file is already imported.

**What's missing:** the gear is not visually shown on the creature. We need to render it.

---

## WHAT `task2_gear_overlays.ts` EXPORTS

```typescript
getGearOverlay(archetypeId: ArchetypeId, gearType: 'crown' | 'sigil' | 'mantle'): GearOverlay
```

Where `GearOverlay` has:
```typescript
{
  symbol: string;      // emoji or unicode glyph representing the gear
  label: string;       // e.g. "Crown of the Archivist"
  color: string;       // hex color for the glyph
  position: 'top' | 'chest' | 'shoulders';  // where on creature
  description: string; // flavour text
}
```

---

## WHAT TO BUILD

Inside the `CompanionScene` component (or wherever the creature ASCII art renders),
add a gear overlay layer that shows earned gear as glyphs positioned around the creature.

### Layout

```
        [crown glyph]          ← top, above creature
   [sigil glyph] CREATURE [mantle glyph]   ← chest-left and shoulders-right
```

### Code pattern

```typescript
// Read gear state (already available as booleans: hasCrown, hasSigil, hasMantle)
// Call getGearOverlay for each piece the user has earned

const crownOverlay = hasCrown ? getGearOverlay(archetypeId, 'crown') : null;
const sigilOverlay = hasSigil ? getGearOverlay(archetypeId, 'sigil') : null;
const mantleOverlay = hasMantle ? getGearOverlay(archetypeId, 'mantle') : null;

// Render as absolutely positioned Text nodes over the creature view
```

### Visual style

- Glyph size: 24px
- Slight glow effect: `textShadow` in the overlay color
- Animate in on first unlock: simple fade-in over 500ms
- Show gear label briefly on unlock (1.5s toast or overlay text)
- If no gear earned yet: nothing shown (no empty slots, no placeholder)

---

## GEAR UNLOCK TRIGGER

Gear unlocks are already handled elsewhere. You only need to READ the existing
`hasCrown` / `hasSigil` / `hasMantle` booleans and render accordingly.

Do not add new unlock logic — just wire the visual display.

---

## DO NOT CHANGE

- Battle system
- Feeding system
- Stage progression
- Scene backgrounds
- Any other part of companion.tsx not mentioned above

Surgical edit only — add the gear overlay render, nothing else.
