# Changelog

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
