import type { StatusDef } from '../../../engine/api.ts';
import { prestigeStarsDraw } from './prestige-1.ts';
import { PALETTE } from '../palette.ts';

/** 2 prestiges this life: 2 gold stars off the top-right of the head (directors/prestige-stars.ts). */
export const prestige2: StatusDef = { id: 'prestige-2', name: 'Prestige 2', color: PALETTE.yellow, draw: prestigeStarsDraw(2) };
