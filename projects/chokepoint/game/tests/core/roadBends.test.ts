import { describe, expect, it } from 'vitest';
import { roadBends } from '../../src/core/roadBends';

const cells = (pairs: [number, number][]) => pairs.map(([col, row]) => ({ col, row }));

describe('roadBends', () => {
  it('a straight road has none', () => {
    expect(roadBends(cells([[0, 0], [0, 1], [0, 2], [0, 3]]))).toBe(0);
  });

  it('counts each turn once', () => {
    expect(roadBends(cells([[0, 0], [0, 1], [1, 1], [2, 1]]))).toBe(1);
    expect(roadBends(cells([[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]]))).toBe(3);
  });

  it('a road of one or two cells has none', () => {
    expect(roadBends(cells([[3, 0]]))).toBe(0);
    expect(roadBends(cells([[3, 0], [3, 1]]))).toBe(0);
  });
});
