import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Rank 1 of Chill: 30% slower. */
export const chill1: StatusDef = {
  id: 'chill-1',
  name: 'Chill 1',
  color: PALETTE.ice,
  speedMul: 0.7,
};
