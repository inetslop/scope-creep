import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Fang: while below half hp, a kill pays 2 extra coins per rank. */
export const fang: UpgradeDef = {
  id: 'fang',
  name: 'Fang',
  description: 'On a kill while below half your hp: +2 coins. Per rank: +2 more.',
  maxLevel: 2,
  look: { shape: 'circle', color: PALETTE.yellow },
  onKill(ctx, me, level, victim) {
    if (me.hp < me.maxHp * 0.5) {
      ctx.giveCoins(me, 2 * level);
      ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, 2 * level);
    }
  },
};
