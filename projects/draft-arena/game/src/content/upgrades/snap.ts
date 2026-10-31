import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Frenzy fork: a player knockout while below half hp snaps the spot red - the crowd around the corpse pays. */
export const snap: UpgradeDef = {
  id: 'snap',
  name: 'Snap',
  description: 'On a player knockout while below half your hp: a burst (radius 110) for 15 damage. Rank 2: 25.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.red },
  onKill(ctx, me, level, victim) {
    if (victim.type !== 'player' || me.hp >= me.maxHp * 0.5) return;
    const dmg = level === 2 ? 25 : 15;
    for (const u of ctx.unitsNear(victim.x, victim.y, 110))
      if (u.alive && u !== me) ctx.damage(u, dmg, me);
    ctx.effect('snap-burst', { x: victim.x, y: victim.y }, undefined, 110);
  },
};
