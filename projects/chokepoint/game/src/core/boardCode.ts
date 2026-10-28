import { Rng } from './rng';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The board's four-letter code: the same seed always gives the same code, different seeds different ones. */
export function boardCode(seed: number): string {
  const rng = new Rng(seed);
  let out = '';
  for (let i = 0; i < 4; i++) out += LETTERS.charAt(rng.int(0, 25));
  return out;
}
