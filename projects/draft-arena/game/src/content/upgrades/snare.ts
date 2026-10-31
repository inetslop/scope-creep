import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober mark: whatever your Gush puddle saps takes more damage from you, with any weapon. */
export const snare: UpgradeDef = {
  id: 'snare',
  name: 'Snare',
  description:
    'After 1 prestige this life. Whatever stands in your Gush puddle is sapped: it takes 15% more damage from you, per rank +10%.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.blue },
  onHit(ctx, me, level, hit) {
    me.mem.snare = me.prestige; // stamp: your puddles read it to know whether to sap
    if (hit.damage <= 0) return; // 0-damage touches (slush blob) are not hits
    if (ctx.statusOf(hit.target, 'sapped') > 0) ctx.damage(hit.target, hit.damage * (0.15 + 0.1 * (level - 1)), me);
  },
};
