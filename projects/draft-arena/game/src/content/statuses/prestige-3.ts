import type { StatusDef } from '../../../engine/api.ts';
import { prestigeStarsDraw } from './prestige-1.ts';
import { PALETTE } from '../palette.ts';

/** 3 prestiges this life: 3 gold stars off the top-right of the head (directors/prestige-stars.ts). */
export const prestige3: StatusDef = { id: 'prestige-3', name: 'Prestige 3', color: PALETTE.yellow, draw: prestigeStarsDraw(3) };
