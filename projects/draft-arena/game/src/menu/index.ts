import type { MakeMenuPart } from '../../engine/api.ts';
import { color } from './color.ts';
import { coins } from './coins.ts';
import { shop } from './shop.ts';

/** The game's parts of the start screen (above Play), top to bottom. One per line. */
export const MENU_PARTS: readonly MakeMenuPart[] = [
  coins,
  color,
  shop,
];
