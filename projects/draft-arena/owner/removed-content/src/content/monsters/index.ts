import type { MonsterDef } from '../../../engine/api.ts';
import { dart } from './dart.ts';
import { dot } from './dot.ts';
import { spitter } from './spitter.ts';

/** Every monster. One per line; the order is the wire order (keep new ones next to related ones). */
export const MONSTERS: readonly MonsterDef[] = [
  dot,
  dart,
  spitter,
];
