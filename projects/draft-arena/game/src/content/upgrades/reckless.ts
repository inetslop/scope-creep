import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Frenzy capstone: while below half hp, every hit lands twice as hard. */
export const reckless: UpgradeDef = {
  id: 'reckless',
  name: 'Reckless',
  description: 'While below half your hp, your hits hit twice as hard.',
  maxLevel: 1,
  look: { shape: 'circle', color: PALETTE.red },
  onHit(ctx, me, _level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble) are not hits
    if (me.hp < me.maxHp * 0.5) ctx.damage(hit.target, hit.damage, me);
  },
};
