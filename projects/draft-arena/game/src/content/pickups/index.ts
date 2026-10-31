import type { PickupDef } from '../../../engine/api.ts';
import { eventGem } from './event-gem.ts';
import { feastGem } from './feast-gem.ts';
import { gem } from './gem.ts';
import { jackpot } from './jackpot.ts';
import { coin } from './coin.ts';

/** Every pickup. One per line. */
export const PICKUPS: readonly PickupDef[] = [
  eventGem,
  feastGem,
  gem,
  jackpot,
  coin,
];
