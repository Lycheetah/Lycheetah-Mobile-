# KIMI ART BRIEF — Sol by Lycheetah
## Companion SVG Art for 4 New Archetypes

**Context:** This is a React Native app using `react-native-svg`. The file to edit is
`components/CreatureSvg.tsx`. You have NO GitHub access — I will paste the relevant
section and you rewrite it.

**Canvas:** All SVG coordinates plot on a 100×150 internal space (CW=100, CH=150).
The SVG renders at width=150 height=220 by default, scaling via viewBox.

**Style rules:**
- These are NOT pixel art — they are painterly/vector creature designs
- Body is roughly humanoid silhouette (head, torso, arms, legs visible)
- Use the `color` parameter for strokes and accents; `f = color+'AA'` for semi-transparent fills; `f2 = color+'DD'` for brighter fills
- Aura glow circles (3 nested) are already rendered BEFORE the creature — do not add more background
- Each companion has 6 stages (0–5). Stage 0 = seed/simple. Stage 5 = transcendent/complex. Design should evolve visually
- Available SVG elements: `Path, Circle, Ellipse, Rect, Polygon, G, Line` (all imported)
- No external images. Pure SVG geometry only.

---

## TASK: Replace the 4 placeholder functions at the BOTTOM of CreatureSvg.tsx

The current placeholders are functional but basic. Replace each function with a
more expressive, distinctive creature design. Keep the same function signatures.

**Paste the current bottom section of the file (after line 850) and replace with:**

---

### CIPHER — ∿ The Decoder
**Personality:** Cold precision, signal extraction, mathematical mind. Doesn't waste a single line.
**Color it receives:** Blue-white tones (caller passes color, you just use it)
**Design concept:**
- Head: a geometric diamond or octahedron shape (not round) — the decoder's face is angular
- Eyes: a single horizontal scanning line (not circles) — like a laser sweep
- Torso: hexagonal or circuit-board-like — rigid, precise
- Arms: wire-thin extending to signal node terminals (small circles at arm tips)
- Stages 0-1: just the basic shape, minimal details
- Stages 2-3: signal lines extend outward, node network grows
- Stages 4-5: crown of circuit nodes appears above head; full network radiates; at stage 5 the eye becomes a full grid pattern

```typescript
function renderCipher(stage: EvolutionStage, color: string, f: string, f2: string) {
  // YOUR IMPLEMENTATION HERE
  // stage 0 = simple diamond head + hex torso, no network
  // stage 2+ = signal arms with terminal nodes
  // stage 4+ = circuit crown
  // stage 5 = transcendent: eye becomes a scanning grid, full network
  return <G>{/* your geometry */}</G>;
}
```

---

### HERALD — ⟡ The Voice
**Personality:** Warm, resonant, always broadcasting. Built for connection and transmission.
**Color it receives:** Gold/amber tones
**Design concept:**
- Head: rounded but with an open mouth (broadcasting) — not closed
- Body: flowing cloak or robe shape — wide at bottom, suggests movement/wind
- Arms: extended outward, slightly raised — like someone speaking to a crowd
- Sound waves: arcs emanating from the mouth/hands (Path arcs, not full circles)
- Stages 0-1: basic cloak shape, closed hands
- Stages 2-3: sound waves appear, arms extend further
- Stages 4-5: crown of three points (like a broadcasting tower crown); at stage 5 the sound waves become full radiating rings around the figure

```typescript
function renderHerald(stage: EvolutionStage, color: string, f: string, f2: string) {
  // YOUR IMPLEMENTATION HERE
  return <G>{/* your geometry */}</G>;
}
```

---

### WEAVER — ⌘ The Pattern-Maker
**Personality:** Multi-armed, obsessive, sees patterns everywhere. Like a spider or loom.
**Color it receives:** Green/emerald tones
**Design concept:**
- Head: round, multiple eyes (3 across the brow — compound eyes)
- Body: compact central mass with radiating arms (4 at stage 0, up to 6 at stage 5)
- Background threads: thin diagonal lines crossing behind the body (like a web)
- Arms end in pointed weaving tips (not hands)
- Stages 0-1: 4 arms, no web threads
- Stages 2-3: web threads appear, 5 arms
- Stages 4-5: full web pattern behind, 6 arms, geometric crown (grid frame over head); at stage 5 the body itself shows a woven grid texture (Rect grid overlay at low opacity)

```typescript
function renderWeaver(stage: EvolutionStage, color: string, f: string, f2: string) {
  // YOUR IMPLEMENTATION HERE
  return <G>{/* your geometry */}</G>;
}
```

---

### REVENANT — ↺ The Returner
**Personality:** Cloaked, liminal, returns from the void. Neither fully here nor fully gone.
**Color it receives:** Violet/silver tones
**Design concept:**
- Head: round but slightly obscured — hood or shadow suggested (dark fill with color outline)
- Eyes: a single spiral mark on the face (the returner's mark) — use a Path arc spiral
- Body: long asymmetric cloak, one side longer than the other — windswept look
- Posture: slightly upward-floating (legs barely visible below cloak hem)
- Particle trails: 3-4 small fading circles rising from below (suggesting rising from shadow)
- Stages 0-1: closed cloak, no spiral visible (spiral appears at stage 1)
- Stages 2-3: spiral opens (more coils), particle trails appear
- Stages 4-5: full spiral eye open, rising arc above head (the return arc), at stage 5 the cloak splits to reveal a glowing inner core (bright ellipse center)

```typescript
function renderRevenant(stage: EvolutionStage, color: string, f: string, f2: string) {
  // YOUR IMPLEMENTATION HERE
  return <G>{/* your geometry */}</G>;
}
```

---

## HOW TO DELIVER

Give me the complete content of these 4 functions as TypeScript/TSX. Each function:
- Returns `<G>...</G>` containing all SVG elements
- Uses `stage`, `color`, `f`, `f2` parameters
- Shows evolution across stages 0–5
- No external imports needed (all SVG elements already imported)

I will paste your output directly into `components/CreatureSvg.tsx` replacing
the 4 functions at the bottom of the file (starting at the `// ── CIPHER` comment).

---

## EXISTING COMPANION EXAMPLES (for style reference)

Here is how the existing archivist is written so you can match the code style:

```typescript
function renderArchivist(
  stage: EvolutionStage,
  p: object, p2: object, p3: object, line: object,
  color: string, _path: EvoPath
) {
  // stage 0 — seed form: floating book with eye
  if (stage === 0) return (
    <G>
      <Rect x="32" y="58" width="36" height="44" rx="4" {...p} />
      <Line x1="50" y1="58" x2="50" y2="102" {...line} />
      <Circle cx="50" cy="42" r="12" {...p2} />
      <Circle cx="50" cy="42" r="5" {...p3} />
    </G>
  );
  // ... more stages
}
```

The new functions use a simpler signature `(stage, color, f, f2)` without the prop-spread objects.
Use inline style props instead: `fill={f} stroke={color} strokeWidth="2"` etc.
