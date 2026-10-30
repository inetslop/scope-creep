/**
 * The run's shape: three levels of ten waves each. The waves number continuously 1-30, so the
 * wave rules (core/waves.ts) keep working untouched across the whole run; the level only changes
 * the board. At each level clear the road re-grows, a quarter longer than the level before.
 */

/** How many waves a level holds. */
export const WAVES_PER_LEVEL = 10;
/** How many levels a run has. */
export const LEVELS = 3;
/** The run's last wave: clearing it with lives left wins the run. */
export const MAX_WAVE = WAVES_PER_LEVEL * LEVELS;

/** Waves 1-10 -> 1, 11-20 -> 2, 21-30 -> 3; clamped to 1..3 outside. */
export function levelOfWave(wave: number): number {
  const level = Math.floor((wave - 1) / WAVES_PER_LEVEL) + 1;
  return Math.min(LEVELS, Math.max(1, level));
}

/** Wave 10 or 20 (a level ends, the run goes on). */
export function isLevelClear(wave: number): boolean {
  return wave > 0 && wave < MAX_WAVE && wave % WAVES_PER_LEVEL === 0;
}

/** Wave 30 (the run is won). */
export function isRunWin(wave: number): boolean {
  return wave === MAX_WAVE;
}

/** Level N's road length target over the run's base: 1, 1.25, 1.5625 (= 1.25^(N-1)). */
export function levelLengthMul(level: number): number {
  return 1.25 ** (Math.min(LEVELS, Math.max(1, level)) - 1);
}

/**
 * The board seed for (seed, level): a level's board is a pure function of the two, so a resumed
 * run and a ghost run replay the exact board. Level 1 keeps the run's own seed — its board draws
 * from the run's rng, which the draft offers then continue.
 */
export function boardSeedFor(seed: number, level: number): number {
  if (level === 1) return seed >>> 0;
  return (seed ^ Math.imul(0x9e3779b9, level)) >>> 0;
}
