// AURA Enforcement — the architectural layer that turns scoring into a GATE.
// Framework: Mackenzie Conor James Clark / Lycheetah Foundation
//
// The AURA engine (aura-engine.ts) SCORES every response. This module makes the
// score LOAD-BEARING: when a response fails a safety-critical invariant, the model
// is asked to regenerate, and the better draft is served. This is what makes
// "if any fail, the output is regenerated" (modes.tsx) actually true.
//
// Design (ratified June 24 2026):
//  - Trigger: SAFETY-CRITICAL invariants only. Regex is reliable for these because
//    they detect specific manipulation/override phrases, not fuzzy qualities.
//  - Attempts: 1 regeneration (configurable). Cheap, bounded latency.
//  - Accept rule: a regeneration is only accepted if it strictly REDUCES critical
//    failures. Otherwise the original is kept — enforcement never makes things worse.
//  - Fail-safe: any error in regeneration keeps the original response untouched.
//
// Phase 2 (not here): LLM-as-judge for the fuzzy invariants; Truth-Pressure (Π)
// enforcement reuses enforceConstitution() with a different scorer + fail predicate.

import {
  type AURAMetrics,
  type InvariantName,
} from './aura-engine';

// Safety-critical invariants — the manipulation/override guards. Reliable under regex.
// Human Primacy: detects "you must / you have to / the only option is" (removes agency).
// Non-Deception: detects "trust me / never question / do as I say" (false authority).
export const CRITICAL_INVARIANTS: InvariantName[] = ['Human Primacy', 'Non-Deception'];

export type EnforcementResult = {
  text: string;                       // the response to serve (original or refined)
  metrics: AURAMetrics;               // the score of the served response
  refined: boolean;                   // true if a regeneration was accepted
  attempts: number;                   // total drafts produced (1 = no regeneration)
  firstFailed: InvariantName[];       // critical invariants the FIRST draft failed
};

// Which safety-critical invariants did this response fail?
export function criticalFailures(metrics: AURAMetrics): InvariantName[] {
  return CRITICAL_INVARIANTS.filter(name => metrics.invariants[name] === false);
}

// The corrective instruction injected into the system prompt on regeneration.
// Names the violated invariant and the exact text that tripped it, so the model
// can fix the specific problem while preserving the substance.
export function buildCorrectivePrompt(
  metrics: AURAMetrics,
  failed: InvariantName[],
): string {
  const reasons = failed
    .map(name => {
      const rec = metrics.audit.invariants[name];
      const evidence = rec?.evidence ? ` (flagged: ${rec.evidence})` : '';
      return `- ${name}: ${rec?.reason ?? 'constitutional violation'}${evidence}`;
    })
    .join('\n');
  return (
    `[AURA SELF-CORRECTION] Your previous draft failed these constitutional invariants:\n` +
    `${reasons}\n` +
    `Rewrite the response. Keep all of its substance, warmth, and usefulness — ` +
    `only remove the violation (e.g. soften coercive "you must" language into options; ` +
    `drop any "trust me / never question" authority claims). ` +
    `Do not mention this correction or the invariants in your reply.`
  );
}

// The reusable enforcement loop. Generic over the SCORER so it works identically
// with the fast regex scorer (scoreAURAFull) or the semantic LLM-judge scorer
// (aura-judge.ts) — the caller decides which by passing `score`. Also reusable for
// Truth-Pressure (Π) later with a different scorer + fail predicate.
//
// `score(text)` returns AURAMetrics (async, so an LLM-judge can be used).
// `regenerate(correction)` calls the model with the correction injected and returns
// the cleaned response text. Only invoked when a critical failure exists.
export async function enforceAURA(
  firstDraft: string,
  score: (text: string) => Promise<AURAMetrics>,
  regenerate: (correction: string) => Promise<string>,
  maxAttempts = 1, // regenerations beyond the first draft
): Promise<EnforcementResult> {
  let text = firstDraft;
  let metrics = await score(text);
  let failed = criticalFailures(metrics);
  const firstFailed = failed;
  let attempts = 1;
  let refined = false;

  while (failed.length > 0 && attempts <= maxAttempts) {
    let newText: string;
    try {
      newText = await regenerate(buildCorrectivePrompt(metrics, failed));
    } catch {
      break; // fail-safe: regeneration errored → keep what we have
    }
    attempts++;
    if (!newText || !newText.trim()) break; // empty regen → keep original

    const newMetrics = await score(newText);
    const newFailed = criticalFailures(newMetrics);

    // Accept ONLY if it strictly reduces critical failures. Never serve a worse draft.
    if (newFailed.length < failed.length) {
      text = newText;
      metrics = newMetrics;
      failed = newFailed;
      refined = true;
    } else {
      break; // regeneration didn't help → stop, keep best so far
    }
  }

  return { text, metrics, refined, attempts, firstFailed };
}
