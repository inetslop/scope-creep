import { PALETTE } from '../content/palette';
import { isBossWave, isQuietWave, isTightWave } from './waves';

export interface WaveTagRow {
  tag: string;
  /** The exact fill the preview's chip wears for this tag. */
  chip: number;
  name: string;
  /** The preview's own tag-teach wording (T0092's table, grown by T0108's tight line). */
  meaning: string;
  when: string;
  /** The game's own wave rule for this tag, the same predicate the preview and the banner use. */
  rule: (wave: number) => boolean;
}

/**
 * The wave tags in the order the run meets them, with what each means in the preview's own
 * teach words and when it comes. One place for the waves reference to read them all.
 */
export const WAVE_TAG_ROWS: WaveTagRow[] = [
  { tag: 'quiet', chip: PALETTE.blueDeep, name: 'quiet', meaning: 'fewer, double gold', when: 'every 4th wave', rule: isQuietWave },
  { tag: 'tight', chip: PALETTE.muted, name: 'tight', meaning: 'they come bunched', when: 'every 8th, from 6', rule: isTightWave },
  { tag: 'boss', chip: PALETTE.purpleDeep, name: 'boss', meaning: 'one big shape, instead of a crowd', when: 'every 10th wave', rule: isBossWave },
];

/** The first wave after `current` that the tag's own rule tags (the reference's 'next: wave N'). */
export function nextTaggedWave(current: number, rule: (wave: number) => boolean): number {
  let n = current + 1;
  while (!rule(n)) n += 1;
  return n;
}
