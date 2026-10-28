import { describe, expect, it } from 'vitest';
import { generateMap } from '../../src/core/map';
import { PathLine, pathLineFor } from '../../src/core/path';
import { Rng } from '../../src/core/rng';

describe('PathLine', () => {
  const line = new PathLine([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ]);

  it('measures its length', () => {
    expect(line.length).toBe(20);
  });

  it('finds points along it, clamped to both ends', () => {
    expect(line.pointAt(5)).toEqual({ x: 5, y: 0 });
    expect(line.pointAt(15)).toEqual({ x: 10, y: 5 });
    expect(line.pointAt(-3)).toEqual({ x: 0, y: 0 });
    expect(line.pointAt(99)).toEqual({ x: 10, y: 10 });
  });
});

describe('pathLineFor', () => {
  it('starts one cell before the entrance and ends one cell past the exit', () => {
    const map = generateMap(new Rng(5), 14, 8, 0);
    const line = pathLineFor(map, 64);
    expect(line.points[0]!.x).toBe(-32);
    expect(line.points[line.points.length - 1]!.x).toBe(14 * 64 + 32);
    expect(line.points.length).toBe(map.path.length + 2);
  });
});
