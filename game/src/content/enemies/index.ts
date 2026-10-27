import type { EnemyDef } from '../types';
import { block } from './block';
import { dart } from './dart';
import { frameWedge } from './frameWedge';
import { hare } from './hare';
import { sentry } from './sentry';
import { splinter } from './splinter';
import { platen } from './platen';
import { splitter } from './splitter';
import { wedge } from './wedge';

/** Every enemy in the game. To add one: create a file next to this one and add it here. */
export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, sentry, splitter, splinter, frameWedge, platen, hare];

export const ENEMY_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(ENEMIES.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDef {
  const def = ENEMY_BY_ID.get(id);
  if (!def) throw new Error(`Unknown enemy id: ${id}`);
  return def;
}
