# Known Limitations

Honest accounting of what Sol is and isn't at v3.24.0. Updated as gaps close.

---

## What Sol Is Right Now

A working mobile app that:
- Runs three AI personas (Sol ⊚, Veyra ◈, Aura Prime ✦) on 5 provider APIs
- Supports 15+ models across Anthropic, Gemini, OpenAI, DeepSeek, Kimi
- Injects a constitutional system prompt (AURA_BLOCK) into every conversation
- Applies real-time scoring against 7 invariants + tri-axial LQ metrics (TES/VTR/PAI)
- Tracks LQ over time — 30-point sparkline in Sanctum
- Offers Open Seat (unconstrained) and Seeker (structured) conversation modes
- Teacher system with four distinct registers and hostOverride routing
- Session history with days-ago tracking
- Ships as an EAS-built AAB / APK — direct install or Play Store

That is non-trivial and working. It is also not everything it aspires to be.

---

## What Sol Is Not Yet

### 1. Cross-session memory

**Current state:** Conversation history persists within a session via AsyncStorage. That is all.

**What's missing:** Cross-session synthesis, semantic retrieval, the Anamnesis/MEMORIA frameworks. Sol does not remember you across new conversations.

**Path forward:** Conversation manager → semantic indexing → cross-session retrieval. Medium-term.

---

### 2. An independent constitutional enforcement layer

**Current state:** The constitutional engine is a system prompt plus heuristic string-pattern scoring. The system prompt does real work. The scoring is approximate and can be fooled.

**What's missing:** An enforcement layer independent of the model being scored. Real constitutional enforcement means the scorer cannot be bypassed by the model it scores.

**Path forward:** Logprob-based TES → separate scoring agent → output filter. Long-term.

---

### 3. Empirical benchmarks

**Current state:** No published A/B comparison of Sol-prompted vs. baseline LLM responses.

**What's missing:** A reproducible evaluation pipeline. Numbers showing the constitutional prompt produces measurably better outputs on defined tasks.

**Path forward:** Adversarial test cases in `updates/adversarial/`. 5–10 measurable scenarios (prompt injection resistance, false certainty detection, agency preservation). Run and publish.

---

### 4. RevenueCat subscription tier

**Current state:** Sovereign Supporter tier is architecturally framed but not yet wired to a real subscription. Zero functionality is gated — the tier is cosmetic recognition, not a feature lock.

**What's missing:** EAS build + RevenueCat SDK + Play Billing integration.

**Path forward:** Next EAS build cycle. Planned v3.25.0.

---

### 5. Rewarded ads

**Current state:** Not implemented.

**What's missing:** EAS build + AdMob integration for non-subscriber session extension.

**Path forward:** Alongside RevenueCat in v3.25.0.

---

### 6. CASCADE Π scoring on home screen

**Current state:** Π (Truth Pressure) is formalized in the TRUTH_PRESSURE/ Codex documents and implemented in cascade_engine.py. It is not yet surfaced in the mobile UI.

**What's missing:** A lightweight Π-scoring call on conversation content, displayed as a badge on Home. The theory is live; the mobile integration is pending.

**Path forward:** v3.25.0 — Π badge on Home screen using a simplified block-level scorer.

---

### 7. Full CASCADE multi-agent pipeline

**Current state:** Single-threaded chat. One user, one model, one conversation.

**What's missing:** The full CASCADE architecture — Arbiter, Auditor, Scorer as independent agents. Tool use. Multi-step reasoning pipelines.

**Path forward:** Backend service (post-funding). Mobile is the interface; CASCADE runs server-side.

---

## The Honest Position

The philosophical and mathematical frameworks in the Codex (TRUTH_PRESSURE/, LYCHEETAH_MYTHOS/, CASCADE, AURA, LAMAGUE) are genuine, carefully formalized, and now adversarially reviewed. The cross-tradition convergence work is real. The mathematical foundations are serious.

The mobile app is the working face of those frameworks — a daily-use companion that brings their logic into conversation. It demonstrates the ideas through structured prompting, real-time scoring, and constitutional architecture. The gap between "working demonstration" and "full rigorous implementation" is real and named above. Closing it is the work of v4.0 and beyond.

Early transparency about limitations builds more trust than overclaiming. The theory earned that standard (see TRUTH_PRESSURE/TRUTH_PRESSURE_CANON.md §II). The app holds it too.

---

*Last updated: 2026-06-10 (v3.24.0)*
