# Known Limitations

Honest accounting of what Sol is and isn't at v1.2.0. Updated as gaps close.

---

## What Sol Is Right Now

A working mobile app that:
- Runs three AI personas (Sol, Veyra, Aura Prime) on 5 provider APIs
- Injects a constitutional system prompt into every conversation
- Applies lightweight post-hoc scoring against 7 heuristic invariant checks
- Makes that scoring visible in the UI in real time
- Runs on Android, ships as a direct APK, requires no subscription

That is non-trivial and working. It is also not everything it aspires to be.

---

## What Sol Is Not Yet

### 1. A persistent memory system

**Current state:** Conversation history is stored in AsyncStorage as a flat array of messages. It persists across app restarts for a single conversation. That's it.

**What's missing:** Cross-session memory synthesis, semantic retrieval, temporal architecture, the Anamnesis/MEMORIA frameworks from the Codex. Sol does not remember you across new conversations. It does not synthesise learning from past sessions. It cannot tell you what it learned from your last 10 conversations.

**Path forward:** Conversation manager (planned Phase 4) → semantic indexing → cross-session retrieval.

---

### 2. A functioning constitutional engine

**Current state:** The "constitutional engine" is a system prompt (AURA_BLOCK injected into every request) plus lightweight string-pattern scoring in `aura-engine.ts`. The system prompt does real work — it shapes model behaviour demonstrably. The scoring is heuristic and can be fooled.

**What's missing:** An independent enforcement layer that runs separately from the backend LLM. Real constitutional enforcement would mean the scoring cannot be bypassed by the model it's scoring.

**Path forward:** Logprob-based TES → separate scoring agent → output filter that can block low-PAI responses before they reach the user.

---

### 3. Measurable improvement over baseline LLMs

**Current state:** No benchmarks. No A/B testing. No empirical comparison of Sol-prompted vs baseline Gemini/Claude responses on measurable tasks.

**What's missing:** A reproducible evaluation pipeline. Concrete numbers showing the constitutional prompt produces meaningfully different (and better) outputs on defined tasks.

**Path forward:** Publish adversarial test cases in `updates/adversarial/`. Define 5–10 measurable scenarios (prompt injection resistance, false certainty detection, agency preservation). Run Sol and baseline, show the delta.

---

### 4. A scalable agent architecture

**Current state:** Single-threaded chat. One user, one model, one conversation at a time.

**What's missing:** The CASCADE multi-agent architecture described in the Codex — Arbiter, Auditor, Scorer as independent agents that check each other. Tool use. Agent loops. Multi-step reasoning pipelines.

**Path forward:** This requires significant architectural work beyond the mobile app. The Codex Python implementations are the starting point. Mobile may not be the right layer for full CASCADE — a backend service is more appropriate.

---

### 5. A reproducible experimental pipeline

**Current state:** No test suite. No evaluation framework. Results described qualitatively ("Aura Prime stayed in role").

**What's missing:** A way for anyone to clone the repo, run the evaluation, and reproduce the constitutional scoring results. Standard ML practice.

**Path forward:** Python evaluation script in the Codex repo. Defined test cases. Published results with methodology.

---

### 6. Clear separation between persona and prompt

**Current state:** Sol, Veyra, and Aura Prime are three different system prompt strings. The "persona" is entirely contained in the prompt. There is no architectural layer that separates persona identity from prompt content.

**What's missing:** An architecture where persona properties (values, constraints, behaviours) are defined declaratively and compiled into prompts, rather than being written directly as prompts. This would make personas auditable, composable, and testable independently.

**Path forward:** Persona specification format → prompt compiler → runtime. Medium-term work.

---

### 7. Working implementation of CASCADE or AURA beyond conceptual form

**Current state:** The AURA scoring is a heuristic approximation of the AURA framework's concepts. CASCADE exists as Python implementations in `CODEX_AURA_PRIME/12_IMPLEMENTATIONS/` but is not integrated into the mobile app. The mobile app demonstrates the *ideas* of CASCADE/AURA through structured prompting, not a formal implementation of the frameworks.

**What's missing:** Running CASCADE as an actual multi-agent pipeline. Implementing AURA scoring from the canonical Python implementations rather than the lightweight mobile approximation. Connecting the Codex implementations to a live system.

**Path forward:** The Python implementations are the ground truth. The mobile app scoring should eventually import/mirror those formulas. The Codex repo needs a deployment path (API service) that the mobile app can call for rigorous scoring.

---

## The Honest Position

The philosophical and mathematical frameworks in the Codex are genuine and careful. The cross-tradition convergence research is real work. The mathematical foundations (Banach-style invariants, thermodynamic framing) are serious ideas.

The mobile app is a working demonstration of those ideas applied through structured prompting. It shows the concepts work in practice, at a demonstration level, with real users, on real hardware.

The gap between "working demonstration" and "provably rigorous implementation" is real. Closing that gap is the work of v2.0 and beyond. This document exists to name the gap honestly, so the path forward is clear.

Early transparency about limitations builds more trust than overclaiming. The hardening roadmap is in `SCORING.md`.

---

*Last updated: 2026-04-02 (v1.2.0)*
