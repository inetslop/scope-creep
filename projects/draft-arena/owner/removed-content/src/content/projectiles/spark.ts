import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Spark's bolt of lightning: tiny and very fast. */
export const sparkShot: ProjectileDef = {
  id: 'spark',
  radius: 6,
  life: 0.45,
  look: { shape: 'star', color: PALETTE.ice },
};
