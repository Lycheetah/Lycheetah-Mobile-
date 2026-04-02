# Changelog

## [1.2.0] — 2026-04-02

### Added
- 5-provider registry: Gemini, Anthropic, OpenAI, DeepSeek, Kimi
- Per-provider key storage (`saveProviderKey` / `getProviderKey`)
- Collapsible provider cards in Settings — tap to expand, shows model list + key input
- DeepSeek R1 (deepseek-reasoner) — free credits on signup
- OpenAI GPT-4o / 4o-mini / 4.1-mini / 4.1-nano
- Kimi 8K / 32K (Moonshot)
- `updates/` folder with X post templates and running log

### Changed
- `ai-client.ts` backed by provider registry pattern
- Settings redesigned — provider cards replace flat key list

---

## [1.1.0] — 2026-04-02

### Added
- Markdown rendering in Sol responses (bold, code blocks, headers, lists)
- Return key sends message

### Changed
- NIGREDO mode colour → distinct red (#CC2222)
- Context leak hardening: strips partial framework echoes from responses
- Token limit raised to 2048 (fixes response truncation)

### Removed
- Legacy `claude-client.ts` (consolidated into `ai-client.ts`)

---

## [1.0.0] — 2026-04-01 — Initial Release

### Core
- Three personas: Sol ⊚, Veyra ◈, Aura Prime ✦
- Four operating modes: NIGREDO / ALBEDO / CITRINITAS / RUBEDO
- AURA constitutional scoring — 7 invariants + TES/VTR/PAI tri-axial metrics
- Emotional Wavelength Matching (EWM)
- NRM (Nigredo Research Mode) adversarial toggle

### Providers
- Gemini 2.5 Flash / Flash Lite / 3.1 Flash Lite (free via AI Studio)
- Anthropic Claude Haiku 4.5 / Sonnet 4.6 / Opus 4.6 (paid)

### App
- Personalisation — Sol addresses you by name
- Onboarding flow (5 slides)
- Conversation persistence
- Codex framework browser (CASCADE, AURA, LAMAGUE)
- Field tab — mode descriptions + invariant reference
- Settings — API key management, model selection, Sol/Lycheetah variant toggle
- Dark theme (⊚ gold on black)
- EAS APK build — direct sideload, no Play Store
