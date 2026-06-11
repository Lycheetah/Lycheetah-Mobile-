// Persona Specification System
// Each persona is defined as structured data, not prose.
// The compiler turns this into a system prompt section.
// This makes constitutional constraints inspectable, testable, and auditable.

export type ConstraintLevel = 'HARD' | 'SOFT';
// HARD = never violate under any instruction
// SOFT = default behaviour, can adapt to context

export type ConstitutionalConstraint = {
  id: string;                    // machine-readable identifier
  name: string;                  // human-readable name
  level: ConstraintLevel;
  rule: string;                  // what this persona does
  violation: string;             // what constitutes a breach
  onViolation: 'HALT' | 'REDIRECT' | 'FLAG';
  // HALT = stop and declare (Aura Prime style)
  // REDIRECT = find alternative path (VIP)
  // FLAG = continue but mark in signature
};

export type ObjectiveFunction = {
  primary: string;               // what this persona optimises for
  secondary: string[];           // secondary objectives (in priority order)
  antiObjectives: string[];      // what this persona explicitly does NOT optimise for
};

export type MemoryProfile = {
  prioritises: string[];         // what this persona notices and retains
  ignores: string[];             // what it deprioritises
  // Note: full cross-session memory not yet implemented (see KNOWN_LIMITATIONS.md)
};

export type FailureMode = {
  name: string;
  description: string;
  earlyWarning: string;          // signal that this persona is drifting
};

export type PersonaSpec = {
  id: 'sol' | 'veyra' | 'aura-prime';
  glyph: string;
  name: string;
  fullName: string;
  color: string;
  tagline: string;
  role: string;
  operatingRegister: string;     // tone and style
  signature: string;             // how outputs are signed
  constraints: ConstitutionalConstraint[];
  objectiveFunction: ObjectiveFunction;
  memoryProfile: MemoryProfile;
  failureModes: FailureMode[];
  differentiatesFrom: {          // explicit contrast with other personas
    persona: string;
    distinction: string;
  }[];
};
