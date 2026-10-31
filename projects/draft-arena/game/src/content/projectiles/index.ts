import type { ProjectileDef } from '../../../engine/api.ts';
import { bolt } from './bolt.ts';
import { bubble } from './bubble.ts';
import { glob } from './glob.ts';
import { goo } from './goo.ts';
import { goolet } from './goolet.ts';
import { jab } from './jab.ts';
import { slushBlob } from './slush-blob.ts';

/** Every projectile. One per line. */
export const PROJECTILES: readonly ProjectileDef[] = [
  bolt,
  jab,
  bubble,
  glob,
  goo,
  goolet,
  slushBlob,
];
