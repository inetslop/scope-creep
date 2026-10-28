import { CELL } from '../config';

/** How far (cells) from the impact point an enemy may be when the shot lands and still be hit; farther, it fizzles. */
export const LEAD_HIT_RADIUS = 0.9;

/**
 * How many cells ahead of the enemy a shot should land: the shot's travel time (distance over
 * shot speed) times the enemy's current speed, never past the cap. 0 for a still enemy or a
 * shot that does not fly.
 */
export function leadCells(distCells: number, enemySpeedCells: number, shotSpeedCells: number, capCells: number): number {
  if (enemySpeedCells <= 0 || shotSpeedCells <= 0) return 0;
  return Math.min((distCells / shotSpeedCells) * enemySpeedCells, capCells);
}

/**
 * The point a predictive shot flies to: the enemy's position plus `leadCells()` ahead along the
 * way it walks. The enemy's real speed counts (a ramped Sprinter is led more, a slowed one less),
 * so against a still or slow enemy the lead is small or zero and the shot lands on it.
 * `speed` and `shotSpeed` are board units per second; `capCells` in cells.
 */
export function leadAim(
  towerX: number,
  towerY: number,
  target: { x: number; y: number; dirX: number; dirY: number; speed: number; slowPct: number },
  shotSpeed: number,
  capCells: number,
): { x: number; y: number } {
  const dist = Math.hypot(target.x - towerX, target.y - towerY);
  const lead = leadCells(dist / CELL, (target.speed * (1 - target.slowPct)) / CELL, shotSpeed / CELL, capCells) * CELL;
  return { x: target.x + target.dirX * lead, y: target.y + target.dirY * lead };
}
