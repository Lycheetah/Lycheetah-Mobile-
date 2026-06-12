// Mulberry32 — fast deterministic PRNG seeded by a 32-bit integer
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash — maps an arbitrary string to a stable 32-bit integer
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Derive a seed integer from timestamp + optional salt
export function makeSeed(timestamp: number, salt = ''): number {
  return hashString(String(timestamp) + salt);
}

// Pick one item from options[] deterministically — same seed+context always returns same item
export function seededPick<T>(seed: number, context: string, options: T[]): T {
  if (options.length === 0) throw new Error('seededPick: empty options');
  const h = hashString(String(seed) + ':' + context);
  const rng = mulberry32(h >>> 0);
  return options[Math.floor(rng() * options.length)];
}

// Return a deterministic float 0–1 for seed+context
export function seededFloat(seed: number, context: string): number {
  const h = hashString(String(seed) + ':' + context);
  return mulberry32(h >>> 0)();
}

// Weighted rare roll — returns true with probability `chance` (0–1), seeded
export function seededRoll(seed: number, context: string, chance: number): boolean {
  return seededFloat(seed, context) < chance;
}
