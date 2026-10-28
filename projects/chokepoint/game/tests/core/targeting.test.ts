import { describe, expect, it } from 'vitest';
import { inRange, pickTarget, pickTargets } from '../../src/core/targeting';

const enemies = [
  { x: 10, y: 0, distance: 5, active: true },
  { x: 20, y: 0, distance: 9, active: true },
  { x: 25, y: 0, distance: 12, active: false },
  { x: 200, y: 0, distance: 50, active: true },
];

describe('pickTarget', () => {
  it('shoots the active enemy in range that is furthest along the path', () => {
    expect(pickTarget(0, 0, 30, enemies)).toBe(1);
  });

  it('returns -1 when nothing is in range', () => {
    expect(pickTarget(0, 0, 5, enemies)).toBe(-1);
  });
});

describe('inRange', () => {
  it('lists every active enemy in range', () => {
    expect(inRange(0, 0, 30, enemies)).toEqual([0, 1]);
  });
});

describe('pickTargets', () => {
  it('takes the ones furthest along first, up to the count', () => {
    expect(pickTargets(0, 0, 30, enemies, 2)).toEqual([1, 0]);
    expect(pickTargets(0, 0, 30, enemies, 5)).toEqual([1, 0]);
  });
});
