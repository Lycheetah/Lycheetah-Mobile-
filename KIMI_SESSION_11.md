# KIMI SESSION 11 — LAMAGUE Workshop Sub-Tab in school.tsx

## What this session produces
A single file: `KIMI_SESSION_11_DELIVERABLE.md`

The LAMAGUE School screen currently has 4 sub-tabs: Glyphbook · Lessons · Drills · Progress
We're adding a 5th: **WORKSHOP** — which will house the Probe (paradox detector), Cement (expression builder), and Glossary tools moved from the Library tab.

---

## Current LAMAGUE school tab structure (school.tsx)

The LAMAGUE school is rendered inside school.tsx when `showLamague === true`.
The sub-tab bar currently looks like:

```tsx
// These are the 4 existing LAMAGUE sub-tabs:
const LM_TABS = ['glyphbook', 'lessons', 'drills', 'progress'] as const;
type LMTab = typeof LM_TABS[number];
```

The tab bar renders like:
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {(['glyphbook','lessons','drills','progress'] as LMTab[]).map(t => (
    <TouchableOpacity key={t} onPress={() => setLmTab(t)}
      style={{ paddingHorizontal:16, paddingVertical:8,
        borderBottomWidth: lmTab === t ? 2 : 0,
        borderBottomColor: LM_COLOR }}>
      <Text style={{ color: lmTab === t ? LM_COLOR : '#666', fontSize:11, fontFamily:mono, letterSpacing:1 }}>
        {t.toUpperCase()}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

Add `'workshop'` to the LM_TABS array and tab bar.

---

## Probe tool — current implementation in library.tsx

The probe tool calls an AI with this prompt:

```typescript
const PROBE_PROMPT = `You are a paradox and contradiction detector for the Lycheetah Framework.

Analyze the text below for:
1. Internal contradictions (things that can't both be true)
2. Hidden assumptions (things assumed true without evidence)
3. Circular reasoning (conclusion used to justify premise)
4. False dichotomies (only two options presented when more exist)
5. Paradoxes (statements that undermine themselves)

Return valid JSON only:
{
  "score": 0-100,
  "verdict": "one sentence",
  "paradoxes": [
    { "type": "contradiction|assumption|circular|dichotomy|paradox", "text": "quote from input", "explanation": "why this is a problem" }
  ],
  "clean": "what remains if all paradoxes are removed"
}`;

async function handleProbe() {
  // calls AI with probeInput + PROBE_PROMPT, parses JSON response
  // sets probeResult: { score, verdict, paradoxes[], clean }
}
```

ProbeResult type:
```typescript
type ProbeResult = {
  score: number;
  verdict: string;
  paradoxes: { type: string; text: string; explanation: string }[];
  clean: string;
};
```

---

## Cement tool — current implementation in library.tsx

```typescript
const LAMAGUE_CEMENT_PROMPT = `You are a LAMAGUE expression builder...
// [long prompt — you don't need to reproduce it, just build the UI wrapper]
`;

// CementBlock type:
type CementBlock = {
  expression: string;
  spoken_form: string;
  english: string;
  components: { symbol: string; meaning: string }[];
  logic: string;
  use_case: string;
};
```

---

## The WORKSHOP tab JSX to build

Build the complete JSX for `{lmTab === 'workshop' && (...)}`.

Structure:
```
WORKSHOP sub-tabs: [PROBE] [CEMENT] [GLOSSARY]
(horizontal pill selector at top of workshop view)
```

### PROBE sub-view:
- Header: "◉ PARADOX PROBE" in amber (#F59E0B)
- Description: "Detect contradictions, hidden assumptions, and circular reasoning in any text"
- TextInput (multiline, 6 lines, dark bg): placeholder "Enter text to probe..."
- "◉ Run Probe" button — calls `handleProbeWorkshop(input)` 
- Results: integrity score bar (green→red), verdict text, list of paradox cards (each with type badge + quote + explanation), "What remains:" clean text block

### CEMENT sub-view:
- Header: "◈ CEMENT" in purple (#8B5CF6)
- Description: "Build a LAMAGUE expression from any concept"
- TextInput (multiline, 4 lines): placeholder "Describe the concept to cement..."
- "◈ Cement" button — calls `handleCementWorkshop(input)`
- Results: large expression display, ◎ spoken_form below it, english translation, component breakdown (symbol + meaning rows), logic block, use case

### GLOSSARY sub-view:
- Header: "⟟ GLOSSARY" in teal (#14B8A6)
- Search TextInput: placeholder "Search symbols..."
- Category filter pills: ALL · CORE · PROCESS · QUALITY · CONNECTIONS · TEMPORAL · EXTENDED
- Scrollable symbol list, each row: symbol (large) · name · meaning · expandable detail

The LAMAGUE_SYMBOLS data to use for glossary:
```typescript
// Pass these inline — do not import from library.tsx
const WS_SYMBOLS = [
  // CORE
  { symbol:'⟟', name:'Λ-ROOT', meaning:'foundation / anchoring point', category:'core', detail:'The root from which all LAMAGUE expressions grow.' },
  { symbol:'◈', name:'CEMENT', meaning:'to solidify / crystallise knowledge', category:'core', detail:'Used when a concept becomes load-bearing.' },
  { symbol:'⊚', name:'SOL', meaning:'solar centre / completed Work', category:'core', detail:'The sovereign principle. Fixed, illuminating.' },
  { symbol:'◉', name:'PROBE', meaning:'to test / examine under pressure', category:'core', detail:'Investigation without agenda.' },
  { symbol:'⧖', name:'SYNTHESIS', meaning:'two streams becoming one', category:'core', detail:'The moment of integration.' },
  { symbol:'∴', name:'THEREFORE', meaning:'logical consequence', category:'core', detail:'What follows necessarily.' },
  // PROCESS
  { symbol:'↯', name:'DISSOLVE', meaning:'to break down / analyse', category:'process', detail:'Solve — the first half of Solve et Coagula.' },
  { symbol:'⇝', name:'COAGULATE', meaning:'to form / crystallise', category:'process', detail:'Coagula — the second half.' },
  { symbol:'⟳', name:'CYCLE', meaning:'recursive refinement', category:'process', detail:'The loop that produces gold.' },
  { symbol:'⌬', name:'TRANSMUTE', meaning:'qualitative change under pressure', category:'process', detail:'Not movement, transformation.' },
  // QUALITY
  { symbol:'Π', name:'TRUTH PRESSURE', meaning:'weight of evidence per unit slack', category:'quality', detail:'Π = (E·P)/(S+S₀). The canonical formula.' },
  { symbol:'⊕', name:'RESONANCE', meaning:'two truths reinforcing each other', category:'quality', detail:'Independent evidence arriving at the same point.' },
  { symbol:'⊗', name:'DISSONANCE', meaning:'two truths in conflict', category:'quality', detail:'The productive tension before synthesis.' },
  { symbol:'◌', name:'VOID', meaning:'absence / unoccupied potential', category:'quality', detail:'Not nothing — the space before form.' },
  // CONNECTIONS
  { symbol:'⧟', name:'BRIDGE', meaning:'connection between domains', category:'connections', detail:'Cross-domain transfer of structure.' },
  { symbol:'⨝', name:'JOIN', meaning:'two streams meeting', category:'connections', detail:'Intersection, not merger.' },
  { symbol:'↔', name:'DUAL', meaning:'bidirectional relationship', category:'connections', detail:'A implies B and B implies A.' },
  // TEMPORAL
  { symbol:'⏭', name:'FORWARD', meaning:'toward consequence', category:'temporal', detail:'What this leads to.' },
  { symbol:'⏮', name:'BACKWARD', meaning:'toward cause', category:'temporal', detail:'What produced this.' },
  { symbol:'⏸', name:'PAUSE', meaning:'deliberate holding', category:'temporal', detail:'Not stasis — active waiting.' },
  { symbol:'⥀', name:'RETURN', meaning:'recursion to origin', category:'temporal', detail:'Coming back changed.' },
  // EXTENDED
  { symbol:'📡', name:'SIGNAL', meaning:'outward transmission', category:'extended', detail:'The Work reaching the world.' },
  { symbol:'✺', name:'RADIANCE', meaning:'light from inner source', category:'extended', detail:'Not reflected — generated.' },
  { symbol:'⇈', name:'ASCEND', meaning:'elevation through integration', category:'extended', detail:'Higher order, not just higher.' },
];
```

---

## Handler stubs to include

```typescript
// Add these to school.tsx state section:
const [wsTab, setWsTab] = useState<'probe'|'cement'|'glossary'>('probe');
const [wsProbeInput, setWsProbeInput] = useState('');
const [wsProbeResult, setWsProbeResult] = useState<ProbeResult | null>(null);
const [wsProbeRunning, setWsProbeRunning] = useState(false);
const [wsCementInput, setWsCementInput] = useState('');
const [wsCementResult, setWsCementResult] = useState<CementBlock | null>(null);
const [wsCementRunning, setWsCementRunning] = useState(false);
const [wsGlossarySearch, setWsGlossarySearch] = useState('');
const [wsGlossaryCategory, setWsGlossaryCategory] = useState<string>('all');
const [wsGlossaryExpanded, setWsGlossaryExpanded] = useState<string|null>(null);
```

The AI call handlers use the existing `sendMessage` / `callAI` pattern already in school.tsx.
For the deliverable, stub them as:
```typescript
async function handleProbeWorkshop(text: string) { /* same pattern as handleProbe in library.tsx */ }
async function handleCementWorkshop(text: string) { /* same pattern as handleCement in library.tsx */ }
```

---

## Deliverable format

Return a single `KIMI_SESSION_11_DELIVERABLE.md` with:
1. Updated LM_TABS array (5 items including 'workshop')
2. Updated tab bar JSX (5 tabs)
3. Complete `{lmTab === 'workshop' && (...)}` JSX block
4. State vars to add to school.tsx
5. Handler stubs (handleProbeWorkshop + handleCementWorkshop)

Do NOT return the full school.tsx — return only the replacement/addition blocks.
