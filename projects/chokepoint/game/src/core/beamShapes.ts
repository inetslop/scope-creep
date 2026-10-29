import { CELL } from '../config';
import { splashHits, type TowerSpec } from './augments';
import { inBeamRange } from './beam';
import type { TargetCandidate } from './targeting';

/** The beam's pierce corridor in board units: a bit wider than half the road (0.29*CELL), so a beam along the road passes through everything on it. */
export const BEAM_PIERCE_HALF_WIDTH = 0.3 * CELL;

/** The beam's pierce (Lance in a beam-first tower): up to `count` more enemies past `main`, in the corridor of the straight line (x,y) through `main`, each within `range` of the tower; indices, nearest first. */
export function beamPierceVictims(
  enemies: readonly TargetCandidate[],
  x: number,
  y: number,
  range: number,
  main: TargetCandidate,
  count: number,
): number[] {
  if (count <= 0) return [];
  const dx = main.x - x;
  const dy = main.y - y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return [];
  const ux = dx / d;
  const uy = dy / d;
  const w2 = BEAM_PIERCE_HALF_WIDTH * BEAM_PIERCE_HALF_WIDTH;
  const out: { i: number; t: number }[] = [];
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e === main || !e.active || !inBeamRange(e, x, y, range)) continue;
    const ex = e.x - x;
    const ey = e.y - y;
    const t = ex * ux + ey * uy; // along the line from the tower
    if (t < d - 1) continue; // not past the main target
    const cross = ex * uy - ey * ux; // lateral offset from the line
    if (cross * cross > w2) continue;
    out.push({ i, t });
  }
  out.sort((a, b) => a.t - b.t);
  return out.slice(0, count).map((o) => o.i);
}

/** The beam's scorch (Splash in a beam-first tower): half the beam rate on the nearest `cap` other enemies within `radius` of the beamed enemy; undefined without one. The numbers mirror describeSpec in core/augments.ts — keep in sync. */
export function beamScorch(spec: TowerSpec): { rate: number; cap: number; radius: number } | undefined {
  if (spec.kind !== 'beam' || spec.splash <= 0) return undefined;
  return { rate: spec.beamDps / 2, cap: splashHits(spec.splashCount) - 1, radius: spec.splash * CELL };
}
