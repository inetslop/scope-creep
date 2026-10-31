import type { ProjectileDef } from '../../../engine/api.ts';
import { bolt } from './bolt.ts';
import { bubble } from './bubble.ts';

/** Every projectile. One per line. */
export const PROJECTILES: readonly ProjectileDef[] = [
  bolt,
  bubble,
];
