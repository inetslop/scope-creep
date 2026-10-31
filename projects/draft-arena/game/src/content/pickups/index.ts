import type { PickupDef } from '../../../engine/api.ts';
import { eventGem } from './event-gem.ts';
import { gem } from './gem.ts';
import { jackpot } from './jackpot.ts';

/** Every pickup. One per line. */
export const PICKUPS: readonly PickupDef[] = [
  eventGem,
  gem,
  jackpot,
];
