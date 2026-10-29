import type { TargetCandidate } from './targeting';
import { pickTarget } from './targeting';

/**
 * The beam's line rules (Beam, systems/BeamSystem.ts): who a beam tower's lines are on. Pure —
 * the held targets and the drawing live in the system.
 */

/** Is `e` within `range` (board units) of the tower at (x, y)? Inactive enemies are never in range. */
export function inBeamRange(e: TargetCandidate, x: number, y: number, range: number): boolean {
  if (!e.active) return false;
  const dx = e.x - x;
  const dy = e.y - y;
  return dx * dx + dy * dy <= range * range;
}

/**
 * Who a beam tower's lines hold this frame. `held` is the targets of the last frame: `held[0]`
 * the main line, the rest the extra lines. `main` is the main line's target (index into `enemies`,
 * -1 when nothing is in range); `lines` the extra lines' targets (same length as `held` minus one).
 *
 * The main line: a Beam-first tower (`mainTower`) is STICKY — it holds its target while the enemy
 * is active and in range, even when another enemy overtakes it, and re-takes (the furthest along)
 * only when its target is gone. A Beam added to another tower always follows the furthest along.
 *
 * The extra lines: each keeps its own target while it is active and in range (and is not the main
 * target); when it is gone — or whenever the main target becomes a different enemy — the line
 * drops and retakes, taking the in-range enemy nearest the main target that no line holds.
 */
export function beamLines<C extends TargetCandidate>(
  held: readonly (C | undefined)[],
  enemies: readonly C[],
  x: number,
  y: number,
  range: number,
  mainTower: boolean,
): { main: number; lines: (C | undefined)[] } {
  const heldMain = held[0];
  let main = mainTower && heldMain && inBeamRange(heldMain, x, y, range) ? enemies.indexOf(heldMain) : -1;
  if (main === -1) main = pickTarget(x, y, range, enemies);
  const mainEnemy = main === -1 ? undefined : enemies[main];
  const lines: (C | undefined)[] = [];
  if (!mainEnemy) {
    for (let i = 1; i < held.length; i++) lines.push(undefined);
    return { main, lines };
  }
  // A different main enemy: every extra line drops, then retakes around the new one.
  const mainChanged = heldMain !== mainEnemy;
  const taken = new Set<TargetCandidate>([mainEnemy]);
  for (let i = 1; i < held.length; i++) {
    const h = held[i];
    let line = !mainChanged && h && h !== mainEnemy && !taken.has(h) && inBeamRange(h, x, y, range) ? h : undefined;
    if (!line) {
      // The nearest free in-range enemy to the main target (spatial distance, not path order).
      let bestDist = Infinity;
      for (const e of enemies) {
        if (!e.active || taken.has(e) || !inBeamRange(e, x, y, range)) continue;
        const dx = e.x - mainEnemy.x;
        const dy = e.y - mainEnemy.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          line = e;
        }
      }
    }
    if (line) taken.add(line);
    lines.push(line);
  }
  return { main, lines };
}
