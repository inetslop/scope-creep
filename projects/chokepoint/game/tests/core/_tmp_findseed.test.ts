import { expect, it } from 'vitest';
import { boardHasDoubleMark } from '../../src/core/markedCell';

it('seed 15 is the committed dblmark seed, the smallest free doubling seed', () => {
  const used = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13]);
  let smallest = -1;
  for (let s = 1; s <= 40; s++) if (!used.has(s) && boardHasDoubleMark(s)) { smallest = s; break; }
  expect(boardHasDoubleMark(15)).toBe(true);
  expect(smallest).toBe(15);
});
