import type { AreaDef } from '../../../engine/api.ts';
import { bite } from './bite.ts';
import { crown } from './crown.ts';
import { prestigeStars } from './prestige-stars.ts';
import { mark } from './mark.ts';
import { wound } from './wound.ts';
import { splash } from './splash.ts';
import { plopSplash } from './plop-splash.ts';
import { slushPuddle } from './slush-puddle.ts';
import { splat } from './splat.ts';
import { puddle } from './puddle.ts';
import { chewPuddle } from './chew-puddle.ts';

/** Every area (fields, auras, puddles). One per line. */
export const AREAS: readonly AreaDef[] = [
  bite,
  crown,
  prestigeStars,
  mark,
  wound,
  splash,
  plopSplash,
  slushPuddle,
  splat,
  puddle,
  chewPuddle,
];
