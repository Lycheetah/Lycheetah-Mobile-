# KIMI SESSION 9 — COMPANION HELP CODEX (TAP-TO-LEARN)
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

You are Kimi, coding assistant for the Vael app (Expo / React Native / TypeScript).
File to edit: `app/(tabs)/companion.tsx`

New players don't know what the companion, battle system, gear, feeding, or
Mystery School dives do. We need a small **? button** that opens a contextual
help panel powered by the AI. This is NOT a static FAQ — the AI explains
features in the voice of the companion/archetype.

---

## THE FEATURE

A small `?` button appears in the top-right corner of the companion tab
(floating over the scene, outside CompanionScene).

Tapping it opens a bottom sheet with three help topics:
- **COMPANION** — what is this creature, how does it grow?
- **BATTLE** — how does combat work?
- **FIELD** — what are the Mystery School dives and why do they matter?

Each topic loads a short AI explanation when tapped. The explanation is spoken
in the voice of the active persona (Sol, Veyra, Aura, Headmaster).

---

## VISUAL SPEC

### The ? button
- Position: absolute, top right of the screen, `top: 12, right: 16`
- Size: 32×32 circle
- Color: `color + '44'` background, `color` border at 1px
- Text: `?` in the skin color, fontSize 14, fontFamily mono

### The help sheet
- Opens as a bottom sheet (slide up from bottom)
- Dark background (`#0D0D1A`), thin top border in `color`
- Three tab buttons at top: COMPANION / BATTLE / FIELD
- Below tabs: the AI-generated explanation text (italic, white, fontSize 14, lineHeight 22)
- Loading state: animated `···` placeholder while AI responds
- Close button: `✕` top right of sheet

---

## AI CALL SPEC

When a help topic is tapped:

```
System: "You are [persona name], a companion in the Vael learning app. Explain [topic] in 3 sentences maximum. Speak in your voice. Be direct, warm, useful."
User: "Explain [topic] to a new user."
```

Where `persona name` = Sol ⊚ / Veyra ◈ / Aura Prime ✦ / Headmaster ⊙ (use active persona).

Topics:
- COMPANION → "what the companion creature is, how it evolves, and why it matters"
- BATTLE → "the battle system: ATK = LQ × 100, Entropy entity, daily tokens"
- FIELD → "Mystery School dives, how they advance the companion, and what LQ means"

---

## STATE NEEDED

```typescript
const [showHelp,     setShowHelp]     = useState(false);
const [helpTopic,    setHelpTopic]    = useState<'companion'|'battle'|'field'>('companion');
const [helpText,     setHelpText]     = useState<string | null>(null);
const [helpLoading,  setHelpLoading]  = useState(false);
const helpSlide = useRef(new Animated.Value(0)).current;
```

---

## WHAT NOT TO CHANGE

- Scene, creature, navigation, battle, feeding, gear systems
- Archetype selector
- DEV panel

Surgical addition only.

---

## RESULT

New users can tap `?` and get the AI to explain the app in the companion's own voice.
This removes onboarding friction without a static tutorial screen.
