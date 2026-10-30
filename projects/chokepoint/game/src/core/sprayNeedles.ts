import { CELL } from '../config';
import type { AttackKind } from '../content/types';
import { pickNearest, type TargetCandidate } from './targeting';

/** The damage one needle of a beam's kill deals (T0242). */
export const NEEDLE_DAMAGE = 12;

/** How far out from the corpse, in cells, a needle can reach its target. */
export const NEEDLE_REACH_CELLS = 2;

/** One per Spray in the tower, only when the beam is its own attack. `TowerSpec` satisfies this. */
export function needleCount(spec: { kind: AttackKind | 'none'; sprayCount: number }): number {
  return spec.kind === 'beam' ? spec.sprayCount : 0;
}

/** Up to `count` other living enemies within NEEDLE_REACH_CELLS of the corpse, nearest first; the identity-skip of the corpse is pickNearest's. */
export function needleTargets(corpse: TargetCandidate, count: number, enemies: readonly TargetCandidate[]): number[] {
  return count <= 0 ? [] : pickNearest(corpse, NEEDLE_REACH_CELLS * CELL, enemies, count);
}
