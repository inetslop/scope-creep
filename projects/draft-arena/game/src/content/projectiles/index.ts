import type { ProjectileDef } from '../../../engine/api.ts';
import { bolt } from './bolt.ts';
import { driftBolt } from './drift-bolt.ts';
import { bubble } from './bubble.ts';
import { glob } from './glob.ts';
import { plop } from './plop.ts';
import { goo } from './goo.ts';
import { goolet } from './goolet.ts';
import { needle } from './needle.ts';
import { horn } from './horn.ts';
import { lashDart } from './lash-dart.ts';
import { jab } from './jab.ts';
import { slushBlob } from './slush-blob.ts';

/** Every projectile. One per line. */
export const PROJECTILES: readonly ProjectileDef[] = [
  bolt,
  driftBolt,
  jab,
  horn,
  lashDart,
  bubble,
  glob,
  plop,
  goo,
  goolet,
  needle,
  slushBlob,
];
