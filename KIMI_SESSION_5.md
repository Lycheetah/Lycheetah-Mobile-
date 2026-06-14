# KIMI SESSION 5 — ADD CHAOS SKIN
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

You are Kimi, coding assistant for the Vael app (Expo / React Native / TypeScript).
File to edit: `app/(tabs)/companion.tsx`

The app has 6 skins. We are adding a 7th: **CHAOS**.

Chaos was the original lycheetah skin — fractured neon reality, void/violet/electric palette.
It is NOT the same as lycheetah (which is orange/gold). Chaos is violet, electric, broken-geometry.

---

## CHANGES NEEDED

### 1. Update `SkinId` type

Find:
```typescript
type SkinId = 'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'lycheetah';
```

Replace with:
```typescript
type SkinId = 'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'lycheetah' | 'chaos';
```

---

### 2. Add chaos to `SKINS` object

Find the SKINS object and add chaos entry:
```typescript
chaos: {
  id: 'chaos',
  name: 'CHAOS',
  desc: 'The Fracture',
  glyph: '⚡',
  color: '#4A0080',
  accent: '#FFD600',
  textColor: '#FFFFFF',
  rarityColor: '#E91E8C',
},
```

---

### 3. Add chaos to `SKIN_IDS` array

Find:
```typescript
const SKIN_IDS: SkinId[] = ['solform', 'void', 'aurora', 'crimson', 'obsidian', 'lycheetah'];
```

Replace with:
```typescript
const SKIN_IDS: SkinId[] = ['solform', 'void', 'aurora', 'crimson', 'obsidian', 'lycheetah', 'chaos'];
```

---

### 4. Add chaos scenes to `SCENE_IMAGES`

Find the SCENE_IMAGES object and add:
```typescript
chaos: [
  require('../../assets/scenes/chaos.png'),
  require('../../assets/scenes/chaos2.png'),
  require('../../assets/scenes/chaos3.png'),
],
```

---

### 5. Update `defaultSkin` (optional — only if it makes sense)

Leave `defaultSkin` as `'lycheetah'` unless Mac says otherwise.

---

## THAT'S IT

Do not change anything else. One skin added, four small edits.
After this, chaos appears in the skin carousel and the world map gets its 7th region.
