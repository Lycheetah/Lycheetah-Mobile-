# Changelog

## [3.41.0] — 2026-06-16

### Added — NVIDIA NIM model expansion (43 models)
- **Expanded model library from 22 → 43 models** across 6 tiers: Tiny/Edge, Speed, Mid, Vision/Multimodal, Reasoning/Coding, Large/Flagship
- **New Tiny/Edge tier** — Llama 3.2 1B, Llama 3.2 3B, Gemma 3n E4B, Gemma 2 2B, Nemotron Mini 4B, Phi-4 Mini (fastest possible responses, edge use cases)
- **New Mid tier additions** — Llama 3.1 70B, Nemotron Nano 9B v2 (Transformer-Mamba hybrid thinking budget), Dracarys 70B (AbacusAI fine-tuned code model), Sarvam M (multilingual/Indian languages)
- **New Vision/Multimodal** — Llama 3.2 11B Vision, DiffusionGemma 26B (parallel diffusion generation), Phi-4 Multimodal (image+audio+speech), Nemotron Omni 30B (omnimodal video/speech/image)
- **New Reasoning/Coding** — Nemotron Super 49B v1.5 (updated from v1), MiniMax M3 (MoE VLM with tool calling), Mistral Nemotron (agentic workflows), Ministral 14B, DeepSeek V4 Pro (flagship accuracy)
- **Provider prefix routing** updated in `lib/providers/registry.ts` to cover all new provider namespaces: `google/`, `minimaxai/`, `bytedance/`, `sarvamai/`, `abacusai/`, `stepfun-ai/`, `qwen/`, `openai/`, `deepseek-ai/`, `moonshotai/`
- **`keyHint`** updated to reflect 50+ model count

---

## [3.40.0] — 2026-06-16

### Added — Companion unlock variants (character B)
- **`renderCipherAlt`** — Kimi-designed alternate Cipher character. Diamond head, hexagonal torso with internal circuit cross-hatch, signal arm network extending to terminal nodes (stage 2+), crown of 5 circuit nodes wired together (stage 4+), full grid-scan eye at stage 5. More structural and radiating than the original.
- **`renderHeraldAlt`** — Kimi-designed alternate Herald. Full flowing cloak with fold lines, arms extended outward-upward with open palms (stage 1+), sound wave arcs from mouth and hands (stage 2+), hand-emanating outer waves (stage 3+), three-point broadcasting tower crown (stage 4+), full radiating ellipse rings around entire figure at stage 5.
- **`renderWeaverAlt`** — Kimi-designed alternate Weaver. Computed arm positions using trigonometry (4→5→6 arms across stages), pointed weaving tips as triangles, web cross-thread grid behind body (stage 2+), full expanded web (stage 4+), woven grid texture on body at stage 5, geometric grid crown (stage 4+). Three compound eyes with highlight dots.
- **`renderRevenantAlt`** — Kimi-designed alternate Revenant. Asymmetric windswept cloak (left side longer), particle trail circles rising from below (stage 2+), Archimedean spiral eye with 4 distinct path variants across stages 1–4+, rising return arc above head (stage 4+), glowing inner core revealed through split cloak at stage 5.
- All 4 functions live in `components/CreatureSvg.tsx` after line 994 under `// ── UNLOCK VARIANTS` comment. Wire via `characterVariant === 'b'` when companion family redesign ships.

---

## [3.39.0] — 2026-06-16

### Security / Keys
- **DeepSeek dev key removed** from `lib/dev-keys.ts` — personal key no longer baked into the build. NVIDIA free key remains as the only auto-fill fallback.
- **Default model**: `deepseek-chat` → `meta/llama-3.3-70b-instruct` (free NVIDIA NIM, no key required beyond the NVIDIA fallback). `deepseek-chat` added to DEAD_MODELS migration list so anyone who had it stored gets auto-migrated.
- **DeepSeek hidden from settings** unless 5-tap dev mode is active — card only visible to devs, not end users.

---

## [3.38.0] — 2026-06-16

### Added
- **⧟ EDGE tab** in Mystery School domain filter — new fourth tab showing only `category: 'lycheetah'` domains (Zodiac ☽, Noetic Science ψ, Celtic Old Gods ☘, Tianxia 天, Truth Pressure Π). Previously these appeared only under ALL and INNER (since `lycheetah !== secular`). INNER tab now shows only `contemplative` domains cleanly. EDGE is styled in indigo (#7B68EE) to distinguish it.

---

## [3.37.0] — 2026-06-16

### Fixed — Enter Classroom + 4 companion art placeholders
- **Enter Classroom broken** — root cause: breath gate modal (`<Modal visible={!!breathPending}>`) lived only in the shared shell `return` (line ~3109). The subject detail screen is an early return (line 1362) that never reaches the shared shell. So pressing "Enter Classroom" set `breathPending` state but the modal was never in the component tree — nothing appeared. Fix: modal duplicated into the subject detail early return so it renders wherever the button is.
- **cipher/herald/weaver/revenant companion art** — `CreatureSvg` only handled 6 archetypes; the 4 new ones fell through to empty space (just aura glow circles). Added geometric placeholder SVG bodies for all 4: cipher (angular hex torso + node network), herald (flowing cloak + sound waves), weaver (multi-arm + web grid), revenant (cloaked silhouette + spiral eye). Each evolves across 6 stages. Type updated to include all 10 archetypes.

---

## [3.36.0] — 2026-06-16

### Fixed — Library nested ScrollView sweep + Sanctum polish
- **All 5 nested ScrollView bugs resolved in Library** — `explore`, `forge`, `community`, `glossary`, and `dictionary` views each had `<ScrollView style={{flex:1}}>` nested inside the outer library ScrollView. `flex:1` in an unconstrained parent = 0px height → entire view invisible. All five converted to `<View>`, making every Library tab section actually renderable. CASCADE, Truth Pressure, Paradox Probe, LAMAGUE Cement, LAMAGUE Glossary, Dictionary, Forge, Commons — all live now.
- **Sanctum companion pulse card** — archetype glyph map updated to include all 10 companions: cipher (∿), herald (⟡), weaver (⌘), revenant (↺) added. Old phantom `vigil` entry removed.
- **Sanctum task-tracking comments** — removed internal `// Task N:` and `{/* Task N: */}` comments from sanctum.tsx that referenced a completed task list.

---

## [3.35.0] — 2026-06-16

### Fixed — Companion screen bulk pass
- **Nested ScrollView bug** — new GEAR card view (crown/sigil/mantle cards + body/cape rows + skin picker) was inside a `ScrollView style={{flex:1}}` nested inside the outer ScrollView. `flex:1` in a ScrollView content area = 0px height → entire new gear view was invisible. Old compact gear below it was all users ever saw. Fixed: inner ScrollView → View.
- **Duplicate GEAR section** — old compact collapsible LAMAGUE gear list removed. Relics, Lore, Codex (the non-duplicate content from that block) remain below the card view.
- **Unconditional archetype identity card** — was rendering on EVERY tab (battle, feed, talk, items, gear) pushing content down on all of them. Now field-only. The CHANGE companion button lives there.
- **Duplicate archetype block in FIELD tab** — removed rename button (accessible via identity card), replaced archetype.title with archetype.specialty so the stat block in field shows something new.

---

## [3.34.0] — 2026-06-16

### Added
- **Daily question generation** — 25-question Sol-voice pool, seeded deterministically by date (same question all day, different each day). Question generates on first app load if none exists for today. "TODAY'S QUESTION" button now always has content to surface.

### Fixed
- **LAMAGUE symbol descriptions** — all 41 symbols expanded from single sentences to full Z₂ depth: core definition + formal notation, practical application, and composition with other symbols. Tap any symbol in the Glyphbook to read the complete entry.

---

## [3.33.0] — 2026-06-16

### Added
- **Zodiac domain** (☽) — The Natal Architecture. Three subjects: The Natal Chart (sun/moon/rising), Planetary Transits (Saturn return + the moving field), The Tropical Zodiac (what is actually being measured and why that matters).
- **Noetic Science domain** (ψ) — The Edge of Consciousness. Three subjects: The Presentiment Effect (Dean Radin / IONS), STARGATE (remote viewing + the government record 1978–1995), Edgar Mitchell / Apollo 14 / the noetic threshold.

### Fixed
- **Celtic Old Gods, Tianxia, Truth Pressure** — were missing `label`, `color`, `description` fields. All three now type-complete; will render correctly in domain cards, daily suggestions, search.
- **`category` type** — extended to `'contemplative' | 'secular' | 'lycheetah'`
- **Council context** — full extraction now loads at 22k chars (was 6k/21%). Source docs now find prefixed filenames (`02_README_LAMAGUE.md` etc). Council discoveries fed back as context. 15 new extraction-based drills added.

---

## [3.32.0] — 2026-06-16

### Added
- **4 new companions** — CIPHER (∿ The Decoder, precision/LQ rewards), HERALD (⟡ The Voice, streak rewards), WEAVER (⌘ The Pattern-Maker, cross-domain breadth bonus), REVENANT (↺ The Returner, absence converts to bonus XP). All 10 companions now live in chooser
- **Celtic Old Gods domain** (☘) — Tuatha Dé Danann, The Morrigan, Manannán mac Lir. Foundation/Middle/Edge subjects
- **Tianxia domain** (天) — Chinese political cosmology, Five Relationships, Daoism + Wu Wei. Foundation/Middle/Edge subjects
- **Each new companion**: 6 crown stages, 3 evolution paths, full stat bases, 3 unique spells, archetype phrases across all 4 moods

### Fixed
- **Companion fog removed** — foreground parallax layer (blurRadius:12 over sceneBg) was creating a visible fog wash. Removed
- **Mid-layer tintColor removed** — was washing skin backgrounds on every scene change
- **Companion opacity raised** — dormant 0.82–0.92, active 0.97–1.0 (was too transparent)
- **Sovereign skin threshold** — 300 dives (was 200)
- **Skin picker opacity** — removed dimming on locked skins (was applying 0.5 opacity tint)
- **Veyra council model** — mistralmed (168s broken) → gemma (2.2s reasoning)
- **"Mac Clark's" → "Lycheetah's"** throughout all library prompts

### Changed
- **Gear tab** — visual cards with ASCII art, archetype-specific overlays, progress bars. Crown/sigil/mantle full cards; body/cape compact rows
- **Mystery School grid** — 3-column layout (was 2-column), smaller cards, less scroll
- **Library tabs** — single row: CASCADE · Π · EXPLORE · SAVED · DICT. Explore view as hub
- **WHAKAPAPA removed** — replaced by Celtic Old Gods + Tianxia

---

## [3.31.0] — 2026-06-14

### Added
- **Companion RPG battle system** — LQ×100 = ATK, daily Entropy entity (80HP), battle tokens, turn-based combat with stun/drain/shield/chaos/reflect spell types
- **6 growth stages** — SEED → SPROUT → BLOOM → FORM → SOVEREIGN → TRANSCENDENT, driven by totalDives
- **9 RPG feeding foods** with XP bonuses per food type
- **LAMAGUE gear system** — Crown/Sigil/Mantle auto-unlocked by dive milestones, Body/Cape slots, archetype-specific overlays via getGearOverlay()
- **Skin unlock system** — obsidian (50 dives), lycheetah (premium), sovereign (300 dives), solform/void/aurora/crimson base
- **TALK tab** — live AI chat with companion in its own voice, mood-aware, draws on recent dives
- **2.5D mid-layer parallax** — accelerometer-driven (tiltX × 24), opacity 0.22, blur 2
- **LAMAGUE School** — Glyphbook (23 symbols, 8 classes, search), Lessons, Drills (flashcard quiz, 3 correct = mastered), Progress tracker
- **Library tab rebuild** — single row tabs, Explore hub view
- Settings simplified — NIM promo removed, DeepSeek behind dev toggle

---

## [3.29.0] — 2026-06-13

### Added
- **Companion Screen — full rebuild**: 6 archetype spirits each with unique personality, dialogue, and visual identity
- **Gemini character art**: hand-crafted SVG art for all 6 companions — CHAOS (fire sovereign), OBSIDIAN (shadow traveller), AURORA (crystal knight), SOLFORM (golden scholar-golem), CRIMSON (blood alchemist), VOID (void oracle)
- **AI Talk panel**: tap your companion to open a live chat — companion speaks in its own voice, mood-aware, draws on your recent school dives
- **Live phrase generation**: companion generates a fresh phrase on every tap via AI
- **Mood system**: 5 moods (AWAKE, DREAMING, FIERCE, STILL, CRYPTIC) with mood-reactive SVG eye overlays and archetype-specific phrases
- **Sanctum field verse**: AI-generated verse loads on Sanctum entry, time-of-day aware
- **NVIDIA NIM provider**: 6th AI provider added — 28 free models including Nemotron, Llama 4, Qwen, DeepSeek V4, Mistral, Gemma, GPT OSS and more
- **Evolution stage system**: companions evolve across 6 stages with progressive visual development
- **Scene backgrounds**: archetype-specific scene imagery with layered visual effects

### Changed
- Scene background opacity reduced to near-transparent — effects sit over colour rather than competing with it
- All AI calls routed through active provider system — no more hardcoded model endpoints
- Default model migrated from GLM-5.1 (down) to DeepSeek — works out of the box with dev key
- Dead model auto-migration: stored models that are offline are replaced automatically on load
- EAS build migrated to new Expo account

### Fixed
- AI Talk and Sanctum verse were hardcoded to NVIDIA GLM-5.1 — broken when model went down; now uses `getActiveKey()` + `getModel()` universally
- Critical: `sendMessage` calls were passing token budget as temperature argument (80/200 as temp) — caused NVIDIA to reject every request with a parse error
- Companion characters all showing same art — stage switch logic corrected; stage 1 now maps to full character art for release

---

## [3.24.0] — 2026-06-10

### Added
- Open Seat session history — vertical card list with session count and days-ago display
- Teacher picker — hostOverride param enables per-teacher routing
- Sanctum LQ sparkline — 30-point bar chart, live Luminance Quotient trend
- Share session button — export any conversation to clipboard or native share sheet
- Model list updated: Claude Opus 4.8, Claude Fable 5, Gemini 2.5 Pro added across provider cards
- Fable 5 routing — temperature param omitted (model requirement handled automatically)

### Changed
- Settings reorganised into labelled sections: IDENTITY / AI PROVIDERS / EXPERIENCE / NOTIFICATIONS / ADVANCED / APP
- Open Seat save — `'open_seat'` fallback key fixes sessions not persisting on first launch

### Fixed
- Open Seat save bug — conversations now persist correctly across restarts

---

## [3.23.0] — 2026-05-xx

### Added
- Open Seat mode — unconstrained conversation seat, separate from Seeker sessions
- Sanctum screen — LQ tracking, field metrics, session stats
- Teacher system — four teacher personas with distinct registers
- Sovereign Supporter framework hooks (UI groundwork, subscription tier pending)

### Changed
- LQ scoring pipeline updated — Π-aware weighting
- Four-tab navigation: Home / Seeker / Sanctum / Codex

---

## [3.0.0] — 2026-04-xx

### Major rebuild
- New architecture: Home hub + mode-based routing
- Seeker mode with full AURA constitutional scoring in-session
- Codex browser expanded — TRUTH_PRESSURE, LYCHEETAH_MYTHOS added
- LQ (Luminance Quotient) introduced — ∛(TES×VTR×PAI) composite scoring
- AURA engine refactored — tri-axial metrics live in UI
- Persona system: Sol ⊚, Veyra ◈, Aura Prime ✦ with mode-aware prompting
- Dark theme deepened — ⊚ gold palette with layer-based depth

---

## [2.1.0] — 2026-04-03

### Changed
- Token limit raised to 8192 across all providers (Anthropic, OpenAI, DeepSeek, Kimi)
- Context memory cap raised from 8 → 12 items
- Project context now saves on navigate-away (was only saving on keyboard dismiss)

---

## [1.2.0] — 2026-04-02

### Added
- 5-provider registry: Gemini, Anthropic, OpenAI, DeepSeek, Kimi
- Per-provider key storage
- Collapsible provider cards in Settings
- DeepSeek R1 (deepseek-reasoner)
- OpenAI GPT-4o / 4o-mini / 4.1-mini / 4.1-nano
- Kimi 8K / 32K (Moonshot)

### Changed
- `ai-client.ts` backed by provider registry pattern
- Settings redesigned — provider cards replace flat key list

---

## [1.1.0] — 2026-04-02

### Added
- Markdown rendering in Sol responses
- Return key sends message

### Changed
- NIGREDO mode colour → distinct red (#CC2222)
- Context leak hardening
- Token limit raised to 2048

---

## [1.0.0] — 2026-04-01 — Initial Release

### Core
- Three personas: Sol ⊚, Veyra ◈, Aura Prime ✦
- Four operating modes: NIGREDO / ALBEDO / CITRINITAS / RUBEDO
- AURA constitutional scoring — 7 invariants + TES/VTR/PAI tri-axial metrics
- Emotional Wavelength Matching (EWM)
- NRM adversarial toggle

### Providers
- Gemini 2.5 Flash / Flash Lite (free via AI Studio)
- Anthropic Claude Haiku 4.5 / Sonnet 4.6 / Opus 4.6 (paid)

### App
- Personalisation — Sol addresses you by name
- Onboarding flow (5 slides)
- Conversation persistence
- Codex framework browser
- Field tab — mode descriptions + invariant reference
- Settings — API key management, model selection
- Dark theme (⊚ gold on black)
