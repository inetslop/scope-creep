import type { DirectorDef } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

const SMOOTH = 0.5; // seconds for the radius to reach its level's size

/** The radius a player has at a level: level 1 is the base, level 18 would be twice it. */
function sizeAt(level: number): number {
  return RULES.player.radius * (1 + (level - 1) / 17);
}

/**
 * Players grow with their level: a level 17 player is almost twice as wide as a level 1 one, so
 * the leader reads at a glance (and is a bigger target). The radius eases toward the level's size
 * over 0.5 s, so a level-up never pops in one frame; a prestige or a knockout puts the player
 * back at level 1 and shrinks it the same way (respawn keeps the same object and its radius).
 */
export const growth: DirectorDef = {
  id: 'growth',
  name: 'Growth',
  description: 'Players grow with their level: twice as wide at the top, smoothed over half a second.',
  tick(ctx, _mem, dt) {
    const f = Math.min(1, dt / SMOOTH);
    for (const p of ctx.players()) {
      const target = sizeAt(p.level);
      p.radius += (target - p.radius) * f;
    }
  },
};
