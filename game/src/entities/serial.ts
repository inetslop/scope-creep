let next = 1;

/**
 * Shared per-spawn serial. Enemies and the boss each take one on spawn;
 * Projectile.hitSerials uses them so a piercing shot hits each target once.
 */
export function takeSerial(): number {
  return next++;
}
