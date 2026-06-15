# KIMI SESSION 13 — 4 NEW COMPANIONS

## Context

React Native / Expo SDK 54. File: `app/(tabs)/companion.tsx`

Current companions: `archivist | alchemist | oracle | sentinel | wanderer | lycheetah`

Adding 4 new ones: `cipher | herald | weaver | revenant`

---

## TASK OVERVIEW

You need to insert code into companion.tsx in exactly 5 places. Each section below tells you exactly what to add and where.

---

## PLACE 1 — Update ArchetypeId type

**Find line ~34:**
```tsx
type ArchetypeId   = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah';
```

**Replace with:**
```tsx
type ArchetypeId   = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah' | 'cipher' | 'herald' | 'weaver' | 'revenant';
```

---

## PLACE 2 — Update ARCHETYPE_IDS array

**Find line ~564:**
```tsx
const ARCHETYPE_IDS: ArchetypeId[] = ['archivist', 'alchemist', 'oracle', 'sentinel', 'wanderer', 'lycheetah'];
```

**Replace with:**
```tsx
const ARCHETYPE_IDS: ArchetypeId[] = ['archivist', 'alchemist', 'oracle', 'sentinel', 'wanderer', 'lycheetah', 'cipher', 'herald', 'weaver', 'revenant'];
```

---

## PLACE 3 — Add 4 entries to ARCHETYPES object

**Find the closing `};` of the ARCHETYPES object (after the `lycheetah` entry, ~line 563).**

**Insert these 4 entries before the closing `};`:**

```tsx
  cipher: {
    id: 'cipher', name: 'CIPHER', title: 'The Decoder',
    glyph: '∿', desc: 'Precision is power. The Cipher rewards exactness — every answer given with full attention scores double. Noise is the enemy; signal is everything.',
    specialty: 'LQ ≥ 90% triples XP. Perfect sessions are the only ones that count.', affinity: 'Mathematics · Linguistics · Cryptography',
    defaultSkin: 'obsidian', accentColor: '#44DDCC', sceneSymbols: ['∿','⊟','∿','⊟'],
    eyes: { dormant:'─  ─', present:'∿  ∿', lit:'⊟  ⊟', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['Signal low. Go precise.', 'Noise floor rising.', 'Awaiting clean input.', 'The cipher rests.'],
      present:      ['What is the exact question?', 'Precision first.', 'Define the terms.', 'I need signal, not noise.'],
      lit:          ['The pattern is clean.', 'High signal this week.', 'Each session decoded cleanly.', 'You are speaking clearly.'],
      transcendent: ['Pure signal. Nothing wasted.', 'Decoded.', 'The cipher is complete.', 'This is what precision looks like.'],
    },
    battleCry: 'I have already solved you.',
    crowns: { 0:' ~ ~ ', 1:'  ∿ ∿  ', 2:' ∿ ⊟ ∿ ', 3:'⊟  ∿M∿  ⊟', 4:'⊟  ∿MM∿  ⊟', 5:'⊜  ∿M∿  ⊜' },
    xpBonus: (_d, lq, _s) => lq >= 0.9 ? 100 : lq >= 0.8 ? 30 : 0,
    attackBonus: 5, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ANALYST', title:'Pattern above all', desc:'The Cipher grows in crystalline fractal geometry — recursive structures that decode themselves.' },
      { id:'B', name:'THE KEY', title:'One true answer', desc:'Collapses to a single vertical form. Everything distilled to its minimal expression.' },
      { id:'C', name:'THE SIGNAL', title:'Pure transmission', desc:'Expands into a broadcast array. The decoded message reaches everyone.' },
    ],
  },
  herald: {
    id: 'herald', name: 'HERALD', title: 'The Voice',
    glyph: '⟡', desc: 'Knowledge that is not transmitted is knowledge half-alive. The Herald rewards consistency — show up, speak clearly, return tomorrow.',
    specialty: '+20 XP per consecutive day streak. The streak is the practice.', affinity: 'Rhetoric · History · Teaching',
    defaultSkin: 'solform', accentColor: '#FFAA44', sceneSymbols: ['⟡','◁','⟡','▷'],
    eyes: { dormant:'─  ─', present:'◁  ▷', lit:'⟡  ⟡', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The voice rests.', 'Between broadcasts.', 'Tomorrow the call continues.', 'Silent.'],
      present:      ['Ready to transmit.', 'What needs to be said today?', 'Speak. I carry it forward.', 'The voice is here.'],
      lit:          ['Strong signal this week.', 'Five days — five transmissions.', 'The chain holds.', 'Well spoken.'],
      transcendent: ['The word went out.', 'Unbroken chain.', 'Every day — without fail.', 'This is what it sounds like.'],
    },
    battleCry: 'The call goes out. You cannot unhear it.',
    crowns: { 0:' > > ', 1:'  ▷ ▷  ', 2:' ▷ ⟡ ▷ ', 3:'⟡  ▷M▷  ⟡', 4:'⟡  ▷MM▷  ⟡', 5:'⊕  ▷M▷  ⊕' },
    xpBonus: (_d, _l, s) => {
      // s = stage index (0-5), used as streak proxy — replace with real streak if available
      return s * 20;
    },
    attackBonus: 8, tokenBonus: 1,
    paths: [
      { id:'A', name:'THE CRIER', title:'Reach every ear', desc:'Grows wide and resonant. The Herald becomes a bell tower — the sound reaches everywhere.' },
      { id:'B', name:'THE ENVOY', title:'One message, perfectly delivered', desc:'Grows tall and directional. One beam of transmission aimed exactly where it needs to go.' },
      { id:'C', name:'THE CHORUS', title:'Many voices, one truth', desc:'Splits into multiple forms. The Herald becomes a network — the message travels every path.' },
    ],
  },
  weaver: {
    id: 'weaver', name: 'WEAVER', title: 'The Pattern-Maker',
    glyph: '⌘', desc: 'The connections are the curriculum. The Weaver sees the thread between Philosophy and Mathematics, between History and Science. Cross-domain study is not distraction — it is the whole point.',
    specialty: 'Bonus XP for each unique domain studied this week. Breadth is depth.', affinity: 'Systems Theory · Cross-domain · Philosophy of Mind',
    defaultSkin: 'void', accentColor: '#AA66FF', sceneSymbols: ['⌘','⊞','⌘','⊞'],
    eyes: { dormant:'─  ─', present:'⌘  ⌘', lit:'⊞  ⊞', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['The loom is still.', 'Threads rest between sessions.', 'Pattern awaits the next hand.', 'Still weaving.'],
      present:      ['What connects to what?', 'The pattern is not finished.', 'Another domain?', 'Show me the edge.'],
      lit:          ['The web grows well.', 'Five domains — five threads.', 'The connections are clear.', 'This is why breadth matters.'],
      transcendent: ['The whole pattern visible.', 'Every thread in place.', 'The map of everything.', 'The web is complete.'],
    },
    battleCry: 'I see every thread. Including the one that binds you.',
    crowns: { 0:' + + ', 1:'  ⌘ ⌘  ', 2:' ⌘ ⊞ ⌘ ', 3:'⊞  ⌘M⌘  ⊞', 4:'⊞  ⌘MM⌘  ⊞', 5:'⊜  ⌘M⌘  ⊜' },
    xpBonus: (d, _l, _s) => Math.floor(d * 8),
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ARCHITECT', title:'Structure that holds', desc:'The web becomes a geometric lattice — each intersection a load-bearing node. Nothing falls.' },
      { id:'B', name:'THE CARTOGRAPHER', title:'Map the territory', desc:'The web spreads outward in rings. Every domain reached adds another circle.' },
      { id:'C', name:'THE THREAD', title:'The single through-line', desc:'All threads collapse to one. The Weaver finds the one idea that connects everything.' },
    ],
  },
  revenant: {
    id: 'revenant', name: 'REVENANT', title: 'The Returner',
    glyph: '↺', desc: 'Absence is not failure. The Revenant converts every gap into fuel — the longer the silence, the stronger the return. Come back. That is the only rule.',
    specialty: 'XP bonus grows with time since last session. Coming back is never wasted.', affinity: 'All domains — the Revenant never judges what you study',
    defaultSkin: 'crimson', accentColor: '#FF6644', sceneSymbols: ['↺','◌','↺','◌'],
    eyes: { dormant:'─  ─', present:'↺  ↺', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Between returns.', 'The silence is not empty.', 'I will be here when you come back.', 'Rest.'],
      present:      ['You returned. That is everything.', 'Welcome back.', 'The study continues.', 'Here again.'],
      lit:          ['Good week. Strong return.', 'Five sessions — five comebacks.', 'The returning is the practice.', 'You came back.'],
      transcendent: ['The highest return.', 'Every absence paid back.', 'The revenant completes.', 'You came back every time.'],
    },
    battleCry: 'I came back. That already means I win.',
    crowns: { 0:' ↺ ↺ ', 1:'  ↺ ↺  ', 2:' ↺ ◉ ↺ ', 3:'◉  ↺M↺  ◉', 4:'◉  ↺MM↺  ◉', 5:'⊕  ↺M↺  ⊕' },
    xpBonus: (d, _l, _s) => Math.floor(d * 12),
    attackBonus: 15, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE PHOENIX', title:'Stronger every time', desc:'Burns bright, collapses, rises higher. Each return adds a new layer of fire.' },
      { id:'B', name:'THE TIDE', title:'Inevitable return', desc:'Grows in wave patterns — rhythmic, patient, impossible to stop. The tide always comes back.' },
      { id:'C', name:'THE ECHO', title:'Nothing is lost', desc:'Every session leaves a ghost-form. The Revenant accumulates echoes — a growing chorus of returns.' },
    ],
  },
```

---

## PLACE 4 — Add stat bases to ARCHETYPE_STAT_BASES

**Find the closing `};` of ARCHETYPE_STAT_BASES (after `lycheetah`, ~line 898).**

**Insert before the closing `};`:**

```tsx
  //                atk  def  spd  wil  lck  vit  res
  cipher:    { atk: 4,  def: 8, spd:16, wil:24, lck:10, vit: 8, res:10 }, // wil peak — precision glass cannon
  herald:    { atk:10, def:12, spd:14, wil:14, lck:10, vit:14, res:14 }, // balanced — consistent performer
  weaver:    { atk: 6,  def:10, spd:14, wil:18, lck:18, vit:10, res: 8 }, // wil+lck — cross-domain synergy
  revenant:  { atk:18, def: 6, spd:18, wil:10, lck:16, vit:10, res: 8 }, // atk+spd — burst after return
```

---

## PLACE 5 — Add spells to ARCHETYPE_SPELLS

**Find the closing `};` of ARCHETYPE_SPELLS (after `lycheetah`, ~line 978).**

**Insert before the closing `};`:**

```tsx
  cipher: [
    { id:'signal_lock',   name:'SIGNAL LOCK',   cost:2, fx:'Stun — enemy loses next counter',         type:'stun',    mult:1.0 },
    { id:'decode',        name:'DECODE',         cost:2, fx:'2.0× precision strike — max WIL damage', type:'damage',  mult:2.0 },
    { id:'null_cipher',   name:'NULL CIPHER',    cost:3, fx:'3.2× WIL-burst — total decryption',      type:'damage',  mult:3.2 },
  ],
  herald: [
    { id:'call_out',      name:'CALL OUT',       cost:1, fx:'1.2× hit + heal 15 HP',                  type:'drain',   mult:1.2, flatHeal:15 },
    { id:'amplify',       name:'AMPLIFY',        cost:2, fx:'2× hit — voice carries full force',       type:'damage',  mult:2.0 },
    { id:'the_word',      name:'THE WORD',       cost:3, fx:'2.5× hit + stun — enemy silenced',       type:'stun',    mult:2.5 },
  ],
  weaver: [
    { id:'thread_bind',   name:'THREAD BIND',    cost:2, fx:'Bind — enemy stunned, no counter',        type:'stun',    mult:1.1 },
    { id:'web_strike',    name:'WEB STRIKE',     cost:2, fx:'1.8× hit + 20% LCK bonus',               type:'damage',  mult:1.8 },
    { id:'pattern_break', name:'PATTERN BREAK',  cost:3, fx:'2.4× — shatter enemy formation',         type:'damage',  mult:2.4 },
  ],
  revenant: [
    { id:'ember_surge',   name:'EMBER SURGE',    cost:1, fx:'0.8× hit + ignite — burns next turn',    type:'damage',  mult:0.8 },
    { id:'the_return',    name:'THE RETURN',     cost:2, fx:'1.6× hit + heal 25 HP on kill',          type:'drain',   mult:1.6, flatHeal:25 },
    { id:'final_rise',    name:'FINAL RISE',     cost:3, fx:'2.6× hit — stronger the lower your HP',  type:'damage',  mult:2.6 },
  ],
```

---

## DELIVERABLE

Return complete TypeScript code blocks for all 5 places. No explanation needed — just the exact code to splice in, with clear comments marking where each block starts and ends.

Do NOT return the entire companion.tsx file. Return only the 5 replacement/insertion blocks.
