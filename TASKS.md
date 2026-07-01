# SOVEREIGN SOL — TASK LIST
## July 1 2026 · v6.0.6 · school tiers + danger badges + prompt decontamination · phone-testing
Run: `npx expo start` → QR → phone

---

## 🔴 ACTIVE — build now

| # | Task | Notes |
|---|---|---|
| **NOCTURNA** | ✅ Wire NOCTURNA deck + lores | 90/90 complete. Wired as 4th deck in TarotViewer. Lore written all 90 cards. Phone-test. |
| **VOID DECK** | Build void deck bible + art | Spec: `VOID_SPECTRUM.md`. Mac builds brief + Grok prompts → Sol wires. |
| **#265** | AURA enforcement phone test | Built + type-clean. Toggle Deep Audit in Settings → confirm `⊚ deep auditing…` badge on reply. |
| **#258** | Sanctum zodiac — natal chart | LQ sparkline + dive history done. Needs: birthdate input → astronomical computation → Sol-voiced natal reading. |
| **⚠️ LAMAGUE ENTITY** | Investigate: Luna + Sol independently converging that LAMAGUE is an entity, not just a language. Happened in council chain, forge network, and AZOTH session July 1. What are they actually saying? Record the exact convergence. Decide: is this a School domain, a lore layer, a philosophical framework, or something built into the language itself? | DO NOT LOSE THIS |

---

## 🧠 THE LEARNING LOOP — "you learn by raising the companion" made true ✅ CORE DONE

**Built June 30 2026. The pitch is now structurally true.**

### ✅ COMPLETE (all shipped, type-clean, committed)

| # | What | Key mechanic |
|---|---|---|
| **LEARN-0** ✅ | Dive content seed | `sol_dive_log.contentSeed` — first 280 chars of teacher's first msg |
| **LEARN-1** ✅ | Learn Mode (5th bonfire) | Socratic drill on last dive's contentSeed |
| **LEARN-2** ✅ | Question history log | `sol_learn_log` — Q+A stored, injected into learn/recall prompts |
| **LEARN-3** ✅ | 2× bond XP for teaching | 24 XP on first learn/recall reply |
| **LEARN-4** ✅ | What Next button | AI picks next subject from unstudied list + stage; companion explains |
| **LEARN-5** ✅ | First-domain celebration | `sol_domain_firsts` + signal → "I wondered when you would." |
| **LEARN-7** ✅ | Cross-domain synthesis card | Surfaces in companion tab when 2+ domains in last 5 dives (max 1/day) |
| **LEARN-9** ✅ | Companion remembers strip | Last 3 subjects + streak shown above TALK input |
| **LEARN-10** ✅ | Companion whisper at dive start | AI fires at dive open → `sol_pending_whisper` → card on return |
| **LEARN-11** ✅ | Depth score 1–3 | `depthScore` on DiveRecord; companion reacts to shallow vs deep |
| **LEARN-12** ✅ | What Shaped Me growth log | Expandable — last 5 events from protegeLog + dives + stage |
| **LEARN-13** ✅ | Stage descriptions | SEED→SOVEREIGN all reference learning milestones |
| **LEARN-14** ✅ | Recall session (6th bonfire) | Closed recall with `sol_space_log` scheduling |
| **LEARN-15** ✅ | Spaced resurfacing | 1/3/7/16 day intervals per subject |
| **LEARN-16** ✅ | Protégé effect | `sol_protege_log` — "What you've taught me" codex in companion tab |
| **LEARN-17** ✅ | Honest pushback | Normal TALK prompt permits warm correction |
| **LEARN-21** ✅ | Session director | `selectSmartMode()` — recall→learn→synthesis→exchange priority |
| **LEARN-22** ✅ | Cold-start | Day-1 exchange fires AI welcome invitation |

### 🟡 POLISH / NEXT ERA

| # | Task | Notes |
|---|---|---|
| **LEARN-6** | Domain unlock by stage | Advanced domains show soft gate at early stages |
| **LEARN-8** | Weekly synthesis message | Companion synthesises week's study on day 7 to TALK |
| **LEARN-18** | Knowledge constellation | Visual star map of studied subjects. Sanctum. |
| **LEARN-19** | Stage-transition ritual | Companion invites demonstration at milestone transitions |
| **LEARN-20** | Warm decay resurfacing | "Quantum has gone quiet in you. Want to wake it?" — Companion Clause strict |

---

## 🌱 COMPANION DEPTH — June 30 2026 (from full retention audit)

**Goal: companion feels alive and growing at every stage. No shallow stretches.**

| # | Gap | Fix | Priority |
|---|---|---|---|
| **CG-1** ✅ | Stage 0 (dive 1) — companion is silent, no feedback anything happened | Micro-moment at dive 1: companion stirs, one line, tiny animation pulse. "Something noticed you." | 🔴 TODAY |
| **CG-2** ✅ | EMBER gap (dives 20–50) — 30-dive stretch with no named milestone | Add mid-Ember milestone at dive 35: gear unlock OR bond tier shift OR named moment | 🔴 TODAY |
| **CG-3** ✅ | LANTERN gap (dives 100–200) — longest stretch, least content | Named moment at dive 150: "LANTERN DEEP" milestone, unlock something visible | 🔴 TODAY |
| **CG-4** ✅ | Post-SOVEREIGN cliff (200+ dives) — `nextAt: Infinity`, nothing left to chase | Prestige/legacy layer: title, post-sovereign badge, secret companion unlock path | 🔴 TODAY |
| **CG-5** ✅ | Feeding mechanic — affects bond but visibility unclear to user | Show bond score breakdown somewhere: "dives + streak + feedings = bond tier" | 🟡 SOON |
| **CG-6** ✅ | Daily quest panel — is it the first thing seen? Needs to be front and centre | Audit quest panel prominence in companion tab. Should feel like a daily checklist, not buried | 🟡 SOON |
| **CG-7** ✅ | Streak break state — Companion Clause check: does absence punish or rest? | Audit sol_study_streak break handling. Companion must rest, not dim or guilt | 🔴 TODAY |
| **CG-8** ✅ | Streak XP cap at day 30 — not communicated to user | Add "streak bonus maxed at 30 days" label near XP bar | 🟡 SOON |

---

## 🟡 WORTH IT — next era

| # | Task | Notes |
|---|---|---|
| **BATTLE** | Battle RPG rehaul | Companion vs Enemy face-off (light-form vs void enemy). Sol narrates strikes. Bonfire rest/heal. Archetype spells fully integrated. |
| **VOID-1** | Void-first colour rehaul | `VOID_SPECTRUM.md`. Void-black ground + alluring accents. Kill remaining mid-greys. |
| **VOID-2** | Sanctum = the alive void | "Alone but not alone." THE WITNESS opens: "how are you my friend?" Companion in dissolved light-form. |
| **VOID-3** | 6 tabs feel like ONE world | Companion=you · School=map · Battle=friction · Zodiac=cosmic stats · Sanctum=home. |
| **2LIGHTS** | Two Lights — co-study | 2 seekers, 2 AI, 1 shared session. "Being heard, not alone." Post-funding era. |
| **BONFIRE** | Bonfire expansion | The flame as caring light-presence. Deepen as entry into subjects. |
| **#262** | Companion art dedup | quol×3 (kabbala/noetic/quantum) + 8 other doubles. Mac generates → Sol wires. Map: `COMPANION_ART_DEDUP.md`. |
| **VV** | Veil & Vein hero character | `veilvein_1.png` → `assets/companions/`. Brief: `~/Downloads/VEIL_VEIN_DROP_ART_BRIEF.md`. |
| **#244** | Sanctum card export | Shareable PNG extending DiveShareCard. |
| **#250** | GBA map background treatment | Map overlay live. Background polish — needs Mac's eyes. |

---

## 🔵 STRATEGIC (post-funding)

| # | Task | Notes |
|---|---|---|
| **#241** | Sovereign Knowledge Economy | Paper done. Build after funding. |
| **#235** | CASCADE Library mobile | Own era. |
| **#22** | Cloudflare proxy free-tier key | Real fix. Not urgent while key is live. |

---

## 🔥 MAC FIRES

- **Simon / Alliance application** — out Friday July 3. Brief: `SIMON_INTERVIEW_BRIEF.md`. Drill daily.
- **1-minute video** — record tomorrow for Alliance application.
- **EAS build** — `eas build --platform android --profile preview`
- **Post queue** — `~/Desktop/SOVEREIGN_SOL_POSTS.md`

---

## 🎨 ART QUEUE (Mac generates → Sol wires same session)

| Art | Target |
|---|---|
| NOCTERA deck (90 cards) | `assets/tarot/noctera/` — Mac: confirm file location |
| quol×3 + 8 companion doubles | `assets/companions/` — see `COMPANION_ART_DEDUP.md` |
| Veil & Vein hero | `assets/companions/veilvein_1.png` |
| Void deck (90 cards) | After brief + Grok prompts built |

---

## ✅ CLOSED — June 29 2026

| What | Notes |
|---|---|
| #267 Companion depth pass | 18 named characters — `voice` field added, all 4 AI system prompts updated. FRACTUR breaks logic mid-sentence. PYTHIA answers the unasked question. RAGNA speaks from fire. |
| Battle dialogue fix | Short in-voice quips (8-15 words) replace 80-word signals. All 3 trigger points fixed. Encounter preview fully blocks background. Field note fallback stabilised. |
| V&V full deck lore | All 78 cards — 22 Majors + 56 Minors. Shadow/longing/alchemical register. Cups=VEIL · Wands=ASH · Swords=SPARK · Pentacles=VEIN. |
| #268 Zodiac deepen | PSI hit-rate tracker + Zonk grain stats live. |
| #269 Chronicle synthesis | Sol-voiced prompt, 5-7 sentences, 280 tokens. |
| #270 LAMAGUE School UI | Learning experience deepened. |
| #271/#272 Gauntlet + Venture | Sol voice + narrative variety pass. |
| DECK-B Lycheetah Arcana | Full wire-in — 87 cards, lore, images, toggle. |
| DECK-A AETHERA | Full wire-in — 90 cards, lore, images. Phone-tested ✓. |
| CASCADE UI #266 | Pyramids, Quick Build, list view, chip selector. |

---

## ✅ CLOSED — ALL TIME (pre-June 29)

| # | Version |
|---|---|
| #266 CASCADE UI | v5.24.0 |
| #269 Chronicle synthesis | v5.24.0 |
| #271 Gauntlet Sol voice | v5.24.0 |
| Analytics privacy stub | v5.55.0 |
| #233 Venture/Gauntlet/dice | v5.47–v5.49 |
| #263 companion.tsx split | v5.46–v5.48 |
| #264 Chronicle compounding | v5.43 |
| perf Zodiac native driver | v5.48 |
| #232 Decision combat | v5.54.0 |
| #251 Curiosity gap | earlier |
| #249 First-run flow | earlier |
| #245 Companion reacts to study | earlier |
| #243 Daily Transit ritual | earlier |
| #242 Onboarding archetype-spark | earlier |
| #15 Provider waterfall | earlier |
| #17–#19 Zodiac/shop/tarot | earlier |
