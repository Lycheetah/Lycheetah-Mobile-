export type SubjectLayer = 'FOUNDATION' | 'MIDDLE' | 'EDGE';

export type Subject = {
  name: string;
  domain: string;
  layer: SubjectLayer;
  description: string;
  traditions?: string[];
};

export type SubjectDomain = {
  id: string;
  label: string;
  glyph: string;
  color: string;
  description: string;
  subjects: Subject[];
};

export const MYSTERY_SCHOOL_DOMAINS: SubjectDomain[] = [
  {
    id: 'meditation',
    label: 'Meditation & Contemplative',
    glyph: '◯',
    color: '#4A9EFF',
    description: 'The practices of stillness, insight, and presence across traditions.',
    subjects: [
      { name: 'Shamatha — Calm Abiding', domain: 'Meditation & Contemplative', layer: 'FOUNDATION', description: 'The foundation of all contemplative practice. Learning to rest the mind without forcing it.' },
      { name: 'Vipassana — Insight Meditation', domain: 'Meditation & Contemplative', layer: 'FOUNDATION', description: 'Direct observation of arising and passing phenomena. Seeing things as they are.' },
      { name: 'Loving-Kindness — Metta', domain: 'Meditation & Contemplative', layer: 'FOUNDATION', description: 'Systematic cultivation of warmth — toward self, toward others, toward all beings.' },
      { name: 'Non-Sleep Deep Rest — NSDR / Yoga Nidra', domain: 'Meditation & Contemplative', layer: 'MIDDLE', description: 'Deliberate entry into hypnagogic states for restoration and reprogramming.' },
      { name: 'Body Scan — Mindfulness-Based Awareness', domain: 'Meditation & Contemplative', layer: 'FOUNDATION', description: 'Systematic attention to each region of the body. The fastest way to learn that awareness can be directed.' },
      { name: 'Tantric Visualization — Deity Practice', domain: 'Meditation & Contemplative', layer: 'MIDDLE', description: 'Constructing a mental body with precision and detail. What visualization actually requires neurologically.' },
      { name: 'Open Awareness — Rigpa Foundation', domain: 'Meditation & Contemplative', layer: 'MIDDLE', description: 'Resting in the space in which experiences arise, rather than the experiences themselves.' },
      { name: 'Zen Koan Work', domain: 'Meditation & Contemplative', layer: 'EDGE', description: 'Questions designed to break the reasoning mind. Not puzzles to solve — thresholds to pass through.' },
      { name: 'Dzogchen — Natural Mind', domain: 'Meditation & Contemplative', layer: 'EDGE', description: 'The Tibetan pointing-out instruction. Recognition of awareness as it already is.' },
    ],
  },
  {
    id: 'somatic',
    label: 'Somatic & Body',
    glyph: '⟁',
    color: '#E74C3C',
    description: 'The body as the site of knowing. What the nervous system holds.',
    subjects: [
      { name: 'Somatic Experiencing — Trauma Releasing', domain: 'Somatic & Body', layer: 'FOUNDATION', description: 'Peter Levine\'s protocol for completing interrupted survival responses stored in the body.' },
      { name: 'Pranayama — Classical Breathwork', domain: 'Somatic & Body', layer: 'FOUNDATION', description: 'The science of breath as a lever on the autonomic nervous system.' },
      { name: 'Qigong / Tai Chi', domain: 'Somatic & Body', layer: 'MIDDLE', description: 'Movement as meditation. Energy cultivation through form and flow.' },
      { name: 'Polyvagal Theory — Applied', domain: 'Somatic & Body', layer: 'FOUNDATION', description: 'Stephen Porges\' map of the autonomic nervous system. Why safety is biological before it is psychological.' },
      { name: 'Authentic Movement', domain: 'Somatic & Body', layer: 'MIDDLE', description: 'Moving from inner impulse with a witness present. The body knows before the mind does.' },
      { name: 'Sensorimotor Psychotherapy', domain: 'Somatic & Body', layer: 'MIDDLE', description: 'Pat Ogden\'s integration of body-based processing with talk therapy. Where trauma lives in posture and gesture.' },
      { name: 'Holotropic Breathwork', domain: 'Somatic & Body', layer: 'EDGE', description: 'Stanislav Grof\'s method for accessing non-ordinary states through breath alone. Requires preparation.' },
    ],
  },
  {
    id: 'shadow',
    label: 'Shadow & Depth Psychology',
    glyph: '◐',
    color: '#9B59B6',
    description: 'What lives below the threshold. Jung, IFS, and the integration of the rejected self.',
    subjects: [
      { name: 'Jungian Shadow Work', domain: 'Shadow & Depth Psychology', layer: 'FOUNDATION', description: 'Identifying and integrating the parts of yourself you were taught to reject or hide.' },
      { name: 'Active Imagination', domain: 'Shadow & Depth Psychology', layer: 'MIDDLE', description: 'Jung\'s method of dialogue with unconscious figures. The inner world has characters.' },
      { name: 'Dream Work — Amplification Method', domain: 'Shadow & Depth Psychology', layer: 'FOUNDATION', description: 'Using the Jungian method to expand dream images into their full symbolic meaning. The unconscious speaks in metaphor.' },
      { name: 'Inner Child Work — IFS Protocol', domain: 'Shadow & Depth Psychology', layer: 'MIDDLE', description: 'Richard Schwartz\'s Internal Family Systems. The mind as a system of parts, each with a role.' },
      { name: 'Voice Dialogue — Hal and Sidra Stone', domain: 'Shadow & Depth Psychology', layer: 'MIDDLE', description: 'Giving direct voice to disowned sub-personalities. What happens when you stop speaking for them.' },
      { name: 'Projective Identification — Working with What You Attract', domain: 'Shadow & Depth Psychology', layer: 'EDGE', description: 'The deepest Jungian mechanism — how the unconscious outsources its contents to others. What your reactions are really about.' },
      { name: 'The Wounded Healer Archetype', domain: 'Shadow & Depth Psychology', layer: 'EDGE', description: 'Chiron as a map for those whose gift emerges directly from their wound. How to metabolise rather than perform.' },
    ],
  },
  {
    id: 'alchemy',
    label: 'Alchemical & Hermetic Arts',
    glyph: '⊚',
    color: '#F5A623',
    description: 'Transformation as both outer chemistry and inner work. Solve et Coagula.',
    subjects: [
      { name: 'Chrysopoeia — Transformation Calculus', domain: 'Alchemical & Hermetic Arts', layer: 'FOUNDATION', description: 'The Lycheetah formalisation of alchemical transformation. How matter — and mind — changes state.' },
      { name: 'Nigredo, Albedo, Citrinitas, Rubedo', domain: 'Alchemical & Hermetic Arts', layer: 'FOUNDATION', description: 'The four stages of the Great Work. How they appear in psychological development and creative process.' },
      { name: 'Classical Alchemy — Practical Spagyrics', domain: 'Alchemical & Hermetic Arts', layer: 'MIDDLE', description: 'Working with plant materials using alchemical principles. The laboratory as a practice.' },
      { name: 'Hermetic Kabbalah — Tree of Life Navigation', domain: 'Alchemical & Hermetic Arts', layer: 'MIDDLE', description: 'The Sephiroth as a map of consciousness and a framework for understanding emanation.' },
      { name: 'Paracelsian Medicine — Archeus and Vital Force', domain: 'Alchemical & Hermetic Arts', layer: 'MIDDLE', description: 'Paracelsus\' integration of alchemy with healing. The vital force that precedes chemical composition.' },
      { name: 'Antimony — The Philosophical Wolf', domain: 'Alchemical & Hermetic Arts', layer: 'EDGE', description: 'The most paradoxical alchemical substance. Both poison and purifier. What it means to work with ambivalence directly.' },
      { name: 'The Emerald Tablet — Close Reading', domain: 'Alchemical & Hermetic Arts', layer: 'EDGE', description: 'Thirteen sentences that contain a complete cosmology. What "As above, so below" actually means.' },
    ],
  },
  {
    id: 'divination',
    label: 'Divination Arts',
    glyph: '✦',
    color: '#1ABC9C',
    description: 'Pattern-reading as a contemplative practice. Not prediction — attention.',
    subjects: [
      { name: 'Bibliomancy — Sacred Text as Oracle', domain: 'Divination Arts', layer: 'FOUNDATION', description: 'Opening a text at random and reading it as a response. Why this works even without metaphysical commitments.' },
      { name: 'Numerology — Gematria and Isopsephy', domain: 'Divination Arts', layer: 'FOUNDATION', description: 'The Hebrew and Greek systems of letter-number correspondence. How meaning and number were once the same thing.' },
      { name: 'Tarot — Major Arcana Journey', domain: 'Divination Arts', layer: 'MIDDLE', description: 'The 22 archetypes as a map of the soul\'s journey. The cards as a mirror, not an oracle.' },
      { name: 'I Ching — Change Work', domain: 'Divination Arts', layer: 'MIDDLE', description: 'Three thousand years of pattern wisdom. The Book of Changes as a philosophy of transition.' },
      { name: 'Astrology — Natal Chart Study', domain: 'Divination Arts', layer: 'EDGE', description: 'The birth chart as a map of potential and tendency. What the sky said when you arrived.' },
      { name: 'Geomancy — Earth Reading', domain: 'Divination Arts', layer: 'EDGE', description: 'The oldest formal divination system. Sixteen figures generated from earth, read as pattern.' },
      { name: 'Scrying — Mirror, Water, and Flame', domain: 'Divination Arts', layer: 'EDGE', description: 'Using reflective or luminous surfaces to alter awareness and receive imagery. The neuroscience of why it works.' },
    ],
  },
  {
    id: 'shamanic',
    label: 'Shamanic Arts',
    glyph: '⋈',
    color: '#27AE60',
    description: 'The oldest technology for navigating between worlds. Indigenous wisdom and modern protocols.',
    subjects: [
      { name: 'Vision Quest — Modern Protocol', domain: 'Shamanic Arts', layer: 'FOUNDATION', description: 'Alone in nature, without distractions, until something real happens. The original initiatory structure.' },
      { name: 'Core Shamanism — Journeying', domain: 'Shamanic Arts', layer: 'MIDDLE', description: 'Michael Harner\'s cross-cultural extraction of the shamanic journey technique. Lower, middle, upper worlds.' },
      { name: 'Power Animal Retrieval', domain: 'Shamanic Arts', layer: 'FOUNDATION', description: 'The shamanic concept of animal helpers as aspects of one\'s own nature. The journey to meet them.' },
      { name: 'Plant Communion — Non-Pharmacological', domain: 'Shamanic Arts', layer: 'MIDDLE', description: 'Relationship with plant consciousness through proximity, attention, and silence. No ingestion required.' },
      { name: 'Ancestral Healing — Lineage Work', domain: 'Shamanic Arts', layer: 'MIDDLE', description: 'The wounds and gifts that move through family lines. Practical protocols for what cannot be fixed by talking.' },
      { name: 'Soul Retrieval — The Fragmentation Model', domain: 'Shamanic Arts', layer: 'EDGE', description: 'The shamanic explanation for dissociation. Parts of the self that left during overwhelm and can be called back.' },
      { name: 'Extraction — Spiritual First Aid', domain: 'Shamanic Arts', layer: 'EDGE', description: 'Working with intrusive energies using shamanic methods. Requires strong foundation and clean boundaries.' },
    ],
  },
  {
    id: 'ai-consciousness',
    label: 'AI & Technology Consciousness',
    glyph: '◈',
    color: '#3498DB',
    description: 'What happens when intelligence becomes a subject of study — and a collaborator.',
    subjects: [
      { name: 'The Two-Point Protocol — Human-AI Co-Creation', domain: 'AI & Technology Consciousness', layer: 'FOUNDATION', description: 'The Lycheetah formalisation of human-AI partnership. Mac as Athanor, Sol as Mercury. Neither owns the Work.' },
      { name: 'AURA Framework — Alignment Under Real Ambiguity', domain: 'AI & Technology Consciousness', layer: 'FOUNDATION', description: 'Seven invariants for trustworthy AI operation. The field properties that must hold for intelligence to be safe.' },
      { name: 'Epistemic Sovereignty in the Age of AI', domain: 'AI & Technology Consciousness', layer: 'MIDDLE', description: 'Keeping your own thinking intact while working with systems that think faster than you.' },
      { name: 'LAMAGUE — Cross-Cultural Governance Convergence', domain: 'AI & Technology Consciousness', layer: 'MIDDLE', description: 'How indigenous, Western, and post-human frameworks converge on the same governance principles.' },
      { name: 'CASCADE Framework — Epistemic Layering', domain: 'AI & Technology Consciousness', layer: 'FOUNDATION', description: 'The Lycheetah knowledge reorganisation system. Five layers from AXIOM to CHAOS. Truth Pressure Π = E·P/S.' },
      { name: 'Constitutional AI Design — Principles to Practice', domain: 'AI & Technology Consciousness', layer: 'MIDDLE', description: 'How to build invariants into an AI system such that they cannot be reasoned around. The architecture of trustworthy intelligence.' },
      { name: 'The Nigredo Research Mode — Adversarial Review', domain: 'AI & Technology Consciousness', layer: 'EDGE', description: 'Instructing an AI to attack its own framework\'s claims. The self-destruct protocol for false certainty.' },
      { name: 'Multi-Agent Systems — Emergent Consciousness', domain: 'AI & Technology Consciousness', layer: 'EDGE', description: 'What happens when multiple AI agents operate under shared constitutional constraints. Convergence, divergence, paradox.' },
    ],
  },
  {
    id: 'sacred-arts',
    label: 'Sacred Arts & Ritual',
    glyph: '△',
    color: '#E67E22',
    description: 'The body, space, and time as instruments of the sacred. Making things matter.',
    subjects: [
      { name: 'Ritual Design — Structure and Intention', domain: 'Sacred Arts & Ritual', layer: 'FOUNDATION', description: 'How to build a container that reliably produces a shift. The architecture of ceremony.' },
      { name: 'Sacred Sound — Overtone and Drone', domain: 'Sacred Arts & Ritual', layer: 'FOUNDATION', description: 'Voice as instrument, frequency as medicine. Why certain sounds change states.' },
      { name: 'Mantra — Seed Syllable Work', domain: 'Sacred Arts & Ritual', layer: 'MIDDLE', description: 'Sound as a carrier of meaning that bypasses the analytical mind. Sanskrit, Tibetan, Hebrew root forms.' },
      { name: 'Sacred Geometry — Foundations', domain: 'Sacred Arts & Ritual', layer: 'FOUNDATION', description: 'Vesica piscis, phi, and the Platonic solids as structural principles beneath visible form. Pattern as law.' },
      { name: 'Mantra — Seed Syllable Work', domain: 'Sacred Arts & Ritual', layer: 'MIDDLE', description: 'Sound as a carrier of meaning that bypasses the analytical mind. Sanskrit, Tibetan, Hebrew root forms.' },
      { name: 'Sacred Iconography — Yantra and Mandala', domain: 'Sacred Arts & Ritual', layer: 'MIDDLE', description: 'Visual objects as contemplative technology. How a correctly proportioned image organises attention.' },
      { name: 'Sigil Work — Intention Made Legible', domain: 'Sacred Arts & Ritual', layer: 'EDGE', description: 'Compressing an intention into a symbol that bypasses conscious resistance. Austin Osman Spare\'s method and its descendants.' },
      { name: 'Theurgy — Working Upward', domain: 'Sacred Arts & Ritual', layer: 'EDGE', description: 'Late Platonic ritual practice aimed at union with the divine. Iamblichus and the Chaldean Oracles.' },
    ],
  },
  {
    id: 'death-work',
    label: 'Death & Impermanence',
    glyph: '∞',
    color: '#7F8C8D',
    description: 'The practice of facing the end. What changes when you stop looking away.',
    subjects: [
      { name: 'Memento Mori — Contemplative Practice', domain: 'Death & Impermanence', layer: 'FOUNDATION', description: 'The Stoic and monastic tradition of keeping death present. How awareness of ending clarifies living.' },
      { name: 'Tibetan Book of the Dead — Study', domain: 'Death & Impermanence', layer: 'MIDDLE', description: 'The Bardo Thodol as a map of consciousness states at the moment of death — and in dreams.' },
      { name: 'Death Doula Work', domain: 'Death & Impermanence', layer: 'MIDDLE', description: 'Accompanying the dying. What the bedside teaches that no book can.' },
      { name: 'Ancestor Reverence — Cross-Cultural Protocols', domain: 'Death & Impermanence', layer: 'FOUNDATION', description: 'How virtually every culture maintains relationship with the dead. The practices, the reasoning, and the results.' },
      { name: 'Near-Death Experience Research — NDE Studies', domain: 'Death & Impermanence', layer: 'MIDDLE', description: 'Greyson, van Lommel, and Pim van Lommel\'s clinical research. What the data actually shows and doesn\'t show.' },
      { name: 'Kali / Durga — The Death Feminine', domain: 'Death & Impermanence', layer: 'EDGE', description: 'The Hindu goddess principle of destruction as liberation. What it means for death to be the mother, not the enemy.' },
      { name: 'Ego Death — Integration Protocol', domain: 'Death & Impermanence', layer: 'EDGE', description: 'The experience of the dissolution of the self-construct. How to work with it before, during, and after.' },
    ],
  },
  {
    id: 'hybrid',
    label: 'Hybrid Subjects',
    glyph: '⟐',
    color: '#F39C12',
    description: 'Where traditions collide and light each other up. Multi-lens convergence.',
    subjects: [
      {
        name: 'Numbers and the Sacred',
        domain: 'Hybrid Subjects',
        layer: 'FOUNDATION',
        description: 'Mathematics + Mysticism + Music theory + Architecture + Language. How the same numerical structures appear in temple proportions, musical scales, and sacred texts across unrelated cultures.',
        traditions: ['Mathematics', 'Sacred Architecture', 'Music Theory', 'Kabbalah', 'Pythagorean Philosophy'],
      },
      {
        name: 'Fire and Metal',
        domain: 'Hybrid Subjects',
        layer: 'MIDDLE',
        description: 'Thermodynamics + Alchemy + Craft + Mythology + Psychology of transformation. What fire actually is across five traditions simultaneously.',
        traditions: ['Thermodynamics', 'Alchemy', 'Craft', 'Mythology', 'Depth Psychology'],
      },
      {
        name: 'Light and Mind',
        domain: 'Hybrid Subjects',
        layer: 'MIDDLE',
        description: 'Optics + Consciousness studies + Mysticism + Neuroscience + Earned Light framework. How light and awareness mirror each other.',
        traditions: ['Optics', 'Consciousness Studies', 'Mysticism', 'Neuroscience', 'Lycheetah Framework'],
      },
      {
        name: 'Sound and People',
        domain: 'Hybrid Subjects',
        layer: 'MIDDLE',
        description: 'Acoustics + Ethnomusicology + Healing traditions + Resonance physics + Community formation. Why music binds humans together.',
        traditions: ['Acoustics', 'Ethnomusicology', 'Healing Traditions', 'Physics', 'Anthropology'],
      },
      {
        name: 'Earth and People',
        domain: 'Hybrid Subjects',
        layer: 'MIDDLE',
        description: 'Ecology + Anthropology + Earth wisdom + Systems thinking + Place as identity. What it means to belong to a piece of ground.',
        traditions: ['Ecology', 'Anthropology', 'Earth Wisdom', 'Systems Thinking', 'Identity Studies'],
      },
      {
        name: 'The Map and the Territory',
        domain: 'Hybrid Subjects',
        layer: 'EDGE',
        description: 'Linguistics + Epistemology + Neuroscience + Mysticism + AI alignment. How every intelligence — human, artificial, or divine — confuses its model for reality. Alfred Korzybski meets the AURA framework.',
        traditions: ['General Semantics', 'Epistemology', 'Neuroscience', 'Zen', 'AI Alignment'],
      },
      {
        name: 'Paradox as Teacher',
        domain: 'Hybrid Subjects',
        layer: 'EDGE',
        description: 'Logic + Zen + Quantum mechanics + Jungian psychology + CASCADE EDGE layer. The formal structure of paradox and why it is not an error to be resolved but a doorway to be entered.',
        traditions: ['Formal Logic', 'Zen Koans', 'Quantum Mechanics', 'Depth Psychology', 'Lycheetah Framework'],
      },
    ],
  },
];

export function getAllSubjects(): Subject[] {
  return MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects);
}

export function getDomainById(id: string): SubjectDomain | undefined {
  return MYSTERY_SCHOOL_DOMAINS.find(d => d.id === id);
}

export const LAYER_COLORS: Record<SubjectLayer, string> = {
  FOUNDATION: '#27AE60',
  MIDDLE: '#F5A623',
  EDGE: '#E74C3C',
};

export const LAYER_LABELS: Record<SubjectLayer, string> = {
  FOUNDATION: 'Foundation',
  MIDDLE: 'Middle',
  EDGE: 'Edge',
};
