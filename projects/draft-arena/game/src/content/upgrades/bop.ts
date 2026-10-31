import type { Player, UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Lobber fork: a bubble that pops on the first critter it touches, instead of splashing where it lands. */
export const bop: UpgradeDef = {
  id: 'bop',
  name: 'Bop',
  description:
    'Your bubble pops on the critter it touches: a burst (radius 35) for 14 damage where it hits, no splash there. Per rank: +5 damage, +5 radius. A bubble that touches nothing splashes where it lands.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.ice },
  stats: {}, // The content test wants one of stats/fire/onHit/onKill; an empty stats is a no-op in the engine. The work is in bop-bubble.
};

/** Their upgrades live engine-side; this is the one place content reads them. Defensive: 0, never throws. */
export function bopRank(me: Player): number {
  const held = (me as Player & { upgrades?: ReadonlyMap<UpgradeDef, { level: number }> }).upgrades?.get(bop);
  return held ? held.level : 0;
}
