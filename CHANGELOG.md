# Changelog

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
