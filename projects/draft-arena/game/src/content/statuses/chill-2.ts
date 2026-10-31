import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Rank 2 of Chill: 40% slower. */
export const chill2: StatusDef = {
  id: 'chill-2',
  name: 'Chill 2',
  color: PALETTE.ice,
  speedMul: 0.6,
};
