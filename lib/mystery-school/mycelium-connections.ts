// Curated thematic cross-domain connections for the Mycelium.
// Each pair renders as a gold thread cutting across domain clusters.
// Keep to the highest-resonance links — quality over quantity.

export type MyceliumLink = {
  from: string; // subject name (exact match)
  to: string;
  strength: 'strong' | 'medium'; // strong = gold bright, medium = gold dim
};

export const MYCELIUM_LINKS: MyceliumLink[] = [
  // ── Shadow / Depth Psychology ────────────────────────────────────────
  { from: 'The Shadow',              to: 'Nigredo',                  strength: 'strong' },
  { from: 'The Shadow',              to: 'Dark Night of the Soul',   strength: 'strong' },
  { from: 'Individuation',           to: 'The Great Work',           strength: 'strong' },
  { from: 'Individuation',           to: 'Awakening',                strength: 'medium' },
  { from: 'The Unconscious',         to: 'Dream Yoga',               strength: 'strong' },
  { from: 'The Unconscious',         to: 'Precognition',             strength: 'medium' },
  { from: 'Archetypes',              to: 'Tarot',                    strength: 'strong' },
  { from: 'Archetypes',              to: 'LAMAGUE',                  strength: 'medium' },
  { from: 'Synchronicity',           to: 'Morphic Resonance',        strength: 'strong' },
  { from: 'Synchronicity',           to: 'Precognition',             strength: 'medium' },

  // ── Alchemy / Transformation ─────────────────────────────────────────
  { from: 'Nigredo',                 to: 'Dark Night of the Soul',   strength: 'strong' },
  { from: 'Nigredo',                 to: 'Dissolution',              strength: 'strong' },
  { from: 'Albedo',                  to: 'Shamatha',                 strength: 'medium' },
  { from: 'Citrinitas',              to: 'Awakening',                strength: 'strong' },
  { from: 'Rubedo',                  to: 'Non-Duality',              strength: 'strong' },
  { from: 'The Great Work',          to: 'Individuation',            strength: 'strong' },
  { from: 'Solve et Coagula',        to: 'Truth Pressure',           strength: 'strong' },

  // ── Consciousness / Non-Duality ───────────────────────────────────────
  { from: 'Non-Duality',             to: 'Emptiness (Śūnyatā)',      strength: 'strong' },
  { from: 'Non-Duality',             to: 'Ain Soph',                 strength: 'strong' },
  { from: 'Awakening',               to: 'Kensho',                   strength: 'strong' },
  { from: 'The Hard Problem',        to: 'Non-Duality',              strength: 'strong' },
  { from: 'The Hard Problem',        to: 'Quantum Consciousness',    strength: 'strong' },
  { from: 'Quantum Consciousness',   to: 'Morphic Resonance',        strength: 'medium' },

  // ── Mystical / Kabbalistic ────────────────────────────────────────────
  { from: 'The Tree of Life',        to: 'The Tarot',                strength: 'strong' },
  { from: 'Ain Soph',                to: 'Emptiness (Śūnyatā)',      strength: 'strong' },
  { from: 'The Sephiroth',           to: 'Archetypes',               strength: 'medium' },
  { from: 'Ein Sof',                 to: 'The Ground of Being',      strength: 'strong' },

  // ── Language / Symbol ─────────────────────────────────────────────────
  { from: 'LAMAGUE',                 to: 'Archetypes',               strength: 'medium' },
  { from: 'LAMAGUE',                 to: 'Truth Pressure',           strength: 'strong' },
  { from: 'Symbolic Logic',          to: 'LAMAGUE',                  strength: 'medium' },
  { from: 'Semiotics',               to: 'Archetypes',               strength: 'medium' },

  // ── Noetic / Psi ─────────────────────────────────────────────────────
  { from: 'Presentiment',            to: 'Precognition',             strength: 'strong' },
  { from: 'STARGATE',                to: 'Remote Viewing',           strength: 'strong' },
  { from: 'Ganzfeld Protocol',       to: 'STARGATE',                 strength: 'strong' },
  { from: 'Global Consciousness Project', to: 'Morphic Resonance',  strength: 'strong' },
  { from: 'Quantum Biology',         to: 'Quantum Consciousness',    strength: 'strong' },

  // ── Death / Liminality ───────────────────────────────────────────────
  { from: 'The Bardo',               to: 'Near-Death Experience',    strength: 'strong' },
  { from: 'The Bardo',               to: 'Dream Yoga',               strength: 'strong' },
  { from: 'Near-Death Experience',   to: 'The Hard Problem',         strength: 'medium' },
  { from: 'Memento Mori',            to: 'Nigredo',                  strength: 'strong' },
  { from: 'Ancestor Veneration',     to: 'Morphic Resonance',        strength: 'medium' },

  // ── Shamanic / Entheogenic ────────────────────────────────────────────
  { from: 'Plant Medicine',          to: 'Non-Duality',              strength: 'medium' },
  { from: 'Plant Medicine',          to: 'The Unconscious',          strength: 'medium' },
  { from: 'Shamanic Journey',        to: 'The Bardo',                strength: 'medium' },
  { from: 'Shamanic Journey',        to: 'Remote Viewing',           strength: 'medium' },

  // ── Truth Pressure / Epistemology ─────────────────────────────────────
  { from: 'Truth Pressure',          to: 'Epistemology',             strength: 'strong' },
  { from: 'Truth Pressure',          to: 'The Socratic Method',      strength: 'strong' },
  { from: 'Epistemology',            to: 'The Socratic Method',      strength: 'strong' },
  { from: 'Paradox',                 to: 'Koan Practice',            strength: 'strong' },
  { from: 'Paradox',                 to: 'Non-Duality',              strength: 'medium' },

  // ── Cosmological ─────────────────────────────────────────────────────
  { from: 'Simulation Theory',       to: 'The Hard Problem',         strength: 'medium' },
  { from: 'Simulation Theory',       to: 'Quantum Consciousness',    strength: 'medium' },
  { from: 'Hermeticism',             to: 'The Great Work',           strength: 'strong' },
  { from: 'Hermeticism',             to: 'The Tree of Life',         strength: 'medium' },
  { from: 'Astrology',               to: 'Archetypes',               strength: 'medium' },
  { from: 'Astrology',               to: 'Synchronicity',            strength: 'strong' },
];
