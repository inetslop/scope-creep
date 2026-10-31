import type { TalentTreeDef } from '../../../engine/api.ts';
import { body } from './body.ts';
import { gunner } from './gunner.ts';
import { goober } from './goober.ts';
import { lobber } from './lobber.ts';

/** Every talent tree, in tab order. One per line; each tree lives in its own file. */
export const TREES: readonly TalentTreeDef[] = [
  gunner,
  body,
  lobber,
  goober,
];
