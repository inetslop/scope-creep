/** The timed untargetable beat (the Colossus): its fractions and seconds, on the simulation clock. */
export interface OutOfReachSpec {
  /** The hp fraction at which the first beat starts (0.5: at half health). */
  hpFrac: number;
  /** The white telegraph flash before the beat, in seconds. */
  telegraphSec: number;
  /** The beat itself: out of reach for this many seconds. */
  phaseSec: number;
  /** Beats repeat every this many seconds from the first one. */
  periodSec: number;
}

/** The leg the beat is in: the quiet walk, the telegraph flash, or the out-of-reach phase. */
export type OutOfReachLeg = 'idle' | 'flash' | 'out';

/**
 * Which leg the beat is in at `clock` seconds since its first trigger; `clock` -1 before the
 * trigger (full health, an ordinary enemy).
 */
export function outOfReachLeg(spec: OutOfReachSpec, clock: number): OutOfReachLeg {
  if (clock < 0) return 'idle';
  const t = clock % spec.periodSec;
  if (t < spec.telegraphSec) return 'flash';
  if (t < spec.telegraphSec + spec.phaseSec) return 'out';
  return 'idle';
}
