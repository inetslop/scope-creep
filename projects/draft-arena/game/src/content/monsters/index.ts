import type { MonsterDef } from '../../../engine/api.ts';
import { dot } from './dot.ts';
import { flee } from './flee.ts';
import { puff } from './puff.ts';
import { snail } from './snail.ts';
import { zippy } from './zippy.ts';
import { sleeper } from './sleeper.ts';
import { spitter } from './spitter.ts';

/** Every monster. One per line; the order is the wire order (keep new ones next to related ones). */
export const MONSTERS: readonly MonsterDef[] = [
  dot,
  puff,
  flee,
  zippy,
  sleeper,
  spitter,
  snail,
];
