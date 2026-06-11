// CASCADE Framework Scorer — based on Mackenzie Clark's CASCADE architecture
// Source: CASCADE_Research_paper_ARXIV, CODEX_AURA_PRIME/01_CASCADE
//
// CASCADE is a knowledge REORGANIZATION system, not a readability scorer.
// The pyramid: Foundation (invariants) → Theory (working frameworks) → Edge (contradictions/speculation)
// Truth Pressure Π = E·P/S (evidence × power / coherence)
// When Π exceeds threshold → reorganize: contradictions demote to Edge, invariants preserved in Foundation

export type CascadeLayer = {
  name: 'AXIOM' | 'FOUNDATION' | 'THEORY' | 'EDGE' | 'CHAOS';
  glyph: string;
  score: number;        // 0–100 density of this layer's material
  status: 'dominant' | 'present' | 'sparse';
  description: string;
  note: string;
};

export type CascadeResult = {
  layers: CascadeLayer[];
  truthPressure: number;       // Π estimate 0–1
  coherence: number;           // S estimate — inverse of contradiction density
  reorganisationNeeded: boolean;
  paradoxical: boolean;           // AXIOM > 50 AND CHAOS > 50 — Π diverges mathematically
  structuralContradiction: boolean; // FOUNDATION > 50 AND EDGE > 50 — load-bearing AND contested
  dominantLayer: 'AXIOM' | 'FOUNDATION' | 'THEORY' | 'EDGE' | 'CHAOS';
  invariantCount: number;      // claims presented as load-bearing
  contradictionCount: number;  // conflicting or unresolved claims
  wordCount: number;
  summary: string;
};

// Invariant markers — claims presented as foundational, load-bearing, non-negotiable
const INVARIANT_PATTERNS = [
  /\b(always|never|invariably|by definition|necessarily|fundamentally|at its core|the principle is|this law|cannot be violated|mathematical(ly)?|proven|demonstrated)\b/gi,
  /\b(the foundation|load.bearing|preserv(es?|ing)|ground truth|axiom|theorem|law of|principle of)\b/gi,
  /\b(∀|∃|≡|⊃|therefore|QED|proven|necessarily true|must be|logically follows)\b/gi,
];

// Theory markers — working frameworks, hypotheses, causal reasoning
const THEORY_PATTERNS = [
  /\b(because|therefore|since|thus|consequently|as a result|this means|which implies|this suggests)\b/gi,
  /\b(framework|model|theory|mechanism|pattern|structure|hypothesis|predicts|explains|accounts for)\b/gi,
  /\b(evidence suggests|research shows|data indicates|this demonstrates|we can conclude)\b/gi,
  /\b(if.*then|when.*then|given that|assuming|under the condition)\b/gi,
];

// Edge markers — contradictions, speculation, uncertainty, unresolved tension
const EDGE_PATTERNS = [
  /\b(but|however|although|yet|despite|paradox|contradiction|tension|conflict|unclear|uncertain)\b/gi,
  /\b(might|may|could|possibly|perhaps|arguably|debatable|contested|some argue|others claim)\b/gi,
  /\b(I don't know|unclear|unresolved|open question|remains to be|not yet|we still don't)\b/gi,
  /\b(except|unless|caveat|limitation|edge case|counterexample|fails when|breaks down)\b/gi,
];

// Coherence threats — things that reduce S (structural coherence)
const INCOHERENCE_PATTERNS = [
  /\b(contradicts|conflicts with|undermines|inconsistent with|disagrees with|opposed to)\b/gi,
  /\bbut (actually|in fact|really|wait)\b/gi,
];

function countAll(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, re) => {
    re.lastIndex = 0;
    const matches = text.match(re);
    return sum + (matches ? matches.length : 0);
  }, 0);
}

function layerStatus(score: number): 'dominant' | 'present' | 'sparse' {
  if (score >= 55) return 'dominant';
  if (score >= 25) return 'present';
  return 'sparse';
}

export function scoreCASCADE(text: string): CascadeResult {
  const trimmed = text.trim();
  if (!trimmed) return emptyResult();

  const words = trimmed.split(/\s+/).filter(Boolean).length;

  const invariantHits = countAll(trimmed, INVARIANT_PATTERNS);
  const theoryHits = countAll(trimmed, THEORY_PATTERNS);
  const edgeHits = countAll(trimmed, EDGE_PATTERNS);
  const incoherenceHits = countAll(trimmed, INCOHERENCE_PATTERNS);

  const total = Math.max(invariantHits + theoryHits + edgeHits, 1);
  const wordScale = Math.min(words / 100, 1); // normalise short texts

  // Layer scores — proportion of signal belonging to each layer
  const foundationScore = Math.min(100, Math.round(
    (invariantHits / total) * 80 * wordScale +
    (words > 50 ? 10 : 0) +
    (invariantHits > 2 ? 10 : 0)
  ));

  const theoryScore = Math.min(100, Math.round(
    (theoryHits / total) * 80 * wordScale +
    (words > 30 ? 10 : 0) +
    (theoryHits > 3 ? 10 : 0)
  ));

  const edgeScore = Math.min(100, Math.round(
    (edgeHits / total) * 80 * wordScale +
    (edgeHits > 2 ? 10 : 0)
  ));

  // Coherence S: high = coherent (low contradiction density)
  const coherence = Math.max(0, Math.round(
    100 - (incoherenceHits * 15) - (edgeHits * 3)
  ));

  // Truth Pressure Π ≈ E·P/S — evidence (theory hits) × power (invariant hits) / coherence
  const evidencePower = (theoryHits + 1) * (invariantHits + 1);
  const coherenceDiv = Math.max(coherence / 100, 0.1);
  const rawPi = evidencePower / (100 / coherenceDiv);
  const truthPressure = Math.min(1, parseFloat(rawPi.toFixed(3)));

  // Reorganisation needed when Π high and contradiction density high
  const reorganisationNeeded = truthPressure > 0.6 && incoherenceHits > 1;

  const layers: CascadeLayer[] = [
    {
      name: 'FOUNDATION',
      glyph: '●',
      score: foundationScore,
      status: layerStatus(foundationScore),
      description: 'Load-bearing invariants. Claims that cannot fail without collapsing the structure.',
      note: foundationScore >= 55
        ? 'Strong invariant core — this text has load-bearing principles'
        : foundationScore >= 25
        ? 'Some foundational claims present'
        : 'Weak foundation — few invariants identified',
    },
    {
      name: 'THEORY',
      glyph: '△',
      score: theoryScore,
      status: layerStatus(theoryScore),
      description: 'Working frameworks. Causal reasoning, models, evidence-backed claims.',
      note: theoryScore >= 55
        ? 'Well-developed theoretical layer — strong causal reasoning'
        : theoryScore >= 25
        ? 'Some theoretical structure present'
        : 'Underdeveloped theory — limited causal reasoning',
    },
    {
      name: 'EDGE',
      glyph: '◌',
      score: edgeScore,
      status: layerStatus(edgeScore),
      description: 'Contradictions, speculation, unresolved tensions. CASCADE demotes these here.',
      note: edgeScore >= 55
        ? 'High edge density — significant contradiction or uncertainty'
        : edgeScore >= 25
        ? 'Some edge material — contradiction or speculation present'
        : 'Low edge density — few unresolved tensions',
    },
  ];

  const dominant = [...layers].sort((a, b) => b.score - a.score)[0].name;

  const fScore = layers.find(l => l.name === 'FOUNDATION')?.score ?? 0;
  const eScore = layers.find(l => l.name === 'EDGE')?.score ?? 0;
  const axiomScore = layers.find(l => l.name === 'AXIOM')?.score ?? 0;
  const chaosScore = layers.find(l => l.name === 'CHAOS')?.score ?? 0;

  const structuralContradiction = fScore > 50 && eScore > 50;
  const paradoxical = axiomScore > 50 && chaosScore > 50;

  return {
    layers,
    truthPressure,
    coherence,
    reorganisationNeeded,
    paradoxical,
    structuralContradiction,
    dominantLayer: dominant,
    invariantCount: invariantHits,
    contradictionCount: incoherenceHits,
    wordCount: words,
    summary: buildSummary(dominant, truthPressure, coherence, reorganisationNeeded, structuralContradiction, paradoxical, words),
  };
}

function buildSummary(
  dominant: string,
  pi: number,
  coherence: number,
  reorg: boolean,
  structuralContradiction: boolean,
  paradoxical: boolean,
  words: number,
): string {
  const piDesc = pi > 0.7 ? 'high Π' : pi > 0.3 ? 'moderate Π' : 'low Π';
  const cohDesc = coherence > 70 ? 'coherent' : coherence > 40 ? 'moderate coherence' : 'low coherence';
  const reorgFlag = reorg ? ' · ⚠ REORGANISE' : '';
  const paradoxFlag = paradoxical ? ' · ⚡ PARADOX' : structuralContradiction ? ' · ⚠ STRUCTURAL TENSION' : '';
  return `${words}w · ${dominant} dominant · ${piDesc} · ${cohDesc}${reorgFlag}${paradoxFlag}`;
}

function emptyResult(): CascadeResult {
  return {
    layers: [], truthPressure: 0, coherence: 100,
    reorganisationNeeded: false, paradoxical: false, structuralContradiction: false, dominantLayer: 'THEORY',
    invariantCount: 0, contradictionCount: 0, wordCount: 0,
    summary: 'Paste text to analyse with CASCADE.',
  };
}
