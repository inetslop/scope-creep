import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Cling splat is riding this critter: the 2 s mark it keeps biting. Refreshed by each new Goo hit. */
export const cling: StatusDef = { id: 'cling', name: 'Cling', color: PALETTE.blue };
