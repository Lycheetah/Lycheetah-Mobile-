# COMPANION GENERATION — Lycheetah 16-bit Pixel Creature System

> Paste the prompt below into Kimi (or any capable AI).
> Paste the returned JSON into `assets/companions/companions_data.json`.
> The app renders it automatically — no code changes needed.

---

## HOW THE RENDERER WORKS

Each companion is a stack of simple React Native shapes on a **150 × 220 canvas** (origin top-left).

Layer types available:

| Type | Fields | What it draws |
|------|--------|--------------|
| `circle` | cx, cy, r, color, opacity | Solid filled circle |
| `ring` | cx, cy, r, stroke, strokeWidth, opacity | Hollow circle (border only) |
| `rect` | x, y, w, h, color, opacity, radius? | Filled rectangle, optional rounded corners |
| `text` | x, y, content, size, color, opacity | Unicode glyph — face, symbol, accent |
| `diamond` | cx, cy, size, color, opacity | Rotated square (45°) |

Layers render bottom-to-top in array order. Body first, details last.

---

## THE PROMPT — paste this into Kimi

```
You are a creature designer for a 16-bit pixel RPG companion system.

The canvas is 150px wide × 220px tall. Origin is top-left (0,0).
Creatures live in the upper 2/3 of the canvas (y 0–150). 
Bottom third (y 150–220) is reserved for the aura and ground glyph.

Design a creature using ONLY these layer types:
- { "type": "circle",  "cx": N, "cy": N, "r": N, "color": "#hex", "opacity": 0-1 }
- { "type": "ring",    "cx": N, "cy": N, "r": N, "stroke": "#hex", "strokeWidth": N, "opacity": 0-1 }
- { "type": "rect",    "x": N, "y": N, "w": N, "h": N, "color": "#hex", "opacity": 0-1, "radius": N }
- { "type": "text",    "x": N, "y": N, "content": "single unicode char", "size": N, "color": "#hex", "opacity": 0-1 }
- { "type": "diamond", "cx": N, "cy": N, "size": N, "color": "#hex", "opacity": 0-1 }

Rules:
- 6–14 layers total. More layers = richer creature.
- Base a humanoid or spirit form on a body (rect torso) + head (circle) + limbs (thin rects).
- Add accent rings, glows (low-opacity large circles), and a single glyph as the "eye" or "core".
- Keep colors tight: 2-3 hex values max per creature, vary opacity for depth.
- The final "text" layer should be the creature's glyph face/core, centered on the head.
- Return ONLY valid JSON, no explanation.

Design [NUMBER] creatures. For each, return:
{
  "KEY": {
    "name": "CreatureName",
    "layers": [ ...layer objects... ],
    "resonance": "one word"
  }
}

KEY format: archetypeid_stage (e.g. "archivist_0", "sentinel_2")

---

CREATURE LIST TO DESIGN:

[PASTE THE BATCH BELOW]
```

---

## BATCH 1 — ARCHIVIST (The One Who Remembers)

Archetype color: #C8A96E (amber gold)
Lore: A scholar-spirit that grows from a dimly glowing seed into a vast cosmic librarian.
Unicode face options: ◈ ∴ ⊚ ◉ ⌬ ≋

Paste into the prompt after "CREATURE LIST TO DESIGN:":

```
archivist_0 — SEED stage. Tiny, shy, barely formed. A small glowing seed-husk with one eye.
archivist_1 — SPARK stage. Small robed figure, a single floating book beside it.
archivist_2 — EMBER stage. Taller, two floating tomes, glowing spine visible.
archivist_3 — LANTERN stage. Full scholar form, lantern held high, orbiting text shards.
archivist_4 — CITRINITAS stage. Towering, robes spread wide, three tomes orbiting, eyes of light.
archivist_5 — GREAT WORK stage. Cosmic librarian, vast and still, surrounded by orbiting rings of knowledge.
```

---

## BATCH 2 — SENTINEL (The Guardian)

Archetype color: #4A9EFF (ice blue)
Lore: A protective warden that grows from a small stone guardian into an immovable fortress-spirit.
Unicode face options: ⊙ ◫ ⬡ ⊞ ◻ ⬢

```
sentinel_0 — SEED stage. A small stone cube with glowing eye slots.
sentinel_1 — SPARK stage. Compact armoured figure, shield half-formed.
sentinel_2 — EMBER stage. Standing knight, shield solid, crack of light on chest.
sentinel_3 — LANTERN stage. Armoured warden, floating pauldrons, light pours from joints.
sentinel_4 — CITRINITAS stage. Fortress-spirit, massive shield, two floating sentries flanking.
sentinel_5 — GREAT WORK stage. Immovable citadel-entity, walls of light, the ground respects it.
```

---

## BATCH 3 — ALCHEMIST (The Transformer)

Archetype color: #A855F7 (violet)
Lore: A volatile transmuter, starts as a bubbling flask, ends as a being of pure change.
Unicode face options: ⚗ ∞ ◈ ⊛ ⋈ ⊕

```
alchemist_0 — SEED. A floating flask, liquid swirling inside.
alchemist_1 — SPARK. Small figure, alchemist cloak, one glowing hand.
alchemist_2 — EMBER. Two glowing hands, potion vials orbiting.
alchemist_3 — LANTERN. Alchemist mid-transformation, half-solid, flame torso.
alchemist_4 — CITRINITAS. The Transmuter, body is pure violet flame, vials orbit fast.
alchemist_5 — GREAT WORK. Being of pure change, no fixed form, rings of transmutation.
```

---

## BATCH 4 — ORACLE (The Seer)

Archetype color: #22D3EE (cyan)
Lore: A farsighted seer, grows from a single seeing eye into a being that exists across time.
Unicode face options: ◉ ⊛ ≋ ∿ ⊜ ⊝

```
oracle_0 — SEED. A floating single eye, teardrop body below it.
oracle_1 — SPARK. Small humanoid, oversized eyes, hands reaching.
oracle_2 — EMBER. Seer with veil, third eye open on forehead.
oracle_3 — LANTERN. Oracle floating off ground, three eyes, vision beams.
oracle_4 — CITRINITAS. The Farseeing, body is a vertical eye, smaller eyes orbit.
oracle_5 — GREAT WORK. Timeless Seer, exists as overlapping translucent planes, all eyes open.
```

---

## BATCH 5 — WANDERER (The Pathfinder)

Archetype color: #34D399 (emerald)
Lore: An eternal traveller, starts as a small compass-spirit, becomes the path itself.
Unicode face options: ⊕ ↯ ∵ ⋱ ◈ ⟐

```
wanderer_0 — SEED. A tiny compass rose, spinning slowly.
wanderer_1 — SPARK. Small cloaked figure with staff, footprints below.
wanderer_2 — EMBER. Ranger form, map fragments orbiting, wind-swept.
wanderer_3 — LANTERN. The Pathfinder, tall and lean, horizon line behind.
wanderer_4 — CITRINITAS. World-Walker, paths trail behind like comet tail.
wanderer_5 — GREAT WORK. The Path Itself, vast horizon-being, roads radiate outward.
```

---

## BATCH 6 — LYCHEETAH (The Wild Seed)

Archetype color: #F97316 (orange flame)
Lore: The primal chaos archetype. Starts feral, ends as something beyond category.
Unicode face options: ⊛ ⟁ ⊗ ◉ ⋆ ✦

```
lycheetah_0 — SEED. Feral spark, orange static creature, claws visible.
lycheetah_1 — SPARK. Wild beast cub, all energy, barely contained.
lycheetah_2 — EMBER. Flame-patterned predator, speed lines.
lycheetah_3 — LANTERN. The Lycheetah at full form, power barely leashed.
lycheetah_4 — CITRINITAS. Primal sovereign, fire mane, three orbiting sparks.
lycheetah_5 — GREAT WORK. The Wild Absolute. Beyond category. Terrifying. Beautiful.
```

---

## VAEL TEST ENTRY (pre-built)

This is already in `assets/companions/companions_data.json`.
`sentinel_0` = VAEL, the forge-hand. Ice blue, stone cube with a ◆ eye.
If it renders wrong, change one JSON object and reload.

---

## AFTER KIMI RESPONDS

1. Copy the JSON Kimi returns
2. Open `assets/companions/companions_data.json`
3. Paste the new entries inside the top-level `{}` object (comma-separated)
4. Save — the app picks them up immediately on next load
5. No code changes needed

---

## ADDING MORE COMPANIONS LATER

Same prompt, same format. Give Kimi the KEY and description, get JSON back, paste it in.
The renderer handles any valid spec — specialty skins, event companions, seasonal variants.
