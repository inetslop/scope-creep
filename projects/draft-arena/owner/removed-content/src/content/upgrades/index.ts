import type { UpgradeDef } from '../../../engine/api.ts';
import { armor } from './armor.ts';
import { auraField } from './aura.ts';
import { bleed } from './bleed.ts';
import { boltWand } from './bolt.ts';
import { chain } from './chain.ts';
import { crit } from './crit.ts';
import { frost } from './frost.ts';
import { haste } from './haste.ts';
import { knockback } from './knockback.ts';
import { magnet } from './magnet.ts';
import { might } from './might.ts';
import { nova } from './nova.ts';
import { orbitBlades } from './orbit.ts';
import { pierce } from './pierce.ts';
import { reach } from './reach.ts';
import { ricochet } from './ricochet.ts';
import { sawstorm } from './sawstorm.ts';
import { seekers } from './seeker.ts';
import { shatter } from './shatter.ts';
import { spark } from './spark.ts';
import { splash } from './splash.ts';
import { split } from './split.ts';
import { swarm } from './swarm.ts';
import { swift } from './swift.ts';
import { tide } from './tide.ts';
import { vigor } from './vigor.ts';
import { waveShot } from './wave.ts';

/** Every upgrade talents give. One per line: weapons, capstones, on-hit, then stats. */
export const UPGRADES: readonly UpgradeDef[] = [
  boltWand,
  waveShot,
  seekers,
  orbitBlades,
  auraField,
  spark,
  ricochet,
  tide,
  swarm,
  sawstorm,
  nova,
  shatter,
  chain,
  frost,
  knockback,
  splash,
  crit,
  bleed,
  swift,
  might,
  vigor,
  haste,
  magnet,
  armor,
  pierce,
  reach,
  split,
];
