import type { AccessoryDef } from '../../../engine/api.ts';
import { candyPack } from './candy-pack.ts';
import { roundGlasses } from './round-glasses.ts';

/** Everything players can wear on their head, face or back (hats and more). One per line. */
export const ACCESSORIES: readonly AccessoryDef[] = [
  candyPack,
  roundGlasses,
];
