import type { AreaDef } from '../../../engine/api.ts';
import { bite } from './bite.ts';

/** Every area (fields, auras, puddles). One per line. */
export const AREAS: readonly AreaDef[] = [
  bite,
];
