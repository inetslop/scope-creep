import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Rank 2 of Wired: 30% faster. */
export const wired2: StatusDef = {
  id: 'wired-2',
  name: 'Wired 2',
  color: PALETTE.yellow,
  speedMul: 1.3,
};
