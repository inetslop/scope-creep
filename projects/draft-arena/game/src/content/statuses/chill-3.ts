import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Rank 3 of Chill: 50% slower. */
export const chill3: StatusDef = {
  id: 'chill-3',
  name: 'Chill 3',
  color: PALETTE.ice,
  speedMul: 0.5,
};
