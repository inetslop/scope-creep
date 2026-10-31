import type { StatusDef } from '../../../engine/api.ts';
import { chill1 } from './chill-1.ts';
import { chill2 } from './chill-2.ts';
import { chill3 } from './chill-3.ts';
import { cling } from './cling.ts';
import { gooSlow } from './goo-slow.ts';
import { sapped } from './sapped.ts';
import { crowned } from './crowned.ts';
import { prestige1 } from './prestige-1.ts';
import { prestige2 } from './prestige-2.ts';
import { prestige3 } from './prestige-3.ts';
import { marked } from './marked.ts';
import { slushed } from './slushed.ts';
import { wired1 } from './wired-1.ts';
import { wired2 } from './wired-2.ts';

/** Every status (slows, burns...). One per line. */
export const STATUSES: readonly StatusDef[] = [
  chill1,
  chill2,
  chill3,
  wired1,
  wired2,
  marked,
  crowned,
  prestige1,
  prestige2,
  prestige3,
  gooSlow,
  slushed,
  cling,
  sapped,
];
