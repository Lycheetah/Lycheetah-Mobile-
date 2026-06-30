// CASCADE Knowledge Builder — the seed pyramid (v2).
// A pre-scored Truth Pressure pyramid — the theory demonstrating itself.
// Every block uses framework_score so AUTO mode works from day one.
// The user can edit or delete any block freely — seeds once (flagged), then theirs.

import { computeBlockScore } from './cascade-onion';
import type { CascadeBlock, BuilderLayer } from './cascade-store';

type Spec = { content: string; score: number; falsifiable?: boolean };

function build(id: string, claim: string, specs: Spec[]): CascadeBlock {
  const layers: BuilderLayer[] = specs.map(s => ({
    content:        s.content,
    framework_score: s.score,   // AUTO mode: engine track
    sovereign_score: s.score,   // MANUAL mode: same starting point
    ...(s.falsifiable !== undefined ? { falsifiable: s.falsifiable } : {}),
  }));
  const now = Date.now();
  return {
    id,
    claim,
    layers,
    score_aggregate:          computeBlockScore(layers, 'framework'),
    sovereign_score_aggregate: computeBlockScore(layers, 'sovereign'),
    createdAt: now,
    updatedAt: now,
  };
}

function L(rows: [string, number][], axiomFalsifiable?: boolean): Spec[] {
  return rows.map(([content, score], i) => ({
    content,
    score,
    ...(i === 0 && axiomFalsifiable !== undefined ? { falsifiable: axiomFalsifiable } : {}),
  }));
}

export function makeSeedBlocks(): CascadeBlock[] {
  return [

    build('tp_definition', 'Truth Pressure measures how hard a belief resists being wrong', L([
      ['A belief carries pressure in proportion to how much evidence supports it and how strongly it explains — falsifiable by observing whether high-Π beliefs actually survive contact with new data.', 90],
      ['Formalised as Π = E·P/(S+S₀). E = evidence density, P = explanatory power, S = coherence, S₀ = regularisation floor. All terms independently operationalised.', 86],
      ['Derives from three independent routes: Bayesian updating, the falsifiability requirement, and the tension-reorganisation cascade. No route contradicts the others.', 82],
      ['All terms are consistently defined. No part of the framework undermines another. Π rises when support rises and falls when coherence is eaten by tension.', 90],
      ['Connects to Bayesian inference, Popperian falsification, epistemic coherentism, and belief revision theory. Each tradition validates a different component.', 74],
      ['Mild: "resists being wrong" is a metaphor — the operational form is Π, which is precise. The bridge from metaphor to formula is explicit.', 10],
      ['Not widely known outside this framework — the specific form is original, though the intuition is shared with several traditions.', 8],
      ['Whether Π scores generalise across knowledge domains beyond the test cases is under empirical investigation (CR1–CR4).', 22],
      ['Exact calibration of S₀ and the cascade threshold Θ are pre-registered open obligations. The theory is complete; the constants are pending.', 28],
    ], true)),

    build('tp_formula', 'Π = E·P / (S + S₀) — the three-factor pressure equation', L([
      ['The formula is explicitly derived in the Truth Pressure Canon §I. Every symbol is formally defined before use. It is not ad hoc.', 85],
      ['E, P, S each have layered operationalisations: E from foundation+structure layers, P from the axiom layer, S from coherence minus tension/contested penalties.', 80],
      ['S₀ (the strain floor) prevents Π from diverging when coherence approaches zero. Canon value S₀=5 on the 0–100 scale, matching S₀=0.05 on 0–1 scale.', 78],
      ['Internally consistent. The three factors are independent. Raising P without raising E raises pressure but not necessarily score — the distinction matters.', 86],
      ['Generalises standard Bayesian credence updates to network-level pressure. The formula is compact and computable.', 70],
      ['Mild: the multiplicative form (E×P) could be additive — the choice is justified by the requirement that zero evidence or zero power produces zero pressure regardless of the other.', 14],
      ['The specific formula is one of several possible pressure metrics. Its advantage is derivability from first principles; its limitation is the three constants (E, P, S) require calibration.', 18],
      ['Whether the formula holds across non-linguistic knowledge (visual, procedural) is not yet tested.', 30],
      ['Pre-registration of k₁–k₄ weighting constants is an open obligation in the empirical programme.', 35],
    ], true)),

    build('tp_pressure_state', 'A strong axiom and weak coherence produces peak pressure — the ⚡ state', L([
      ['When axiom > 50 and coherence < 40, the denominator S+S₀ is near its floor while the numerator is high. Π spikes. This is a structural feature of the formula, not an edge case.', 80],
      ['Empirically: cascade events cluster in the ⚡ state. High-axiom, low-coherence blocks are the most likely sites of reorganisation.', 74],
      ['The ⚡ indicator is triggered by blockUnderPressure() — a direct read of the computed layer values, not a heuristic.', 72],
      ['Coherent: the ⚡ state is stable (no contradiction between axiom strength and coherence collapse — they can coexist), just unstable under new evidence.', 82],
      ['Analogous to "cognitive dissonance" in psychology, but structural rather than phenomenological.', 65],
      ['Friction: a high-axiom belief with eaten coherence might indicate a great insight under attack, or a false belief surrounded by exceptions. The ⚡ state flags the condition — it does not adjudicate.', 25],
      ['Contested: some would argue low coherence alone is sufficient to flag instability, without requiring a strong axiom. The two-factor condition is a design choice.', 22],
      ['Whether the ⚡ threshold (50/40) is optimal is a tuning question. Current values were chosen to produce meaningful but not over-fired flags on test corpora.', 38],
      ['The exact boundary conditions are calibrated heuristics pending the CR1–CR4 empirical programme.', 42],
    ], true)),

    build('tp_cascade_structure', 'CASCADE organises knowledge from invariants at the apex to speculation at the frontier', L([
      ['The pyramid is ordered by score_aggregate descending — highest-pressure, most-established claims rise to the top automatically.', 76],
      ['Demonstrated by the engine: blocks sort themselves without user intervention. The apex earns its position from the scores.', 70],
      ['The onion layers (AXIOM → FRONTIER) map directly to the pyramid tiers. A block with strong axiom and low speculative content rises. A speculative block with weak axiom stays at the base.', 68],
      ['Internally consistent. The layer structure and the pyramid ordering are derived from the same scoring function — no separate rule for "what goes where".', 80],
      ['Analogous to the scientific pyramid: reproducible findings at the base, theories in the middle, hypotheses at the frontier. CASCADE makes this spatial and computable.', 65],
      ['Friction: expertise is needed to fill the layers accurately. Without good content, the engine scores are unreliable.', 28],
      ['Contested whether a score-based pyramid is the right shape for all knowledge domains — some fields have no "bedrock", only contested clusters.', 35],
      ['The pyramid layout is one possible visualisation. A network graph (in progress) may better represent cross-block tensions.', 40],
      ['The number of rows and blocks per row (1/2/3/4/5) is a display constant, not a theoretical claim.', 45],
    ], true)),

    build('tp_falsifiability', 'Unfalsifiable axioms are capped at 70 — claiming certainty without a test is a ceiling, not a floor', L([
      ['An axiom that cannot be tested cannot score above 70 regardless of confidence. The cap is structural — hardcoded into the engine.', 72],
      ['Operationalised via the falsifiable flag on layer 0. When false, FALSIFIABILITY_CAP (70) is applied before all downstream calculations.', 68],
      ['The cap propagates: since foundation is bounded at axiom×1.1 and structure at foundation×1.2, a capped axiom limits the entire block\'s ceiling.', 65],
      ['Coherent with Popperian epistemology: a claim that cannot be falsified provides no information about the world and should not be treated as load-bearing.', 78],
      ['Connects to the demarcation problem, falsificationism, and the precautionary principle in science.', 62],
      ['Friction: some load-bearing truths (logical axioms, mathematical foundations) may be genuinely unfalsifiable yet carry real knowledge. The cap treats all unfalsifiable claims equally, which is a simplification.', 32],
      ['Contested: some traditions (coherentism, pragmatism) do not require falsifiability as a criterion of knowledge.', 38],
      ['The specific cap value (70) is a calibration choice. A lower cap (e.g., 50) would be more restrictive; a higher one less so.', 42],
      ['Whether the binary falsifiable/unfalsifiable flag should be a continuous "testability" score is an open design question.', 48],
    ], true)),

    build('tp_tension', 'Cross-block tension flags the live contradictions in a knowledge network', L([
      ['When two blocks\' scores diverge by more than the tension threshold, the system surfaces the contradiction as a TENSION. The stronger block is not automatically right.', 65],
      ['Demonstrated: in the seed pyramid, consciousness vs. computation and the alignment question produce genuine TENSION pairs because they occupy adjacent scoring bands with opposing content.', 58],
      ['Connects block-level tension to the network-level S (coherence) term: many active tensions reduce S across the pyramid, raising system-wide Π.', 60],
      ['Coherent with epistemology of disagreement: tension does not resolve claims, it marks the live edges where resolution is needed.', 74],
      ['Analogous to falsifying observation in science — the tension does not disprove, it creates pressure to resolve.', 60],
      ['Friction: tension detection uses score divergence as a proxy for logical contradiction. Two claims can diverge in score for reasons unrelated to contradiction.', 38],
      ['Contested whether delta-score is the right tension signal. Semantic contradiction detection (NLP-based) would be more precise but computationally heavier.', 45],
      ['Whether the current tension threshold (25 pts delta) is well-calibrated is a tuning question pending empirical feedback.', 52],
      ['The system surfaces tensions but does not resolve them. Resolution is the user\'s responsibility — by design.', 55],
    ], true)),

    build('tp_threshold', 'The cascade threshold Θ — when Π exceeds it, the network reorganises', L([
      ['A cascade event occurs when accumulated Π across the network crosses Θ while incoherence is high. Blocks below the threshold descend; blocks above it rise.', 55],
      ['Partially evidenced: the S₀ regularisation was derived from a self-found defect (7 errors in 847 cascade events) and fixed the divergence problem. The threshold itself is still under calibration.', 48],
      ['Bridges Π (a block property) to network reorganisation (a structural event). The causal chain from single-block pressure to cascade is the current frontier.', 45],
      ['Strained at this layer: "reorganisation" is defined operationally (blocks move in the pyramid), not by a formal criterion derived from Π. The connection is asserted, not proven.', 55],
      ['Resonates with phase transitions, tipping points, the edge of chaos. The mathematical analogues are well-developed but not yet mapped onto the CASCADE specific form.', 50],
      ['The threshold value Θ is post-hoc — chosen after observing cascade behaviour, not pre-registered. This is the highest-priority open obligation in the empirical programme.', 65],
      ['Contested: whether a single threshold Θ governs all claim types, or whether different domains require different thresholds, is unresolved.', 70],
      ['If Θ is domain-dependent, the current single-Θ model is a first approximation that will require extension.', 72],
      ['Empirical pre-registration (CR1–CR4) is the path to earning this block a STRONG rating. Until then, it remains at FRONTIER.', 78],
    ], true)),

  ];
}

// v2: use this flag so existing installs re-seed with the new pre-scored pyramid.
export const CASCADE_SEED_FLAG = 'sol_cascade_seeded_v2';
