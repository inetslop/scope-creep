import type { ProjectileDef } from '../../../engine/api.ts';
import { bolt } from './bolt.ts';
import { orbit } from './orbit.ts';
import { saw } from './saw.ts';
import { seeker } from './seeker.ts';
import { spit } from './spit.ts';
import { sparkShot } from './spark.ts';
import { tideWave } from './tide.ts';
import { wave } from './wave.ts';

/** Every projectile. One per line. */
export const PROJECTILES: readonly ProjectileDef[] = [
  bolt,
  wave,
  tideWave,
  seeker,
  orbit,
  saw,
  sparkShot,
  spit,
];
