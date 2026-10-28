/** What targeting needs to know about an enemy. */
export interface TargetCandidate {
  x: number;
  y: number;
  /** Distance walked along the path: bigger is closer to the exit. */
  distance: number;
  active: boolean;
}

/**
 * Index of the enemy a tower at (x, y) with `range` (board units) should shoot: the one in range
 * that is furthest along the path, or -1 when nothing is in range.
 */
export function pickTarget(x: number, y: number, range: number, enemies: readonly TargetCandidate[]): number {
  let best = -1;
  let bestDistance = -Infinity;
  const r2 = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    if (e.distance > bestDistance) {
      best = i;
      bestDistance = e.distance;
    }
  }
  return best;
}

/** Indexes of every active enemy within `range` of (x, y). */
export function inRange(x: number, y: number, range: number, enemies: readonly TargetCandidate[]): number[] {
  const out: number[] = [];
  const r2 = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy <= r2) out.push(i);
  }
  return out;
}

/** Up to `count` active enemies in range, furthest along the path first (multi-shot towers). */
export function pickTargets(x: number, y: number, range: number, enemies: readonly TargetCandidate[], count: number): number[] {
  return inRange(x, y, range, enemies)
    .sort((a, b) => enemies[b]!.distance - enemies[a]!.distance)
    .slice(0, Math.max(0, count));
}
