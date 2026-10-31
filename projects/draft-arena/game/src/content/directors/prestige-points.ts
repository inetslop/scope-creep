import type { DirectorDef } from '../../../engine/api.ts';

/**
 * Each prestige this life banks 1 talent point, so the level-1 start after one is not an empty minute. Bots get none.
 * Like prestige-coins it pays through mem one tick later: a knockout in that instant loses the point exactly like any
 * other banked one, while clients still see it with the reset, since directors run at the end of the same step.
 */
export const prestigePoints: DirectorDef = {
  id: 'prestige-points',
  name: 'Prestige point',
  description: 'Each prestige this life banks 1 talent point to spend at once.',
  onPrestige(_ctx, mem, player) {
    if (player.bot) return; // a bot's build is unchanged: no banked point for them
    const key = `pt${player.id}`;
    mem[key] = (mem[key] ?? 0) + 1; // one per prestige, flat
  },
  tick(ctx, mem) {
    for (const key of Object.keys(mem)) {
      const n = mem[key]!;
      delete mem[key];
      const p = ctx.playerById(Number(key.slice(2)));
      if (p) ctx.givePoints(p, n);
    }
  },
};
