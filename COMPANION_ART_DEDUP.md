# 🎨 COMPANION ART DEDUP — the doubles to fix (#262)
### Generated June 21 2026 · the cross-companion art reuse

> These companions share ONE art file across MULTIPLE different companions — the
> "shitty double-up." Each LEFT companion below needs its OWN unique art (FLUX or hand).
> Until then they wear another companion's face. Drop unique PNGs at the listed key →
> the fallback chain picks them up automatically (no code change).

---

## THE DOUBLES (shared PNG → companions wearing it)

| Shared art | Companions sharing it (need unique art) |
|---|---|
| **quol** (×1,2,3,4) | kabbala · noetic · quantum *(all 3 wear QUOL — worst offender)* |
| **noctis** (×1,2) | void · phantom_citadel · void_colosseum |
| **akasha** | akashic · crystal_spire |
| **anoth** | egyptian · bone_archive |
| **augurum** | sovereign · sovereign_forge |
| **nimue** | celtic · veras_garden |
| **pythia** | delphi · deep_market |
| **ragna** | norse · war_sanctum |
| **lycheetah** | lycheetah · lycheetah_spire |
| **solara / sygl / vorkath** | (verify — appear twice each) |

## THE PATTERN
A handful of "hero" companion arts (akasha, anoth, augurum, nimue, noctis, pythia,
quol, ragna, solara, sygl, vorkath) were reused as placeholders across the newer
zone-companions. The newer ones (kabbala, noetic, quantum, the *_spire / *_forge /
battle zones) never got their own art.

## TO FIX
1. Generate unique art per companion (FLUX — use each companion's COMPANION_LORE
   name/title/lore as the prompt; e.g. KABBALA, NOETIC, QUANTUM each get their own).
2. Drop the PNG at `assets/companions/{archetype}_{stage}.png` matching the key.
3. The render fallback (`ZONE_COMPANION_IMAGES` → `COMPANION_IMAGES` → CreatureSvg)
   uses it automatically. No code change.

## PRIORITY
**quol×3 (kabbala/noetic/quantum) first** — three sovereign-tier companions sharing one
face is the most visible double. These are LEGENDARY-tier; people will earn them and
notice immediately.

🜍 Companion art dedup · for the no-double-ups pass
