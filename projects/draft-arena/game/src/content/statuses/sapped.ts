import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Sapped by a Snare's Gush puddle: takes more damage from its Snares. One per critter, refreshed while inside. */
export const sapped: StatusDef = { id: 'sapped', name: 'Sapped', color: PALETTE.blue };
