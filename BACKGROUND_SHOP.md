# SOL BACKGROUND SHOP — SCENE COSMETICS

Backgrounds equip to the companion scene and override the current zone's default image.
The flowing landscape (26s cinematic drift + accelerometer parallax) runs on all of them.
Unlock gates mirror the cosmetics system: ORIGIN free · ARCANE 5dv · MYTHIC 15dv · LEGENDARY/SPECTRAL coin shop.

---

## ORIGIN — Free for all

| id | name | file | glyph | lore |
|---|---|---|---|---|
| bg_alabaster | THE ALABASTER CHASM | alabaster_chasm.png | ◌ | A pale rift between plateaus. Nothing lives here. Everything listens. |
| bg_antarctic | ANTARCTIC REFUGE | antarctic_refuge.png | ❄ | Ice that has not moved in twelve thousand years. Stillness as architecture. |
| bg_elven | THE ELVEN VILLAGE | elven_village.png | ✦ | Built in canopy. The residents learned to think in leaves. |

---

## ARCANE — Unlocked at 5 School Dives

| id | name | file | glyph | lore |
|---|---|---|---|---|
| bg_apollo | APOLLO JUNGLE | apollo_jungle.png | 🜂 | The sun grew roots here. The jungle grew upward to meet it. |
| bg_aurorian | AURORIAN PILLAR | aurorian_pillar.png | ◎ | A stone marker from a civilization that worshipped light differentials. |
| bg_mana | THE MANA FIELD | mana_field.png | ∿ | Visible only to those who have studied long enough to see what isn't there. |
| bg_pulse | PULSE ZONE | pulse_zone.png | ◉ | The ground hums at 7.83 Hz. This is not metaphor. |

---

## MYTHIC — Unlocked at 15 School Dives

| id | name | file | glyph | lore |
|---|---|---|---|---|
| bg_augmented | THE AUGMENTED | augmented_ai.png | ⟟ | What a machine dreams when it is left alone long enough to dream. |
| bg_foundry | CELESTIAL FOUNDRY | celestial_foundry.png | △ | Stars are made here. The workers do not survive the shift. |
| bg_chaos_temple | TEMPLE OF CHAOS | chaos_temple.png | ◈ | Chaos built this to prove it could. Then forgot where it left the key. |
| bg_crystal_soul | CRYSTAL SOUL | crystal_soul.png | ✦ | Compressed thought. Every facet is a different version of the same truth. |
| bg_glitch | GLITCH CASCADE | glitch_cascade.png | ⊘ | A moment where the simulation questioned itself. Preserved for study. |
| bg_obsidian_forge | OBSIDIAN FORGE | obsidian_forge2.png | ⚒ | The second forge. The first one became something else entirely. |

---

## LEGENDARY — Shop purchase (coins)

| id | name | file | glyph | lore |
|---|---|---|---|---|
| bg_neon_cove | NEON COVE | neon_cove.png | ◑ | Bioluminescence that learned to argue. The glow disagrees with itself at the edges. |
| bg_veil_atrium | THE VEIL ATRIUM | veil_atrium.png | ☽ | The waiting room between what you know and what you suspect. |

---

## SECRET — Special unlock

| id | name | file | glyph | unlock | lore |
|---|---|---|---|---|---|
| bg_veilvein | VEIL & VEIN SANCTUM | veilvein_sanctum.png | 🜍 | Own both Veil & Vein SECRET cosmetics | Where the two spirits rest between sessions. No one else is allowed here. |

---

## Technical notes

- Storage key: `sol_cosmetics` → `bg` field (same JSON object as halo/wings/pet)
- CompanionScene override: when `equippedBg` is set, replaces `currentRoom.image`
- The flowing drift (bgAutoX) and parallax (bgParallaxX) apply identically
- BACKGROUND is a 4th CosmeticSlot in the companion shop UI, icon: `⬛`, label: `BG`
- `findBgArt(id)` looks up from `BACKGROUND_ITEMS` array
