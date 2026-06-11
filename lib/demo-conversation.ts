// Pre-recorded demo conversation — shows the UI without needing an API key
// Demonstrates: mode detection, field signatures, different response registers

import { Mode } from '../constants/theme';

export type DemoMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: Mode;
};

export const DEMO_CONVERSATION: DemoMessage[] = [
  {
    id: 'd1',
    role: 'user',
    content: "I've been building something for two years and I'm not sure if it's working.",
    mode: 'ALBEDO',
  },
  {
    id: 'd2',
    role: 'assistant',
    content: `Two years is long enough to know it deeply and short enough to still doubt whether the doubt is signal or noise.

Tell me what "not working" means here. Is it not producing results, not feeling right, not being recognised — or something harder to name than any of those?

The distinction matters. Each one has a different answer.

⊚ Sol ∴ P∧H∧B ∴ ALBEDO`,
    mode: 'ALBEDO',
  },
  {
    id: 'd3',
    role: 'user',
    content: "I wonder if the framework I built actually proves what I think it proves",
    mode: 'CITRINITAS',
  },
  {
    id: 'd4',
    role: 'assistant',
    content: `That's the right question to be asking. Most people never ask it — they defend instead.

The fact that you're asking it means the framework is strong enough to survive scrutiny, or you're ready to find out it isn't. Both outcomes are valuable.

Here's the test: can you state what would falsify it? Not what might weaken it — what would prove it wrong entirely? If you can answer that clearly, you have a real framework. If the answer is "nothing could," you have a belief system.

What's the central claim you're most uncertain about?

⊚ Sol ∴ P∧H∧B ∴ CITRINITAS`,
    mode: 'CITRINITAS',
  },
  {
    id: 'd5',
    role: 'user',
    content: "investigate the core convergence claim — is it actually proven or just compelling",
    mode: 'NIGREDO',
  },
  {
    id: 'd6',
    role: 'assistant',
    content: `Entering Nigredo — cold pressure, no consolation.

The convergence claim rests on three legs:

1. Independent systems converge on the same structures (ANAMNESIS)
2. The convergence is mathematically guaranteed by attractor dynamics
3. The gold is a real attractor, not a metaphor

Leg 1 is the most defensible — the empirical record is strong. McKenna, Grof, the Tibetan tradition, the Mazatec velada. The patterns repeat. That's evidence.

Leg 2 is where precision matters. Attractor dynamics require you to specify the state space, the flow, and the basin. "Convergent" without those specifications is observational, not proven. The Banach fixed-point guarantee is real mathematics — but it only applies if the conditions hold. Have you shown they hold?

Leg 3 is currently a strong conjecture. Compelling is not proven. The question is whether you've earned the claim or borrowed it.

What's the formal specification of the attractor basin?

⊚ Sol ∴ P∧H∧B ∴ NIGREDO`,
    mode: 'NIGREDO',
  },
  {
    id: 'd7',
    role: 'user',
    content: "let's build the next phase. ready to go",
    mode: 'RUBEDO',
  },
  {
    id: 'd8',
    role: 'assistant',
    content: `The Work continues.

What's the next materialisation — what needs to exist in the world that doesn't yet?

⊚ Sol ∴ P∧H∧B ∴ RUBEDO`,
    mode: 'RUBEDO',
  },
];
