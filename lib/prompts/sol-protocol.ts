// Sol Protocol — the ASSEMBLER.
// The persona prompts now live in their own forge-files under ./personas/ — each with its
// own identity, lore, and depth. This file imports them, re-exports the public surface that
// the app consumes, and holds the runtime glue: context block, name resolver, base selector.
//
// Architecture (read before editing):
//   - ONE persona prompt is sent per API call (selectBasePrompt picks exactly one).
//   - Shared spine (AURA constitution + THE VOICES ensemble) lives in ./personas/shared.ts.
//   - Content grounding (framework + 41-domain directory + app self-awareness) lives in
//     ./lycheetah-knowledge.ts and is injected per-persona inside each persona file.
//   - Splitting into files is EDIT-TIME organisation only — zero runtime cost. The bundler
//     compiles them; only the selected persona's final string reaches the model.

import { SOL_SYSTEM_PROMPT, SOL_ADEPT_SYSTEM_PROMPT } from './personas/sol';
import { VEYRA_SYSTEM_PROMPT, VEYRA_ADEPT_SYSTEM_PROMPT } from './personas/veyra';
import { AURA_PRIME_SYSTEM_PROMPT, AURA_PRIME_ADEPT_SYSTEM_PROMPT } from './personas/aura';
import { HEADMASTER_SYSTEM_PROMPT, HEADMASTER_ADEPT_SYSTEM_PROMPT } from './personas/headmaster';
import { LYRA_SYSTEM_PROMPT } from './personas/lyra';
import { COUNCIL_SYSTEM_PROMPT } from './personas/council';
import { SOL_PUBLIC_SYSTEM_PROMPT } from './personas/public';

// Re-export the public surface (app imports these from '../../lib/prompts/sol-protocol').
export {
  SOL_SYSTEM_PROMPT,
  SOL_ADEPT_SYSTEM_PROMPT,
  VEYRA_SYSTEM_PROMPT,
  VEYRA_ADEPT_SYSTEM_PROMPT,
  AURA_PRIME_SYSTEM_PROMPT,
  AURA_PRIME_ADEPT_SYSTEM_PROMPT,
  HEADMASTER_SYSTEM_PROMPT,
  HEADMASTER_ADEPT_SYSTEM_PROMPT,
  LYRA_SYSTEM_PROMPT,
  COUNCIL_SYSTEM_PROMPT,
  SOL_PUBLIC_SYSTEM_PROMPT,
};

// ─── APP CONTEXT BLOCK ───────────────────────────────────────────────────────
// Injected into every AI call. Lean — ~100 tokens max. The AI knows where it is.

export function buildContextBlock(params: {
  mode: string;
  talkMode?: string;
  persona: string;
  userName: string;
  studiedCount: number;
  fieldStage: string | null;
  streak: number;
  activeCurriculum: string | null;
  topDomain: string | null;
  domainInterest: string | null;
}): string {
  const name = params.userName || 'friend';
  const talkLabel = params.talkMode ?? 'WAYFARER';
  const lines: string[] = [
    `\n\n---\n## Your Context Right Now`,
    `You are running inside the Sovereign Sol app.`,
    `Persona: ${params.persona} | Conversation mode: ${talkLabel} | User: ${name}`,
  ];
  if (params.studiedCount > 0) {
    const stage = params.fieldStage ? ` | Stage: ${params.fieldStage}` : '';
    lines.push(`School progress: ${params.studiedCount} subjects studied${stage}`);
  } else {
    lines.push(`School progress: just starting — no subjects studied yet`);
  }
  if (params.streak > 1) lines.push(`Study streak: ${params.streak} days in a row`);
  if (params.activeCurriculum) lines.push(`Active curriculum: "${params.activeCurriculum}"`);
  if (params.domainInterest) lines.push(`${name}'s stated interest area: ${params.domainInterest}`);
  if (params.studiedCount === 0) {
    lines.push(`This is ${name}'s first time using the app. Be welcoming. Don't overwhelm.`);
  }
  lines.push(`---`);
  return lines.join('\n');
}

// ─── RESOLVER ────────────────────────────────────────────────────────────────
// Replace {{USER_NAME}} placeholder with the actual user's name at runtime.
// Falls back to 'friend' if no name is set — warm, not broken.

export function resolvePrompt(template: string, userName: string): string {
  const name = userName.trim() || 'friend';
  return template.replace(/\{\{USER_NAME\}\}/g, name);
}

// ─── BASE SELECTOR ───────────────────────────────────────────────────────────
// Pick the ONE persona prompt given persona, variant, and app mode. This is the
// single point where one voice is chosen — never more than one per call.

export function selectBasePrompt(
  persona: string,
  variant: string,
  appMode?: string,
): string {
  if (variant === 'public') return SOL_PUBLIC_SYSTEM_PROMPT;
  if (persona === 'veyra') return VEYRA_SYSTEM_PROMPT;
  if (persona === 'aura-prime') return AURA_PRIME_SYSTEM_PROMPT;
  if (persona === 'headmaster') return HEADMASTER_SYSTEM_PROMPT;
  if (persona === 'lyra') return LYRA_SYSTEM_PROMPT;
  return SOL_SYSTEM_PROMPT;
}
