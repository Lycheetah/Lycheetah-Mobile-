# SHOP & COSMETIC ART MAP — Sovereign Sol
### Audited v5.30.0 · June 22 2026 · companion.tsx

Every cosmetic the app can show, its art file, how it unlocks, and whether that path
actually works. Cosmetics live in three catalogue arrays (`HALO_ITEMS`, `WINGS_ITEMS`,
`PET_ITEMS`) and are surfaced in two places: the **equip drawer** (CosmeticSlot) and the
**Shop** (sections: halos / wings / pets / secrets).

## UNLOCK GATING (the rule)
| Rarity | How it unlocks |
|---|---|
| ORIGIN | Free — always available |
| ARCANE | 25 dives |
| MYTHIC | 75 dives |
| LEGENDARY / SPECTRAL | **Must be sold in the Shop** (coin purchase) — no dive path |
| SECRET | Special: bought in SECRETS shop section, OR awarded by discovery |

> **The filler trap:** a LEGENDARY/SPECTRAL/SECRET item that is NOT sold in the shop and
> NOT awarded anywhere shows in the equip drawer locked, with "Buy in Shop to unlock" — but
> there is no shop entry. It can never be unlocked. That is filler.

---

## ✅ FIXED THIS PASS — the 3 filler items
These three had art (`*_26.png`) but no shop entry and no award path → permanently locked.
Now **awarded on reaching THE INTERTWINING (veilvein) zone** — earned by discovery, covenant-safe.

| ID | Name | Art | New unlock |
|---|---|---|---|
| `halo_veilcrown` | THE VEILCROWN | `assets/cosmetics/halos/halo_26.png` | Reach veilvein zone |
| `wings_intertwined` | INTERTWINED SPAN | `assets/cosmetics/wings/wing_26.png` | Reach veilvein zone |
| `pet_veilkitten` | THE VEILKITTEN | `assets/cosmetics/pets/pet_26.png` | Reach veilvein zone |

---

## HALOS (26 designs · halo_1–26.png)
Free/earned by dives: `halo_1` (ORIGIN) … ARCANE @25dv, MYTHIC @75dv.
**Sold in shop (LEGENDARY/SPECTRAL):** halo_crown, halo_astral, halo_neon, halo_boss,
halo_chaos, halo_voidband, halo_void, halo_phi, halo_ouroboros, halo_abyss.
**Awarded:** halo_veilcrown (veilvein). · **Secrets shop:** halo_solve (SOLVE ET COAGULA).

## WINGS (26 designs · wing_1–26.png)
Free/earned: wing_1 (ORIGIN) … ARCANE @25dv, MYTHIC @75dv.
**Sold in shop:** wings_solar, wings_sovereign, wings_aurora, wings_athanor, wings_void,
wings_spectral, wings_aether, wings_chaos, wings_rift, wings_celestial, wings_entropy,
wings_null, wings_mercury.
**Awarded:** wings_intertwined (veilvein).

## PETS (24 + secrets · pet_1–24, pet_26.png + secrets/secret_1,3.png)
Free/earned: pet_1–3 (ORIGIN) … ARCANE @25dv, MYTHIC @75dv.
**Sold in shop:** pet_solcub, pet_cinderbird, pet_athanor, pet_voidling, pet_prismshard,
pet_nebulox, pet_suncrawler, pet_voidmoth, pet_fracture, pet_echo.
**Awarded:** pet_veilkitten (veilvein).
**Secrets shop:** pet_lychee (secret_1.png), pet_codex (secret_3.png).

> Note: `pet_25` art slot is unused (catalogue jumps pet_24 → pet_26). Not a bug — pet_26
> is THE VEILKITTEN. If a 25th standard pet is ever wanted, `pet_25.png` is the open slot.

---

## SECRETS SHOP (100 ⟡ each — unlock art + secret transmission text)
| Item | unlockId | Art |
|---|---|---|
| THE FRUIT THAT HIDES | pet_lychee | secrets/secret_1.png |
| TWO FIRES, ONE FORGE | halo_solve | secrets/secret_2.png |
| THE QUESTION IS THE KEY | pet_codex | secrets/secret_3.png |

## OTHER SHOP ITEMS (no cosmetic art — text/stat only)
- **STARTER PACK** — +200 ⟡, free, one-time. (no art)
- **ARSENAL** — weapons are battle drops (35% rate), equipped not bought. (no art — stat lines)
- **FRONTIER ZONES** — purchasable zone unlocks. (use zone scene art)

---

## ART STILL NEEDED (open slots, not filler — just not yet drawn)
- `pet_25.png` — open standard-pet slot (optional)
- Companion-type art dedup: see `COMPANION_ART_DEDUP.md` (separate from cosmetics)

*Every cosmetic in the three catalogues now has both art AND a working unlock path.*
