import type { StatusDef } from '../../../engine/api.ts';
import { bleeding } from './bleed.ts';
import { chill } from './chill.ts';

/** Every status. One per line. */
export const STATUSES: readonly StatusDef[] = [
  chill,
  bleeding,
];
