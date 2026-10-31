import type { DirectorDef } from '../../../engine/api.ts';

/**
 * Prestige stars: one gold star per prestige this life, up to 3, fanned off the top-right of the
 * critter. They are statuses (statuses/prestige-1.ts to prestige-3.ts), so they are drawn with the
 * player and never trail behind; kept on every tick, they go within 0.2 s of a knockout (prestiges
 * this life reset) or of the player leaving.
 */
export const prestigeStars: DirectorDef = {
  id: 'prestige-stars',
  name: 'Prestige stars',
  description: 'One gold star per prestige this life (up to 3), fanned off the top-right of the critter.',
  tick(ctx) {
    for (const p of ctx.players()) {
      if (p.prestige > 0) ctx.addStatus(p, `prestige-${Math.min(3, p.prestige)}`, 0.2);
    }
  },
};
