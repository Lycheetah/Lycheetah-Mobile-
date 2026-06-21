// Canonical companion type definitions.
// Replaces the deleted ./task1_companion_specs that task2/3/4 still imported from (ghost import).
// ONE home for ArchetypeId so it stops being redefined per-file (Single Truth).
//
// NOTE: the live roster is 19 archetypes (companion.tsx). The data files (gear/journal)
// only carry bespoke content for the original 10 — missing entries fall back gracefully
// (see generateJournalEntry). Filling the other 9 is tracked content work.

export type ArchetypeId =
  // original 10
  | 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer'
  | 'lycheetah' | 'cipher' | 'herald' | 'weaver' | 'revenant'
  // expansion 9
  | 'nullveil' | 'ironclad' | 'stormwarden' | 'runeborn' | 'drifter'
  | 'thornweald' | 'meridian' | 'eclipse' | 'deepwalker';
