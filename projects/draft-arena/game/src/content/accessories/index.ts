import type { AccessoryDef } from '../../../engine/api.ts';
import { beanie } from './beanie.ts';
import { bloom } from './bloom.ts';
import { candyPack } from './candy-pack.ts';
import { chefHat } from './chef-hat.ts';
import { medal } from './medal.ts';
import { cone } from './cone.ts';
import { roundGlasses } from './round-glasses.ts';
import { bowTie } from './bow-tie.ts';
import { beak } from './beak.ts';
import { heartShades } from './heart-shades.ts';
import { balloon } from './balloon.ts';

/** Everything players can wear on their head, face or back (hats and more). One per line. */
export const ACCESSORIES: readonly AccessoryDef[] = [
  candyPack,
  chefHat,
  medal,
  cone,
  beanie,
  bloom,
  roundGlasses,
  bowTie,
  beak,
  heartShades,
  balloon,
];
