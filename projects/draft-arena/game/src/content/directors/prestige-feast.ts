import type { DirectorDef } from '../../../engine/api.ts';

const GEMS = 8;
const RADIUS = 120;
const XP = 4;

/** Prestige: 8 gems worth 4 xp in an even ring where a player goes back to level 1: the feast. */
export const prestigeFeast: DirectorDef = {
  id: 'prestige-feast',
  name: 'Prestige feast',
  description: 'When a player prestiges, 8 gems worth 4 xp land in a ring around them.',
  onPrestige(ctx, _mem, player, _count) {
    for (let i = 0; i < GEMS; i++) {
      const a = (i / GEMS) * Math.PI * 2;
      ctx.dropPickup('feast-gem', player.x + Math.cos(a) * RADIUS, player.y + Math.sin(a) * RADIUS, XP);
    }
  },
};
