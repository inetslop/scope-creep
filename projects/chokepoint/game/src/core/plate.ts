/**
 * What a directed shot deals to a plated enemy (the Bulwark): the plate covers its forward 180°,
 * so a shot whose flight opposes the enemy's travel — a downstream tower shooting into the face —
 * is multiplied by `plate`, and every other hit goes whole: the rear (a shot chasing the enemy)
 * and the dead side (a perpendicular flight counts as the rear, strict `< 0`). Hits with no flight
 * direction (pulse, traps, burn ticks, the beam) never come here and always go whole.
 * `fx, fy` is the shot's flight (unit vector); `dx, dy` the enemy's travel along the road.
 */
export function plateMul(plate: number, fx: number, fy: number, dx: number, dy: number): number {
  return fx * dx + fy * dy < 0 ? plate : 1;
}
