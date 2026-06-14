# KIMI SESSION 7 — ARCHETYPE VISUAL IDENTITY UPGRADE
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

You are Kimi, coding assistant for the Vael app (Expo / React Native / TypeScript).
File to edit: `components/CreatureSvg.tsx`

The 5 companion archetypes currently render SVG creatures using `archId` and `stage`.
The shapes are different per archetype but the COLOR is always the active skin color,
making all companions look similar when on the same skin.

We want each archetype to have a **stronger visual identity** so players can clearly
tell them apart at a glance. The creature must still use the `color` prop for
its primary color, but we want distinctive silhouette elements, secondary marks,
and signature details per archetype.

---

## THE 5 ARCHETYPES

| id | Theme | Visual identity |
|---|---|---|
| `archivist` | Knowledge tower | Tall, layered books/scrolls, floating runes |
| `alchemist` | Flask transmutation | Round body, glowing vessel, smoke/bubbles |
| `oracle` | Eye / vision | Central eye motif, radiating lines, mist |
| `sentinel` | Fortress guard | Angular, wide, shield-like, solid presence |
| `wanderer` | Cloaked traveler | Flowing cloak, staff, star trail behind |

---

## WHAT TO CHANGE

For each archetype's render function (`renderTower`, `renderFlask`, `renderOracle`,
`renderFortress`, `renderCloak`), add these distinctive elements at **stage 1** (the
most commonly seen stage):

### ARCHIVIST (renderTower)
- Add 2–3 small floating rune glyphs (◈ ⊹ ✦) as `<SvgText>` orbiting the tower
- Make the tower taller and narrower — emphasize height over width
- Add stacked book shapes at the base

### ALCHEMIST (renderFlask)
- Flask body should be more rounded (circle body, narrow neck)
- Add 3–4 rising bubble circles inside the flask
- Add a small flame at the base
- Make the glow more prominent (larger colored circle behind flask)

### ORACLE (renderOracle)
- Make the eye motif LARGER — it should be the dominant feature
- Add radiating lines (like sunbeams) extending from the eye
- Add small floating dot constellation around it
- Outer ring of the eye should have animated stroke (hint at pulsing)

### SENTINEL (renderFortress)
- Wide rectangular body, crenellations on top (like castle battlements)
- Two side towers flanking the main body
- Heavy, grounded presence — fills more of the viewBox horizontally
- Small shield emblem in center

### WANDERER (renderCloak)
- Flowing cloak that fills most of the height
- Staff with a glowing tip on the right side
- Small star trail (3–4 small circles) behind/below the cloak
- Hood with a visible face area (simple eye marks)

---

## STAGE SCALING

For stages 0, 2, 3, 4, 5 — keep the existing logic but make sure the stage 1 upgrades
carry through. Stage 2+ should have MORE detail, stage 0 should be the small/simple form.

---

## WHAT NOT TO CHANGE

- The `lycheetah` archetype (`renderCat`) — leave it exactly as-is
- The color system (f, f2, f3 props) — keep using these
- The outer `Svg` container dimensions (W=100, H=150)
- The dark contrast base Rect at the top

---

## RESULT

After this change, switching archetypes should be immediately obvious visually —
each creature has a clear personality before sprite PNGs are added.
