import { v, type Player, type UpgradeDef } from '../../../engine/api.ts';
import { driftRank } from './drift.ts';
import { PALETTE } from '../palette.ts';

/** Gunner's committed weapon: a bolt that swoops in — a slow nose-down creep, then the dive. */
export const swoop: UpgradeDef = {
  id: 'swoop',
  name: 'Swoop',
  description: 'A bolt that swoops in: it creeps in nose-down, then dives. Per rank: +4 damage.',
  maxLevel: 3,
  look: { shape: 'triangle', color: PALETTE.ice },
  cooldown: 1.1,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 460);
    if (!target) return;
    // Stamped at fire, not read live: ricochet and cover read it back, and a prestige's
    // life-stamp clears it until the next fire re-stamps the rank for this life.
    me.mem['swoop'] = level;
    me.mem['swoopLife'] = me.prestige;
    const aim = v.angleTo(me, target);
    const rank = driftRank(me);
    const life = rank >= 2 ? 1.2 : rank === 1 ? 0.8 : undefined;
    ctx.fire(me, 'swoop-bolt', { angle: aim, speed: 420, damage: 14 + 4 * (level - 1), life });
  },
};

/** The rank of Swoop this life: the last fire's stamp, or 0 until one holds (or since a prestige). */
export function swoopLevel(me: Player): number {
  if (me.mem['swoopLife'] !== me.prestige) return 0;
  return me.mem['swoop'] ?? 0;
}

/** What a ricochet or cover swoop-bolt does: the stamped rank's damage, or nothing. */
export function swoopDamage(me: Player): number {
  const level = swoopLevel(me);
  return level > 0 ? 14 + 4 * (level - 1) : 0;
}
