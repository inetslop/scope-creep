import { describe, expect, it } from 'vitest';
import { splitDistances } from '../../src/core/split';

describe('splitDistances', () => {
  it('places one child 0.25 cells ahead of the kill and one behind', () => {
    // One cell is 64 board units, so 0.25 cells is 16.
    expect(splitDistances(400, 800)).toEqual([416, 384]);
  });

  it('clamps to the road ends at both', () => {
    // Ahead of a kill near the start: nothing before distance 0; behind clamps at the end.
    expect(splitDistances(0, 800)).toEqual([16, 0]);
    expect(splitDistances(10, 800)).toEqual([26, 0]);
    expect(splitDistances(800, 800)).toEqual([799, 784]);
  });
});
