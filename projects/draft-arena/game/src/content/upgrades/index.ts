import type { UpgradeDef } from '../../../engine/api.ts';
import { adrenaline } from './adrenaline.ts';
import { bolt } from './bolt.ts';
import { chill } from './chill.ts';
import { chew } from './chew.ts';
import { chomp } from './chomp.ts';
import { cling } from './cling.ts';
import { frenzy } from './frenzy.ts';
import { fuse } from './fuse.ts';
import { goo } from './goo.ts';
import { gush } from './gush.ts';
import { haste } from './haste.ts';
import { hide } from './hide.ts';
import { lance } from './lance.ts';
import { lob } from './lob.ts';
import { magnet } from './magnet.ts';
import { maw } from './maw.ts';
import { might } from './might.ts';
import { nerve } from './nerve.ts';
import { quick } from './quick.ts';
import { reap } from './reap.ts';
import { reckless } from './reckless.ts';
import { ricochet } from './ricochet.ts';
import { scatter } from './scatter.ts';
import { slush } from './slush.ts';
import { split } from './split.ts';
import { swift } from './swift.ts';
import { vigor } from './vigor.ts';
import { wide } from './wide.ts';

/** Every upgrade talents give. One per line: weapons, capstones, on-hit, then stats. */
export const UPGRADES: readonly UpgradeDef[] = [
  bolt,
  maw,
  lob,
  goo,
  nerve,
  ricochet,
  reckless,
  chill,
  reap,
  chomp,
  adrenaline,
  fuse,
  scatter,
  gush,
  chew,
  slush,
  cling,
  split,
  lance,
  swift,
  quick,
  wide,
  might,
  vigor,
  frenzy,
  hide,
  haste,
  magnet,
];
