import type { TalentTreeDef } from '../../../engine/api.ts';
import { blades } from './blades.ts';
import { body } from './body.ts';
import { gunner } from './gunner.ts';
import { hunter } from './hunter.ts';
import { storm } from './storm.ts';
import { tideTree } from './tide.ts';
import { warden } from './warden.ts';

/** Every talent tree, in tab order. One per line; each tree lives in its own file. */
export const TREES: readonly TalentTreeDef[] = [
  gunner,
  hunter,
  tideTree,
  blades,
  warden,
  storm,
  body,
];
