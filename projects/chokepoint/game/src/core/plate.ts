/**
 * The damage multiplier a plate gives to one directed hit: `plate` (e.g. half) when the shot
 * flies against the enemy's travel and strikes its front, 1 when it strikes the rear or a side
 * (or is exactly perpendicular). Flightless hits never pass through here: they go whole.
 */
export function plateMul(plate: number, fx: number, fy: number, dx: number, dy: number): number {
  return fx * dx + fy * dy < 0 ? plate : 1;
}
