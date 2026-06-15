# KIMI SESSION 10 — Library Tab Rebuild (Cicada Tool)

## What this session produces
A single file: `KIMI_SESSION_10_DELIVERABLE.md`

The Library tab currently has 5 tabs: forge · cascade · truth · probe · cementer
We want to rebuild it down to 3 clean tabs: **CASCADE SCORE · Π TRUTH PRESSURE · EXPLORE**
- Remove PROBE and CEMENTER tabs from Library entirely (they're moving to LAMAGUE School in a later session)
- Add a "CICADA" synthesis view that bridges CASCADE and Π — but keep it as a button inside the Π tab, not a separate tab
- Clean up the tab bar

---

## Current tab bar (library.tsx line ~190)

```tsx
// Tab bar currently renders these 5:
const TABS = [
  { id: 'forge',    label: '⚗',     title: 'FORGE'   },
  { id: 'cascade',  label: 'SCORE',  title: 'CASCADE' },
  { id: 'truth',    label: 'Π',      title: 'TRUTH'   },
  { id: 'probe',    label: 'PROBE',  title: 'PROBE'   },
  { id: 'cementer', label: '◈',      title: 'CEMENT'  },
];
```

Replace with:
```tsx
const TABS = [
  { id: 'cascade', label: 'SCORE', title: 'CASCADE' },
  { id: 'truth',   label: 'Π',     title: 'TRUTH'   },
  { id: 'explore', label: '◬',     title: 'EXPLORE' },
];
```

---

## Current view type (library.tsx)

```typescript
type LibView = 'forge' | 'cascade' | 'truth' | 'probe' | 'cementer' | 'glossary';
```

Replace with:
```typescript
type LibView = 'cascade' | 'truth' | 'explore';
```

---

## State vars to REMOVE (no longer needed in Library)

Remove these entirely from library.tsx:
```typescript
// REMOVE:
const [probeInput, setProbeInput] = useState('');
const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
const [probeRunning, setProbeRunning] = useState(false);
const [probeError, setProbeError] = useState('');

const [cementInput, setCementInput] = useState('');
const [cementResult, setCementResult] = useState<CementBlock | null>(null);
const [cementRunning, setCementRunning] = useState(false);
const [cementError, setCementError] = useState('');

const [invExpanded, setInvExpanded] = useState<string | null>(null);
const [glossarySearch, setGlossarySearch] = useState('');
const [glossaryExpanded, setGlossaryExpanded] = useState<string | null>(null);
const [glossaryCategory, setGlossaryCategory] = useState<string>('all');
```

Keep all CASCADE state vars (`cascadeInput`, `cascadeResult`, `cascadeRunning`, `cascadeError`) and all TRUTH PRESSURE state vars (`truthInput`, `truthResult`, `truthRunning`, `truthError`).

---

## New EXPLORE tab view

Replace the old probe/cement/forge views with a single Explore tab:

```tsx
{activeTab === 'explore' && (
  <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>
    
    {/* What is this Library? */}
    <View style={{ marginBottom:20, padding:16, borderRadius:14, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}>
      <Text style={{ color:'#6B7DB3', fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:8 }}>LYCHEETAH LIBRARY</Text>
      <Text style={{ color:SOL_THEME.text, fontSize:14, fontWeight:'700', marginBottom:8 }}>Tools for thinking clearly</Text>
      <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18 }}>
        CASCADE scores the epistemic structure of any text. Truth Pressure Π measures the weight of a belief against the evidence holding it. Use them together to see what survives scrutiny.
      </Text>
    </View>

    {/* Quick-start cards */}
    {[
      { icon:'◈', title:'CASCADE Score', desc:'Paste any text — get a structural breakdown of its epistemic quality, contradictions, and claim density.', onPress:() => setActiveTab('cascade') },
      { icon:'Π', title:'Truth Pressure', desc:'Enter a belief or hypothesis. Get E, P, S, S₀ readings + which critical regime (CR1–CR4) it sits in.', onPress:() => setActiveTab('truth') },
    ].map(card => (
      <TouchableOpacity key={card.title} onPress={card.onPress}
        style={{ flexDirection:'row', gap:14, marginBottom:12, padding:16, borderRadius:14, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}
        activeOpacity={0.7}>
        <Text style={{ fontSize:24, width:32, textAlign:'center', marginTop:2 }}>{card.icon}</Text>
        <View style={{ flex:1 }}>
          <Text style={{ color:SOL_THEME.text, fontSize:13, fontWeight:'700', marginBottom:4 }}>{card.title}</Text>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:11, lineHeight:17 }}>{card.desc}</Text>
        </View>
        <Text style={{ color:'#333344', fontSize:18, alignSelf:'center' }}>›</Text>
      </TouchableOpacity>
    ))}

    {/* LAMAGUE School link */}
    <View style={{ marginTop:8, padding:16, borderRadius:14, borderWidth:1, borderColor:'#1A2A1A', backgroundColor:'#08100A' }}>
      <Text style={{ color:'#3A6A3A', fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>LAMAGUE SCHOOL</Text>
      <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:17 }}>
        The LAMAGUE language, drills, glyphbook, paradox probe, and cement tool live in the School tab (𝔏).
      </Text>
    </View>

  </ScrollView>
)}
```

---

## Add CICADA synthesis button inside the Π TRUTH PRESSURE view

At the bottom of the truth result section (after the regime badge, before the claims list), add:

```tsx
{/* CICADA — run CASCADE on the same text */}
{truthResult && (
  <TouchableOpacity
    onPress={() => { setCascadeInput(truthInput); setActiveTab('cascade'); }}
    style={{ marginTop:12, padding:12, borderRadius:10, borderWidth:1,
      borderColor:'#2A2A4A', backgroundColor:'#0A0A1A',
      flexDirection:'row', alignItems:'center', gap:10 }}>
    <Text style={{ fontSize:18 }}>⧖</Text>
    <View style={{ flex:1 }}>
      <Text style={{ color:'#6B7DB3', fontSize:11, fontWeight:'700', fontFamily:mono }}>CICADA SYNTHESIS</Text>
      <Text style={{ color:SOL_THEME.textMuted, fontSize:10, marginTop:2 }}>Send this text to CASCADE for structural scoring</Text>
    </View>
    <Text style={{ color:'#333344', fontSize:16 }}>›</Text>
  </TouchableOpacity>
)}
```

This requires `setCascadeInput` to be accessible — it already is since both live in the same component.

---

## Remove the GLOSSARY section entirely from library.tsx

The LAMAGUE_SYMBOLS const and all glossary rendering code can be removed. The glossary moves to school.tsx in a later session.

---

## Default tab on mount

Change the default active tab from `'forge'` (or whatever it is) to `'cascade'`:

```tsx
const [activeTab, setActiveTab] = useState<LibView>('cascade');
```

---

## Deliverable format

Return a single `KIMI_SESSION_10_DELIVERABLE.md` containing:
1. The complete new TABS array (3 items)
2. The complete new EXPLORE tab JSX (ready to paste as a block)
3. The CICADA synthesis button JSX (paste inside truth result section)
4. A list of the state vars to delete and the view render blocks to delete (by their `{activeTab === 'xxx'}` guard)

Do NOT return the full library.tsx — return only the replacement blocks.
