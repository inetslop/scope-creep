/** What targeting needs to know about an enemy. */
export interface TargetCandidate {
  x: number;
  y: number;
  /** Distance walked along the path: bigger is closer to the exit. */
  distance: number;
  active: boolean;
  /** Out of reach right now (the Colossus's timed beat): the picks skip it; area, line and held damage still reach it. */
  untargetable?: boolean;
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
    if (!e.active || e.untargetable) continue;
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

/** Up to `count` active enemies in range, furthest along the path first (multi-shot towers). Untargetable ones are skipped. */
export function pickTargets(x: number, y: number, range: number, enemies: readonly TargetCandidate[], count: number): number[] {
  return inRange(x, y, range, enemies)
    .filter((i) => !enemies[i]!.untargetable)
    .sort((a, b) => enemies[b]!.distance - enemies[a]!.distance)
    .slice(0, Math.max(0, count));
}

/** Up to `max` active enemies within `radius` (board units) of `near`, nearest first; skips `near` itself. */
export function pickNearest(near: TargetCandidate, radius: number, enemies: readonly TargetCandidate[], max: number): number[] {
  const d2 = (i: number): number => {
    const e = enemies[i]!;
    const dx = e.x - near.x;
    const dy = e.y - near.y;
    return dx * dx + dy * dy;
  };
  return inRange(near.x, near.y, radius, enemies)
    .sort((a, b) => d2(a) - d2(b))
    .filter((i) => enemies[i] !== near)
    .slice(0, Math.max(0, max));
}
