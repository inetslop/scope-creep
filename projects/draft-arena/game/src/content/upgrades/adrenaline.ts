import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A kill made while hurt wires you up: a burst of move speed. */
export const adrenaline: UpgradeDef = {
  id: 'adrenaline',
  name: 'Adrenaline',
  description: 'On a kill while below half your hp: +20% move speed for 1.5 s, refreshed on each kill. Rank 2: +30% for 2 s.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.red },
  onKill(ctx, me, level, _victim) {
    if (me.hp < me.maxHp * 0.5) {
      ctx.addStatus(me, level === 2 ? 'wired-2' : 'wired-1', level === 2 ? 2 : 1.5);
      ctx.effect('wired-pop', { x: me.x, y: me.y });
    }
  },
};
