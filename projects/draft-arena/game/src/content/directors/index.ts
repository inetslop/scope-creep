import type { DirectorDef } from '../../../engine/api.ts';
import { gemRain } from './gem-rain.ts';
import { prestigeRing } from './prestige-ring.ts';
import { prestigeStars } from './prestige-stars.ts';
import { gemGeyser } from './gem-geyser.ts';
import { jackpot } from './jackpot.ts';
import { crown } from './crown.ts';
import { mark } from './mark.ts';
import { price } from './price.ts';
import { wound } from './wound.ts';
import { prestigeCoins } from './prestige-coins.ts';
import { swarmSurge } from './swarm-surge.ts';
import { gemRush } from './gem-rush.ts';
import { killCoins } from './kill-coins.ts';
import { corpse } from './corpse.ts';
import { prestigePoints } from './prestige-points.ts';
import { prestigeFeast } from './prestige-feast.ts';

/** Everything that runs the whole match (field events, elites, bounties). One per line. */
export const DIRECTORS: readonly DirectorDef[] = [
  gemRain,
  prestigeRing,
  prestigeStars,
  gemGeyser,
  jackpot,
  killCoins,
  corpse,
  crown,
  mark,
  price,
  wound,
  prestigeCoins,
  prestigePoints,
  prestigeFeast,
  swarmSurge,
  gemRush,
];
