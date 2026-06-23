# SOVEREIGN SOL — CURRENCY ECONOMY
## v5.43.0 · June 22 2026 · Single source of truth

---

## TWO CURRENCIES

### ✦ DIVE COINS
**What it is:** The primary unlock currency. Earned through knowledge dives, ventures, and milestones.

**Storage keys:**
| Key | Type | Purpose |
|-----|------|---------|
| `sol_total_dives` | number (int) | Raw dive count. Incremented in school.tsx on dive completion. |
| `sol_dive_spent` | number (int) | Total ✦ spent on unlocks. Incremented on every purchase. |
| `sol_bonus_coins` | number (int) | Bonus pool from ventures + test injection. Starts at 15 on first load. |

**Formula:**
```
diveCoins = Math.max(0, totalDives + bonusCoins - diveSpent)
```

**State (companion.tsx):**
```typescript
const [totalDives,  setTotalDives]  = useState(0);  // loaded from sol_total_dives
const [diveSpent,   setDiveSpent]   = useState(0);  // loaded from sol_dive_spent
const [bonusCoins,  setBonusCoins]  = useState(0);  // loaded from sol_bonus_coins (defaults to 15)
const diveCoins = Math.max(0, totalDives + bonusCoins - diveSpent);
```

**Earn sources:**
- 1 ✦ per dive completed (via totalDives)
- 2–6 ✦ per VENTURE session completed (via bonusCoins, persisted in sol_bonus_coins)
- 15 ✦ test injection on first load (via bonusCoins default)

**Spend targets (unlockZoneWithDives / unlockWithDives):**
- Zone unlocks — ARCANE zones: 2–8 ✦, MYTHIC: 5–22 ✦, LEGENDARY: 15–55 ✦, SPECTRAL: 35–65 ✦
- Landscape zones (land_6-10): 3 ✦ each
- Landscape zones (land_11-15): 4 ✦ each
- Shop zones (amber_vault etc.): 12–30 ✦
- Companion unlocks: varies by archetype

**Display:** shown as `{diveCoins}` with ✦ glyph. In companion tab header area (line ~5508).

---

### ✧ VERAS (Knowledge Dust)
**What it is:** The knowledge economy currency. Placeholder for the Sovereign Knowledge Economy (post-funding build).

**Storage key:** `sol_veras` (number, int)

**State (companion.tsx or shop.tsx):**
```typescript
// loaded from sol_veras
```

**Earn sources (current):**
- +50 on onboarding completion
- +5 per journal entry

**Spend targets:** None yet (placeholder). Future: premium knowledge unlocks, Sovereign Knowledge Economy features.

**Display:** alongside ⟡ Lumens in Shop tab. Glyph: ✧

---

## WHAT DOES NOT EXIST

- **Battle currency** — battle wins are tracked (`sol_battle_wins`) but do NOT generate a spendable currency. Battle wins unlock BATTLE tier zones directly by win count (no coins involved).
- **Lumens (⟡)** — legacy reference in some copy. Not a live currency. Do not add it.
- **Third currency** — two currencies is the ceiling. Do not add a third medium of exchange.

---

## PURCHASE FLOW

```
User taps ✦ price button on a locked zone card
  → unlockZoneWithDives(id, cost) called
  → checks: diveCoins >= cost (error toast if not)
  → nextSpent = diveSpent + cost
  → setDiveSpent(nextSpent)
  → setPurchasedZones([...purchasedZones, id])
  → AsyncStorage.multiSet([sol_dive_spent, sol_zone_unlocks])
  → haptic + toast + addChronicle
```

```
User taps ✦ price button on a locked companion
  → unlockWithDives(sid, cost) called
  → same pattern, writes to sol_unlocked_companions instead
```

---

## ZONE TIERS AND PRICES

| Tier | Unlock condition | ✦ cost |
|------|-----------------|--------|
| ORIGIN | Free (land_1-5, solform, void, aurora, crimson) | 0 |
| ARCANE (standard) | raw dive threshold (0-14 dives) | 2–8 ✦ |
| LANDSCAPE (land_6-15) | purchasable, no dive threshold | 3–4 ✦ |
| MYTHIC | raw dive threshold (0-50 dives) | 5–22 ✦ |
| LEGENDARY | raw dive threshold (0-112 dives) | 15–55 ✦ |
| SPECTRAL | raw dive threshold (0-140 dives) | 35–65 ✦ |
| BATTLE | battle wins (5-100 wins) | 5–70 ✦ |
| SHOP | purchasable only | 12–30 ✦ |
| SOVEREIGN | Sovereign status required | — |

Note: for tiered zones, the raw dive threshold is still required even when ✦ cost shows. Once the threshold is met, the zone can be purchased. `purchasedZones` array (sol_zone_unlocks) gates whether a purchased zone is "owned."

---

## WHERE THE ECONOMY LIVES

| File | What it owns |
|------|-------------|
| `app/(tabs)/companion-zones.ts` | `ZONE_DIVE_COST`, `getSkinUnlockStatus`, all tier thresholds |
| `app/(tabs)/companion.tsx` | `totalDives`, `diveSpent`, `bonusCoins`, `diveCoins`, `unlockZoneWithDives`, `unlockWithDives`, `finishVenture` |
| `app/(tabs)/school.tsx` | dive completion → increments `sol_total_dives` |

If you add a new zone, add it to **both** `ZONE_DIVE_COST` (if purchasable) **and** the appropriate tier block in `getSkinUnlockStatus`. Touching one without the other is the most common economy bug.

---

*Single source of truth. Update this file when the economy changes.*
