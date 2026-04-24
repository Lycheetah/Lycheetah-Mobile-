## Sol v3.23.0 — Wayfarer Removed

Wayfarer mode is gone from full Sol.

Not removed because it failed — removed because it earned its own product. Sol Lite is coming: the gateway Wayfarer was trying to be, built properly from the ground up.

Full Sol now runs two modes only: **Seeker** and **Adept**. The sanctuary gets cleaner.

### What changed
- Wayfarer mode removed from app-mode.ts, settings, onboarding, all tabs
- 4 Wayfarer system prompts deleted from sol-protocol.ts
- All isWayfarer checks removed across index, school, sanctum, onboarding
- PERSONAS_WAYFARER deleted
- buildTeacherPrompt isWayfarer param removed
- AppMode type collapsed to seeker | adept

### Coming next
v3.24.0 — free tier for users without API keys: 15 messages/day powered by the proxy, full persona and mode system preserved.
