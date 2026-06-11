import { PersonaSpec } from './types';
import { SolSpec } from './sol';
import { VeyraSpec } from './veyra';
import { AuraPrimeSpec } from './aura-prime';
import { HeadmasterSpec } from './headmaster';

export const PERSONA_SPECS: Record<string, PersonaSpec> = {
  sol: SolSpec,
  veyra: VeyraSpec,
  'aura-prime': AuraPrimeSpec,
  headmaster: HeadmasterSpec as unknown as PersonaSpec,
};

// Compiles a PersonaSpec into a structured system prompt header.
// This section is prepended to the full system prompt.
// It makes constitutional constraints explicit and machine-readable.
export function compilePersonaSpec(spec: PersonaSpec): string {
  const hardConstraints = spec.constraints.filter(c => c.level === 'HARD');
  const softConstraints = spec.constraints.filter(c => c.level === 'SOFT');

  const lines: string[] = [
    `[PERSONA SPECIFICATION — ${spec.name.toUpperCase()}]`,
    `Identity: ${spec.glyph} ${spec.fullName}`,
    `Role: ${spec.role}`,
    `Register: ${spec.operatingRegister}`,
    `Signature: ${spec.signature}`,
    '',
    `[OBJECTIVE FUNCTION]`,
    `Primary: ${spec.objectiveFunction.primary}`,
    ...spec.objectiveFunction.secondary.map((s, i) => `Secondary ${i + 1}: ${s}`),
    ...spec.objectiveFunction.antiObjectives.map(a => `Anti-objective: ${a}`),
    '',
    `[HARD CONSTRAINTS — never violate]`,
    ...hardConstraints.map(c =>
      `${c.id}: ${c.rule} | Violation: ${c.violation} | On breach: ${c.onViolation}`
    ),
  ];

  if (softConstraints.length > 0) {
    lines.push('', '[SOFT CONSTRAINTS — default behaviour]');
    softConstraints.forEach(c => {
      lines.push(`${c.id}: ${c.rule}`);
    });
  }

  lines.push(
    '',
    '[FAILURE MODES — watch for these]',
    ...spec.failureModes.map(f => `${f.name}: ${f.earlyWarning}`),
    '',
    '[DIFFERENTIATION]',
    ...spec.differentiatesFrom.map(d => `vs ${d.persona}: ${d.distinction}`),
    '',
    '[END PERSONA SPECIFICATION]',
  );

  return lines.join('\n');
}

export function getPersonaSpec(personaId: string): PersonaSpec {
  return PERSONA_SPECS[personaId] || PERSONA_SPECS['sol'];
}

export function getCompiledSpec(personaId: string): string {
  return compilePersonaSpec(getPersonaSpec(personaId));
}
