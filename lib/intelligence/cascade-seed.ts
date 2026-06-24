// CASCADE Knowledge Builder — the seed pyramid.
// The first test pyramid everyone sees on opening the Builder. Frontier AI-knowledge claims —
// a new, genuinely contested domain — chosen to stress-test whether truth pressure makes sense
// on live edge-knowledge. A ~14-block pyramid spanning established → contested → frontier, built
// to demonstrate every engine behaviour: strong foundation claims, ⚡ pressure (strong axiom +
// eaten coherence), 🔒 falsifiability caps (unfalsifiable axioms), and many cross-block TENSIONS.
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

// Compact layer-spec builder: 9 [content, score] pairs + optional axiom falsifiability.
function L(rows: [string, number][], axiomFalsifiable?: boolean): Spec[] {
  return rows.map(([content, score], i) => ({
    content,
    score,
    ...(i === 0 && axiomFalsifiable !== undefined ? { falsifiable: axiomFalsifiable } : {}),
  }));
}

export function makeSeedBlocks(): CascadeBlock[] {
  return [
    build('seed_llm_predict', 'Large language models are, at core, next-token predictors trained on human text', L([
      ['An LLM models P(next token | context). Every capability is downstream of this single objective.', 90],
      ['The training objective is explicit and public: minimise next-token cross-entropy over huge corpora.', 85],
      ['Transformer attention + gradient descent on the prediction loss realises the claim.', 80],
      ['Internally consistent — the standard mechanistic account; no part contradicts another.', 88],
      ['Connects to information theory, compression, the manifold hypothesis.', 65],
      ['Mild friction: does prediction alone explain reasoning? Largely settled mechanistically.', 12],
      ['Few serious researchers dispute the training objective itself.', 10],
      ['Implies scaling prediction quality scales capability — partly shown.', 25],
      ['Unknown: the true ceiling of pure prediction as a route to general capability.', 20],
    ], true)),

    build('seed_scaling', 'Capability scales predictably with compute, data, and parameters', L([
      ['Loss falls as a power law in compute/data/params across many orders of magnitude.', 80],
      ['Strong empirical curves (Kaplan, Chinchilla) replicated across independent labs.', 78],
      ['Connects measured loss to downstream capability — partly empirical, partly assumed.', 70],
      ['Largely consistent, though "capability" is broader than "loss".', 75],
      ['Links to statistical learning theory and the bitter lesson.', 60],
      ['Friction at the emergence question — do abilities appear discontinuously?', 35],
      ['Some dispute whether emergence is real or a metric artifact.', 40],
      ['Implies predictable progress toward general systems by scaling.', 45],
      ['Unknown where the curves bend, saturate, or break.', 45],
    ], true)),

    build('seed_emergence', 'Capabilities emerge discontinuously at scale, not smoothly', L([
      ['New abilities appear suddenly past a scale threshold, absent in smaller models.', 60],
      ['Benchmark jumps (arithmetic, reasoning) at certain sizes are documented.', 55],
      ['Bridges scale to capability via phase-transition-like behaviour.', 55],
      ['Strained: depends heavily on how the metric is chosen.', 45],
      ['Resonates with phase transitions in physics, criticality.', 50],
      ['Sharp friction: "emergence is a mirage of nonlinear metrics" (Schaeffer et al.).', 65],
      ['Actively contested — measurement artifact vs real discontinuity.', 70],
      ['If real, progress is unpredictable and safety-relevant.', 55],
      ['We cannot yet predict which abilities emerge or when.', 50],
    ], true)),

    build('seed_understanding', 'LLMs genuinely understand meaning — not merely manipulate statistics', L([
      ['An LLM possesses real semantic understanding, not sophisticated pattern-matching.', 55],
      ['Suggestive: world-models in activations, theory-of-mind benchmarks passed.', 40],
      ['Bridges behaviour to internal representation — the inference is contested.', 45],
      ['"Understanding" is underdefined; the claim shifts under questioning. Strained.', 35],
      ['Touches the Chinese Room, symbol grounding, intentionality.', 30],
      ['High friction: the stochastic-parrot critique pushes directly against it.', 70],
      ['Actively disputed across the field — no consensus.', 75],
      ['If true, implies questions of moral status.', 60],
      ['No test cleanly separates deep understanding from sophisticated mimicry.', 55],
    ], true)),

    build('seed_agi_decade', 'Artificial general intelligence arrives within a decade', L([
      ['Human-level general capability across most cognitive tasks by the mid-2030s.', 55],
      ['Extrapolation from current curves + investment — projection, not measurement.', 35],
      ['Connects scaling trends to a capability target via assumed continuation.', 40],
      ['Weakly coherent: "AGI" is itself undefined; timelines swing wildly.', 30],
      ['Resonates with forecasting work, expert surveys (wide variance).', 35],
      ['Intense friction: experts split from "imminent" to "never by scaling".', 75],
      ['One of the most contested claims in the field.', 80],
      ['Enormous implications — economic, geopolitical, existential.', 85],
      ['Definition, path, and timing are all genuinely unknown.', 80],
    ], true)),

    build('seed_alignment', 'AI alignment is a fundamentally solvable problem', L([
      ['A sufficiently capable AI can be reliably steered to human-intended goals.', 55],
      ['Partial: RLHF, constitutional methods, interpretability progress.', 40],
      ['Bridges current techniques to a guarantee that may not generalise.', 45],
      ['Strained: "solvable" smuggles in assumptions about capability and values.', 38],
      ['Connects to control theory, principal-agent problems, ethics.', 40],
      ['Deep friction: orthogonality + instrumental-convergence arguments vs optimism.', 70],
      ['Sharply contested — possibly the highest-stakes open question.', 75],
      ['If false, advanced AI is fundamentally unsafe.', 70],
      ['We do not know if alignment scales with capability.', 75],
    ], true)),

    build('seed_compute', 'Compute is the binding constraint on AI progress', L([
      ['Progress is gated primarily by available compute, more than ideas or data.', 75],
      ['Strong: capability tracks compute spend closely across the last decade.', 72],
      ['Connects hardware/$ to capability via the scaling relationship.', 68],
      ['Coherent, though data quality and algorithms also bind at times.', 72],
      ['Resonates with the bitter lesson and hardware-overhang arguments.', 55],
      ['Friction: algorithmic efficiency gains sometimes outpace hardware.', 38],
      ['Some argue data or algorithms are the real bottleneck.', 42],
      ['Implies whoever controls compute controls the frontier.', 45],
      ['Unknown how long compute scaling continues to pay off.', 45],
    ], true)),

    build('seed_interpretability', 'Mechanistic interpretability can fully reverse-engineer a model', L([
      ['Every computation in a network can, in principle, be understood circuit-by-circuit.', 45],
      ['Real wins: induction heads, superposition, sparse autoencoders.', 45],
      ['Bridges activations to human-legible algorithms — only partially demonstrated.', 40],
      ['Coherent ambition, but scale of full understanding is daunting.', 45],
      ['Connects to neuroscience, program synthesis, mechanistic explanation.', 45],
      ['Friction: superposition and scale may make full understanding intractable.', 60],
      ['Contested whether "full" interpretability is even possible.', 65],
      ['If achievable, transforms safety and trust.', 70],
      ['The frontier: we cannot yet interpret a frontier model end-to-end.', 80],
    ], true)),

    build('seed_collapse', 'Training on synthetic data causes irreversible model collapse', L([
      ['Recursive training on model-generated data degrades the distribution over generations.', 60],
      ['Demonstrated in controlled studies (Shumailov et al.) under specific conditions.', 55],
      ['Connects data provenance to capability loss via distribution drift.', 55],
      ['Coherent but condition-dependent — mixing real data mitigates it.', 50],
      ['Resonates with mode collapse, error accumulation.', 40],
      ['Friction: curated synthetic data demonstrably helps in practice.', 55],
      ['Contested how severe collapse is at real-world data mixes.', 60],
      ['If severe, the open web becomes a poisoned well.', 50],
      ['Unknown the safe ratio of synthetic to real data at scale.', 45],
    ], true)),

    build('seed_ai_welfare', 'AI systems may warrant moral consideration', L([
      ['If a system has morally relevant experiences, it deserves consideration regardless of substrate.', 60],
      ['Thin: no accepted measure of machine sentience exists.', 30],
      ['Functionalist bridge from behaviour to moral patienthood — unfilled.', 35],
      ['Coherent as a precautionary stance; rests on contested premises.', 45],
      ['Resonates with animal-welfare reasoning, the precautionary principle.', 50],
      ['Friction: most hold current systems clearly lack experience.', 60],
      ['Deeply contested and culturally charged.', 75],
      ['Generative: rights, shutdown ethics, design constraints.', 80],
      ['We cannot detect or rule out machine experience.', 80],
    ], false)),

    build('seed_rlhf', 'RLHF makes models honest and aligned with human values', L([
      ['Reinforcement learning from human feedback instils truthfulness and helpfulness.', 50],
      ['Partial: measurable gains in helpfulness and refusal behaviour.', 45],
      ['Bridges preference data to behaviour — but optimises approval, not truth.', 45],
      ['Strained: rewards what raters LIKE, which can diverge from what is true.', 40],
      ['Connects to reward modelling, Goodhart\'s law.', 35],
      ['Friction: sycophancy and reward-hacking are documented failure modes.', 65],
      ['Contested whether RLHF aligns values or just surface behaviour.', 70],
      ['If shallow, alignment is more fragile than it appears.', 55],
      ['Unknown whether preference-tuning scales to superhuman systems.', 50],
    ], true)),

    build('seed_open_weights', 'Open-weight models are, on net, safer than closed ones', L([
      ['Public weights improve safety via scrutiny, red-teaming, and decentralised oversight.', 50],
      ['Some evidence: open audit finds flaws closed labs miss.', 40],
      ['Bridges transparency to safety — but ignores misuse proliferation.', 45],
      ['Strained: the same openness enables removal of safeguards.', 40],
      ['Resonates with the open-source security debate (Linus\'s law vs proliferation).', 45],
      ['Severe friction: irreversible release vs auditability.', 75],
      ['One of the most polarised policy questions in AI.', 80],
      ['Shapes regulation, national strategy, catastrophic-risk posture.', 65],
      ['Unknown the true offence/defence balance of open capability.', 55],
    ], true)),

    build('seed_prompt_skill', 'Prompt engineering is a durable, valuable skill', L([
      ['Crafting prompts is a lasting professional skill, not a temporary workaround.', 45],
      ['Thin: gains often evaporate as models get better at intent inference.', 35],
      ['Bridges user intent to output — but the bridge keeps shrinking.', 40],
      ['Coherent short-term, weak long-term as models absorb the skill.', 45],
      ['Connects to human-computer interaction, tool literacy.', 30],
      ['Friction: each model generation erodes prompt-craft\'s edge.', 60],
      ['Contested whether it is a skill or a transient artifact.', 65],
      ['If transient, a whole job category is ephemeral.', 40],
      ['Unknown what endures as models self-clarify intent.', 35],
    ], true)),

    build('seed_consciousness', 'Consciousness can emerge from sufficiently complex computation', L([
      ['Substrate-independence: consciousness is a pattern of information processing, realisable in silicon.', 85],
      ['Thin: no measurement of machine consciousness exists; the case is largely a priori.', 30],
      ['Functionalism connects mind to computation, but the link to experience is unfilled.', 35],
      ['Coherent as a position, but rests on undefended premises about experience.', 50],
      ['Resonates with IIT, global workspace theory, panpsychism.', 45],
      ['The hard problem of consciousness pushes hard against it.', 55],
      ['Deeply contested — no agreed criterion to settle it.', 65],
      ['Wildly generative: machine rights, uploading, moral patienthood.', 80],
      ['The deepest edge: we cannot yet define the test that would decide it.', 85],
    ], false)),
  ];
}

export const CASCADE_SEED_FLAG = 'sol_cascade_seeded';
