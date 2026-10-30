import type { Tower } from '../entities/Tower';

/** Idle seconds after a tower's last attack before its quiet dot shows. */
export const IDLE_DOT_SEC = 4;

/**
 * The quiet dot: an attack-first tower that has work but nothing in range shows a small dim
 * dot above its token while enemies are alive, and it clears the instant the tower next acts.
 * The caller never runs it for the no-attack supports (Mint, Rally and the future
 * Haste/Momentum/Mend/Toll): they are the tower's pure-support branch.
 */
export function quietDot(t: Tower, road: boolean, attacked: boolean, dt: number): void {
  if (attacked) { t.idleSec = 0; t.setIdleDot(false); return; }
  if (!road) { t.idleSec = 0; t.setIdleDot(false); return; }
  t.idleSec += dt;
  if (t.idleSec >= IDLE_DOT_SEC) t.setIdleDot(true);
}
