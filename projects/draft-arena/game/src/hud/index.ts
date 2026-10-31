import type { MakeHudPart } from '../../engine/api.ts';
import './base.css';
import { audio } from './audio.ts';
import { chime } from './chime.ts';
import { coin } from './coin.ts';
import { coinChip } from './coinChip.ts';
import { connection } from './connection.ts';
import { knockedOut } from './knockedOut.ts';
import { prestige } from './prestige.ts';
import { scoreboard } from './scoreboard.ts';
import { talentTree } from './talentTree.ts';
import { xpBar } from './xpBar.ts';

/** Every HUD element, in the order they are built. One per line. */
export const HUD_PARTS: readonly MakeHudPart[] = [
  audio,
  coin,
  coinChip,
  connection,
  chime,
  xpBar,
  scoreboard,
  knockedOut,
  prestige,
  talentTree,
];
