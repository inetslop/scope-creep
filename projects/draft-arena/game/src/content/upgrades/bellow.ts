import { type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Body's second-life weapon: an unaimed bellow ring that strikes everything around the player. */
export const bellow: UpgradeDef = {
  id: 'bellow',
  name: 'Bellow',
  description: 'After 1 prestige this life. Every 1.4 s, if a critter is within 60, a ring (radius 80) around you strikes everything inside. 10 damage. Per rank: +4.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.ice },
  cooldown: 1.4,
  fire(ctx, me, level) {
    if (!ctx.nearestEnemy(me, 60)) return;
    ctx.area(me, 'bellow-ring', { damage: 10 + 4 * (level - 1) });
    ctx.effect('bellow-mouth', { x: me.x, y: me.y });
  },
};
