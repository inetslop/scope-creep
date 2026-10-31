import type { AreaDef } from '../../../engine/api.ts';
import { bite } from './bite.ts';
import { crown } from './crown.ts';
import { mark } from './mark.ts';
import { splash } from './splash.ts';
import { puddle } from './puddle.ts';
import { sticky } from './sticky.ts';

/** Every area (fields, auras, puddles). One per line. */
export const AREAS: readonly AreaDef[] = [
  bite,
  crown,
  mark,
  splash,
  sticky,
  puddle,
];
