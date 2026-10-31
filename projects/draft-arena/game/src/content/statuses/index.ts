import type { StatusDef } from '../../../engine/api.ts';
import { chill1 } from './chill-1.ts';
import { chill2 } from './chill-2.ts';
import { chill3 } from './chill-3.ts';
import { gooSlow } from './goo-slow.ts';
import { mired } from './mired.ts';

/** Every status (slows, burns...). One per line. */
export const STATUSES: readonly StatusDef[] = [
  chill1,
  chill2,
  chill3,
  mired,
  gooSlow,
];
