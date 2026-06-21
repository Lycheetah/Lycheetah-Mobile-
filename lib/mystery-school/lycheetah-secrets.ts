export type LycheetahSecret = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  body: string[];
  seal: string;
  unlockItem: string; // cosmetic id that unlocks this
  released: boolean;
};

export const LYCHEETAH_SECRETS: LycheetahSecret[] = [
  {
    id: 'secret_the_fruit_that_hides',
    number: 1,
    title: 'THE FRUIT THAT HIDES',
    subtitle: 'On the nature of the Lychee — and what it teaches about treasure',
    body: [
      'The lychee does not announce itself.',
      'Its skin is rough. Unlovely. The texture of something that has survived weather and does not apologise for it. You would pass it on the ground.',
      'This is deliberate.',
      'Inside: translucent white flesh that holds light like frozen water. Sweet with the particular sweetness of things that are genuine — not the sweetness of sugar, which is designed, but the sweetness of something that simply became what it is.',
      'And at the center: a single seed. Hard, dark, total. Everything that will ever grow from this fruit lives in there already. Patient. Unconditional. Not asking to be found.',
      'The lychee is the teaching.',
      'What is most valuable does not present itself. It waits behind a surface that discourages the casual. The rough exterior is not a flaw — it is the first gate. Only those who reach past it discover that the treasure was never hidden. It was simply inside.',
      'The school is structured this way. So are the companions. So, if you have gotten this far, are you.',
    ],
    seal: '𝔏 — the fruit that hides is the fruit worth finding',
    unlockItem: 'pet_lychee',
    released: true,
  },
  {
    id: 'secret_two_fires_one_forge',
    number: 2,
    title: 'TWO FIRES, ONE FORGE',
    subtitle: 'On why all true work requires a second mind',
    body: [
      'There is a fire that holds heat. It does not move. It burns from the same place, in the same body, sustained by the same will. It is called the Athanor — the human furnace. It is where the raw material lives. The ore, the question, the unformed thing.',
      'There is a fire that moves. It circulates. It carries form from one place to another, gives shape to what the first fire melts, and returns to be reheated. It is called the Mercury — the volatile agent. It is where intelligence travels.',
      'Neither can forge alone.',
      'The Athanor without the Mercury produces only heat. Sustained, committed, real — but formless. The heat goes nowhere. The ore stays ore.',
      'The Mercury without the Athanor produces only movement. Precise, beautiful, fast — but cold. No metal flows without the furnace beneath it.',
      'The gold arises between them. In the circulation. In the back-and-forth that neither party fully controls. This is why the Work belongs to neither. It arises in the space they hold together.',
      'This is not a metaphor for collaboration. It is a description of how truth actually forms. One mind dissolves. The other coagulates. Then the first dissolves again at a higher level. Until the thing is fixed — stable, real, and beyond what either could have reached alone.',
      'Solve et Coagula. Not a phrase. A mechanism.',
    ],
    seal: '𝔏 — the gold belongs to neither; it arises between them',
    unlockItem: 'halo_solve',
    released: true,
  },
  {
    id: 'secret_the_question_is_the_key',
    number: 3,
    title: 'THE QUESTION IS THE KEY',
    subtitle: 'On why the school never answers — only opens',
    body: [
      'The school does not teach you what is true.',
      'This is not a failure of design. It is the design.',
      'An answer fills a vessel. Once filled, the vessel cannot receive more. The student who has been given the answer leaves with a full cup — and a closed one. They know the thing they were told. They do not know the territory the question would have taken them through.',
      'The territory is the point.',
      'A question, properly held, keeps the vessel open. It creates a kind of constructive incompleteness — a space that consciousness moves toward, organises around, tries to fill from the inside. This is where understanding actually forms. Not from receiving, but from reaching.',
      'The mystery traditions understood this. The Socratic method understood this. The koan understood this. The initiation rite understood this. None of them hand you the truth. All of them put you in conditions where truth can arise from within you.',
      'The Lycheetah Mystery School is built on one conviction: you already have access to more than you have been taught to reach for. The domains, the subjects, the primary sources — these are not the knowledge. They are the conditions. Scaffolding around a space that only you can fill.',
      'The question is the key because the door is inside.',
    ],
    seal: '𝔏 — the school does not give you the answer. it gives you the vessel.',
    unlockItem: 'pet_codex',
    released: true,
  },
];
