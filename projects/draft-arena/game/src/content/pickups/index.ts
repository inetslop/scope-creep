import type { PickupDef } from '../../../engine/api.ts';
import { gem } from './gem.ts';

/** Every pickup. One per line. */
export const PICKUPS: readonly PickupDef[] = [
  gem,
];
