import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Rank 1 of Wired: 20% faster. */
export const wired1: StatusDef = {
  id: 'wired-1',
  name: 'Wired 1',
  color: PALETTE.yellow,
  speedMul: 1.2,
};
