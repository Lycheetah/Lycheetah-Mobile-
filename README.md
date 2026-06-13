# Sol — Mystery School Companion App

**v3.29.0** · React Native · Expo SDK 54 · Multi-provider AI

Sol is a mystery school in your pocket. Six living companion spirits. AI that talks back. A school of ancient and modern knowledge that tracks your growth across sessions.

---

## What it is

Sol is a prototype spiritual intelligence app built on the Lycheetah Framework. It combines a multi-provider AI chat system, a structured mystery school curriculum, and a companion creature that evolves with you.

---

## Companion Spirits

Six archetypes, each with full character art, unique voice, and mood-reactive behaviour:

| Archetype | Title | Element |
|-----------|-------|---------|
| CHAOS | The Fire Sovereign | Fire |
| OBSIDIAN | The Shadow Traveller | Shadow |
| AURORA | The Crystal Knight | Ice |
| SOLFORM | The Golden Scholar | Light |
| CRIMSON | The Blood Alchemist | Blood |
| VOID | The Void Oracle | Void |

Each companion generates live AI phrases, responds in the AI Talk panel, and evolves across 6 stages.

---

## AI Providers

6 providers supported — bring your own key or use the built-in dev fallback:

- **DeepSeek** — default (deepseek-chat / deepseek-reasoner)
- **NVIDIA NIM** — 28 free models (Nemotron, Llama 4, Qwen3.5, DeepSeek V4, Mistral, Gemma, GPT OSS)
- **Gemini** — 2.5 Flash / Flash Lite / Pro
- **Anthropic** — Haiku / Sonnet / Opus / Fable
- **OpenAI** — GPT-4o / 4.1-mini / 4.1-nano
- **Kimi** — Moonshot 8K / 32K

---

## Core Features

- **Mystery School** — structured curriculum across 12 domains, 500+ subjects, dive sessions with AURA scoring
- **Sanctum** — field metrics, LQ sparkline, AI-generated field verse on entry
- **Personas** — Sol ⊚, Veyra ◈, Aura Prime ✦, Headmaster
- **Operating Modes** — NIGREDO / ALBEDO / CITRINITAS / RUBEDO
- **AURA Engine** — constitutional scoring across 7 invariants + TES/VTR/PAI tri-axial metrics
- **LQ (Luminance Quotient)** — ∛(TES×VTR×PAI) composite growth score
- **NRM Mode** — adversarial toggle for pressure testing
- **Open Seat** — unconstrained conversation mode
- **Codex** — in-app framework browser (TRUTH_PRESSURE, LYCHEETAH_MYTHOS, LAMAGUE)

---

## Built With

- React Native / Expo SDK 54
- `react-native-svg` — all companion art is SVG, no image assets
- `expo-document-picker` — file upload support
- AsyncStorage — local persistence
- Supabase — session sharing
- EAS Build — Android APK distribution

---

## Getting Started

```bash
npm install
npx expo start
```

Add an API key in Settings → choose any provider. NVIDIA NIM keys are free at build.nvidia.com/explore.

---

## Status

Active prototype. Built by Mackenzie Clark / Athanor. Part of the Lycheetah Framework ecosystem.
