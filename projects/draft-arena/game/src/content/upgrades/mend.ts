import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A hurt Frenzy life buys back hp: every Nerve jab hit heals the attacker, the more hurt, the more. */
export const mend: UpgradeDef = {
  id: 'mend',
  name: 'Mend',
  description: 'On a Nerve hit: heal 1 hp per 10 hp missing. Per rank: +1 per 10 hp missing.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.green },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile || hit.projectile.def.id !== 'jab') return; // Nerve jabs only (Bolt, Maw, Lob, Goo, Slush: nothing)
    const missing = me.maxHp - me.hp;
    if (missing > 0) ctx.heal(me, Math.floor(missing / 10) * level);
  },
};
