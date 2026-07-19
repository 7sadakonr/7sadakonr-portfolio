/**
 * Creates a seeded pseudo-random number generator (PRNG).
 * Uses a simple linear congruential generator (LCG).
 * @param seed - The initial seed value.
 * @returns A function that returns a random number between 0 (inclusive) and 1 (exclusive).
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
