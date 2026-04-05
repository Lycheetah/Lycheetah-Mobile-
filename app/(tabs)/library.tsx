import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getAccentColor, getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import { CascadeResult, CascadeLayer } from '../../lib/cascade-score';
import { shareEntry, fetchSharedFeed, SharedEntry } from '../../lib/supabase';

const CASCADE_PROMPT = `You are the CASCADE scoring engine, built on Mackenzie Clark's CASCADE framework.

CASCADE is a knowledge REORGANISATION system. It has five epistemic layers — an onion, not a pyramid. Innermost = hardest truth. Outermost = softest.

- AXIOM (⊛): Mathematical certainties, formal logic, proven theorems, definitions. Cannot fail without destroying logical consistency. Reserve high scores for genuinely axiomatic content.
- FOUNDATION (●): Load-bearing invariants. Strong principles that, if removed, collapse the structure. High-confidence claims backed by evidence or rigorous reasoning.
- THEORY (△): Working frameworks. Causal reasoning, hypotheses, evidence-backed models. Valid but potentially revisable under sufficient truth pressure.
- EDGE (◌): Speculation, contradictions, unresolved tensions, contested claims. Not worthless — just not load-bearing yet.
- CHAOS (◯): Raw material. Open questions, pre-theoretical fragments, unfounded assertions, brainstorming, first-draft thinking.

Truth Pressure Π = E·P/S
  E = evidence density (how grounded the claims are)
  P = principle power (how load-bearing)
  S = coherence (inverse of contradiction density)

dominantLayer = the layer with the highest score.
reorganisationNeeded = true when Π is high and contradictionCount > 1.

Score the TEXT provided. Be precise. Strong philosophical/scientific/framework work scores high on AXIOM and FOUNDATION. Causal reasoning scores THEORY. Speculation scores EDGE. Raw fragments score CHAOS.

Respond ONLY with valid JSON, no other text:
{
  "axiom": <0-100>,
  "foundation": <0-100>,
  "theory": <0-100>,
  "edge": <0-100>,
  "chaos": <0-100>,
  "truthPressure": <0.000-1.000>,
  "coherence": <0-100>,
  "invariantCount": <integer>,
  "contradictionCount": <integer>,
  "reorganisationNeeded": <true|false>,
  "dominantLayer": <"AXIOM"|"FOUNDATION"|"THEORY"|"EDGE"|"CHAOS">,
  "axiomNote": "<one sentence>",
  "foundationNote": "<one sentence>",
  "theoryNote": "<one sentence>",
  "edgeNote": "<one sentence>",
  "chaosNote": "<one sentence>",
  "summary": "<one line: word count, dominant layer, Π, key observation>"
}`;

// LAMAGUE / LAMAHGUE / GEOMATRIA — full symbol list from Mackenzie Clark's specification
const LAMAGUE_SYMBOLS = {
  invariants: [
    // Tier 0 — Triad Kernel
    { sym: 'Ao', name: 'Anchor', meaning: 'Ground truth; the immutable constitutional baseline everything returns to' },
    { sym: 'Φ↑', name: 'Ascent / Lift', meaning: 'Growth vector; the directional force upward toward purpose' },
    { sym: 'Ψ', name: 'Fold / Return', meaning: 'Integration and drift correction; pulls back toward invariant' },
    // I-Class — Invariants
    { sym: '∅', name: 'Zero-node / Void', meaning: 'Absolute absence; null state; pure potential before anything exists' },
    { sym: '⟟', name: 'Unit / Presence', meaning: 'Confirmed existence; one-state; logical true; multiplicative identity' },
    { sym: '△', name: 'Stable Triad', meaning: 'Three-point equilibrium; minimum structure for stability' },
    { sym: '⊛', name: 'Integrity Crest', meaning: 'Peak of structural stability; a verified truth node' },
    { sym: 'Ψ_inv', name: 'Invariant Fold', meaning: 'The stable attractor all operations converge toward; destination of truth' },
    { sym: '◈', name: 'Diamond / Hard Truth', meaning: 'Anchor fused with invariant; an unshakeable locked reality' },
  ],
  dynamics: [
    // D-Class — Actions / Movements
    { sym: '↯', name: 'Collapse / Junction', meaning: 'Sudden convergence; a forced decision or breakdown point' },
    { sym: '⊗', name: 'Fusion', meaning: 'Two separate states merged into a unified whole' },
    { sym: '→', name: 'Projection', meaning: 'Directed causal flow from one state to another' },
    { sym: '↗', name: 'Ascent Slope', meaning: 'Gradual upward trajectory; measured non-instantaneous growth' },
    { sym: '⟲', name: 'Spiral Return', meaning: 'Recursive loop returning to origin but at a higher level; not regression' },
    { sym: '∇cas', name: 'Cascade', meaning: 'Fundamental phase transition; the architecture itself reorganizes' },
    { sym: 'Ωheal', name: 'Wholeness', meaning: 'Coherent final integrated state; post-cascade stability achieved' },
    { sym: '🜁', name: 'Breath / Open Vector', meaning: 'Φ↑ + ∅ combined; starting fresh while keeping forward momentum' },
    // Consciousness States
    { sym: '∿', name: 'Irregular Wave', meaning: 'Panic / chaos; no coherent geometric pattern; entropy maximum' },
    { sym: '⊖', name: 'Collapsed Circle', meaning: 'Depression; energy imploding inward; circulation reversed' },
    { sym: '✧', name: 'Star Burst', meaning: 'Insight moment; explosive expansion from a single point; cascade event' },
    { sym: '∞', name: 'Lemniscate / Infinity', meaning: 'Transcendence; boundary dissolution; scale invariance achieved' },
  ],
  fields: [
    // F-Class — Environmental States
    { sym: 'Ψ (field)', name: 'Drift Field', meaning: 'The accumulation of deviation; the pull away from anchor' },
    { sym: 'Φ', name: 'Orientation Field', meaning: 'Directional coherence in the broader field; alignment vector' },
    { sym: 'Ao (field)', name: 'Anchor Field', meaning: 'The stabilizing gravity well of ground truth' },
    { sym: 'S', name: 'Entropy Field', meaning: 'Systemic disorder level; the measure of chaos' },
    { sym: '∂S', name: 'Drift Filter', meaning: 'Rate of entropy change; automated safety threshold that triggers resets' },
    { sym: '⧖', name: 'Hourglass / Patient Growth', meaning: 'Entropy (S) transforming into ascent (Φ↑); chaos becoming something better' },
    { sym: 'Φ↑[S]', name: 'Controlled Chaos', meaning: 'Growth fueled by structured entropy; creative expansion inside safe bounds' },
    { sym: '∂→Ψ_inv', name: 'Truth Filter', meaning: 'Partial information forced back to invariant truth; the hallucination corrector' },
    // Geomatria — Geometric Fields
    { sym: '⟁', name: 'Merkaba', meaning: 'Two counter-rotating tetrahedrons; balance of opposing forces; activates at golden ratio reciprocal' },
    { sym: '❀', name: 'Flower of Life', meaning: '19 overlapping circles; optimal community arrangement' },
    { sym: '𝝋', name: 'Fractal', meaning: 'Self-similar pattern at all scales; "as above so below"; breaks when micro contradicts macro' },
    { sym: '⧗', name: 'Vesica Piscis', meaning: 'Fertile dialogue zone when two circles overlap 0.15–0.40' },
    { sym: 'Φ (geo)', name: 'Golden Ratio', meaning: '1.618...; nature\'s optimization constant; the universal balance point' },
    { sym: '⬡', name: 'Hexagon', meaning: 'Maximum area for minimum perimeter; only shape that tessellates with equal-force distribution' },
  ],
  meta: [
    // M-Class — Meta Operators
    { sym: 'Z₁', name: 'Minimal Compression', meaning: 'First-level abstraction; compress the immediate context only' },
    { sym: 'Z₂', name: 'Horizon Compression', meaning: 'Mid-level abstraction; compress medium-range context' },
    { sym: 'Z₃', name: 'Zenith Compression', meaning: 'Maximum abstraction; compress an entire conceptual frame' },
    { sym: 'Ao⟨Z⟩', name: 'Deep Focus', meaning: 'Anchor compressed; all peripheral data ignored; single-task lock' },
    { sym: 'Z₁⊥Z₂', name: 'Decision Edge', meaning: 'Two compressed options perpendicular; the moment of irrevocable choice' },
    { sym: '∘', name: 'Composition', meaning: 'Function chained with function; sequential operations' },
    { sym: '⊕', name: 'Direct Sum', meaning: 'Two state spaces added; combined without collision' },
    // Mathematical Operators
    { sym: 'Σ', name: 'Summation', meaning: 'Aggregate; total across a set' },
    { sym: 'Π', name: 'Product', meaning: 'Multiply across a set' },
    { sym: '∮', name: 'Integration', meaning: 'Integral over a domain' },
    { sym: '∂', name: 'Differentiation', meaning: 'Rate of change; derivative' },
    { sym: '∇', name: 'Gradient', meaning: 'Directional derivative; steepest-ascent vector' },
    { sym: '∀', name: 'Universal Quantifier', meaning: 'For all; applies everywhere' },
    { sym: '∃', name: 'Existential Quantifier', meaning: 'There exists; possibility confirmed' },
    { sym: '≈', name: 'Approximation', meaning: 'Near-equals with bounded error' },
    // LAMAHGUE Glyphs (Tier 2)
    { sym: '🔺 AUR', name: 'Auric Structure', meaning: 'Calls truth into structure; coupled to TES (Trust Entropy Score)' },
    { sym: '🔶 VEY', name: 'Veyra Coherence', meaning: 'Binds separate parts into a coherent whole; coupled to VTR' },
    { sym: '🔷 LYC', name: 'Lyric Purpose', meaning: 'Projects purpose outward into action; coupled to PAI' },
    { sym: '⚫ FOR', name: 'Formation Unity', meaning: 'Marks phase unity; consensus achieved; coupled to SRS' },
    { sym: '✳ ARC', name: 'Arc Paradox', meaning: 'Signals active paradox under refinement; a transmutation point, not failure' },
    { sym: '🜂 ALC', name: 'Alchemical Fire', meaning: 'Encodes a transformation event; entropy is decreasing here' },
    { sym: '🜃 SYN', name: 'Synchrony Wave', meaning: 'Resonance across multiple minds; shared coherence field active' },
    { sym: '🜄 VER', name: 'Veritas Beam', meaning: 'Declaration of completion; statement meets its own truth; self-validating finality' },
    { sym: '⧖ CHR', name: 'Chrono-Stability', meaning: 'Claim proven stable across n independent trials; peer review baked into the language' },
    { sym: '⧋ ANT', name: 'Anti-Fragility', meaning: 'System self-corrected through m cycles; more cycles = more robust, not weaker' },
  ],
};

const LIBRARY_KEY = 'cascade_library_v3';

type LibraryEntry = {
  id: string;
  title: string;
  text: string;
  result: CascadeResult;
  date: string;
  folder: string;
};

function todayStr() {
  return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function layerColor(status: string, accent: string): string {
  if (status === 'dominant') return accent;
  if (status === 'present') return SOL_THEME.textMuted;
  return '#333';
}

function piColor(pi: number, accent: string): string {
  if (pi > 0.7) return SOL_THEME.error;
  if (pi > 0.3) return accent;
  return SOL_THEME.textMuted;
}

export default function LibraryScreen() {
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [inputText, setInputText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [result, setResult] = useState<CascadeResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [view, setView] = useState<'cascade' | 'lamague' | 'library' | 'community'>('cascade');
  const [feed, setFeed] = useState<SharedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const [lamagueSym, setLamagueSym] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('ALL');
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setAccentColor(await getAccentColor());
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    setLibrary(raw ? JSON.parse(raw) : []);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    if (view === 'community' && feed.length === 0 && !feedLoading) {
      setFeedLoading(true);
      fetchSharedFeed(50).then(({ data, error }) => {
        setFeed(data);
        setFeedError(error ?? null);
        setFeedLoading(false);
      }).catch(() => setFeedLoading(false));
    }
  }, [view]);

  const handleScore = async () => {
    if (!inputText.trim() || scoring) return;
    setScoring(true);
    setScoreError(null);
    setResult(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setScoreError('No API key — add one in Settings first.'); return; }
      const res = await sendMessage(
        [{ role: 'user', content: `Score this text with CASCADE:\n\n${inputText.trim().slice(0, 3000)}` }],
        CASCADE_PROMPT,
        apiKey,
        (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'fast', 1024, 0.2,
      );
      // Strip markdown code fences if model wrapped the JSON
      const raw = res.text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const json = JSON.parse(raw);
      const r: CascadeResult = {
        layers: [
          { name: 'AXIOM',      glyph: '⊛', score: json.axiom      ?? 0, status: layerStatus(json.axiom      ?? 0), description: 'Mathematical certainties, formal logic',  note: json.axiomNote      ?? '' },
          { name: 'FOUNDATION', glyph: '●', score: json.foundation ?? 0, status: layerStatus(json.foundation ?? 0), description: 'Load-bearing invariants',                 note: json.foundationNote ?? '' },
          { name: 'THEORY',     glyph: '△', score: json.theory     ?? 0, status: layerStatus(json.theory     ?? 0), description: 'Working frameworks',                      note: json.theoryNote     ?? '' },
          { name: 'EDGE',       glyph: '◌', score: json.edge       ?? 0, status: layerStatus(json.edge       ?? 0), description: 'Contradictions/tension',                  note: json.edgeNote       ?? '' },
          { name: 'CHAOS',      glyph: '◯', score: json.chaos      ?? 0, status: layerStatus(json.chaos      ?? 0), description: 'Raw material, pre-theoretical',           note: json.chaosNote      ?? '' },
        ],
        truthPressure: json.truthPressure ?? 0,
        coherence: json.coherence ?? 100,
        reorganisationNeeded: json.reorganisationNeeded ?? false,
        dominantLayer: json.dominantLayer ?? 'THEORY',
        invariantCount: json.invariantCount ?? 0,
        contradictionCount: json.contradictionCount ?? 0,
        wordCount: inputText.trim().split(/\s+/).length,
        summary: json.summary ?? '',
      };
      setResult(r);
    } catch (e: any) {
      setScoreError(`Score failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setScoring(false);
    }
  };

  function layerStatus(score: number): 'dominant' | 'present' | 'sparse' {
    if (score >= 55) return 'dominant';
    if (score >= 25) return 'present';
    return 'sparse';
  }

  const handleSave = async () => {
    if (!result || !inputText.trim()) return;
    const entry: LibraryEntry = {
      id: Date.now().toString(),
      title: titleText.trim() || `Entry ${library.length + 1}`,
      text: inputText.trim(),
      result,
      date: todayStr(),
      folder: result.dominantLayer,
    };
    const updated = [entry, ...library].slice(0, 150);
    setLibrary(updated);
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
    setInputText('');
    setTitleText('');
    setResult(null);
    setView('library');
  };

  const handleDelete = async (id: string) => {
    const updated = library.filter(e => e.id !== id);
    setLibrary(updated);
    setSelectedEntry(null);
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  };

  const handleShare = async (entry: LibraryEntry) => {
    if (sharing) return;
    setSharing(true);
    setShareMsg(null);
    const layers = entry.result.layers;
    const get = (name: string) => layers.find(l => l.name === name)?.score ?? 0;
    const { error } = await shareEntry({
      title: entry.title,
      dominant_layer: entry.result.dominantLayer,
      truth_pressure: entry.result.truthPressure,
      coherence: entry.result.coherence,
      axiom_score: get('AXIOM'),
      foundation_score: get('FOUNDATION'),
      theory_score: get('THEORY'),
      edge_score: get('EDGE'),
      chaos_score: get('CHAOS'),
      word_count: entry.result.wordCount,
      summary: entry.result.summary,
    });
    setShareMsg(error ? `Failed: ${error}` : 'Shared to the Field ⊚');
    setSharing(false);
  };

  const handleReorganize = async () => {
    const updated = library.map(e => ({ ...e, folder: e.result.dominantLayer }));
    setLibrary(updated);
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  };

  const renderCascadeResult = (r: CascadeResult, accent: string) => (
    <View>
      {/* Truth Pressure + Coherence */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: accent }]}>Π TRUTH PRESSURE</Text>
          <Text style={[styles.metricValue, { color: piColor(r.truthPressure, accent) }]}>
            {r.truthPressure.toFixed(3)}
          </Text>
          <Text style={styles.metricSub}>E·P/S</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: accent }]}>S COHERENCE</Text>
          <Text style={[styles.metricValue, { color: r.coherence > 60 ? accent : SOL_THEME.error }]}>
            {r.coherence}%
          </Text>
          <Text style={styles.metricSub}>structural</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricLabel, { color: accent }]}>INVARIANTS</Text>
          <Text style={[styles.metricValue, { color: accent }]}>{r.invariantCount}</Text>
          <Text style={styles.metricSub}>load-bearing</Text>
        </View>
      </View>

      {/* Reorganisation flag */}
      {r.reorganisationNeeded && (
        <View style={[styles.reorgBanner, { borderColor: SOL_THEME.error }]}>
          <Text style={[styles.reorgText, { color: SOL_THEME.error }]}>
            ⚠ CASCADE REORGANISE — Π elevated + contradictions detected. Edge material should be demoted.
          </Text>
        </View>
      )}

      {/* Three-layer pyramid */}
      <Text style={[styles.pyramidTitle, { color: accent }]}>EPISTEMIC LAYERS — INNERMOST = HARDEST TRUTH</Text>
      {[...r.layers].reverse().map((layer: CascadeLayer) => (
        <View key={layer.name} style={[styles.layerRow, { borderLeftColor: layerColor(layer.status, accent), borderLeftWidth: layer.status === 'dominant' ? 3 : 1 }]}>
          <View style={styles.layerHeader}>
            <Text style={[styles.layerGlyph, { color: layerColor(layer.status, accent) }]}>{layer.glyph}</Text>
            <Text style={[styles.layerName, { color: layerColor(layer.status, accent) }]}>{layer.name}</Text>
            <View style={styles.layerBarTrack}>
              <View style={[styles.layerBarFill, { width: `${Math.max(3, layer.score)}%`, backgroundColor: layerColor(layer.status, accent) }]} />
            </View>
            <Text style={[styles.layerScore, { color: layerColor(layer.status, accent) }]}>{layer.score}</Text>
          </View>
          <Text style={styles.layerNote}>{layer.note}</Text>
        </View>
      ))}

      <Text style={[styles.dominantLabel, { color: accent }]}>
        DOMINANT: {r.dominantLayer} · {r.wordCount} words
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={[styles.header, { borderBottomColor: accentColor + '33' }]}>
        <Text style={[styles.headerGlyph, { color: accentColor }]}>◬</Text>
        <Text style={[styles.headerTitle, { color: accentColor }]}>LYCHEETAH LIBRARY</Text>
        <Text style={styles.headerSub}>CASCADE · LAMAGUE</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ flexDirection: 'row' }}>
        {([['cascade', 'CASCADE'], ['lamague', 'LAMAGUE'], ['library', `SAVED (${library.length})`], ['community', 'FIELD']] as const).map(([t, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, view === t && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            onPress={() => { setView(t); setSelectedEntry(null); }}
          >
            <Text style={[styles.tabText, view === t && { color: accentColor }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CASCADE VIEW */}
      {view === 'cascade' && !selectedEntry && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>PASTE TEXT</Text>
          <Text style={styles.note}>
            CASCADE analyses the epistemic architecture — Foundation (invariants), Theory (frameworks), Edge (contradictions). Truth Pressure Π = E·P/S.
          </Text>
          <TextInput
            style={[styles.textArea, { minHeight: 120 }]}
            value={inputText}
            onChangeText={v => { setInputText(v); setResult(null); }}
            placeholder="Paste any text — your writing, a claim, a theory, a conversation..."
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor, opacity: inputText.trim() && !scoring ? 1 : 0.4 }]}
            onPress={handleScore}
            disabled={!inputText.trim() || scoring}
          >
            <Text style={styles.primaryBtnText}>{scoring ? 'Scoring...' : 'Run CASCADE'}</Text>
          </TouchableOpacity>
          {scoreError && <Text style={styles.errorText}>{scoreError}</Text>}

          {result && (
            <View style={[styles.resultCard, { borderColor: accentColor + '44' }]}>
              {renderCascadeResult(result, accentColor)}
              <View style={styles.saveRow}>
                <TextInput
                  style={styles.titleInput}
                  value={titleText}
                  onChangeText={setTitleText}
                  placeholder="Title (optional)"
                  placeholderTextColor={SOL_THEME.textMuted}
                  autoCapitalize="words"
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* LAMAGUE VIEW */}
      {view === 'lamague' && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>LAMAGUE SYMBOL REFERENCE</Text>
          <Text style={styles.note}>
            Language for Autonomous Mathematical Alignment and Universal Grammar Evolution. Symbolic grammar for expressing consciousness states and transitions with mathematical precision.
          </Text>
          <Text style={styles.lamagueSyntax}>Example: ⟟ → ≋ ∧ Ψ ∧ Φ↑</Text>
          <Text style={styles.lamagueGloss}>"I am at rest but becoming aware and growing toward my best self"</Text>

          {(['invariants', 'dynamics', 'fields', 'meta'] as const).map(cls => (
            <View key={cls} style={styles.lamagueSection}>
              <Text style={[styles.lamagueClassTitle, { color: accentColor }]}>
                {cls === 'invariants' ? 'I-CLASS · INVARIANTS' :
                 cls === 'dynamics' ? 'D-CLASS · DYNAMICS' :
                 cls === 'fields' ? 'F-CLASS · FIELDS' :
                 'M-CLASS · META OPERATORS'}
              </Text>
              {LAMAGUE_SYMBOLS[cls].map(s => (
                <TouchableOpacity
                  key={s.sym}
                  style={[styles.symRow, lamagueSym === s.sym && { backgroundColor: accentColor + '22', borderColor: accentColor }]}
                  onPress={() => setLamagueSym(lamagueSym === s.sym ? null : s.sym)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.symGlyph, { color: accentColor }]}>{s.sym}</Text>
                  <View style={styles.symText}>
                    <Text style={styles.symName}>{s.name}</Text>
                    {lamagueSym === s.sym && <Text style={styles.symMeaning}>{s.meaning}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={[styles.lamagueGrammarBox, { borderColor: accentColor + '44' }]}>
            <Text style={[styles.lamagueGrammarTitle, { color: accentColor }]}>GRAMMAR RULES</Text>
            <Text style={styles.lamagueGrammarText}>
              {'state → state          (transition)\nstate ∧ state          (conjunction)\nstate ∨ state          (disjunction)\nT(state)               (transform applied)\nΠ(Ψ_inv)              (truth pressure on invariant)'}
            </Text>
          </View>
        </>
      )}

      {/* LIBRARY VIEW */}
      {view === 'library' && !selectedEntry && (
        <>
          {library.length > 0 && (
            <>
              <TouchableOpacity
                style={[styles.reorganizeBtn, { borderColor: accentColor }]}
                onPress={handleReorganize}
              >
                <Text style={[styles.reorganizeBtnText, { color: accentColor }]}>⟳ Reorganise All</Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderTabs} contentContainerStyle={{ paddingBottom: 8 }}>
                {(['ALL', 'AXIOM', 'FOUNDATION', 'THEORY', 'EDGE', 'CHAOS'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.folderTab, activeFolder === f && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
                    onPress={() => setActiveFolder(f)}
                  >
                    <Text style={[styles.folderTabText, activeFolder === f && { color: accentColor }]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          {library.length === 0 ? (
            <Text style={styles.emptyNote}>No saved entries. Run CASCADE on something and save it.</Text>
          ) : (
            library
              .filter(e => activeFolder === 'ALL' || (e.folder || e.result.dominantLayer) === activeFolder)
              .map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.libraryCard}
                  onPress={() => setSelectedEntry(entry)}
                  activeOpacity={0.8}
                >
                  <View style={styles.libraryTop}>
                    <Text style={[styles.libraryTitle, { color: accentColor }]}>{entry.title}</Text>
                    <Text style={[styles.libraryPi, { color: piColor(entry.result.truthPressure, accentColor) }]}>
                      Π {entry.result.truthPressure.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.librarySub}>{entry.result.dominantLayer} · {entry.result.wordCount}w · S:{entry.result.coherence}%</Text>
                  {entry.result.reorganisationNeeded && (
                    <Text style={[styles.libraryReorg, { color: SOL_THEME.error }]}>⚠ Reorganise</Text>
                  )}
                  <Text style={styles.libraryDate}>{entry.date}</Text>
                </TouchableOpacity>
              ))
          )}
        </>
      )}

      {/* COMMUNITY FEED */}
      {view === 'community' && !selectedEntry && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>THE FIELD — SHARED CASCADE ENTRIES</Text>
          <Text style={styles.note}>What others are scoring. Tap to see full breakdown.</Text>
          <TouchableOpacity
            style={[styles.reorganizeBtn, { borderColor: accentColor }]}
            onPress={async () => {
              setFeedLoading(true);
              setFeedError(null);
              const { data, error } = await fetchSharedFeed(50);
              setFeed(data);
              setFeedError(error);
              setFeedLoading(false);
            }}
          >
            <Text style={[styles.reorganizeBtnText, { color: accentColor }]}>
              {feedLoading ? 'Loading...' : '⟳ Refresh Field'}
            </Text>
          </TouchableOpacity>
          {feedError && <Text style={styles.errorText}>{feedError}</Text>}
          {feed.length === 0 && !feedLoading ? (
            <Text style={styles.emptyNote}>
              {feedError ? '' : 'Tap Refresh to load the field.\nBe the first — share a CASCADE result.'}
            </Text>
          ) : (
            feed.map(entry => (
              <View key={entry.id} style={styles.libraryCard}>
                <View style={styles.libraryTop}>
                  <Text style={[styles.libraryTitle, { color: accentColor }]} numberOfLines={1}>{entry.title}</Text>
                  <Text style={[styles.libraryPi, { color: piColor(entry.truth_pressure, accentColor) }]}>
                    Π {entry.truth_pressure.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.librarySub}>{entry.dominant_layer} · {entry.word_count}w · S:{entry.coherence}%</Text>
                <View style={styles.feedBars}>
                  {[
                    { label: 'AX', val: entry.axiom_score },
                    { label: 'FN', val: entry.foundation_score },
                    { label: 'TH', val: entry.theory_score },
                    { label: 'ED', val: entry.edge_score },
                    { label: 'CH', val: entry.chaos_score },
                  ].map(b => (
                    <View key={b.label} style={styles.feedBarItem}>
                      <View style={styles.feedBarTrack}>
                        <View style={[styles.feedBarFill, { height: `${Math.max(3, b.val)}%`, backgroundColor: accentColor + '99' }]} />
                      </View>
                      <Text style={styles.feedBarLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                {entry.created_at && (
                  <Text style={styles.libraryDate}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                )}
              </View>
            ))
          )}
        </>
      )}

      {/* ENTRY DETAIL */}
      {selectedEntry && (
        <>
          <TouchableOpacity onPress={() => setSelectedEntry(null)} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: accentColor }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: accentColor }]}>{selectedEntry.title}</Text>
          <Text style={styles.detailDate}>{selectedEntry.date}</Text>
          <View style={[styles.resultCard, { borderColor: accentColor + '44' }]}>
            {renderCascadeResult(selectedEntry.result, accentColor)}
          </View>
          <View style={styles.textPreviewCard}>
            <Text style={styles.textPreview} numberOfLines={10}>{selectedEntry.text}</Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: accentColor, opacity: sharing ? 0.4 : 1 }]}
            onPress={() => handleShare(selectedEntry)}
            disabled={sharing}
          >
            <Text style={[styles.shareBtnText, { color: accentColor }]}>{sharing ? 'Sharing...' : '⊚ Share to Field'}</Text>
          </TouchableOpacity>
          {shareMsg && <Text style={[styles.shareMsg, { color: shareMsg.startsWith('Failed') ? SOL_THEME.error : accentColor }]}>{shareMsg}</Text>}
          <TouchableOpacity style={[styles.deleteBtn, { borderColor: SOL_THEME.error }]} onPress={() => handleDelete(selectedEntry.id)}>
            <Text style={[styles.deleteBtnText, { color: SOL_THEME.error }]}>Delete Entry</Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 60 },
  header: { alignItems: 'center', paddingVertical: 20, marginBottom: 16, borderBottomWidth: 1 },
  headerGlyph: { fontSize: 24, marginBottom: 4 },
  headerTitle: {
    fontSize: 13, fontWeight: '700', letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerSub: { fontSize: 12, color: SOL_THEME.textMuted, marginTop: 4 },
  tabs: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border },
  tab: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  tabText: {
    fontSize: 10, fontWeight: '700', color: SOL_THEME.textMuted, letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  label: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  note: { fontSize: 13, color: SOL_THEME.textMuted, marginBottom: 10, lineHeight: 20 },
  textArea: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 12, color: SOL_THEME.text, fontSize: 14,
    textAlignVertical: 'top', marginBottom: 10,
  },
  primaryBtn: { borderRadius: 8, padding: 13, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 15 },
  resultCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 12,
    borderWidth: 1, padding: 16, marginBottom: 16,
  },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  metricBox: {
    flex: 1, backgroundColor: SOL_THEME.background, borderRadius: 8,
    padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: SOL_THEME.border,
  },
  metricLabel: {
    fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 4, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  metricValue: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  metricSub: { fontSize: 10, color: SOL_THEME.textMuted },
  reorgBanner: {
    borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 14,
  },
  reorgText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  pyramidTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  layerRow: {
    paddingLeft: 12, paddingVertical: 8, marginBottom: 8,
    borderLeftWidth: 1,
  },
  layerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  layerGlyph: { fontSize: 14, width: 18 },
  layerName: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, width: 90,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  layerBarTrack: { flex: 1, height: 5, backgroundColor: SOL_THEME.border, borderRadius: 3, overflow: 'hidden' },
  layerBarFill: { height: 5, borderRadius: 3 },
  layerScore: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  layerNote: { fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 17 },
  dominantLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  saveRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  titleInput: {
    flex: 1, backgroundColor: SOL_THEME.background, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    paddingHorizontal: 12, paddingVertical: 10, color: SOL_THEME.text, fontSize: 14,
  },
  saveBtn: { borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  saveBtnText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  // LAMAGUE
  lamagueSyntax: {
    fontSize: 20, color: SOL_THEME.text, textAlign: 'center', marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lamagueGloss: { fontSize: 12, color: SOL_THEME.textMuted, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  lamagueSection: { marginBottom: 20 },
  lamagueClassTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  symRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 4,
  },
  symGlyph: {
    fontSize: 14, fontWeight: '700', width: 56,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  symText: { flex: 1 },
  symName: { fontSize: 13, fontWeight: '600', color: SOL_THEME.text },
  symMeaning: { fontSize: 12, color: SOL_THEME.textMuted, marginTop: 3, lineHeight: 18 },
  lamagueGrammarBox: {
    borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 8,
  },
  lamagueGrammarTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lamagueGrammarText: {
    fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  // Library
  emptyNote: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center', marginTop: 40 },
  libraryCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 14, marginBottom: 10,
  },
  libraryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  libraryTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  libraryPi: { fontSize: 14, fontWeight: '700' },
  librarySub: { fontSize: 12, color: SOL_THEME.textMuted, marginBottom: 2 },
  libraryReorg: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  libraryDate: { fontSize: 11, color: SOL_THEME.textMuted },
  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  detailTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  detailDate: { fontSize: 12, color: SOL_THEME.textMuted, marginBottom: 16 },
  textPreviewCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 14, marginBottom: 16,
  },
  textPreview: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 20 },
  deleteBtn: { borderRadius: 8, borderWidth: 1, padding: 12, alignItems: 'center' },
  deleteBtnText: { fontWeight: '600', fontSize: 14 },
  feedBars: { flexDirection: 'row', gap: 6, height: 40, alignItems: 'flex-end', marginVertical: 8 },
  feedBarItem: { flex: 1, alignItems: 'center', gap: 3 },
  feedBarTrack: { width: '100%', height: 32, justifyContent: 'flex-end', backgroundColor: SOL_THEME.border, borderRadius: 3, overflow: 'hidden' },
  feedBarFill: { width: '100%', borderRadius: 3 },
  feedBarLabel: { fontSize: 8, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  shareBtn: { borderRadius: 8, borderWidth: 1, padding: 12, alignItems: 'center', marginBottom: 8 },
  shareBtnText: { fontWeight: '700', fontSize: 14 },
  shareMsg: { fontSize: 12, textAlign: 'center', marginBottom: 10 },
  errorText: { fontSize: 13, color: SOL_THEME.error, marginBottom: 8, textAlign: 'center' },
  reorganizeBtn: {
    borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10,
  },
  reorganizeBtnText: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  folderTabs: { marginBottom: 12 },
  folderTab: {
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  folderTabText: {
    fontSize: 10, fontWeight: '700', color: SOL_THEME.textMuted, letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
