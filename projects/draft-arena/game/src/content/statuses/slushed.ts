import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Standing in a Slush puddle: 80% speed, refreshed while inside. */
export const slushed: StatusDef = { id: 'slushed', name: 'Slushed', color: PALETTE.ice, speedMul: 0.8 };
