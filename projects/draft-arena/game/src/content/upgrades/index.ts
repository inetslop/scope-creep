import type { UpgradeDef } from '../../../engine/api.ts';
import { bolt } from './bolt.ts';
import { chomp } from './chomp.ts';
import { haste } from './haste.ts';
import { lance } from './lance.ts';
import { magnet } from './magnet.ts';
import { might } from './might.ts';
import { ricochet } from './ricochet.ts';
import { split } from './split.ts';
import { swift } from './swift.ts';
import { vigor } from './vigor.ts';

/** Every upgrade talents give. One per line: weapons, capstones, on-hit, then stats. */
export const UPGRADES: readonly UpgradeDef[] = [
  bolt,
  ricochet,
  chomp,
  split,
  lance,
  swift,
  might,
  vigor,
  haste,
  magnet,
];
