/** What targeting needs to know about an enemy. */
export interface TargetCandidate {
  x: number;
  y: number;
  /** Distance walked along the path: bigger is closer to the exit. */
  distance: number;
  active: boolean;
  /** Current hit points: the Strongest mode's pick. */
  hp: number;
  /** Out of reach right now (the Colossus's timed beat): the picks skip it; area, line and held damage still reach it. */
  untargetable?: boolean;
}

/** How a tower picks its main target when several are in range. */
export type TargetMode = 'first' | 'strongest' | 'closest';

/** Both in range: should the tower prefer a over b? Ties always go to the furthest along. */
export function prefers(a: TargetCandidate, b: TargetCandidate, mode: TargetMode, x: number, y: number): boolean {
  if (mode === 'strongest') return a.hp > b.hp || (a.hp === b.hp && a.distance > b.distance);
  if (mode === 'closest') {
    const da = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y);
    const db = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
    return da < db || (da === db && a.distance > b.distance);
  }
  return a.distance > b.distance;
}

/**
 * Index of the enemy a tower at (x, y) with `range` (board units) should shoot: the one in range
 * that the tower's mode prefers (First: furthest along the path), or -1 when nothing is in range.
 */
export function pickTarget(x: number, y: number, range: number, enemies: readonly TargetCandidate[], mode: TargetMode = 'first'): number {
  let best = -1;
  const r2 = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.active || e.untargetable) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy > r2) continue;
    if (best === -1 || prefers(e, enemies[best]!, mode, x, y)) best = i;
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

/**
 * Up to `count` active enemies in range (multi-shot towers), best first by the tower's mode —
 * First: furthest along the path; Untargetable ones are skipped.
 */
export function pickTargets(x: number, y: number, range: number, enemies: readonly TargetCandidate[], count: number, mode: TargetMode = 'first'): number[] {
  const by = (a: number, b: number): number => {
    const ea = enemies[a]!;
    const eb = enemies[b]!;
    if (mode === 'strongest') return eb.hp - ea.hp || eb.distance - ea.distance;
    if (mode === 'closest') {
      const da = (ea.x - x) * (ea.x - x) + (ea.y - y) * (ea.y - y);
      const db = (eb.x - x) * (eb.x - x) + (eb.y - y) * (eb.y - y);
      return da - db || eb.distance - ea.distance;
    }
    return eb.distance - ea.distance;
  };
  return inRange(x, y, range, enemies)
    .filter((i) => !enemies[i]!.untargetable)
    .sort(by)
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
