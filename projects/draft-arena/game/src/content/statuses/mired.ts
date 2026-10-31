import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Stuck in the muck a Snail left behind: 60% speed, players and monsters alike. */
export const mired: StatusDef = {
  id: 'mired',
  name: 'Mired',
  color: PALETTE.orange,
  speedMul: 0.6,
};
