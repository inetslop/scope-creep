/**
 * The point a straight shot should fly to: where the target — at (x, y), walking at `speed`
 * board units per second along the unit vector (dirX, dirY) — will be when a shot fired from
 * (sx, sy) at `shotSpeed` arrives. Aims at the target's current spot when it is on top of the
 * target, not moving, or as fast or faster than the shot (a slower shot can never catch up).
 */
export function leadPoint(sx: number, sy: number, shotSpeed: number, x: number, y: number, dirX: number, dirY: number, speed: number): { x: number; y: number } {
  const wx = x - sx;
  const wy = y - sy;
  const w = Math.hypot(wx, wy);
  if (w < 1e-6 || speed <= 0 || shotSpeed <= speed) return { x, y };
  const a = shotSpeed * shotSpeed - speed * speed;
  const wu = wx * dirX + wy * dirY;
  const t = (speed * wu + Math.sqrt(speed * speed * wu * wu + a * w * w)) / a;
  return { x: x + dirX * speed * t, y: y + dirY * speed * t };
}
