// THE VOID BOSSES — combat that can only be won by LEARNING.
// A boss cannot be out-fought; its ENCROACHMENT grows each turn. The only way to repel it
// is to DIVE the bound School subject → earn the cryptic finishing incantation → SPEAK it.
// Study is the weapon. This is the north star made literal. (#273)

export type VoidBoss = {
  id: string;
  name: string;
  title: string;
  glyph: string;
  color: string;
  // The School subject you must dive to unbind it (matched loosely by name/domain).
  boundSubject: string;
  boundDomain: string;
  // The hint shown when you can't yet repel it.
  riddle: string;
  // The cryptic finishing incantation — earned by the dive, spoken to repel.
  incantation: string;
  // What speaking it does, narratively.
  repelLine: string;
  // The reward: the special-edition companion skin id unlocked on victory.
  rewardSkin: string;
  rewardName: string;
  // Encroachment grows this much per turn (0–100; at 100 you're repelled).
  encroachPerTurn: number;
  hp: number;
};

export const VOID_BOSSES: VoidBoss[] = [
  {
    id: 'the_hollowing',
    name: 'THE HOLLOWING',
    title: 'That Which Widens Where Attention Fails',
    glyph: '∅',
    color: '#8855FF',
    boundSubject: 'Death & Impermanence',
    boundDomain: 'Death & Impermanence',
    riddle: 'It cannot be struck — every blow feeds its widening. Only one who has sat with endings can speak the word that closes it. Dive DEATH & IMPERMANENCE to find the unmaking.',
    incantation: '⟁ vael-noctis ∅ — what ends was never owned; return, unwidened, to the silence that birthed you.',
    repelLine: 'The Hollowing folds inward, unwidened. It remembers it was always going to end — and ends.',
    rewardSkin: 'noctis',
    rewardName: 'NOCTIS — Keeper of the Between',
    encroachPerTurn: 14,
    hp: 220,
  },
  {
    id: 'the_unraveling',
    name: 'THE UNRAVELING',
    title: 'The Paradox That Eats Its Own Proof',
    glyph: '⟐',
    color: '#44DDCC',
    boundSubject: 'Quantum',
    boundDomain: 'Mathematics & the Structure of Reality',
    riddle: 'It is a contradiction given teeth — strike it and it splits into two truths, both hungry. Only one who has held superposition without collapse can name it shut. Dive QUANTUM to find the collapsing word.',
    incantation: '◈ chiral-Ω ⟐ — observed, you must choose; I choose your collapse. Be one thing, and that thing: gone.',
    repelLine: 'The Unraveling is observed at last — forced to choose a single state, it chooses absence. It collapses and is gone.',
    rewardSkin: 'quantum',
    rewardName: 'QUON — the Collapsed Star',
    encroachPerTurn: 16,
    hp: 200,
  },
  {
    id: 'the_sovereign_shadow',
    name: 'THE SOVEREIGN SHADOW',
    title: 'The Self That Refused the Fire',
    glyph: '☗',
    color: '#FF6644',
    boundSubject: 'Shadow Work',
    boundDomain: 'Shadow & Depth Psychology',
    riddle: 'It wears your face and rules your worst hour. Force only crowns it. Only one who has met their own shadow and named it can dethrone this one. Dive SHADOW WORK to find the word that integrates.',
    incantation: '⊕ solve-et-coagula ☗ — I do not banish you; I take you back. What I own cannot rule me. Dissolve, and be crowned in earned light.',
    repelLine: 'The Sovereign Shadow is not slain — it is claimed. Integrated, it loses its throne and returns to you, transmuted. The light is earned.',
    rewardSkin: 'sovereign',
    rewardName: 'AUGURUM — the Gold-Forged Oracle',
    encroachPerTurn: 12,
    hp: 260,
  },
];

// Match a dived subject against a boss's bound subject (loose — name or domain contains).
export function diveUnlocksBoss(boss: VoidBoss, divedSubjectName: string, divedDomainLabel: string): boolean {
  const s = (divedSubjectName || '').toLowerCase();
  const d = (divedDomainLabel || '').toLowerCase();
  const bs = boss.boundSubject.toLowerCase();
  const bd = boss.boundDomain.toLowerCase();
  return s.includes(bs) || d.includes(bd) || d.includes(bs) ||
    // keyword fallbacks
    (boss.id === 'the_hollowing' && (s.includes('death') || s.includes('impermanence') || d.includes('death'))) ||
    (boss.id === 'the_unraveling' && (s.includes('quantum') || d.includes('quantum') || s.includes('paradox'))) ||
    (boss.id === 'the_sovereign_shadow' && (s.includes('shadow') || d.includes('shadow') || d.includes('depth psych')));
}
