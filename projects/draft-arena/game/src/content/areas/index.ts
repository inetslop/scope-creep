import type { AreaDef } from '../../../engine/api.ts';
import { bite } from './bite.ts';
import { crown } from './crown.ts';
import { splash } from './splash.ts';
import { sticky } from './sticky.ts';

/** Every area (fields, auras, puddles). One per line. */
export const AREAS: readonly AreaDef[] = [
  bite,
  crown,
  splash,
  sticky,
];
