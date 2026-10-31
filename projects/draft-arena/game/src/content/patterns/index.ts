import type { PatternDef } from '../../../engine/api.ts';
import { bands } from './bands.ts';
import { spots } from './spots.ts';
import { belly } from './belly.ts';
import { party } from './party.ts';
import { halves } from './halves.ts';
import { diagonal } from './diagonal.ts';
import { lolly } from './lolly.ts';
import { star } from './star.ts';
import { cheeks } from './cheeks.ts';
import { ring } from './ring.ts';

/** Color patterns painted over a player's body. One per line. */
export const PATTERNS: readonly PatternDef[] = [
  bands,
  spots,
  belly,
  party,
  halves,
  diagonal,
  lolly,
  star,
  cheeks,
  ring,
];
