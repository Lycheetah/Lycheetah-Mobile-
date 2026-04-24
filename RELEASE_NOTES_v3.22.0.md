## Sol v3.22.0 — The Launch Build
**April 13, 2026**

Full release notes covering v3.14.0 → v3.22.0.

---

### v3.22.0 — The Launch Build
- Adept mode lock removed — free mode selection for all users
- Smart error messages — 401 / rate limit / network / no key each get plain-language alerts
- BYOK onboarding — tappable "Open Google AI Studio" button + numbered step-by-step guide
- School no-key alerts — all silent returns replaced with helpful alerts + Settings navigation
- Streak Reminder — daily notification, 10 rotating nudges, configurable hour (4pm–9pm), toggle in Settings
- Sol icon — concentric gold circles on black — slotted into all 3 asset paths
- README fully rewritten to reflect v3.22.0 feature set

---

### v3.21.0 — Tool Calling + Usability

**Real API-level tool calling (Claude + OpenAI):**
- 8 tools wired at API level: wikipedia_search · duckduckgo_instant · web_search · read_url · calculate · save_insight · get_datetime · search_subjects
- Anthropic: tool_use → execute → tool_result loop
- OpenAI: tool_calls → execute → tool messages loop
- Tool UI indicator in chat header
- Tool history visible in Sanctum → Knowledge Log (last 20 calls)

**Other features:**
- Export chat — copies full conversation as Markdown to clipboard
- Onboarding Quick Start Paths — 3 path cards (Thinking Partner / Study Buddy / Growth Journal) pre-set mode + persona and skip to domain picker

---

### v3.20.0 — Wayfarer Hardening
- All 4 Wayfarer system prompts have explicit no-jargon instruction
- buildTeacherPrompt() takes isWayfarer param
- buildContextBlock() translates stage names in Wayfarer mode
- allStudied variable name collision fixed

---

### v3.19.0 — Adept UI Density
- getDomainArcPhase() helper added
- Domain cards show ⊙ ARC · [PHASE] in Adept mode
- Layer headers show CASCADE · FOUNDATION/MIDDLE/EDGE in Adept mode
- AURA Resonance Links always visible in Adept mode

---

### v3.18.0 — Progression Gates
- Adept card in Settings shows locked state (progress bar X/25) until 25 subjects studied
- After subject #5 → full-screen "Seeker Mode Unlocked" banner
- After subject #25 → full-screen "Adept Mode Unlocked" banner
- getAppMode() bug fixed — was silently downgrading 'adept' to 'seeker' on restart

---

### v3.17.0 — Context Injection + Onboarding Rebuild
- buildContextBlock() in lib/prompts/sol-protocol.ts — ~100 token context block injected before every message
- AI now knows: app name, mode, persona, user name, study count, field stage, streak, active curriculum, domain interest
- Onboarding step 2: interactive domain interest picker (17 tappable chips)
- Step 3 persona cards: show real sample message on selection
- Final onboarding step: "YOUR INTERESTS" summary before entering app

---

### v3.16.0
- 4 missing Wayfarer domain translations added
- isAdept onboarding branch added

---

### v3.15.0 — The Polish Release
- Wayfarer / Seeker / Adept mode system — onboarding step 0 shows 3 mode cards
- AppMode context: isWayfarer, isAdept, t() translation hook
- Settings: advanced section collapsible; mode picker as 3 vertical expand-on-select cards
- Sanctum: Headmaster weekly summary rewritten as personal letter format
- Library: CURATED PATHS horizontal scroll (4 cards) above tool tabs
- School: daily suggestion card (date-seeded, Foundation-first); empty state welcome; streak pill from day 1
- 4 Adept system prompts added (SOL_ADEPT, VEYRA_ADEPT, AURA_PRIME_ADEPT, HEADMASTER_ADEPT)
- 4 Wayfarer system prompts added; selectBasePrompt() routes persona × mode

---

### v3.14.0 — Seeker/Wayfarer App Mode + Mystery School Rebuild
- App mode system introduced (Wayfarer / Seeker / Adept)
- Mystery School rebuilt with full domain/subject architecture

---

### Install

1. Download the APK below
2. Enable "Install from unknown sources" on Android
3. Install → paste your Gemini key in Settings (free at aistudio.google.com/apikey)

### What's in the app

- 4 personas: ⊚ Sol · ◈ Veyra · ✦ Aura Prime · 𝔏 Headmaster
- 3 modes: Wayfarer · Seeker · Adept (all open, no gates)
- 5 AI providers: Gemini (free) · Claude · GPT-4o · Mistral · OpenRouter
- 8 real tools: Wikipedia · DuckDuckGo · Web Search · URL reader · Calculator · Save Insight · Datetime · Subject Search
- Mystery School: 17 domains · 192 subjects · study streaks · curricula
- The Sanctum: journal · vault · knowledge log · field tracker · paradox journal
- AURA constitutional scoring on every response
- 3 notification systems: Cognitive Weather · Daily Weird Question · Streak Reminder
- Export chat · Model comparison · Conversation history · TTS · Image input · Pinned messages

MIT — open source, free forever.
