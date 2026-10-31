import type { Player, UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Lobber fork: the bubble splashes where it lands, then turns and flies back, splashing again behind you. */
export const echo: UpgradeDef = {
  id: 'echo',
  name: 'Echo',
  description:
    'Your bubble splashes, then turns and flies back to you, splashing again where it lands behind you. Per rank: the return splash is 25% bigger (50% to 75% to 100% of your splash).',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.teal },
  stats: {}, // The content test wants one of stats/fire/onHit/onKill; an empty stats is a no-op in the engine. The work is in echo-bubble.
};

/** Their upgrades live engine-side; this is the one place content reads them. Defensive: 0, never throws. */
export function echoRank(me: Player): number {
  const held = (me as Player & { upgrades?: ReadonlyMap<UpgradeDef, { level: number }> }).upgrades?.get(echo);
  return held ? held.level : 0;
}
