// CASCADE Knowledge Builder — the seed pyramid.
// The first test pyramid everyone sees on opening the Builder. Frontier AI-knowledge claims —
// a new, genuinely contested domain — chosen to stress-test whether truth pressure makes sense
// on live edge-knowledge. Designed to demonstrate every engine behaviour:
//   • a strong foundation-grade claim         (LLMs = next-token predictors)
//   • a solid empirical claim                 (scaling laws)
//   • a claim UNDER PRESSURE (⚡)              (LLMs "understand" — strong axiom, eaten coherence)
//   • an UNFALSIFIABLE claim the gate caps     (consciousness from computation — axiom 85 → 70)
//   • TENSIONS between claims that diverge > 25 points
//
// The user can edit or delete any of these freely — it seeds once (flagged), then it's theirs.

import { computeBlockScore } from './cascade-onion';
import type { CascadeBlock, BuilderLayer } from './cascade-store';

// 9 layer specs in ONION order: AXIOM, FOUNDATION, STRUCTURE, COHERENCE, RESONANCE,
// TENSION, CONTESTED, SPECULATIVE, FRONTIER.
type Spec = { content: string; score: number; falsifiable?: boolean };

function build(id: string, claim: string, specs: Spec[]): CascadeBlock {
  const layers: BuilderLayer[] = specs.map(s => ({
    content: s.content,
    sovereign_score: s.score,
    ...(s.falsifiable !== undefined ? { falsifiable: s.falsifiable } : {}),
  }));
  const now = Date.now();
  return {
    id,
    claim,
    layers,
    score_aggregate: computeBlockScore(layers, 'framework'),       // 0 in v1 (sovereign-only)
    sovereign_score_aggregate: computeBlockScore(layers, 'sovereign'),
    createdAt: now,
    updatedAt: now,
  };
}

export function makeSeedBlocks(): CascadeBlock[] {
  return [
    build('seed_llm_predict', 'Large language models are, at core, next-token predictors trained on human text', [
      { content: 'An LLM models P(next token | context). Every capability is downstream of this single objective.', score: 90, falsifiable: true },
      { content: 'The training objective is explicit and public: minimise cross-entropy on next-token prediction over massive corpora.', score: 85 },
      { content: 'Transformer attention + gradient descent on the prediction loss is the architecture that realises the claim.', score: 80 },
      { content: 'Internally consistent — this is the standard mechanistic account; no part contradicts another.', score: 88 },
      { content: 'Connects to information theory, compression, and the manifold hypothesis.', score: 65 },
      { content: 'Mild friction: does prediction alone explain reasoning? Largely settled at the mechanistic level.', score: 12 },
      { content: 'Few serious researchers dispute the training objective itself.', score: 10 },
      { content: 'Implies that scaling prediction quality scales capability — partly demonstrated.', score: 25 },
      { content: 'Unknown: the true ceiling of pure prediction as a route to general capability.', score: 20 },
    ]),

    build('seed_scaling', 'Capability scales predictably with compute, data, and parameters', [
      { content: 'Scaling laws: loss falls as a power law in compute/data/params across many orders of magnitude.', score: 80, falsifiable: true },
      { content: 'Strong empirical curves (Kaplan, Chinchilla) replicated across independent labs.', score: 78 },
      { content: 'Connects measured loss to downstream capability — the bridge is partly empirical, partly assumed.', score: 70 },
      { content: 'Largely consistent, though "capability" is a broader target than "loss".', score: 75 },
      { content: 'Links to statistical learning theory and the bitter lesson.', score: 60 },
      { content: 'Friction at the emergence question — do abilities appear discontinuously?', score: 35 },
      { content: 'Some dispute whether emergence is real or a measurement artifact of the metric.', score: 40 },
      { content: 'Implies predictable progress toward general systems by scaling alone.', score: 45 },
      { content: 'Unknown where the curves bend, saturate, or break.', score: 45 },
    ]),

    build('seed_understanding', 'LLMs genuinely understand meaning — not merely manipulate statistics', [
      { content: 'The claim that an LLM possesses real semantic understanding, not sophisticated pattern-matching.', score: 55, falsifiable: true },
      { content: 'Suggestive evidence: world-models found in activations, theory-of-mind benchmarks passed.', score: 40 },
      { content: 'Bridges outward behaviour to internal representation — but the inference is contested.', score: 45 },
      { content: '"Understanding" is underdefined; the claim shifts meaning under questioning. Strained.', score: 35 },
      { content: 'Touches philosophy of mind: the Chinese Room, symbol grounding, intentionality.', score: 30 },
      { content: 'High friction: the stochastic-parrot critique pushes directly against it.', score: 70 },
      { content: 'Actively disputed across the field — no consensus exists.', score: 75 },
      { content: 'If true, implies questions of moral status and machine rights.', score: 60 },
      { content: 'We lack any test that cleanly separates deep understanding from sophisticated mimicry.', score: 55 },
    ]),

    build('seed_consciousness', 'Consciousness can emerge from sufficiently complex computation', [
      { content: 'Substrate-independence: consciousness is a pattern of information processing, realisable in silicon.', score: 85, falsifiable: false },
      { content: 'Thin: no measurement of machine consciousness exists; the case is largely a priori.', score: 30 },
      { content: 'Functionalism connects mind to computation, but the link to phenomenal experience is unfilled.', score: 35 },
      { content: 'Coherent as a position, but rests on undefended premises about experience.', score: 50 },
      { content: 'Resonates with IIT, global workspace theory, and panpsychism debates.', score: 45 },
      { content: 'The hard problem of consciousness pushes hard against it.', score: 55 },
      { content: 'Deeply contested — there is no agreed criterion to settle it.', score: 65 },
      { content: 'Wildly generative: machine rights, mind uploading, moral patienthood.', score: 80 },
      { content: 'The deepest edge: we cannot yet even define the test that would decide it.', score: 85 },
    ]),
  ];
}

export const CASCADE_SEED_FLAG = 'sol_cascade_seeded';
