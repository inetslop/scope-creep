import type { Vec2 } from './vec';

/** Position of an enemy for arc targeting (id + world position). */
export interface ArcTarget {
  id: number;
  x: number;
  y: number;
}

/**
 * Picks the enemies a chained arc hits, in hit order. The first hit is the
 * nearest enemy within `range` of `origin` that lies inside the `coneDeg` full
 * cone around the (unit-length) `aim` direction; each following jump goes to
 * the nearest not-yet-hit enemy within `chainRadius` of the enemy just hit,
 * for at most `maxJumps` jumps. Returns enemy ids (an empty array on a whiff).
 */
export function pickArcTargets(
  enemies: readonly ArcTarget[],
  origin: Vec2,
  aim: Vec2,
  range: number,
  coneDeg: number,
  chainRadius: number,
  maxJumps: number,
): number[] {
  const cosHalfCone = Math.cos((coneDeg / 2) * (Math.PI / 180));
  let current: ArcTarget | null = null;
  let bestD = Infinity;
  for (const e of enemies) {
    const dx = e.x - origin.x;
    const dy = e.y - origin.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-9 || d > range) continue;
    if ((dx / d) * aim.x + (dy / d) * aim.y < cosHalfCone) continue; // outside the aim cone
    if (d < bestD) {
      bestD = d;
      current = e;
    }
  }
  const ids: number[] = [];
  if (!current) return ids;
  const hit = new Set<number>();
  let jumps = 0;
  while (true) {
    ids.push(current.id);
    hit.add(current.id);
    if (jumps >= maxJumps) break;
    jumps += 1;
    let next: ArcTarget | null = null;
    let nextD = Infinity;
    for (const e of enemies) {
      if (hit.has(e.id)) continue;
      const d = Math.hypot(e.x - current.x, e.y - current.y);
      if (d > chainRadius) continue;
      if (d < nextD) {
        nextD = d;
        next = e;
      }
    }
    if (!next) break;
    current = next;
  }
  return ids;
}
