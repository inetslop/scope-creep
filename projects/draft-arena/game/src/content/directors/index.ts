import type { DirectorDef } from '../../../engine/api.ts';
import { gemRain } from './gem-rain.ts';
import { crown } from './crown.ts';

/** Everything that runs the whole match (field events, elites, bounties). One per line. */
export const DIRECTORS: readonly DirectorDef[] = [
  gemRain,
  crown,
];
