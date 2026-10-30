import type { LevelAugmentDef } from '../types';
import { crowded } from './crowded';
import { lean } from './lean';
import { shortFuse } from './shortFuse';
import { swift } from './swift';
import { tough } from './tough';

export type { LevelAugmentDef };

/** Every level augment: the pre-run switches on the menu (never in the draft, hand, towers or codex). */
export const LEVEL_AUGMENTS: readonly LevelAugmentDef[] = [tough, lean, shortFuse, swift, crowded];

const byId = new Map(LEVEL_AUGMENTS.map((a) => [a.id, a]));

/** A level augment by id, or undefined. */
export function getLevelAugment(id: string): LevelAugmentDef | undefined {
  return byId.get(id);
}
