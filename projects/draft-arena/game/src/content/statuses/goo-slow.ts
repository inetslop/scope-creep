import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Standing in a Gush puddle: 80% speed, refreshed while inside. */
export const gooSlow: StatusDef = { id: 'goo-slow', name: 'Slosh', color: PALETTE.teal, speedMul: 0.8 };
