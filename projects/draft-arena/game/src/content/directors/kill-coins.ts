import type { DirectorDef } from '../../../engine/api.ts';

/** Kills pay coins: 1 per monster, the victim's level per real-player knockout. Bots never earn. */
export const killCoins: DirectorDef = {
  id: 'kill-coins',
  name: 'Kill coins',
  description: "Kills pay coins: 1 per monster, the victim's level per player knockout.",
  onKill(ctx, _mem, killer, victim) {
    if (!killer || killer.bot) return;
    if (victim.type === 'player') {
      if (victim.bot) return;
      ctx.giveCoins(killer, victim.level);
      ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, victim.level);
    } else {
      ctx.giveCoins(killer, 1);
      ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, 1);
    }
  },
};
