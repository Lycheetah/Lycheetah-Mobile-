# Privacy Policy — Sol

**Last updated: April 24, 2026**
**App:** Sol | Developer: Mackenzie Conor James Clark | Contact: banduabusiness@gmail.com

---

## What Sol Collects and Why

### Data stored on your device only

The following data is stored locally on your device using Android's secure storage (AsyncStorage and SecureStore). It never leaves your device except as described below.

| Data | Where stored | Purpose |
|------|-------------|---------|
| API keys you enter | SecureStore (encrypted) | Send requests to the AI provider you choose |
| Conversation messages | AsyncStorage | Display your chat history |
| Journal entries | AsyncStorage | Show your Sanctum journal |
| Study progress | AsyncStorage | Track your Mystery School streak and progress |
| App preferences (mode, persona, font, etc.) | AsyncStorage | Remember your settings |
| Streak data | AsyncStorage | Show your current study streak |

**Sol does not have a server.** No conversation, journal entry, or personal data is sent to any Lycheetah server. There is no Lycheetah server.

---

### Data sent to AI providers

When you send a message, it is transmitted to the AI provider whose key you have entered in Settings (or to the Sol free tier proxy for free-tier messages). The message content includes:

- Your message text
- Conversation history (last N messages, as configured)
- A system prompt defining Sol's constitutional operating mode
- Context about your app mode and persona selection

**Your message is sent to:** whichever AI provider's API key you entered (Anthropic, Google, OpenAI, Mistral, or OpenRouter). Each provider has its own privacy policy governing how they handle API requests.

**For free-tier messages:** Your message is sent to the Sol free-tier Cloudflare Worker proxy, which forwards it to DeepSeek's API. The proxy does not log message content. It stores only an anonymous device identifier (a random UUID generated on first install) and a daily message count in a Cloudflare KV store to enforce the 15 messages/day limit. This device identifier is not linked to your name, email, or any personal information.

---

### Device identifier (free tier only)

If you use the free tier (no API key entered), Sol generates a random UUID on first install. This UUID is:
- Stored locally on your device
- Sent to the Sol proxy with each free-tier request to enforce the daily limit
- Not linked to your identity in any way
- Not combined with any other data

---

## What Sol Does NOT Collect

- No name, email, or account required
- No location data
- No device fingerprinting beyond the anonymous UUID described above
- No analytics or crash reporting
- No advertising identifiers
- No data sold or shared with third parties

---

## Push Notifications

Sol may send local push notifications (streak reminders, cognitive weather, daily prompts). These are scheduled locally on your device. No notification content is sent to any server.

---

## Data Deletion

All app data is stored on your device. To delete it: uninstall Sol. This removes all locally stored data including conversation history, journal entries, API keys, and preferences.

The anonymous free-tier device ID stored in Cloudflare KV expires automatically after 24 hours of inactivity and is not recoverable to you personally.

---

## Third-Party Services

When you use Sol, data may be processed by:

- **Your chosen AI provider** (Anthropic / Google / OpenAI / Mistral / OpenRouter) — governed by their respective privacy policies
- **DeepSeek** (free tier only) — [deepseek.com/privacy](https://deepseek.com/privacy)
- **Cloudflare** (free tier rate limiting only) — [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/)

---

## Children

Sol is not directed at children under 13. If you believe a child under 13 has used Sol and you have concerns, contact us at banduabusiness@gmail.com.

---

## Changes to This Policy

If this policy changes materially, we will update the "Last updated" date and note the change in the app's release notes.

---

## Contact

Mackenzie Conor James Clark
banduabusiness@gmail.com
Dunedin, New Zealand

---

*Sol is open source. The full codebase is available at [github.com/Lycheetah/Lycheetah-Mobile-](https://github.com/Lycheetah/Lycheetah-Mobile-). Transparency is not a marketing claim — it is the architecture.*
