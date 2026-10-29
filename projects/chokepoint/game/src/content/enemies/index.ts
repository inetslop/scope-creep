import type { EnemyDef } from '../types';
import { block } from './block';
import { bulwark } from './bulwark';
import { dasher } from './dasher';
import { dart } from './dart';
import { dot } from './dot';
import { hauler } from './hauler';
import { mute } from './mute';
import { splinter } from './splinter';
import { splitter } from './splitter';
import { sprinter } from './sprinter';
import { ward } from './ward';

/** Every enemy type. Waves draw from the ones whose fromWave has been reached. */
export const ENEMIES: readonly EnemyDef[] = [
  dot,
  dart,
  block,
  dasher,
  sprinter,
  splitter,
  hauler,
  mute,
  ward,
  bulwark,
  splinter,
];

const byId = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const def = byId.get(id);
  if (!def) throw new Error(`unknown enemy "${id}"`);
  return def;
}
