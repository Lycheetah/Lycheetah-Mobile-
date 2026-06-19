# SOL APP — LIVE TASK LIST
## v4.9.0 · June 19 2026 · HWM #181

---

## 🔥 FORGE TODAY (priority order)

### #179 — Wire Kimi weapons array (40 weapons)
Paste `WEAPONS` constant from Kimi into a new `lib/weapons.ts`.
Wire loot drop on battle win: pick 1 random weapon weighted by dropRate.
Add `sol_weapons` AsyncStorage key (array of earned weapon ids).
Equip slot in SHOP/FIELD tab — equipped weapon feeds ATK/SPD/WIL bonus into playerStats.
SHOP tab gets WEAPONS section to browse/equip owned weapons.

### #180 — Enemy art: use companion images in battle
In battle render block, route enemy image lookup to ZONE_COMPANION_IMAGES first.
`ZONE_COMPANION_IMAGES[`${battle.entitySkinId}_1`]` — companions become zone entities.
No file copying needed. ENEMY_IMAGES becomes the fallback only.

### #181 — SHOP expansion: weapons + more items
After #179 lands: wire earned weapons into SHOP WEAPONS section.
Add 5–8 more coin-purchasable items (companion food, bonus XP boosts, cosmetics).
Price balance: testers start with 200⟡ free, each win earns 15–40⟡.

### #178 — Full App Coherence Audit (multi-stage)
Multi-pass sweep of all tabs and features. Goal: everything named correctly, nothing redundant,
no eye-bloat, all features functional and discoverable.
Pass 1 — rename pass: all labels, section headers, button text coherent and distinct.
Pass 2 — feature pass: every visible element does something or is removed.
Pass 3 — flow pass: navigation between tabs is logical, no dead ends, no orphaned screens.
Pass 4 — cosmetics pass: halo/wings/pets render correctly, specials grid usable, encounter preview works.
Each pass done as a focused session, not all at once.

### #182 — Zodiac tab aesthetic rehaul (TONIGHT)
Full visual pass on zodiac.tsx. Goal: feels like a living celestial instrument, not a card list.
Dark cosmos background, constellation particle layer, glowing orbit rings for natal chart.
Tarot section: atmospheric card display with glow, not flat rows.
Celtic Cross: proper card spread layout with labels, not a boring column.
Wing/mode selectors: styled like the School wing selectors (glyph + label, accent-coloured).
After: test on phone, verify no layout breaks.

### #183 — TALK tab full-screen mode (TONIGHT)
Full-screen toggle in TALK header (alongside Aura + Pact toggles).
When active: tab bar hidden, input bar + messages fill the display, companion header minimized to glyph + name strip.
Exit button: small ✕ or swipe-down gesture restores normal layout.
Keyboard-aware: full-screen mode hugs the keyboard perfectly.
This is the sacred space mode — no distractions, just the conversation.

### #154 — Register tag on AI responses
Tiny pill on every companion/AI output: PROJECTIVE / PSYCHOLOGICAL / SPECULATIVE / EVIDENCE.
Auto-tagged by domain: astrology=P, shadow work=PSY, noetic/psi=S, school facts=E.
One-tap tooltip explains the register system in plain English.

### #155 — Skeptic Mode toggle
Settings toggle. Reframes mystical language → psychological utility language.
Injects framing modifier into companion system prompt.
Badge in Sanctum header when active. Does NOT disable crisis intercepts.

### #156 — Reality Anchor periodic check-in
After 3+ consecutive heavy sessions: soft interstitial on open.
"This is a tool, not a replacement for support." Dismissable, non-guilt, never blocks.
Cooldown: shows max once per 3 days.

### #157 — Journal export
Export all journal entries as plain text or PDF.
For sharing with therapists. Clean formatting, no app branding in the file.
Lives in SANCTUM → Journal → Export button.

### #159 — Sanctum warmth pass
Palette shift in Sanctum tab: amber/gold accents replace purple, slower animations.
Separates "safe hearth" feel from battle/RPG chaos zones.
Colour + timing pass only — no structural changes.

### #160 — Main chat mode tabs (TALK tab)
WAYFARER / COUNCIL / LAMAGUE / SKEPTIC quick-switch chips at top of TALK.
Changes system prompt register on selection.
Persists as user preference (AsyncStorage) — some users will live in SKEPTIC, others in LAMAGUE.
Default mode settable in settings. Wayfarer is factory default.

### #161 — Onboarding quick-win flow (post-onboarding)
After current onboarding: 5-min guided first experience.
Quick natal fact OR mirror prompt → companion intro → sovereignty baseline (3 questions)
→ immediate small win: "You just completed your first Flame ignition — here's 1 Lumen."
Dopamine + meaning in under 5 min. Then deeper invite.
Runs once. Skippable.

### #162 — Epistemic layer background tagging
Every AI response tagged in background: register + confidence tier.
Powers #154 register pills. Foundation for future audit/vote system.
Stored per-message in session state, not persisted (no storage cost).

### #163 — Sovereign Sideloading (SS) in-app guide
"Sovereign Sideloading" — official name for direct APK distribution.
In-app screen (accessible from settings + help): 3-step install guide with big clear screenshots,
"Works on Android 8+" + "Tested on: Pixel 8, Samsung S23, OnePlus 12" trust line,
link to GitHub releases, Obtainium setup guide.
Framing: "No gatekeepers. Direct from the forge to you."

### #164 — GitHub Releases + lycheetah.io distribution
Set up GitHub Releases for signed APK hosting.
Point lycheetah.io to GitHub Pages for web landing.
Release notes template: install guide + SHA-256 + changelog.
Web landing: hero = one-line pitch + big "Download Sovereign APK" button, manifesto below.
Web/PWA export via `expo export:web` → gh-pages deploy.

### #165 — AdMob ads integration
`react-native-google-mobile-ads` wired into non-Sanctum tabs.
Banner ads: BATTLE tab bottom, SCHOOL tab bottom only.
Rewarded ads: unlock bonus school content, extra tokens.
HARD RULES: no ads in Sanctum or TALK (sacred zones). Max 1 ad per 3 sessions — not an ad farm.
Works on sideloaded APKs (no Play Store required for AdMob revenue).

### #166 — NVIDIA key migration plan + fallback
Document the migration path: NVIDIA (current) → Groq / Together.ai / Fireworks.
Build API_PROVIDER config so switching providers is one env var change.
Keep NVIDIA as working fallback. Target: commercial-safe provider before public launch.

### #167 — Solana wallet connect (Sovereign tier gate)
@solana/web3.js + Expo-compatible wallet (Phantom deep link / WalletConnect).
Wallet address stored locally (AsyncStorage). Optional — Sovereign badge if connected.
No transactions required to connect. Wallet = identity layer only at this stage.

### #168 — Soulbound Token (SBT) milestone minting
After key milestones (50 dives, FLAME stage, school completion), offer to mint SBT.
Non-transferable on-chain credential via Solana Attestation Service.
"Albedo Phase Certified" / "FLAME Reached" / "Codex Keeper" etc.
Gas sponsorship so users never need SOL to claim. Sovereign+ feature.
BUILT BUT DISABLED BY DEFAULT — toggle in settings.

### #169 — API Automation Hub (Sovereign+) — BUILT, DISABLED
Users bring their own API keys (Claude / Grok / Gemini / GPT-4o).
Keys stored locally only — never sent to Lycheetah servers.
Trigger types: time-based, notification-based, app-event-based (dive complete, streak, level up).
Action types: auto journal prompt, companion message, school summary, daily briefing.
All automations disabled by default, individually opt-in.
BUILT TODAY — feature flag `AUTOMATION_ENABLED = false` until Sovereign+ gate is live.

### #170 — API Automation: Tasker/MacroDroid webhook bridge
Expose local webhook endpoint (Expo DevTools / local server) that Tasker can call.
Tasker trigger → hits Sol webhook → Sol fires AI action → Tasker receives response.
Document integration with MacroDroid HTTP Request action as easier path.
Example: WhatsApp message received → Sol summarises + companion responds.
Sovereign+ feature. BUILT DISABLED — enables when #169 is active.

### #171 — Solana micropayments (x402 / USDC)
USDC/SOL payments for Sovereign+ tier access.
x402 protocol for agentic micropayments without traditional subscriptions.
Gas sponsorship for new users — they never need to hold SOL to transact.
Revenue share to knowledge carriers (crediting model on-chain).
Held until wallet (#167) and SBT (#168) are live.

### #172 — On-chain journal anchoring (Sovereign+ privacy tier)
Hash psi/precog/intention experiment journal entries on Arweave via Solana.
Content stored client-side; only hash goes on-chain.
"Earned Light" records: tamper-proof, user-owned, shareable.
Sovereign+ feature. Users own their data fully — sovereignty in action.

### #173 — NFT artifacts (Mystery School Grimoires)
Mint lesson completions, tarot spreads, natal charts as dynamic NFTs (Metaplex Core).
Companion NFTs: on-chain assets that reference evolution stage + journal data.
Held until #167/#168 are proven. Long-game feature.

### #174 — Community curriculum contributions (moderated)
Users submit domain/subject suggestions. Moderated against epistemic standards.
Register-tagged before acceptance: speculative EDGE subjects go through stricter review.
Governance seed for eventual DAO layer (#175).

### #176 — lycheetah.io website — beautiful static landing
Single-page HTML/CSS/JS site. Dark (#0D0D0D), gold/purple Sol aesthetic.
Hero: one-line pitch + big glowing "Download APK" button → GitHub latest release.
Below fold: what Sol is (3 short sections), manifesto, screenshots.
Deploys to GitHub Pages → lycheetah.io custom domain.
Built at: ~/lycheetah-web/index.html
BUILDING TODAY.

### #177 — Sol AI Agent on lycheetah.io
Floating "⊚ TALK TO SOL" button on website — opens chat panel.
Runs on NVIDIA NIM API (KEY_2). No backend needed — direct browser fetch.
System prompt = condensed Sol identity + what the app is + how to install.
Talks to visitors instead of making them read files.
Knows: the framework, the companion system, the school, the distribution path, how to install.
BUILDING TODAY alongside #176.

### #175 — Lycheetah DAO seed
Token-gated governance for curriculum additions (EDGE subjects).
Co-creation bounties for domain contributors.
Architecture only at this stage — full build post-Solana wallet + SBT live.

---

## 📋 QUEUED (ordered, not today)

### #132 Lore compounding — unified codex view
### #133 Cosmetics placeholders
### #134 UI accessibility pass
### #135 Workshop tab — LAMAGUE probe/cement/glossary
### #136 MENAGERIE party mode — captured entities as battle roster
### #138 Companion type-family redesign
### #140 Battle encounter cinematic mode
### #141 Zodiac natal chart foundation
### #142 LAMAGUE Symbol Forge
### #143 EAS build — Mac fires, Sol never triggers

---

## ⏸ HELD (resume when space opens)

- NVIDIA Cloudflare Worker proxy (#68) — superseded by #166 migration plan
- NVIDIA image generation (#70)
- Silicon Path onboarding (#87)
- Companion Invoke protocol (#88)
- Technopagan lesson cards (#89)
- Battle HUD cinematic overhaul (#93/#96/#107)
- Tarot deck selector (#100)
- Zodiac advanced modes (#110–115)
- Rarity tab system (#109)

---

## ✅ SHIPPED THIS ERA (v4.6 → v4.9)

| # | Feature |
|---|---|
| #92 | Companion art wired — 18 named zones |
| #94 | Companion collected grid — scrollable zone collector |
| #97 | 45-zone progress collector (SPECTRAL frontier) |
| #99 | Tarot cards clickable — lore modal per card |
| #102 | Fix Mycelium network nodes |
| #104 | Companion scene arrow navigation fixed |
| #105 | Companion scene height increased |
| #108 | 40 relics — 8 categories × 5 triggers wired |
| #120 | Companion equip system — tap → EQUIP ✦ → appears on scene |
| #121 | HP shimmer animation on player damage |
| #122 | Cosmetics persistence (sol_cosmetics) |
| #123 | Companion grid reorg — ORIGIN tier, hidden exclusions |
| #124 | Arrow navigation simplified — up/down cycles zones |
| #125 | Inventory collapse — all sub-tabs collapsible |
| #126 | CAPTURE button — handleCapture, sol_menagerie storage |
| #127 | Companion image fix — scene shows zone companion |
| #128 | HUD header in CompanionScene — name/LVL/HP/quick actions |
| #129 | devStagePin UI + XP strip removed |
| #130 | equippedCompanionSkin persisted to sol_equipped_skin |
| #131 | MENAGERIE view — captured entities display |
| #144 | Companion filter pills — ALL/ORIGIN/ARCANE/MYTHIC/LEGENDARY/SPECTRAL |
| #145 | Floating ? help button — 8-section static guide (Companions/Battle/School/LAMAGUE/Gear/Safety/Sanctum/Talk) |
| #146 | ⚔ floating battle button — Sol tab → companion tab |
| #147 | Unified encounter system — companions appear as entities in home zones |
| #148 | Battle panel minimize + AUTO mode (8s cadence) |
| #149 | Onboarding rehaul — cinematic landing, Solara art, 6-step flow |
| #150 | All companion tab sections start collapsed |
| #151 | Emergency Beacon — global ⊚ orb, long-press → crisis modal, color escalation via CareEvents |
| #152 | T1 augmentation — crisis signal appends warmth + lines after response, never suppresses |
| #153 | Post-session grounding — ReturnToBody component, 4-4-4-4 breath + 3-step, no lore |
| #158 | ReturnToBody wired to school.tsx — fires on deep session close (≥3 exchanges + ≥90s + heavy subject) |
| safety | CARE tag system — Magister self-audits, visible 𝔏 pill, tag-absent → HOLDING default |
| safety | Pronoun drift detection — third→first person shift elevates floor to HOLDING |
| safety | Witness Protocol in Magister prompt — breaks headmaster role for CARE assessment |
| safety | Subject care classification — crisis-adjacent/elevated flags in subjects.ts |
| safety | Magister gate — "Study with 𝔏 or go alone?" fork for heavy subjects |
| safety | CareEvents emitter — Beacon orb changes color when CARE fires from TALK tab |
| safety | sol_care_log AsyncStorage telemetry (total/tagMissing/genuine/crisis/elevated/holding) |
| safety | sol_care_append_enabled user toggle (defaults ON) |
| battle | 40 BATTLE_MYSTERY_SIGNALS, 8s AUTO, COMPANION SIGHTED banner |
| battle | Arrow nav syncs both companion + background |
| battle | All 45 zones in ZONE_COMPANION_POOL |
| cosmetics | 6 wings wired + rendered ON CompanionScene (zIndex:0, left:-40, width:230) |
| cosmetics | Halos wired — zIndex:0 render-first, width:560, height:280, opacity:0.55 (aura style) |
| cosmetics | Wings wired — zIndex:1, width:280, height:240, opacity:1.0, top:-5 |
| cosmetics | Pets wired — bottom-right of companion, width:90, height:90, zIndex:4 |
| cosmetics | CosmeticSlot horizontal scroll picker with tap-to-equip |
| cosmetics | 5 halos (halo_1–5, halo_6 deleted bad art), 10 wings, 7 pets with files |
| cosmetics | Layer order LOCKED: halo(0) → wings(1) → companion(2) → gear(3) → pet(4) |
| #145 | LYC-HELP global ? button — mounted in _layout.tsx, 8-section guide, removed from companion.tsx |
| specials | SPECIALS & EVOLUTIONS — tap-to-EQUIP on unlocked cards, image fallback for special keys |
| specials | Header shows X/15 UNLOCKED (was wrong static "X LOCKED") |
| encounter | ENCOUNTER preview modal — zone info + enemy pool + ENGAGE/RETREAT before battle |
| zone-bg | Zone bg: currentRoomId drives image correctly. activeSkin NOT synced from arrows (companion stable) |
| shop | SHOP tab ⟡ — 6th sub-tab, coin balance, 7 purchasable items, starter pack +200⟡ free |
| coins | ⟡ coins currency — earned from battle wins (10 + wave×5), persisted sol_coins |
| coins | sol_shop_unlocks AsyncStorage key — tracks purchased item ids |
| #176 | lycheetah.io website (~/lycheetah-web/index.html) — static dark site |
| #177 | Sol AI agent on website — NVIDIA KEY_2 chat widget, llama-3.3-70b |

---

## KEY STATE

| Thing | Value |
|---|---|
| Version | 4.9.0 |
| Git branch | master |
| Run command | `npx expo start -c` |
| Distribution | Sovereign Sideloading (SS) — GitHub Releases + lycheetah.io |
| Play Store | NOT targeting — sovereign distribution only |
| Monetization | AdMob (#165) + Solana Sovereign tier (#167–172) + ads-in-crypto |
| AI provider | NVIDIA (current, scaffolding) → migrate to commercial provider (#166) |
| Companion art | 102 PNGs in `assets/companions/` |
| Enemy art | 52 PNGs in `assets/enemies/` |
| Zones | 45 total — all wired in ZONE_COMPANION_POOL |
| Archetypes | 10 |
| EAS | account: solveyra · project: 55350e14-5cdc-4a5f-8a0e-735bca572dd3 |
| Solana spec | `/home/guestpc/Desktop/SOLANA INTEGRATION TO SOL SOVERIENG` |
