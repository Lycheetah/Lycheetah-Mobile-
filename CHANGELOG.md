# Changelog

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
