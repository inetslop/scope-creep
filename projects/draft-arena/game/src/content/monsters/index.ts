import type { MonsterDef } from '../../../engine/api.ts';
import { dot } from './dot.ts';
import { flee } from './flee.ts';
import { puff } from './puff.ts';
import { brood } from './brood.ts';
import { twin } from './twin.ts';
import { twinling } from './twinling.ts';
import { zippy } from './zippy.ts';
import { jaw } from './jaw.ts';
import { sleeper } from './sleeper.ts';
import { spitter } from './spitter.ts';
import { toss } from './toss.ts';

/** Every monster. One per line; the order is the wire order (keep new ones next to related ones). */
export const MONSTERS: readonly MonsterDef[] = [
  dot,
  puff,
  brood,
  twin,
  twinling,
  flee,
  zippy,
  jaw,
  sleeper,
  spitter,
  toss,
];
