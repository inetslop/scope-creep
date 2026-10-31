import type { MakeHudPart } from '../../engine/api.ts';
import './base.css';
import { connection } from './connection.ts';
import { knockedOut } from './knockedOut.ts';
import { scoreboard } from './scoreboard.ts';
import { talentTree } from './talentTree.ts';
import { xpBar } from './xpBar.ts';

/** Every HUD element, in the order they are built. One per line. */
export const HUD_PARTS: readonly MakeHudPart[] = [
  connection,
  xpBar,
  scoreboard,
  knockedOut,
  talentTree,
];
