# KIMI SESSION 12 — JOURNAL UI (RPG LOG PER STAGE)
## Vael (0sol-by-lycheetah) · June 2026

---

## CONTEXT

Kimi — file to edit: `app/(tabs)/companion.tsx`
The journal data system (`task3_journal.ts`) is already wired — entries are
generated and saved to AsyncStorage at key `sanctum_journal`. What's missing
is the UI to READ the journal. Build it as a scrollable log accessible from
the companion tab.

---

## WHERE TO ADD IT

Add a `JOURNAL` button to the companion tab bar alongside BATTLE / FEED / GEAR / FIELD:

```typescript
{ id: 'journal' as const, label: '📖', name: 'LOG' }
```

Or use glyph `◎` instead of emoji if emoji doesn't fit the aesthetic.

When `activeTab === 'journal'`, render the journal panel below the scene.

---

## JOURNAL PANEL SPEC

### Header
```
◎  COMPANION LOG            [CLEAR ✕] (small, danger-colored, far right)
```

### Entry list (ScrollView)

Each entry is a card:
```
┌─────────────────────────────────────────────────┐
│  ◈  STAGE 2 · EMBER REACHED            Jun 12  │
│  "The creature stretched for the first time.    │
│   It remembered your last three dives."         │
└─────────────────────────────────────────────────┘
```

Fields from journal entry:
- Glyph + stage name (from `entry.stageGlyph`, `entry.stageName`)
- Date (format: `MMM DD`)
- Entry text (`entry.text`)

Style:
- Card bg: `SOL_THEME.surface`
- Border: `color+'33'`
- Date text: muted, fontSize 9
- Entry text: white, fontSize 13, lineHeight 20, italic

### Empty state
```
◎  No log entries yet.
   Complete a Mystery School dive to begin.
```

---

## DATA LOADING

```typescript
const [journalEntries, setJournalEntries] = useState<any[]>([]);

// In useFocusEffect, alongside other AsyncStorage loads:
const raw = await AsyncStorage.getItem('sanctum_journal');
if (raw) setJournalEntries(JSON.parse(raw));
```

---

## AI-GENERATED ENTRY PREVIEW (optional enhancement)

When the journal tab opens for the first time in a session, if there are ≥ 3 entries,
generate a 1-sentence "companion reflection" via AI:

Prompt: `"Given these journal milestones: [last 3 entry texts], write one sentence from the companion's perspective reflecting on the journey so far."`

Fallback: `"Every entry here is a day you showed up. The companion remembers."`

Show this as a pinned card at the TOP of the journal, styled differently (glow border in `color`).

---

## DO NOT CHANGE

- The journal generation logic in `task3_journal.ts`
- The AsyncStorage key (`sanctum_journal`)
- Battle, feed, gear, field, scene, navigation

Surgical additions only.
