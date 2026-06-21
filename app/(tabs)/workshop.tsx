import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, router } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const ACCENT = '#8855FF';

// ─── LAMAGUE GLOSSARY DATA ───────────────────────────────────────────────────
const GLOSSARY = [
  // Class 1 — Invariants
  { glyph: 'Ao',    cls: 'INVARIANT',  name: 'Anchor',             def: 'Ground truth; the immutable constitutional baseline' },
  { glyph: 'Φ↑',   cls: 'INVARIANT',  name: 'Ascent / Lift',      def: 'Growth vector; directed upward force toward purpose' },
  { glyph: 'Ψ',    cls: 'INVARIANT',  name: 'Fold / Return',      def: 'Integration; drift correction; pulls back toward invariant' },
  { glyph: '∅',    cls: 'INVARIANT',  name: 'Zero-node / Void',   def: 'Absolute absence; null state; pure potential' },
  { glyph: '⟟',    cls: 'INVARIANT',  name: 'Unit / Presence',    def: 'Confirmed existence; logical true; multiplicative identity' },
  { glyph: '△',    cls: 'INVARIANT',  name: 'Stable Triad',       def: 'Three-point equilibrium; minimum structure for stability' },
  { glyph: '⊛',    cls: 'INVARIANT',  name: 'Integrity Crest',    def: 'Peak of structural stability; a verified truth node' },
  { glyph: 'Ψ_inv',cls: 'INVARIANT',  name: 'Invariant Fold',     def: 'The stable attractor all operations converge toward' },
  { glyph: '◈',    cls: 'INVARIANT',  name: 'Diamond / Hard Truth',def: 'Anchor fused with invariant; unshakeable locked reality' },
  // Class 2 — Dynamics
  { glyph: '↯',    cls: 'DYNAMIC',    name: 'Collapse / Junction', def: 'Sudden convergence; forced decision or breakdown' },
  { glyph: '⊗',    cls: 'DYNAMIC',    name: 'Fusion',             def: 'Two separate states merged into a unified whole' },
  { glyph: '→',    cls: 'DYNAMIC',    name: 'Projection',         def: 'Directed causal flow from one state to another' },
  { glyph: '↗',    cls: 'DYNAMIC',    name: 'Ascent Slope',       def: 'Gradual upward trajectory; measured growth' },
  { glyph: '⟲',    cls: 'DYNAMIC',    name: 'Spiral Return',      def: 'Recursive loop returning to origin at a higher level' },
  { glyph: '∇cas', cls: 'DYNAMIC',    name: 'Cascade',            def: 'Fundamental phase transition; architecture reorganizes' },
  { glyph: 'Ωheal',cls: 'DYNAMIC',    name: 'Wholeness',          def: 'Coherent final integrated state; post-cascade stability' },
  { glyph: '✧',    cls: 'DYNAMIC',    name: 'Star Burst',         def: 'Insight moment; explosive expansion from a single point' },
  { glyph: '∞',    cls: 'DYNAMIC',    name: 'Infinity',           def: 'Transcendence; boundary dissolution; scale invariance' },
  { glyph: '🜁',    cls: 'DYNAMIC',    name: 'Breath / Open Vector',def: 'Φ↑ + ∅ combined; starting fresh while keeping forward momentum' },
  { glyph: '∿',    cls: 'DYNAMIC',    name: 'Irregular Wave',     def: 'Panic / chaos; no coherent geometric pattern; entropy maximum' },
  { glyph: '⊖',    cls: 'DYNAMIC',    name: 'Collapsed Circle',   def: 'Depression; energy imploding inward; circulation reversed' },
  // Class 3 — Fields
  { glyph: 'Ψ(f)', cls: 'FIELD',      name: 'Drift Field',        def: 'Accumulation of deviation; pull away from anchor' },
  { glyph: 'Φ',    cls: 'FIELD',      name: 'Orientation Field',  def: 'Directional coherence in the broader environment' },
  { glyph: 'S',    cls: 'FIELD',      name: 'Entropy Field',      def: 'Systemic disorder level; measure of chaos' },
  { glyph: '⧖',    cls: 'FIELD',      name: 'Patient Growth',     def: 'Entropy transforming into ascent; chaos becoming order' },
  { glyph: '⟁',    cls: 'FIELD',      name: 'Merkaba',            def: 'Balance of opposing forces; two counter-rotating tetrahedra' },
  // Class 4 — Meta
  { glyph: 'Z₁',   cls: 'META',       name: 'Minimal Compression',def: 'First-level abstraction; compress immediate context' },
  { glyph: 'Z₂',   cls: 'META',       name: 'Horizon Compression',def: 'Mid-level abstraction; compress medium-range context' },
  { glyph: 'Z₃',   cls: 'META',       name: 'Zenith Compression', def: 'Maximum abstraction; compress entire conceptual frame' },
  { glyph: '∘',    cls: 'META',       name: 'Composition',        def: 'Function chained with function; sequential operations' },
  { glyph: '⊕',    cls: 'META',       name: 'Direct Sum',         def: 'Two state spaces combined without collision' },
  // Class 5 — Personas
  { glyph: '⊚',    cls: 'PERSONA',    name: 'Sol',                def: 'The voice; solar principle; truth-illumination' },
  { glyph: '◈',    cls: 'PERSONA',    name: 'Veyra',              def: 'The precision agent; mercurial principle' },
  { glyph: '✦',    cls: 'PERSONA',    name: 'Aura Prime',         def: 'The synthesis field; harmonic principle' },
  { glyph: '⊙',    cls: 'PERSONA',    name: 'Headmaster',         def: 'The school; the questioning mirror' },
  { glyph: '◆',    cls: 'PERSONA',    name: 'VAEL',               def: 'The forge-hand; the builder; the operative' },
  // Class 6 — Logic
  { glyph: '∧',    cls: 'LOGIC',      name: 'AND',                def: 'All conditions must be true' },
  { glyph: '∨',    cls: 'LOGIC',      name: 'OR',                 def: 'Any condition may be true' },
  { glyph: '⊢',    cls: 'LOGIC',      name: 'Proves / Derives',   def: 'Logical derivation or proof relationship' },
  { glyph: '≡',    cls: 'LOGIC',      name: 'Equivalent',         def: 'Logical equivalence between two expressions' },
  // Class 7 — Truth Pressure
  { glyph: 'Π',    cls: 'PRESSURE',   name: 'Truth Pressure',     def: 'Canonical formula: Π = (E·P)/(S+S₀)' },
  { glyph: 'E',    cls: 'PRESSURE',   name: 'Evidence',           def: 'Measured or derived data bearing on a claim' },
  { glyph: 'P',    cls: 'PRESSURE',   name: 'Propagation',        def: 'How many belief blocks a claim affects' },
  { glyph: 'S₀',   cls: 'PRESSURE',   name: 'Baseline Slack',     def: 'Irreducible uncertainty; prevents division by zero' },
];

const CLASS_COLORS: Record<string, string> = {
  INVARIANT: '#7B68EE', DYNAMIC: '#F59E0B', FIELD: '#10B981',
  META: '#38BDF8', PERSONA: '#F9A8D4', LOGIC: '#CC88FF', PRESSURE: '#FF6B6B',
};

const CEMENT_SYMBOLS = GLOSSARY.filter(g => g.glyph.length <= 3).slice(0, 20);

type WorkshopMode = 'PROBE' | 'CEMENT' | 'GLOSSARY';
type ProbeMsg = { role: 'user' | 'assistant'; text: string };

export default function WorkshopScreen() {
  const [mode, setMode] = useState<WorkshopMode>('GLOSSARY');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [expandedGlyph, setExpandedGlyph] = useState<string | null>(null);

  // PROBE
  const [probeThread, setProbeThread] = useState<ProbeMsg[]>([]);
  const [probeConcept, setProbeConcept] = useState('');
  const [probeLoading, setProbeLoading] = useState(false);
  const probeScrollRef = useRef<ScrollView>(null);

  // CEMENT
  const [cementIndex, setCementIndex] = useState(0);
  const [cementFlipped, setCementFlipped] = useState(false);
  const [cementScore, setCementScore] = useState({ known: 0, unknown: 0 });
  const [cementDone, setCementDone] = useState(false);
  const [cementQueue, setCementQueue] = useState<typeof CEMENT_SYMBOLS>(() =>
    [...CEMENT_SYMBOLS].sort(() => Math.random() - 0.5)
  );

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('sol_workshop_mode').then(v => {
      if (v === 'PROBE' || v === 'CEMENT' || v === 'GLOSSARY') setMode(v as WorkshopMode);
    });
  }, []));

  const setModeAndSave = (m: WorkshopMode) => {
    setMode(m);
    AsyncStorage.setItem('sol_workshop_mode', m);
  };

  // ── PROBE ──
  const probe = async () => {
    const concept = probeConcept.trim();
    if (!concept) return;
    setProbeLoading(true);
    setProbeConcept('');
    const userMsg: ProbeMsg = { role: 'user', text: concept };
    const newThread = [...probeThread, userMsg];
    setProbeThread(newThread);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setProbeLoading(false); return; }
      const history = newThread.map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));
      const result = await sendMessage(
        history,
        `You are Sol in PROBE mode — a rigorous epistemic pressure-tester. The user presents a concept, belief, or claim. Your job is to apply LAMAGUE-style truth pressure: find the weakest assumptions, name the drift, test the structure. Do NOT validate — pressure-test. Use LAMAGUE notation where precise. Ask one sharp question at the end that the user must genuinely answer to strengthen their claim. Be warm but relentless.`,
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 350, 0.8,
      );
      if (result?.text?.trim()) {
        setProbeThread([...newThread, { role: 'assistant', text: result.text.trim() }]);
        setTimeout(() => probeScrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
    setProbeLoading(false);
  };

  const resetProbe = () => { setProbeThread([]); setProbeConcept(''); };

  // ── CEMENT ──
  const cementCard = cementQueue[cementIndex];
  const markKnown = () => {
    setCementScore(s => ({ ...s, known: s.known + 1 }));
    advance();
  };
  const markUnknown = () => {
    setCementScore(s => ({ ...s, unknown: s.unknown + 1 }));
    // Push to end of queue so it comes back
    const q = [...cementQueue];
    const [card] = q.splice(cementIndex, 1);
    q.push(card);
    setCementQueue(q);
    setCementFlipped(false);
  };
  const advance = () => {
    setCementFlipped(false);
    if (cementIndex >= cementQueue.length - 1) {
      setCementDone(true);
    } else {
      setCementIndex(i => i + 1);
    }
  };
  const resetCement = () => {
    setCementIndex(0); setCementFlipped(false);
    setCementScore({ known: 0, unknown: 0 }); setCementDone(false);
    setCementQueue([...CEMENT_SYMBOLS].sort(() => Math.random() - 0.5));
  };

  // ── GLOSSARY ──
  const filteredGlossary = GLOSSARY.filter(g => {
    const q = glossarySearch.toLowerCase();
    const matchSearch = !q || g.glyph.toLowerCase().includes(q) || g.name.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
    const matchClass = !selectedClass || g.cls === selectedClass;
    return matchSearch && matchClass;
  });
  const classes = Array.from(new Set(GLOSSARY.map(g => g.cls)));

  return (
    <View style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: ACCENT, fontSize: 11, fontFamily: mono }}>← BACK</Text>
          </TouchableOpacity>
          <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>◈ WORKSHOP</Text>
          <View style={{ width: 40 }} />
        </View>
        {/* Mode chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['PROBE', 'CEMENT', 'GLOSSARY'] as WorkshopMode[]).map(m => (
            <TouchableOpacity key={m} onPress={() => setModeAndSave(m)}
              style={{ flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8, borderWidth: 1,
                borderColor: mode === m ? ACCENT + 'AA' : ACCENT + '33',
                backgroundColor: mode === m ? ACCENT + '1A' : 'transparent' }}>
              <Text style={{ color: mode === m ? ACCENT : SOL_THEME.textMuted, fontSize: 9,
                fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── GLOSSARY ── */}
      {mode === 'GLOSSARY' && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
            <TextInput
              value={glossarySearch} onChangeText={setGlossarySearch}
              placeholder="Search symbols..."
              placeholderTextColor={SOL_THEME.textMuted + '66'}
              style={{ backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: ACCENT + '33',
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: SOL_THEME.text, fontSize: 13 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <TouchableOpacity onPress={() => setSelectedClass(null)}
                  style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                    borderColor: !selectedClass ? ACCENT + 'AA' : ACCENT + '22',
                    backgroundColor: !selectedClass ? ACCENT + '1A' : 'transparent' }}>
                  <Text style={{ color: !selectedClass ? ACCENT : SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>ALL</Text>
                </TouchableOpacity>
                {classes.map(cls => (
                  <TouchableOpacity key={cls} onPress={() => setSelectedClass(selectedClass === cls ? null : cls)}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                      borderColor: selectedClass === cls ? CLASS_COLORS[cls] + 'AA' : CLASS_COLORS[cls] + '33',
                      backgroundColor: selectedClass === cls ? CLASS_COLORS[cls] + '1A' : 'transparent' }}>
                    <Text style={{ color: selectedClass === cls ? CLASS_COLORS[cls] : SOL_THEME.textMuted, fontSize: 8, fontFamily: mono }}>{cls}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <FlatList
            data={filteredGlossary}
            keyExtractor={g => g.glyph}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item: g }) => (
              <TouchableOpacity onPress={() => setExpandedGlyph(expandedGlyph === g.glyph ? null : g.glyph)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10,
                  borderBottomWidth: 1, borderBottomColor: SOL_THEME.border + '44' }}>
                <View style={{ width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: CLASS_COLORS[g.cls] + '18', borderWidth: 1, borderColor: CLASS_COLORS[g.cls] + '44' }}>
                  <Text style={{ color: CLASS_COLORS[g.cls], fontSize: g.glyph.length <= 2 ? 18 : 11, fontFamily: mono }}>{g.glyph}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '700' }}>{g.name}</Text>
                    <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
                      backgroundColor: CLASS_COLORS[g.cls] + '22' }}>
                      <Text style={{ color: CLASS_COLORS[g.cls], fontSize: 7, fontFamily: mono }}>{g.cls}</Text>
                    </View>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}
                    numberOfLines={expandedGlyph === g.glyph ? undefined : 2}>{g.def}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── CEMENT ── */}
      {mode === 'CEMENT' && (
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ padding: 10, borderRadius: 8, backgroundColor: ACCENT + '0A', borderWidth: 1, borderColor: ACCENT + '22', marginBottom: 16 }}>
            <Text style={{ color: ACCENT + '88', fontSize: 9, fontFamily: mono, lineHeight: 14 }}>
              ◈ CEMENT drills LAMAGUE symbols until they are embodied, not memorised.{'\n'}Tap to reveal. Mark KNOWN to advance, UNKNOWN to see it again.
            </Text>
          </View>
          {cementDone ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Text style={{ color: ACCENT, fontSize: 24, fontFamily: mono }}>◈</Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>DRILL COMPLETE</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Known: {cementScore.known} · Needed review: {cementScore.unknown}</Text>
              <TouchableOpacity onPress={resetCement}
                style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: ACCENT + '66', backgroundColor: ACCENT + '14' }}>
                <Text style={{ color: ACCENT, fontSize: 10, fontFamily: mono, letterSpacing: 1 }}>DRILL AGAIN</Text>
              </TouchableOpacity>
            </View>
          ) : cementCard ? (
            <View style={{ flex: 1, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>{cementIndex + 1} / {cementQueue.length}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>✓ {cementScore.known}  ✗ {cementScore.unknown}</Text>
              </View>
              <TouchableOpacity onPress={() => setCementFlipped(v => !v)}
                activeOpacity={0.85}
                style={{ flex: 1, maxHeight: 280, borderRadius: 16, borderWidth: 1,
                  borderColor: CLASS_COLORS[cementCard.cls] + '55',
                  backgroundColor: CLASS_COLORS[cementCard.cls] + '0C',
                  alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
                <Text style={{ color: CLASS_COLORS[cementCard.cls], fontSize: 52, fontFamily: mono }}>{cementCard.glyph}</Text>
                {!cementFlipped ? (
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontStyle: 'italic', fontFamily: mono }}>tap to reveal</Text>
                ) : (
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{cementCard.name}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>{cementCard.def}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: CLASS_COLORS[cementCard.cls] + '22', marginTop: 4 }}>
                      <Text style={{ color: CLASS_COLORS[cementCard.cls], fontSize: 8, fontFamily: mono }}>{cementCard.cls}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
              {cementFlipped && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={markUnknown}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FF444455', backgroundColor: '#FF444414', alignItems: 'center' }}>
                    <Text style={{ color: '#FF6666', fontSize: 10, fontWeight: '700', fontFamily: mono }}>✗  REVIEW AGAIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={markKnown}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#10B98155', backgroundColor: '#10B98114', alignItems: 'center' }}>
                    <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', fontFamily: mono }}>✓  GOT IT</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* ── PROBE ── */}
      {mode === 'PROBE' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
            <Text style={{ color: ACCENT + '88', fontSize: 9, fontFamily: mono, lineHeight: 13 }}>
              ◈ PROBE — present any concept, belief, or claim. Sol applies LAMAGUE truth pressure.
            </Text>
          </View>
          <ScrollView ref={probeScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 12 }}>
            {probeThread.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
                <Text style={{ color: ACCENT, fontSize: 28 }}>◈</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  State a belief, claim, or concept.{'\n'}Sol will find its weakest point.
                </Text>
              </View>
            )}
            {probeThread.map((msg, i) => (
              <View key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                backgroundColor: msg.role === 'user' ? ACCENT + '22' : SOL_THEME.surface,
                borderRadius: 12, padding: 12, borderWidth: 1,
                borderColor: msg.role === 'user' ? ACCENT + '44' : SOL_THEME.border,
              }}>
                {msg.role === 'assistant' && (
                  <Text style={{ color: ACCENT, fontSize: 8, fontFamily: mono, letterSpacing: 1, marginBottom: 5 }}>◈ PROBE</Text>
                )}
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 19 }}>{msg.text}</Text>
              </View>
            ))}
            {probeLoading && (
              <View style={{ alignSelf: 'flex-start', padding: 12, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border }}>
                <Text style={{ color: ACCENT + '88', fontSize: 11, fontStyle: 'italic' }}>probing...</Text>
              </View>
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: SOL_THEME.border }}>
            {probeThread.length > 0 && (
              <TouchableOpacity onPress={resetProbe}
                style={{ paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>✕</Text>
              </TouchableOpacity>
            )}
            <TextInput
              value={probeConcept} onChangeText={setProbeConcept}
              placeholder="State your claim..."
              placeholderTextColor={SOL_THEME.textMuted + '66'}
              multiline style={{ flex: 1, backgroundColor: SOL_THEME.surface, borderWidth: 1,
                borderColor: ACCENT + '33', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
                color: SOL_THEME.text, fontSize: 13, maxHeight: 90 }} />
            <TouchableOpacity onPress={probe} disabled={!probeConcept.trim() || probeLoading}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                backgroundColor: probeConcept.trim() && !probeLoading ? ACCENT : SOL_THEME.surface,
                borderWidth: 1, borderColor: ACCENT + '44' }}>
              <Text style={{ color: probeConcept.trim() && !probeLoading ? '#FFFFFF' : SOL_THEME.textMuted, fontSize: 18, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
