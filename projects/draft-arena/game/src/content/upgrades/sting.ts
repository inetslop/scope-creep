import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Hive capstone: a kill in a pile bursts the pile - 12 damage (6 to players, via the engine's pvp
 * half) to all within 80 of the corpse. It is plain damage, but burst kills credit the killer and
 * re-trigger on-kill, so a chain only runs while kills keep finding 2+ neighbors in the spot.
 */
export const sting: UpgradeDef = {
  id: 'sting',
  name: 'Sting',
  description: 'On a kill with 2 or more other critters within 80 of the corpse: the corpse bursts (radius 80) for 12 damage.',
  maxLevel: 1,
  look: { shape: 'star', color: PALETTE.purple, scale: 1.1 },
  onKill(ctx, me, _level, victim) {
    const near = ctx.unitsNear(victim.x, victim.y, 80);
    if (near.length < 2) return;
    for (const u of near) ctx.damage(u, 12, me);
    ctx.effect('sting-burst', { x: victim.x, y: victim.y }, undefined, 80);
  },
};
