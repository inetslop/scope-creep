import type { DirectorDef } from '../../../engine/api.ts';

/** Prestige: the field's biggest ring and 24 stars, where a player goes back to level 1. */
export const prestigeRing: DirectorDef = {
  id: 'prestige-ring',
  name: 'Prestige ring',
  description: 'The biggest ring on the field and 24 stars, where a player prestiges.',
  onPrestige(ctx, _mem, player, _count) {
    ctx.effect('prestige-ring', player);
  },
};
