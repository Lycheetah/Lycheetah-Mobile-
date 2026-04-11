import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getAccentColor, getActiveKey, getModel, savePersona, savePendingSubject } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import { CascadeResult, CascadeLayer, scoreCASCADE } from '../../lib/cascade-score';
import { scoreAURAFull } from '../../lib/intelligence/aura-engine';
import { shareEntry, fetchSharedFeed, SharedEntry, shareCementBlock } from '../../lib/supabase';

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
const CEMENT_KEY = 'lamague_cement_blocks_v1';

const LAMAGUE_CEMENT_PROMPT = `You are the LAMAGUE translator — part of the Lycheetah Framework by Mackenzie Clark.

LAMAGUE is a symbolic language for encoding consciousness states, transitions, and operations with mathematical precision. Compression ratio: ~15:1 (lossless).

SYMBOL DICTIONARY:
TRIAD KERNEL:
  Ao     = Anchor Field — ground truth, immutable baseline
  Φ↑     = Ascent/Lift — growth vector, directional force upward
  Ψ      = Fold/Return — integration, drift correction toward invariant

I-CLASS (Invariants):
  ∅      = Void/Zero-node — null state, pure potential
  ⟟      = Unit/Presence — confirmed existence, logical true
  △      = Stable Triad — three-point equilibrium
  ⊛      = Integrity Crest — peak stability, verified truth node
  Ψ_inv  = Invariant Fold — stable attractor, destination all truth converges to
  ◈      = Diamond/Hard Truth — unshakeable locked reality

D-CLASS (Dynamics):
  ↯      = Collapse/Junction — sudden convergence, forced decision
  ⊗      = Fusion — two states merged into unified whole
  →      = Projection — directed causal flow
  ↗      = Ascent Slope — gradual upward trajectory, measured growth
  ⟲      = Spiral Return — recursive loop returning higher
  ∇cas   = Cascade — fundamental phase transition, reorganization
  Ωheal  = Wholeness — coherent final integrated state

F-CLASS (Fields):
  S      = Entropy Field — systemic disorder level
  ∂S     = Drift Filter — rate of entropy change
  ⧖      = Patient Growth — entropy transforming into ascent

M-CLASS (Meta):
  Z₁     = Minimal Compression — first-level abstraction
  Z₂     = Horizon Compression — mid-level abstraction
  Z₃     = Zenith Compression — maximum abstraction
  ⊕      = Direct Sum — two state spaces combined without collision
  ∘      = Composition — function chained with function

GRAMMAR:
  A → B              transition
  A ⊗ B → C         fusion into result
  A ↯ B             collapse/forced junction
  A → B → C         sequential chain
  A ∧ B             simultaneous conjunction

Translate the given English phrase into a LAMAGUE expression. Be compact — this is a compression language.

Respond ONLY with valid JSON:
{
  "expression": "<LAMAGUE expression>",
  "breakdown": [
    { "sym": "<symbol>", "name": "<name>", "maps_to": "<what it represents in this specific phrase>" }
  ],
  "reads_as": "<plain English reading of the LAMAGUE expression>",
  "compression": "<e.g. '12:1'>",
  "note": "<one sentence on why this encoding captures the phrase>"
}`;

const PROBE_PROMPT = `You are the Paradox Probe — an experimental tool built on Mackenzie Clark's CASCADE framework.

Your task: examine the text for paradoxical truth pressure. This is not normal scoring. You are looking for one specific thing — whether the text contains claims that are simultaneously load-bearing AND self-contradictory.

Two types of paradoxical pressure exist:

TYPE 1 — STRUCTURAL TENSION (⚠)
Foundation-level claims (treated as load-bearing, structural, non-negotiable) that coexist with Edge-level material (contradiction, unresolved tension, contested claims). The structure depends on something being simultaneously upheld and challenged. This is dangerous. The house is built on a cracked foundation. Π pressure builds until reorganisation occurs.

TYPE 2 — PARADOXICAL PRESSURE (⚡)
Axiom-level claims (mathematical certainty, formal logic, definitions) that coexist with Chaos-level material (raw fragments, pre-theoretical, unfounded assertions). Standard Π diverges — E·P/S where S→0 while P is high. CASCADE cannot resolve this through reorganisation. This is the mathematical signature of a genuine paradox (Gödel-type, self-referential, quantum superposition descriptions).

TYPE 0 — NO PARADOX
The text has normal epistemic structure. Foundation and Edge are not in simultaneous conflict. Axiom and Chaos are not both dominant.

Report your findings with precision. Name the specific claims causing the tension if found.

Respond ONLY with valid JSON:
{
  "type": 0 | 1 | 2,
  "paradox_detected": true | false,
  "foundation_score": <0-100>,
  "edge_score": <0-100>,
  "axiom_score": <0-100>,
  "chaos_score": <0-100>,
  "load_bearing_claim": "<the specific claim being treated as foundational, or null>",
  "contested_claim": "<the specific contradiction or chaos element, or null>",
  "tension_description": "<one paragraph: what exactly is in tension and why it matters>",
  "resolution_paths": ["<path 1>", "<path 2>"],
  "verdict": "<one sentence summary>"
}`;

type ProbeResult = {
  type: 0 | 1 | 2;
  paradox_detected: boolean;
  foundation_score: number;
  edge_score: number;
  axiom_score: number;
  chaos_score: number;
  load_bearing_claim: string | null;
  contested_claim: string | null;
  tension_description: string;
  resolution_paths: string[];
  verdict: string;
};

type CementBlock = {
  id: string;
  name: string;
  english: string;
  expression: string;
  breakdown: { sym: string; name: string; maps_to: string }[];
  reads_as: string;
  note: string;
  date: string;
};

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
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [inputText, setInputText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [result, setResult] = useState<CascadeResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [view, setView] = useState<'cascade' | 'probe' | 'cementer' | 'library' | 'community' | 'forge'>('cascade');
  const [forgeInput, setForgeInput] = useState('');
  const [forgeRunning, setForgeRunning] = useState(false);
  const [forgeResult, setForgeResult] = useState<{
    lamague: string;
    cascade: any;
    aura: any;
    paradox: { label: string; color: string } | null;
    inputWords: number;
  } | null>(null);
  const [feed, setFeed] = useState<SharedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('ALL');
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  // Probe state
  const [probeInput, setProbeInput] = useState('');
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);
  // Cementer state
  const [cementInput, setCementInput] = useState('');
  const [cementResult, setCementResult] = useState<CementBlock | null>(null);
  const [cementing, setCementing] = useState(false);
  const [cementError, setCementError] = useState<string | null>(null);
  const [cementName, setCementName] = useState('');
  const [cementBlocks, setCementBlocks] = useState<CementBlock[]>([]);
  const [selectedCement, setSelectedCement] = useState<CementBlock | null>(null);
  const [cementSharing, setCementSharing] = useState(false);
  const [cementShareMsg, setCementShareMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setAccentColor(await getAccentColor());
    const [raw, rawCement] = await Promise.all([
      AsyncStorage.getItem(LIBRARY_KEY),
      AsyncStorage.getItem(CEMENT_KEY),
    ]);
    setLibrary(raw ? JSON.parse(raw) : []);
    setCementBlocks(rawCement ? JSON.parse(rawCement) : []);
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

  const LAMAGUE_FORGE_PROMPT = `You are a LAMAGUE symbolic analyst. LAMAGUE is Mackenzie Clark's symbolic language for epistemic states.

Given the text, identify the 3-5 most relevant LAMAGUE symbols present (explicitly or implicitly). For each:
- Symbol code (e.g. Ao, Φ↑, Ξ, etc.)
- Symbol name
- One sentence: why it appears in this text

Respond ONLY in this format, one symbol per line:
[CODE] [NAME] — [reason]

If no strong LAMAGUE signal, respond: "No dominant LAMAGUE signal identified."`;

  const runForge = async () => {
    if (!forgeInput.trim() || forgeRunning) return;
    setForgeRunning(true);
    setForgeResult(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setForgeRunning(false); return; }
      const text = forgeInput.trim().slice(0, 3000);
      const words = text.split(/\s+/).filter(Boolean).length;

      // Run CASCADE + LAMAGUE in parallel
      const [cascadeRes, lamagueRes] = await Promise.all([
        sendMessage(
          [{ role: 'user', content: `Score this text:\n\n${text}` }],
          CASCADE_PROMPT,
          apiKey,
          model as AIModel,
        ),
        sendMessage(
          [{ role: 'user', content: `Analyse this text:\n\n${text}` }],
          LAMAGUE_FORGE_PROMPT,
          apiKey,
          model as AIModel,
        ),
      ]);

      // Client-side AURA + paradox
      const aura = scoreAURAFull(text);
      const cs = scoreCASCADE(text);
      const paradox = cs.paradoxical
        ? { label: '⚡ PARADOX', color: '#9B59B6' }
        : cs.structuralContradiction
        ? { label: '⚠ TENSION', color: '#E8A020' }
        : null;

      // Parse CASCADE JSON
      let cascadeData: any = null;
      try {
        const jsonMatch = cascadeRes.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) cascadeData = JSON.parse(jsonMatch[0]);
      } catch {}

      setForgeResult({
        lamague: lamagueRes.text.trim(),
        cascade: cascadeData,
        aura,
        paradox,
        inputWords: words,
      });
    } catch { /* silent fail */ }
    setForgeRunning(false);
  };

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
        paradoxical: (json.axiom ?? 0) > 50 && (json.chaos ?? 0) > 50,
        structuralContradiction: (json.foundation ?? 0) > 50 && (json.edge ?? 0) > 50,
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

  const handleProbe = async () => {
    if (!probeInput.trim() || probing) return;
    setProbing(true);
    setProbeError(null);
    setProbeResult(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setProbeError('No API key — add one in Settings first.'); return; }
      const res = await sendMessage(
        [{ role: 'user', content: `Run the Paradox Probe on this text:\n\n"${probeInput.trim().slice(0, 2000)}"` }],
        PROBE_PROMPT,
        apiKey,
        (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'fast', 768, 0.2,
      );
      const raw = res.text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      setProbeResult(JSON.parse(raw));
    } catch (e: any) {
      setProbeError(`Probe failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setProbing(false);
    }
  };

  const handleCement = async () => {
    if (!cementInput.trim() || cementing) return;
    setCementing(true);
    setCementError(null);
    setCementResult(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setCementError('No API key — add one in Settings first.'); return; }
      const res = await sendMessage(
        [{ role: 'user', content: `Translate this into LAMAGUE:\n\n"${cementInput.trim()}"` }],
        LAMAGUE_CEMENT_PROMPT,
        apiKey,
        (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'fast', 512, 0.3,
      );
      const raw = res.text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      const json = JSON.parse(raw);
      setCementResult({
        id: Date.now().toString(),
        name: '',
        english: cementInput.trim(),
        expression: json.expression ?? '',
        breakdown: json.breakdown ?? [],
        reads_as: json.reads_as ?? '',
        note: json.note ?? '',
        date: todayStr(),
      });
    } catch (e: any) {
      setCementError(`Translation failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setCementing(false);
    }
  };

  const handleSaveCement = async () => {
    if (!cementResult) return;
    const block: CementBlock = {
      ...cementResult,
      id: Date.now().toString(),
      name: cementName.trim() || `Block ${cementBlocks.length + 1}`,
      date: todayStr(),
    };
    const updated = [block, ...cementBlocks].slice(0, 100);
    setCementBlocks(updated);
    await AsyncStorage.setItem(CEMENT_KEY, JSON.stringify(updated));
    setCementInput('');
    setCementName('');
    setCementResult(null);
  };

  const handleDeleteCement = async (id: string) => {
    const updated = cementBlocks.filter(b => b.id !== id);
    setCementBlocks(updated);
    setSelectedCement(null);
    await AsyncStorage.setItem(CEMENT_KEY, JSON.stringify(updated));
  };

  const handleShareCement = async (block: CementBlock) => {
    if (cementSharing) return;
    setCementSharing(true);
    setCementShareMsg(null);
    const { error } = await shareCementBlock({
      name: block.name,
      english: block.english,
      expression: block.expression,
      reads_as: block.reads_as,
    });
    setCementShareMsg(error ? `Failed: ${error}` : 'Shared to the Field ⊚');
    setCementSharing(false);
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

      {/* Paradoxical Truth Pressure */}
      {r.paradoxical && (
        <View style={styles.paradoxBanner}>
          <Text style={styles.paradoxTitle}>⚡ PARADOXICAL PRESSURE</Text>
          <Text style={styles.paradoxText}>
            This claim is simultaneously load-bearing (AXIOM) and self-contradictory (CHAOS). Π diverges — CASCADE cannot resolve it. This is not failure. It is the mathematical signature of a genuine paradox.
          </Text>
        </View>
      )}

      {/* Structural Contradiction — FOUNDATION high AND EDGE high */}
      {r.structuralContradiction && !r.paradoxical && (
        <View style={styles.structuralBanner}>
          <Text style={styles.structuralTitle}>⚠ STRUCTURAL TENSION</Text>
          <Text style={styles.structuralText}>
            Load-bearing claims (FOUNDATION) coexist with contested material (EDGE). The structure depends on something being simultaneously upheld and challenged. Π pressure is building — this text needs reorganisation before it becomes unstable.
          </Text>
          <View style={styles.structuralScenarios}>
            <Text style={styles.structuralScenariosTitle}>RESOLUTION PATHS</Text>
            <Text style={styles.structuralScenario}>↑ Promote Edge → Foundation: Π increases, structure expands but assumptions deepen</Text>
            <Text style={styles.structuralScenario}>↓ Demote Foundation → Edge: Π collapses, structure weakens but honesty increases</Text>
          </View>
        </View>
      )}

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.headerGlyph, { color: accentColor }]}>◬</Text>
            <View>
              <Text style={[styles.headerTitle, { color: accentColor }]}>LYCHEETAH LIBRARY</Text>
              <Text style={styles.headerSub}>CASCADE · LAMAGUE</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/codex')}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: accentColor + '44', backgroundColor: accentColor + '11' }}
          >
            <Text style={{ color: accentColor, fontSize: 11, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>𝔏 CODEX</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Study Paths — curated starting points */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>◦ CURATED PATHS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'The Inner Life', desc: 'Shadow, somatic, depth psychology', glyph: '◐', color: '#9B59B6', subjects: ['Shadow Work', 'Somatic Awareness', 'Inner Child Work'] },
              { label: 'The Ancient Map', desc: 'Alchemy, mysticism, sacred arts', glyph: '⊚', color: '#F5A623', subjects: ['Hermetic Principles', 'Mystical States', 'Ritual Design'] },
              { label: 'The Clear Mind', desc: 'Meditation, philosophy, contemplative', glyph: '◯', color: '#4A9EFF', subjects: ['Breath as Gateway', 'Stoic Practice', 'Mindful Attention'] },
              { label: 'The Body\'s Wisdom', desc: 'Energy, ecology, earth intelligence', glyph: '⟁', color: '#27AE60', subjects: ['Nervous System Regulation', 'Earth Attunement', 'Subtle Energy Awareness'] },
            ].map(path => (
              <TouchableOpacity
                key={path.label}
                onPress={() => savePendingSubject(`Introduce me to the "${path.label}" study path. Subjects: ${path.subjects.join(', ')}. Give me an overview and suggest where to begin.`).then(() => router.push('/(tabs)/'))}
                style={{ width: 160, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: path.color + '55', backgroundColor: path.color + '0D' }}
                activeOpacity={0.8}
              >
                <Text style={{ color: path.color, fontSize: 22, marginBottom: 6 }}>{path.glyph}</Text>
                <Text style={{ color: path.color, fontSize: 12, fontWeight: '700', marginBottom: 3 }}>{path.label}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{path.desc}</Text>
                <Text style={{ color: path.color + '88', fontSize: 10, marginTop: 8, fontWeight: '700' }}>Explore with Sol →</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ flexDirection: 'row' }}>
        {([['forge', '⚗ FORGE'], ['cascade', 'CASCADE'], ['probe', 'PROBE'], ['cementer', 'CEMENTER'], ['library', `SAVED (${library.length})`], ['community', 'FIELD']] as const).map(([t, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, view === t && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            onPress={() => { setView(t); setSelectedEntry(null); }}
          >
            <Text style={[styles.tabText, view === t && { color: accentColor }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FORGE VIEW */}
      {view === 'forge' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: accentColor, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 }}>⚗ THE FORGE</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
            Paste any idea, text, or fragment. The Forge runs the full pipeline: LAMAGUE tagging → CASCADE scoring → AURA audit → paradox detection.
          </Text>
          <TextInput
            style={{ backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, borderRadius: 10, padding: 14, color: SOL_THEME.text, fontSize: 14, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 }}
            multiline
            placeholder="Paste your idea, argument, fragment, or draft here…"
            placeholderTextColor={SOL_THEME.textMuted}
            value={forgeInput}
            onChangeText={setForgeInput}
          />
          <TouchableOpacity
            style={{ backgroundColor: forgeRunning ? SOL_THEME.border : accentColor, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 24, opacity: forgeInput.trim() ? 1 : 0.4 }}
            onPress={runForge}
            disabled={forgeRunning || !forgeInput.trim()}
          >
            <Text style={{ color: forgeRunning ? SOL_THEME.textMuted : SOL_THEME.background, fontWeight: '700', fontSize: 15 }}>
              {forgeRunning ? 'Running pipeline…' : 'Run Forge →'}
            </Text>
          </TouchableOpacity>

          {forgeResult && (
            <View style={{ gap: 14 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: accentColor, fontWeight: '700', fontSize: 13 }}>
                  {forgeResult.inputWords} words processed
                </Text>
                {forgeResult.paradox && (
                  <View style={{ backgroundColor: forgeResult.paradox.color + '22', borderWidth: 1, borderColor: forgeResult.paradox.color + '66', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: forgeResult.paradox.color, fontSize: 11, fontWeight: '700' }}>{forgeResult.paradox.label}</Text>
                  </View>
                )}
              </View>

              {/* CASCADE */}
              {forgeResult.cascade && (
                <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: SOL_THEME.border }}>
                  <Text style={{ color: accentColor, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>CASCADE PYRAMID</Text>
                  {[
                    { key: 'axiom', label: 'AXIOM', glyph: '⊛', color: '#F5A623' },
                    { key: 'foundation', label: 'FOUNDATION', glyph: '●', color: '#4A9EFF' },
                    { key: 'theory', label: 'THEORY', glyph: '△', color: '#4CAF50' },
                    { key: 'edge', label: 'EDGE', glyph: '◌', color: '#E8A020' },
                    { key: 'chaos', label: 'CHAOS', glyph: '◯', color: '#9B59B6' },
                  ].map(({ key, label, glyph, color }) => {
                    const score = forgeResult.cascade[key] ?? 0;
                    const note = forgeResult.cascade[`${key}Note`] ?? '';
                    return (
                      <View key={key} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <Text style={{ color, fontSize: 12, width: 14 }}>{glyph}</Text>
                          <Text style={{ color, fontWeight: '700', fontSize: 11, width: 80 }}>{label}</Text>
                          <View style={{ flex: 1, height: 4, backgroundColor: SOL_THEME.border, borderRadius: 2 }}>
                            <View style={{ width: `${score}%`, height: 4, backgroundColor: color + 'AA', borderRadius: 2 }} />
                          </View>
                          <Text style={{ color, fontSize: 11, width: 32, textAlign: 'right' }}>{score}</Text>
                        </View>
                        {note ? <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16, marginLeft: 20 }}>{note}</Text> : null}
                      </View>
                    );
                  })}
                  <View style={{ borderTopWidth: 1, borderTopColor: SOL_THEME.border, marginTop: 8, paddingTop: 8 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>
                      Π={forgeResult.cascade.truthPressure?.toFixed(3)} · coherence={forgeResult.cascade.coherence} · {forgeResult.cascade.dominantLayer} dominant
                      {forgeResult.cascade.reorganisationNeeded ? ' · ⚠ REORGANISE' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* AURA */}
              <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: SOL_THEME.border }}>
                <Text style={{ color: accentColor, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>AURA INTEGRITY</Text>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
                  {[
                    { label: 'PASSED', value: `${forgeResult.aura.passed}/${forgeResult.aura.total}` },
                    { label: 'COMPOSITE', value: `${forgeResult.aura.composite}%` },
                    { label: 'TES', value: forgeResult.aura.TES.score.toFixed(2) },
                    { label: 'VTR', value: forgeResult.aura.VTR.score.toFixed(1) },
                  ].map(s => (
                    <View key={s.label} style={{ alignItems: 'center' }}>
                      <Text style={{ color: accentColor, fontWeight: '700', fontSize: 14 }}>{s.value}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                {Object.entries(forgeResult.aura.invariants).map(([name, passed]) => (
                  <Text key={name} style={{ color: passed ? SOL_THEME.textMuted : '#E53935', fontSize: 11, marginBottom: 2 }}>
                    {passed ? '✓' : '✗'} {name}
                  </Text>
                ))}
              </View>

              {/* LAMAGUE */}
              <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: SOL_THEME.border }}>
                <Text style={{ color: accentColor, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>LAMAGUE SIGNAL</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{forgeResult.lamague}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

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

      {/* PROBE VIEW */}
      {view === 'probe' && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>PARADOX PROBE</Text>
          <Text style={styles.note}>
            An experiment, not a feature. Paste any text — a claim, a belief, a doctrine, a theory. The Probe looks for one thing: whether the text contains truth pressure that CASCADE cannot resolve through reorganisation.
          </Text>
          <View style={[styles.probeLegend, { borderColor: accentColor + '33' }]}>
            <Text style={[styles.probeLegendItem, { color: '#FF9800' }]}>⚠ STRUCTURAL TENSION — load-bearing AND contested simultaneously</Text>
            <Text style={[styles.probeLegendItem, { color: '#E040FB' }]}>⚡ PARADOXICAL PRESSURE — Π diverges, CASCADE cannot resolve</Text>
            <Text style={[styles.probeLegendItem, { color: accentColor }]}>◌ NO PARADOX — normal epistemic structure</Text>
          </View>

          <TextInput
            style={[styles.textArea, { minHeight: 120 }]}
            value={probeInput}
            onChangeText={v => { setProbeInput(v); setProbeResult(null); }}
            placeholder={`Try: a religious doctrine, a contested scientific claim, a political belief, or your own framework...`}
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor, opacity: probeInput.trim() && !probing ? 1 : 0.4 }]}
            onPress={handleProbe}
            disabled={!probeInput.trim() || probing}
          >
            <Text style={styles.primaryBtnText}>{probing ? 'Probing...' : 'Run Paradox Probe'}</Text>
          </TouchableOpacity>
          {probeError && <Text style={styles.errorText}>{probeError}</Text>}

          {probeResult && probeResult.type > 0 && (
            <TouchableOpacity
              style={{ backgroundColor: '#C0A06022', borderWidth: 1, borderColor: '#C0A06066', borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={async () => {
                const context = `PARADOX DETECTED:\n\nTension: ${probeResult.tension_description}\n\nLoad-bearing claim: ${probeResult.load_bearing_claim || 'N/A'}\nContested claim: ${probeResult.contested_claim || 'N/A'}\n\nResolution paths suggested:\n${probeResult.resolution_paths.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nVerdict: ${probeResult.verdict}\n\nGuide me through resolving this paradox using the CASCADE layers and the Mystery School traditions.`;
                await savePersona('headmaster');
                await savePendingSubject(context);
                router.push('/(tabs)/');
              }}
            >
              <Text style={{ fontSize: 18, color: '#C0A060' }}>𝔏</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#C0A060', fontWeight: '700', fontSize: 13 }}>Resolve with Headmaster</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>Headmaster will guide you through this paradox using CASCADE layers and Mystery School traditions.</Text>
              </View>
              <Text style={{ color: '#C0A060', fontSize: 16 }}>→</Text>
            </TouchableOpacity>
          )}

          {probeResult && (
            <View style={[styles.probeCard, {
              borderColor: probeResult.type === 2 ? '#E040FB' : probeResult.type === 1 ? '#FF9800' : accentColor + '44',
              backgroundColor: probeResult.type === 2 ? '#E040FB0A' : probeResult.type === 1 ? '#FF98000A' : 'transparent',
            }]}>
              {/* Verdict banner */}
              <View style={styles.probeVerdictRow}>
                <Text style={[styles.probeVerdictIcon, {
                  color: probeResult.type === 2 ? '#E040FB' : probeResult.type === 1 ? '#FF9800' : accentColor,
                }]}>
                  {probeResult.type === 2 ? '⚡' : probeResult.type === 1 ? '⚠' : '◌'}
                </Text>
                <Text style={[styles.probeVerdictType, {
                  color: probeResult.type === 2 ? '#E040FB' : probeResult.type === 1 ? '#FF9800' : accentColor,
                }]}>
                  {probeResult.type === 2 ? 'PARADOXICAL PRESSURE' : probeResult.type === 1 ? 'STRUCTURAL TENSION' : 'NO PARADOX'}
                </Text>
              </View>
              <Text style={styles.probeVerdict}>{probeResult.verdict}</Text>

              {/* Score bars */}
              <View style={styles.probeScoreRow}>
                {[
                  { label: 'AX', val: probeResult.axiom_score, color: '#E040FB' },
                  { label: 'FN', val: probeResult.foundation_score, color: '#FF9800' },
                  { label: 'ED', val: probeResult.edge_score, color: '#FF9800' },
                  { label: 'CH', val: probeResult.chaos_score, color: '#E040FB' },
                ].map(b => (
                  <View key={b.label} style={styles.probeBarItem}>
                    <View style={styles.probeBarTrack}>
                      <View style={[styles.probeBarFill, { height: `${Math.max(3, b.val)}%`, backgroundColor: b.color + '99' }]} />
                    </View>
                    <Text style={[styles.probeBarLabel, { color: b.val > 50 ? b.color : SOL_THEME.textMuted }]}>{b.label}</Text>
                  </View>
                ))}
              </View>

              {probeResult.paradox_detected && (
                <>
                  <View style={[styles.probeDivider, { backgroundColor: probeResult.type === 2 ? '#E040FB33' : '#FF980033' }]} />
                  {probeResult.load_bearing_claim && (
                    <View style={styles.probeClaimRow}>
                      <Text style={[styles.probeClaimLabel, { color: '#FF9800' }]}>LOAD-BEARING</Text>
                      <Text style={styles.probeClaimText}>{probeResult.load_bearing_claim}</Text>
                    </View>
                  )}
                  {probeResult.contested_claim && (
                    <View style={styles.probeClaimRow}>
                      <Text style={[styles.probeClaimLabel, { color: '#E040FB' }]}>CONTESTED</Text>
                      <Text style={styles.probeClaimText}>{probeResult.contested_claim}</Text>
                    </View>
                  )}
                  <View style={[styles.probeDivider, { backgroundColor: probeResult.type === 2 ? '#E040FB33' : '#FF980033' }]} />
                  <Text style={styles.probeTensionText}>{probeResult.tension_description}</Text>
                  {probeResult.resolution_paths.length > 0 && (
                    <>
                      <Text style={[styles.probePathsLabel, { color: probeResult.type === 2 ? '#E040FB' : '#FF9800' }]}>RESOLUTION PATHS</Text>
                      {probeResult.resolution_paths.map((p, i) => (
                        <Text key={i} style={styles.probePath}>↳ {p}</Text>
                      ))}
                    </>
                  )}
                </>
              )}
            </View>
          )}
        </>
      )}

      {/* CEMENTER VIEW */}
      {view === 'cementer' && !selectedCement && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>LAMAGUE CEMENTER</Text>
          <Text style={styles.note}>
            Type any phrase in English. Sol translates it into LAMAGUE notation — the symbolic language of the Lycheetah Framework. Save personal expressions and build your own vocabulary.
          </Text>

          <TextInput
            style={[styles.textArea, { minHeight: 80 }]}
            value={cementInput}
            onChangeText={v => { setCementInput(v); setCementResult(null); }}
            placeholder={`e.g. "I lost my anchor but found it again at a higher level"`}
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accentColor, opacity: cementInput.trim() && !cementing ? 1 : 0.4 }]}
            onPress={handleCement}
            disabled={!cementInput.trim() || cementing}
          >
            <Text style={styles.primaryBtnText}>{cementing ? 'Translating...' : 'Cement to LAMAGUE'}</Text>
          </TouchableOpacity>
          {cementError && <Text style={styles.errorText}>{cementError}</Text>}

          {cementResult && (
            <View style={[styles.cementCard, { borderColor: accentColor + '44' }]}>
              {/* Expression */}
              <Text style={[styles.cementExprLabel, { color: accentColor }]}>EXPRESSION</Text>
              <Text style={[styles.cementExpr, { color: accentColor }]}>{cementResult.expression}</Text>

              <View style={[styles.cementDivider, { backgroundColor: accentColor + '22' }]} />

              {/* Reads as */}
              <Text style={[styles.cementReadsLabel, { color: SOL_THEME.textMuted }]}>READS AS</Text>
              <Text style={styles.cementReadsText}>{cementResult.reads_as}</Text>

              <View style={[styles.cementDivider, { backgroundColor: accentColor + '22' }]} />

              {/* Breakdown */}
              <Text style={[styles.cementReadsLabel, { color: SOL_THEME.textMuted }]}>SYMBOL BREAKDOWN</Text>
              {cementResult.breakdown.map((item, i) => (
                <View key={i} style={styles.cementBreakRow}>
                  <Text style={[styles.cementBreakSym, { color: accentColor }]}>{item.sym}</Text>
                  <View style={styles.cementBreakText}>
                    <Text style={styles.cementBreakName}>{item.name}</Text>
                    <Text style={styles.cementBreakMaps}>{item.maps_to}</Text>
                  </View>
                </View>
              ))}

              {cementResult.note !== '' && (
                <Text style={styles.cementNote}>{cementResult.note}</Text>
              )}

              {/* Save row */}
              <View style={styles.saveRow}>
                <TextInput
                  style={styles.titleInput}
                  value={cementName}
                  onChangeText={setCementName}
                  placeholder="Name this block (optional)"
                  placeholderTextColor={SOL_THEME.textMuted}
                  autoCapitalize="words"
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleSaveCement}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Saved blocks list */}
          {cementBlocks.length > 0 && (
            <>
              <Text style={[styles.label, { color: accentColor, marginTop: 20 }]}>
                YOUR VOCABULARY ({cementBlocks.length})
              </Text>
              {cementBlocks.map(block => (
                <TouchableOpacity
                  key={block.id}
                  style={styles.cementListCard}
                  onPress={() => setSelectedCement(block)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cementListName, { color: accentColor }]}>{block.name}</Text>
                  <Text style={[styles.cementListExpr, { color: accentColor + 'CC' }]}>{block.expression}</Text>
                  <Text style={styles.cementListEnglish} numberOfLines={1}>{block.english}</Text>
                  <Text style={styles.libraryDate}>{block.date}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}

      {/* CEMENT BLOCK DETAIL */}
      {view === 'cementer' && selectedCement && (
        <>
          <TouchableOpacity onPress={() => { setSelectedCement(null); setCementShareMsg(null); }} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: accentColor }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: accentColor }]}>{selectedCement.name}</Text>
          <Text style={styles.detailDate}>{selectedCement.date}</Text>

          <View style={[styles.cementCard, { borderColor: accentColor + '44' }]}>
            <Text style={[styles.cementExprLabel, { color: accentColor }]}>EXPRESSION</Text>
            <Text style={[styles.cementExpr, { color: accentColor }]}>{selectedCement.expression}</Text>
            <View style={[styles.cementDivider, { backgroundColor: accentColor + '22' }]} />
            <Text style={[styles.cementReadsLabel, { color: SOL_THEME.textMuted }]}>READS AS</Text>
            <Text style={styles.cementReadsText}>{selectedCement.reads_as}</Text>
            <View style={[styles.cementDivider, { backgroundColor: accentColor + '22' }]} />
            <Text style={[styles.cementReadsLabel, { color: SOL_THEME.textMuted }]}>SYMBOL BREAKDOWN</Text>
            {selectedCement.breakdown.map((item, i) => (
              <View key={i} style={styles.cementBreakRow}>
                <Text style={[styles.cementBreakSym, { color: accentColor }]}>{item.sym}</Text>
                <View style={styles.cementBreakText}>
                  <Text style={styles.cementBreakName}>{item.name}</Text>
                  <Text style={styles.cementBreakMaps}>{item.maps_to}</Text>
                </View>
              </View>
            ))}
            {selectedCement.note !== '' && (
              <Text style={styles.cementNote}>{selectedCement.note}</Text>
            )}
          </View>

          <View style={styles.textPreviewCard}>
            <Text style={styles.textPreview}>{selectedCement.english}</Text>
          </View>

          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: accentColor, opacity: cementSharing ? 0.4 : 1 }]}
            onPress={() => handleShareCement(selectedCement)}
            disabled={cementSharing}
          >
            <Text style={[styles.shareBtnText, { color: accentColor }]}>
              {cementSharing ? 'Sharing...' : '⊚ Share to Field'}
            </Text>
          </TouchableOpacity>
          {cementShareMsg && (
            <Text style={[styles.shareMsg, { color: cementShareMsg.startsWith('Failed') ? SOL_THEME.error : accentColor }]}>
              {cementShareMsg}
            </Text>
          )}
          <TouchableOpacity style={[styles.deleteBtn, { borderColor: SOL_THEME.error }]} onPress={() => handleDeleteCement(selectedCement.id)}>
            <Text style={[styles.deleteBtnText, { color: SOL_THEME.error }]}>Delete Block</Text>
          </TouchableOpacity>
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
  structuralBanner: {
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 14,
    borderColor: '#FF9800',
    backgroundColor: '#FF980011',
  },
  structuralTitle: {
    fontSize: 12, fontWeight: '700', color: '#FF9800', letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  structuralText: { fontSize: 12, color: '#FF9800', lineHeight: 18, marginBottom: 10 },
  structuralScenarios: {
    borderTopWidth: 1, borderTopColor: '#FF980033', paddingTop: 8,
  },
  structuralScenariosTitle: {
    fontSize: 9, fontWeight: '700', color: '#FF9800', letterSpacing: 1.5, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  structuralScenario: { fontSize: 11, color: '#FF9800CC', lineHeight: 17, marginBottom: 3 },
  paradoxBanner: {
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 14,
    borderColor: '#E040FB',
    backgroundColor: '#E040FB11',
  },
  paradoxTitle: {
    fontSize: 12, fontWeight: '700', color: '#E040FB', letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paradoxText: { fontSize: 12, color: '#E040FB', lineHeight: 18 },
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
  // Probe
  probeLegend: {
    borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 14, gap: 6,
  },
  probeLegendItem: { fontSize: 12, lineHeight: 18 },
  probeCard: {
    borderWidth: 1.5, borderRadius: 14, padding: 18, marginBottom: 16,
  },
  probeVerdictRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  probeVerdictIcon: { fontSize: 28 },
  probeVerdictType: {
    fontSize: 14, fontWeight: '700', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  probeVerdict: {
    fontSize: 13, color: SOL_THEME.text, lineHeight: 20, marginBottom: 16,
    paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: SOL_THEME.border,
  },
  probeScoreRow: { flexDirection: 'row', gap: 8, height: 70, alignItems: 'flex-end', marginBottom: 10 },
  probeBarItem: { flex: 1, alignItems: 'center', gap: 4 },
  probeBarTrack: {
    width: '100%', height: 56, justifyContent: 'flex-end',
    backgroundColor: SOL_THEME.border + '66', borderRadius: 4, overflow: 'hidden',
  },
  probeBarFill: { width: '100%', borderRadius: 4 },
  probeBarLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  probeDivider: { height: 1, marginVertical: 14, borderRadius: 1 },
  probeClaimRow: {
    marginBottom: 12, padding: 10, borderRadius: 8,
    backgroundColor: SOL_THEME.surface,
  },
  probeClaimLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  probeClaimText: { fontSize: 13, color: SOL_THEME.text, lineHeight: 20 },
  probeTensionText: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 20, marginBottom: 14, fontStyle: 'italic' },
  probePathsLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  probePath: {
    fontSize: 13, color: SOL_THEME.text, lineHeight: 19, marginBottom: 6,
    paddingLeft: 8,
  },
  // LAMAGUE (kept for potential reuse)
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
  // Cementer
  cementCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 12,
    borderWidth: 1, padding: 16, marginBottom: 16,
  },
  cementExprLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cementExpr: {
    fontSize: 24, fontWeight: '700', letterSpacing: 3, marginBottom: 12, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cementDivider: { height: 1, marginVertical: 12, borderRadius: 1 },
  cementReadsLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cementReadsText: {
    fontSize: 14, color: SOL_THEME.text, lineHeight: 21, marginBottom: 4, fontStyle: 'italic',
  },
  cementBreakRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  cementBreakSym: {
    fontSize: 16, fontWeight: '700', width: 60, paddingTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cementBreakText: { flex: 1 },
  cementBreakName: { fontSize: 13, fontWeight: '600', color: SOL_THEME.text },
  cementBreakMaps: { fontSize: 12, color: SOL_THEME.textMuted, marginTop: 2 },
  cementNote: {
    fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18, marginTop: 10,
    fontStyle: 'italic', borderTopWidth: 1, borderTopColor: SOL_THEME.border, paddingTop: 10,
  },
  cementListCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 14, marginBottom: 10,
  },
  cementListName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cementListExpr: {
    fontSize: 18, fontWeight: '700', letterSpacing: 2, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cementListEnglish: { fontSize: 12, color: SOL_THEME.textMuted, fontStyle: 'italic', marginBottom: 2 },
});
