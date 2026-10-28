import type { EnemyDef } from '../types';
import { block } from './block';
import { dart } from './dart';
import { dot } from './dot';

/** Every enemy type. Waves draw from the ones whose fromWave has been reached. */
export const ENEMIES: readonly EnemyDef[] = [
  dot,
  dart,
  block,
];

const byId = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const def = byId.get(id);
  if (!def) throw new Error(`unknown enemy "${id}"`);
  return def;
}
