import { FRAME } from './frame';
import { GRID } from './grid';
import type { BossDef } from './types';

/** Every boss in the game. To add one: create a file next to this one and add it here. */
export const BOSSES: readonly BossDef[] = [FRAME, GRID];

export const BOSS_BY_ID: ReadonlyMap<string, BossDef> = new Map(BOSSES.map((b) => [b.id, b]));

export function getBoss(id: string): BossDef {
  const def = BOSS_BY_ID.get(id);
  if (!def) throw new Error(`Unknown boss id: ${id}`);
  return def;
}

export type { BossDef, FrameBossDef, GridBossDef } from './types';
export { FRAME } from './frame';
export { GRID } from './grid';
