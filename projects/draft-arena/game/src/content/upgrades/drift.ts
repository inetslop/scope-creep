import type { Player, UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Gunner fork: every Bolt drifts at 40% speed after its first 120 units, then lingers until it pops. */
export const drift: UpgradeDef = {
  id: 'drift',
  name: 'Drift',
  description: 'After 120 units, your bolts fly at 40% speed and keep going until 0.8 s after launch. Rank 2: until 1.2 s.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.ice },
  stats: {}, // The content test wants one of stats/fire/onHit/onKill; an empty stats is a no-op in the engine. The work is in drift-bolt.
};

/** Their upgrades live engine-side; this is the one place content reads them. Defensive: 0, never throws. */
export function driftRank(me: Player): number {
  const held = (me as Player & { upgrades?: ReadonlyMap<UpgradeDef, { level: number }> }).upgrades?.get(drift);
  return held ? held.level : 0;
}
