# KIMI BUILD BRIEF — Sol by Lycheetah · GitHub Pages Site

## What to build
A single-page static website (`index.html` + `style.css`) hosted on GitHub Pages.
Purpose: public-facing landing page for the Sol app. Visitors can learn what it is and download the APK.

No frameworks. No build step. Pure HTML + CSS. Must work when opened directly from a file or served from GitHub Pages.

---

## Visual direction

**Palette:**
- Background: `#0A0012` (near-black, deep indigo-void)
- Primary accent: `#7B68EE` (indigo)
- Gold accent: `#C8A96E`
- Text: `#E8E8F0`
- Muted text: `#888899`
- Surface cards: `#12101E`
- Card border: `#7B68EE33`
- VOID purple: `#4A0080`

**Feel:** mysterious, elite, compact. Dark mode only. Monospace headers. Clean sans-serif body.
Think: a grimoire that also has a download button.

**Fonts (Google Fonts — load via `<link>`):**
- Headers: `Space Mono` (monospace, weight 700)
- Body: `Inter` (sans-serif, weight 400/600)

---

## Page structure (top to bottom)

### 1. HERO
- Full-width dark section, centered
- Large glyph: `⊚` in gold (`#C8A96E`), 80px, Space Mono
- App name: **Sol by Lycheetah** — large, indigo, Space Mono
- Tagline (italic, muted): *"A mystery school. A companion. A way of seeing."*
- Two buttons side by side:
  - **Download APK** → links to `#download` section (indigo filled button)
  - **View on GitHub** → links to `https://github.com/lycheetah` (ghost button, indigo border)

### 2. WHAT IS SOL
Three feature cards in a row (stack to column on mobile), each with:
- A glyph (large, indigo)
- A short bold title
- 2-line description

Card 1 — `𝔏` — **The Mystery School**
"Explore 30+ domains across 5 epistemic layers — from Buddhist philosophy to quantum mechanics to the VOID. Your companion guides every dive."

Card 2 — `✦` — **Your Companion**
"A living RPG character that grows with you. 10 archetypes. Battle, feed, talk, evolve. LAMAGUE gear earned through study."

Card 3 — `☽` — **The Stars**
"Daily tarot card, daily rune, natal chart reading, 3-card spread. Ask the stars a question. Real astronomical computation."

### 3. THE EPISTEMIC LAYERS
A horizontal band showing the 5 layers. Each as a small pill/badge:
- `Σ●` FOUNDATION — indigo
- `Σ~` MIDDLE — muted white
- `Σ◈` EDGE — gold `#C8A96E`
- `Σ∅` OPEN — purple `#9B59B6`
- `Σ◌` VOID — deep purple `#4A0080`

Above the row: **"Knowledge has depth. So does the school."** (monospace, muted)

### 4. FEATURES LIST
Two-column grid of feature lines. Each line: a small indigo glyph + text.

- `◈` 10 companions across 6 growth stages
- `◈` 30+ mystery school domains
- `◈` VOID zone — forever experimental
- `◈` Daily tarot + Elder Futhark rune oracle
- `◈` Natal chart with personal lineage readings
- `◈` LAMAGUE compression language — learn it in-app
- `◈` Battle system with enemy rarity tiers
- `◈` Local-only — your data never leaves your device
- `◈` No account required. No tracking. No ads (coming).
- `◈` Free. Open gate. Always.

### 5. DOWNLOAD — id="download"
Dark card, centered.

Title: **Get the App** (Space Mono, gold)
Subtitle: *Android · Sideload APK · Free*

Big download button:
- Label: `⬇ Download Sol APK`
- Background: gold `#C8A96E`, text black, bold, Space Mono
- href: `#` (placeholder — Mac will replace with real GitHub Releases link)
- Below button, small muted text: `v3.38+ · Android 8.0+ · ~25MB · No Play Store required`

Below that, a small collapsible/static note:
**How to install:**
1. Download the APK file
2. On your Android device: Settings → Security → Allow from this source
3. Open the downloaded file and install
4. Launch Sol

### 6. FOOTER
- Glyph: `⊚` small, gold
- "Sol by Lycheetah · Built by Mac Clark"
- "lycheetahsol@gmail.com"
- Link to GitHub (text link, muted)
- Small italic: *"The mystery school is not a place you graduate from. It is a way of seeing."*

---

## Mobile responsiveness
- Hero: stack buttons vertically on small screens
- Feature cards: 3-col → 1-col on mobile
- Features list: 2-col → 1-col on mobile
- Layer pills: wrap is fine

---

## File output
- `index.html` — complete, self-contained (links to style.css)
- `style.css` — all styles

No JavaScript required. No dependencies except Google Fonts CDN.

---

## Placeholder to replace later
- APK download link: currently `href="#"` — Mac will replace with real GitHub Releases URL after EAS build
- GitHub URL: `https://github.com/lycheetah` — update when repo is public
