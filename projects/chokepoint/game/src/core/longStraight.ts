import { roadStretches } from './cove';
import type { Cell, GameMap } from './map';

/**
 * The long straight (the board's "The long straight" trait): the road's longest straight run of
 * cells is at least LONG_STRAIGHT_MIN — one unbroken stretch a single long-range tower can cover
 * from one side, with the board's guaranteed choke sitting off it. The decision reads the grown
 * board's own road (a property of the seed, never a roll) and the trait changes nothing, so a
 * board without it is that seed's exact board, down to the bytes, and the run save is untouched.
 * Never on the fork's or the loop's reshaped road.
 */

/**
 * The straight's length in cells. Measured, not assumed: over seeds 1..2000 in both 14x8 and 8x14
 * the as-grown road runs no straight longer than six off the fork and the loop (the longer runs
 * sit on a fork's or a loop's road, or on the switchback's fold — the tech's own board, which
 * simply also carries the trait), and six is the value one board in five reaches (867/4000,
 * pinned by tests/core/longStraight.test.ts).
 */
export const LONG_STRAIGHT_MIN = 6;

/** The road's longest straight run of cells: the longest of its straight stretches (the cove's own runs). */
export function longestStraight(path: readonly Cell[]): number {
  let m = 0;
  for (const s of roadStretches(path)) m = Math.max(m, s.end - s.start + 1);
  return m;
}

/** Whether the grown board carries the long straight: a straight of LONG_STRAIGHT_MIN or more, never with the fork or the loop. */
export function boardHasLongStraight(map: GameMap): boolean {
  return !map.fork && !map.loop && longestStraight(map.path) >= LONG_STRAIGHT_MIN;
}
