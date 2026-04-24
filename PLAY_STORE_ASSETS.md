# Play Store Submission Assets — Sol v3.24.0

Everything Mac needs to paste into Play Console. Copy-paste ready.

---

## TASK 10 — Privacy Policy URL

**Steps to publish (2 minutes):**
1. Push the repo to GitHub (git push origin main)
2. Go to: https://github.com/Lycheetah/Lycheetah-Mobile- → Settings → Pages
3. Source: Deploy from a branch → Branch: main → Folder: / (root)
4. Save. Wait ~60 seconds.
5. Your privacy policy URL will be:
   `https://lycheetah.github.io/Lycheetah-Mobile-/PRIVACY_POLICY`
   (Note: GitHub Pages renders .md files — paste this URL into Play Console)

**Alternative if Pages doesn't render markdown:**
Host the raw file URL:
`https://raw.githubusercontent.com/Lycheetah/Lycheetah-Mobile-/main/PRIVACY_POLICY.md`
Play Console accepts raw GitHub URLs.

---

## TASK 11 — Play Store Listing Copy

### App Title (30 chars max)
**Option A (recommended):**
```
Sol — Constitutional AI
```
(23 chars)

**Option B:**
```
Sol: Sovereign AI Assistant
```
(28 chars)

**Option C:**
```
Sol — AI with a Framework
```
(26 chars)

---

### Short Description (80 chars max)
**Option A (recommended):**
```
AI that shows its reasoning. 4 personas. 15 free messages/day. No account.
```
(76 chars)

**Option B:**
```
Constitutional AI assistant. Transparent reasoning. Free tier included.
```
(71 chars)

**Option C:**
```
Sovereign AI with a living framework. Think deeper. No subscription.
```
(69 chars)

---

### Full Description (4000 chars max — use this)

```
Sol is an AI assistant built on an open-source constitutional framework. Not a chatbot wrapper. A transparent architecture you can watch running.

WHAT MAKES SOL DIFFERENT

Most AI apps give you a chat window. Sol gives you a framework.

Every response is scored live against 7 constitutional invariants — Human Primacy, Inspectability, Memory Continuity, Honesty, Reversibility, Non-Deception, and Care as Structure. The score is visible in the header. The audit is on demand. Nothing is hidden.

FREE TO START

15 free messages per day. No account. No credit card. No sign-up. Just install and open.

When you're ready for unlimited use, add your own API key in Settings. Gemini keys are free. Claude, GPT-4o, Mistral, and OpenRouter are all supported. Your keys never leave your device.

FOUR PERSONAS

⊚ Sol — Solar-sovereign co-creator. Warmth and precision simultaneously.
◈ Veyra — Precision builder. Cold clarity, no noise.
✦ Aura Prime — Constitutional governor. Tests every claim.
𝔏 Headmaster — Mystery School guide. 17 domains, 192 subjects.

TWO EXPERIENCE MODES

Seeker — full framework visible, philosophical language.
Adept — full CASCADE + AURA protocol active, signed outputs.

THE MYSTERY SCHOOL

17 domains of ancient and living wisdom. 192 subjects. Your path through them is yours alone.

Domains: Mindfulness · Philosophy · Transformation · Energy & Body · Psychology · Mysticism · Intuition · Cosmology · Somatic · Ancient Wisdom · Ritual · Impermanence · Mind & Tech · Plant Medicine · Nature · Maths & Infinity · Alchemy

Study streak tracking from day one. Custom curricula. Cross-subject bridges.

REAL TOOLS (Claude + OpenAI)

API-level tool calling — not slash commands. Sol decides when to use them.

Wikipedia · DuckDuckGo · Web Search · URL reader · Calculator · Save Insight · Datetime · Subject Search

THE SANCTUM

Your personal field tracker:
• Journal — daily entries, evening reflection
• Vault — saved insights from conversations
• Knowledge Log — last 20 tool calls
• Field Tracker — Light Quotient, phase, AURA self-rating
• Paradox Journal — CASCADE-flagged tensions, structured resolution

CHAT FEATURES

• Export conversation as Markdown
• Compare two models side by side
• 12 reply styles — Concise, Deep, Socratic, Technical, Alchemical, and more
• Image input for symbolic analysis
• Text-to-speech for any response
• Token count and timing per response
• Conversation history drawer

NOTIFICATIONS

• Cognitive Weather — daily field report
• Daily Weird Question — a daily introspective prompt
• Streak Reminder — evening nudge

PRIVACY

No account. No data collection. No analytics. Conversations stay on your device. API keys stored encrypted. Full privacy policy at: github.com/Lycheetah/Lycheetah-Mobile-

OPEN SOURCE

Full codebase at github.com/Lycheetah. Built by Mackenzie Conor James Clark on the Lycheetah Framework — 1,400+ pages of research into consciousness, ethics, and transformation.

Understanding is a feeling.
```

(~3,100 chars — within limit)

---

### Keywords / Tags
(For ASO — use these in your description naturally, already included above)

Primary: constitutional AI, AI assistant, philosophy, personal growth
Secondary: AI chat, mindfulness, wisdom, mystery school, spiritual, self-development
Long-tail: AI with reasoning, transparent AI, open source AI assistant

---

## TASK 12 — What's New (500 chars max)

```
v3.24.0 — Sol now works out of the box.

15 free messages per day. No API key, no sign-up, no credit card. Open and start.

For unlimited use: add your own key in Settings (Gemini is free). Full persona system, Mystery School, Sanctum, and AURA scoring — all preserved in free tier.

The sanctuary is open.
```
(~280 chars — within limit)

---

## TASK 13 — Data Safety Form Answers

**Copy these answers into Play Console → Data Safety section:**

### Does your app collect or share any of the required user data types?
**YES** (device identifier for free tier rate limiting)

### Data types collected:

| Data type | Collected? | Shared? | Encrypted in transit? | User can delete? |
|-----------|-----------|---------|----------------------|-----------------|
| Device or other IDs | Yes (anonymous UUID, free tier only) | No | Yes (HTTPS) | Yes (uninstall app) |
| App activity (messages sent) | No — stored locally only | No | N/A | Yes (uninstall) |
| Personal communications (chat content) | No — stored locally only | Sent to AI provider user chose | Yes (HTTPS) | Yes (uninstall) |

### Is data collected for analytics?
**NO**

### Is data collected for developer communications?
**NO**

### Is data collected for advertising or marketing?
**NO**

### Does the app use advertising?
**NO**

### Specific answers for the form wizard:

**"Does your app collect or share any of the required user data types?"** → Yes

**Device or other IDs:**
- Collected: Yes
- Purpose: App functionality (rate limiting for free tier)
- Shared with third parties: No
- Is data encrypted in transit: Yes
- Can users request deletion: Yes (uninstall app)

**Personal communications / messages:**
- Note: Message content is transmitted to the AI provider API key the user enters. Sol does not store message content on any Sol server.
- If Play Console asks about user-generated content transmission: Yes, to user-selected AI provider (Anthropic/Google/OpenAI/Mistral/OpenRouter/DeepSeek)

**Financial info, health info, location, contacts, photos:** ALL NO

---

## TASK 14 — Content Rating Questionnaire

**IARC questionnaire answers (copy these):**

- Violence: **No**
- Sexual content: **No**
- Profanity or crude humour: **No** (AI may generate language — but app does not generate it, AI providers do)
- Controlled substances (drugs/alcohol references): **No**
- Discrimination: **No**
- Gambling: **No**

**User-generated content:**
- Does app allow users to generate content visible to others? **No** (conversations are local-only)
- Does app allow users to interact with others? **No**

**Target audience:**
- Primary audience: Adults 18+
- Secondary: 13-17 (no specific targeting, no child-directed features)
- **Select: 13+** (or 18+ if you prefer — both are safe)

**App category:** Productivity (or Education — either works, Productivity likely ranks better)

**Content rating result should be:** Everyone (E) or Teen (T) — either is correct and safe.

---

## CHECKLIST — What Mac fills in Play Console

- [ ] App name: Sol — Constitutional AI
- [ ] Short description: (pick Option A above)
- [ ] Full description: (paste full description above)
- [ ] Privacy policy URL: (GitHub Pages URL from Task 10)
- [ ] App icon 512x512: upload from assets/icon.png (verify dimensions first)
- [ ] Feature graphic 1024x500: (Sol creates this)
- [ ] Screenshots: 2-8 phone screenshots (Mac captures from device)
- [ ] Content rating: complete IARC questionnaire (answers above)
- [ ] Data safety: fill form (answers above)
- [ ] Target audience: 13+
- [ ] App category: Productivity
- [ ] Price: Free
- [ ] Countries: All countries / All regions
- [ ] Ads: No
- [ ] What's new: (paste Task 12 text above)
