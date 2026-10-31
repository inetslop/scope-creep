import type { PatternDef } from '../../../engine/api.ts';
import { bands } from './bands.ts';
import { spots } from './spots.ts';

/** Color patterns painted over a player's body. One per line. */
export const PATTERNS: readonly PatternDef[] = [
  bands,
  spots,
];
