import type { UpgradeDef } from '../../../engine/api.ts';
import { adrenaline } from './adrenaline.ts';
import { bellow } from './bellow.ts';
import { bolt } from './bolt.ts';
import { chill } from './chill.ts';
import { chew } from './chew.ts';
import { chomp } from './chomp.ts';
import { cling } from './cling.ts';
import { cover } from './cover.ts';
import { fang } from './fang.ts';
import { frenzy } from './frenzy.ts';
import { fuse } from './fuse.ts';
import { goo } from './goo.ts';
import { gore } from './gore.ts';
import { gush } from './gush.ts';
import { haste } from './haste.ts';
import { hide } from './hide.ts';
import { horn } from './horn.ts';
import { lance } from './lance.ts';
import { leech } from './leech.ts';
import { lob } from './lob.ts';
import { magnet } from './magnet.ts';
import { maw } from './maw.ts';
import { mend } from './mend.ts';
import { might } from './might.ts';
import { nest } from './nest.ts';
import { nerve } from './nerve.ts';
import { quick } from './quick.ts';
import { reap } from './reap.ts';
import { reckless } from './reckless.ts';
import { ricochet } from './ricochet.ts';
import { scatter } from './scatter.ts';
import { slush } from './slush.ts';
import { split } from './split.ts';
import { snare } from './snare.ts';
import { sting } from './sting.ts';
import { swarm } from './swarm.ts';
import { swift } from './swift.ts';
import { vigor } from './vigor.ts';
import { wide } from './wide.ts';

/** Every upgrade talents give. One per line: weapons, capstones, on-hit, then stats. */
export const UPGRADES: readonly UpgradeDef[] = [
  bolt,
  cover,
  maw,
  bellow,
  lob,
  goo,
  nerve,
  horn,
  ricochet,
  reckless,
  chill,
  reap,
  swarm,
  leech,
  mend,
  chomp,
  adrenaline,
  fang,
  gore,
  fuse,
  scatter,
  gush,
  chew,
  slush,
  nest,
  sting,
  cling,
  snare,
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
