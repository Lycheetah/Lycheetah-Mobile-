// CASCADE Judge — auto-scoring the 9 onion layers with the engine, not by hand.
// Framework: Mackenzie Conor James Clark / Lycheetah Foundation
//
// This is Truth Pressure running live. The user writes the CLAIM and the CONTENT of each of
// the 9 layers (the actual thinking). The judge reads that content and scores how well each
// layer fulfils its epistemic role — populating `framework_score` per layer. The onion engine
// (cascade-onion.ts) then turns those into Π = E·P/(S+S₀) and the block score. The human's
// `sovereign_score` stays as their OVERRIDE — their disagreement with the engine's verdict.
//
// REGISTER (Reflexive Π): the score is MEASURED, with a language model as the instrument —
// NOT gospel. The truth-pressure tool must pass its own truth-pressure test: never overclaim.
// One model call per block (all 9 layers in one structured pass). Mirrors aura-judge.ts.
//
// Two modes:
//   'score' — fast auto-score: each layer 0–100 + a short reason.
//   'audit' — Depth Audit (Nigredo): same scores PLUS the adversarial read — attacks the
//             axiom's falsifiability, the weakest layer, and the single sharpest objection.

import { getActiveKey, getModel } from '../storage';
import { sendMessageResilient, type AIModel } from '../ai-client';
import { ONION_LAYERS, type LayerData } from './cascade-onion';

export type CascadeJudgeMode = 'score' | 'audit';

export const CASCADE_JUDGE_SYSTEM =
  'You are the CASCADE engine — a truth-pressure instrument for the Lycheetah framework. You ' +
  'read a knowledge claim and the content of its nine epistemic layers, and you score each ' +
  'layer 0–100 by how well its CONTENT fulfils that layer\'s role. Score by MEANING and ' +
  'evidence, not length or confidence. Be honest and exacting: thin or empty content scores ' +
  'low; genuine evidence and structure score high. You are not flattering the author — you are ' +
  'measuring the claim. Respond with ONLY the requested JSON.';

// Per-layer judging key + the question the engine answers for that layer.
const LAYER_QUESTION: string[] = [
  'AXIOM — is the core claim clear, irreducible, and load-bearing? Score its strength as a claim.',
  'FOUNDATION — how strong is the primary evidence actually presented for the axiom?',
  'STRUCTURE — how sound is the logical architecture connecting claim to evidence?',
  'COHERENCE — how internally consistent is it? Penalise self-contradiction.',
  'RESONANCE — how well does it connect to other established truths?',
  'TENSION — how honestly does it name where the claim meets genuine friction? (Naming tension well scores HIGH.)',
  'CONTESTED — how well does it acknowledge active dispute / what others challenge?',
  'SPECULATIVE — how clearly does it mark what it implies beyond what is proven?',
  'FRONTIER — how honestly does it name the unknown edge it cannot yet account for?',
];

export type LayerVerdict = { score: number; reason: string };
export type CascadeVerdict = {
  layers: LayerVerdict[];       // length 9, indexed to ONION_LAYERS
  falsifiable: boolean;         // AXIOM gate
  weakestLayer?: string;        // audit mode: name of the weakest layer
  objection?: string;           // audit mode: the single sharpest objection
};

export function buildCascadePrompt(claim: string, layers: { content: string }[], mode: CascadeJudgeMode): string {
  const body = ONION_LAYERS.map((l, i) => {
    const content = (layers[i]?.content || '').trim() || '(empty)';
    return `${i}. ${l.name} — ${LAYER_QUESTION[i]}\n   CONTENT: ${content}`;
  }).join('\n');

  const scoreShape = ONION_LAYERS
    .map((l, i) => `"${i}":{"score":<0-100>,"reason":"<≤12 words>"}`)
    .join(',');

  const auditExtra = mode === 'audit'
    ? ',"falsifiable":<true|false>,"weakest":"<layer name>","objection":"<the single sharpest objection, ≤25 words>"'
    : ',"falsifiable":<true|false>';

  const stance = mode === 'audit'
    ? 'Run a NIGREDO adversarial read. Attack the claim at its weakest point. Be cold and exact.'
    : 'Score each layer honestly.';

  return (
    `${stance}\n\nCLAIM: "${claim || '(no claim stated)'}"\n\n` +
    `LAYERS:\n${body}\n\n` +
    `Empty content scores 0. Set "falsifiable" false only if the AXIOM cannot in principle be ` +
    `proven wrong.\nReturn ONLY this JSON:\n{${scoreShape}${auditExtra}}`
  );
}

// Parse the judge's JSON into a verdict. Returns null on ANY parse failure so the caller can
// leave the human's manual scores untouched — a bad judge response never corrupts the block.
export function parseCascadeVerdict(raw: string, mode: CascadeJudgeMode): CascadeVerdict | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Record<string, any>;

    const layers: LayerVerdict[] = ONION_LAYERS.map((_, i) => {
      const v = parsed[String(i)];
      const rawScore = v && typeof v.score === 'number' ? v.score : 0;
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));
      const reason = (v && v.reason ? String(v.reason) : '').slice(0, 120);
      return { score, reason };
    });

    // falsifiable defaults TRUE — never trip the gate on absence of data.
    const falsifiable = parsed.falsifiable === false ? false : true;
    const verdict: CascadeVerdict = { layers, falsifiable };
    if (mode === 'audit') {
      if (parsed.weakest) verdict.weakestLayer = String(parsed.weakest).slice(0, 24);
      if (parsed.objection) verdict.objection = String(parsed.objection).slice(0, 200);
    }
    return verdict;
  } catch {
    return null;
  }
}

// Apply a verdict onto a set of layers: fills framework_score + the axiom falsifiable flag.
// Pure — returns new layer objects, leaving sovereign_score (the human's override) untouched.
export function applyVerdict<T extends LayerData>(layers: T[], verdict: CascadeVerdict): T[] {
  return layers.map((l, i) => {
    const next: T = { ...l, framework_score: verdict.layers[i]?.score ?? 0 };
    if (i === 0) next.falsifiable = verdict.falsifiable;
    return next;
  });
}

// Full async entry point: score (or audit) one block. Resolves the active key/model itself and
// uses the resilient waterfall, so a rate-limited key falls back rather than breaking the audit.
// Returns null if there is no key or the model returns unparseable output (caller keeps state).
export async function auditCascadeBlock(
  claim: string,
  layers: { content: string }[],
  mode: CascadeJudgeMode = 'score',
): Promise<CascadeVerdict | null> {
  const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
  const prompt = buildCascadePrompt(claim, layers, mode);
  try {
    const res = await sendMessageResilient(
      [{ role: 'user', content: prompt }],
      CASCADE_JUDGE_SYSTEM,
      apiKey || '',
      (model || 'meta/llama-3.3-70b-instruct') as AIModel,
      undefined,
      'fast',
      1024,
      0.4, // low temperature — scoring wants consistency, not creativity
    );
    return parseCascadeVerdict(res.text, mode);
  } catch {
    return null;
  }
}
