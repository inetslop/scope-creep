import { describe, expect, it } from 'vitest';
import { inRange, pickNearest, pickPierceTarget, pickTarget, pickTargets } from '../../src/core/targeting';

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

describe('pickNearest', () => {
  const struck = { x: 100, y: 0, distance: 20, active: true };
  const list = [
    struck, // the enemy that was just hit
    { x: 104, y: 0, distance: 21, active: true }, // 4 away
    { x: 90, y: 0, distance: 15, active: true }, // 10 away
    { x: 200, y: 0, distance: 60, active: true }, // 100 away
    { x: 112, y: 0, distance: 24, active: false }, // dead, 12 away
  ];

  it('the nearest first within the radius, skipping the struck enemy and the dead', () => {
    expect(pickNearest(struck, 30, list, 5)).toEqual([1, 2]);
    expect(pickNearest(struck, 100, list, 5)).toEqual([1, 2, 3]);
  });

  it('caps at max, nearest first', () => {
    expect(pickNearest(struck, 100, list, 2)).toEqual([1, 2]);
    expect(pickNearest(struck, 100, list, 0)).toEqual([]);
  });
});

describe('pickPierceTarget', () => {
  const behind = { x: 100, y: 0, distance: 40, active: true };
  const list = [
    behind, // the enemy that was just hit
    { x: 90, y: 0, distance: 36, active: true }, // behind by 4
    { x: 80, y: 0, distance: 30, active: true }, // behind by 10
    { x: 110, y: 0, distance: 44, active: true }, // ahead of the hit
    { x: 85, y: 0, distance: 34, active: false }, // dead
  ];

  it('the closest active enemy strictly behind, within the reach', () => {
    expect(pickPierceTarget(behind, list, 20)).toBe(1);
  });

  it('skips the hit enemy, the dead, and anything ahead', () => {
    expect(pickPierceTarget(behind, [list[4]!], 20)).toBe(-1); // the only one behind is dead
    expect(pickPierceTarget(behind, [list[3]!, list[1]!], 20)).toBe(1); // list[3] is ahead, list[1] behind
  });

  it('includes a gap exactly at the reach, and not one beyond it', () => {
    const at = { x: 0, y: 0, distance: 30, active: true }; // behind by 10
    const over = { x: 0, y: 0, distance: 29, active: true }; // behind by 11
    expect(pickPierceTarget(behind, [behind, at], 10)).toBe(1);
    expect(pickPierceTarget(behind, [behind, over], 10)).toBe(-1);
  });

  it('returns -1 when nothing is behind', () => {
    expect(pickPierceTarget(behind, [behind], 20)).toBe(-1);
  });
});
