import type { DirectorDef } from '../../../engine/api.ts';
import { gemRain } from './gem-rain.ts';
import { prestigeRing } from './prestige-ring.ts';
import { gemGeyser } from './gem-geyser.ts';
import { crown } from './crown.ts';
import { swarmSurge } from './swarm-surge.ts';
import { gemRush } from './gem-rush.ts';

/** Everything that runs the whole match (field events, elites, bounties). One per line. */
export const DIRECTORS: readonly DirectorDef[] = [
  gemRain,
  prestigeRing,
  gemGeyser,
  crown,
  swarmSurge,
  gemRush,
];
