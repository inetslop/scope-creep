import { CELL } from '../config';

/**
 * Where an enemy's split children spawn, as distances along the road: one 0.25 cells ahead of the
 * kill, one 0.25 behind, clamped to the road's ends.
 */
export function splitDistances(distance: number, pathLength: number): [number, number] {
  return [Math.min(distance + CELL * 0.25, pathLength - 1), Math.max(0, distance - CELL * 0.25)];
}
