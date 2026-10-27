import { describe, expect, it } from 'vitest';
import { add, distance, length, normalize, scale, vec } from '../../src/core/vec';

describe('vec helpers', () => {
  it('length of (3, 4) is 5', () => {
    expect(length(vec(3, 4))).toBe(5);
  });

  it('normalize of (3, 4) is (0.6, 0.8)', () => {
    expect(normalize(vec(3, 4))).toEqual({ x: 0.6, y: 0.8 });
  });

  it('add (1, 2) + (3, 4) is (4, 6)', () => {
    expect(add(vec(1, 2), vec(3, 4))).toEqual({ x: 4, y: 6 });
  });

  it('scale (1, 2) x 3 is (3, 6)', () => {
    expect(scale(vec(1, 2), 3)).toEqual({ x: 3, y: 6 });
  });

  it('distance from (0, 0) to (3, 4) is 5', () => {
    expect(distance(vec(0, 0), vec(3, 4))).toBe(5);
  });

  it('normalize of (0, 0) is (0, 0) and NaN-free', () => {
    const n = normalize(vec(0, 0));
    expect(n).toEqual({ x: 0, y: 0 });
    expect(Number.isNaN(n.x) || Number.isNaN(n.y)).toBe(false);
  });
});
