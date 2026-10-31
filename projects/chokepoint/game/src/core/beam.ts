import type { TargetCandidate } from './targeting';
import { pickTarget, pickTargets } from './targeting';

/**
 * The beam's line rules (Beam, systems/BeamSystem.ts): who a beam tower's main line is on (and
 * its rays' targets). Pure — the held targets and the drawing live in the system.
 */

/** Is `e` within `range` (board units) of the tower at (x, y)? Inactive enemies are never in range. */
export function inBeamRange(e: TargetCandidate, x: number, y: number, range: number): boolean {
  if (!e.active) return false;
  const dx = e.x - x;
  const dy = e.y - y;
  return dx * dx + dy * dy <= range * range;
}

/**
 * Who a beam tower's main line holds this frame: the tower has one line, on one enemy (its bolts
 * are rays, rayTargets). `heldMain` is the main line's target of the last frame. Returns the
 * target's index into `enemies`, -1 when nothing is in range.
 *
 * A Beam-first tower (`mainTower`) is STICKY — it holds its target while the enemy is active and
 * in range, even when another enemy overtakes it, and re-takes (the furthest along) only when its
 * target is gone. A Beam added to another tower always follows the furthest along.
 */
export function beamLines<C extends TargetCandidate>(
  heldMain: C | undefined,
  enemies: readonly C[],
  x: number,
  y: number,
  range: number,
  mainTower: boolean,
): number {
  return mainTower && heldMain && inBeamRange(heldMain, x, y, range) ? enemies.indexOf(heldMain) : pickTarget(x, y, range, enemies);
}

/**
 * Who a beam tower's Bolt rays are on this frame: up to `count` in-range active enemies, furthest
 * along the path first, never the `main` target (the main line already holds it). Stateless — no
 * memory between calls: the caller re-derives the rays each frame, and a ray retakes the instant
 * its enemy dies or leaves range.
 */
export function rayTargets<C extends TargetCandidate>(
  enemies: readonly C[],
  x: number,
  y: number,
  range: number,
  main: C | undefined,
  count: number,
): C[] {
  // One more than the rays: the main holds the furthest, so the rays take what comes after it.
  return pickTargets(x, y, range, enemies, count + 1)
    .map((i) => enemies[i]!)
    .filter((e) => e !== main)
    .slice(0, count);
}
