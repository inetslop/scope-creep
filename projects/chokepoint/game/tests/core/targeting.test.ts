import { describe, expect, it } from 'vitest';
import { inRange, pickNearest, pickTarget, pickTargets } from '../../src/core/targeting';

const enemies = [
  { x: 10, y: 0, distance: 5, active: true, hp: 1 },
  { x: 20, y: 0, distance: 9, active: true, hp: 1 },
  { x: 25, y: 0, distance: 12, active: false, hp: 1 },
  { x: 200, y: 0, distance: 50, active: true, hp: 1 },
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

describe('targeting modes', () => {
  // In range of (0,0) at 30: a far weak one and a near strong one.
  const modeEnemies = [
    { x: 28, y: 0, distance: 40, active: true, hp: 2 }, // furthest, weakest
    { x: 12, y: 0, distance: 10, active: true, hp: 9 }, // nearest, strongest
  ];

  it('first (the default) keeps the furthest along', () => {
    expect(pickTarget(0, 0, 30, modeEnemies)).toBe(0);
    expect(pickTarget(0, 0, 30, modeEnemies, 'first')).toBe(0);
  });

  it('strongest takes the most current hp, a tie to the furthest', () => {
    expect(pickTarget(0, 0, 30, modeEnemies, 'strongest')).toBe(1);
    expect(pickTarget(0, 0, 30, [{ ...modeEnemies[0]!, hp: 9 }, modeEnemies[1]!], 'strongest')).toBe(0);
  });

  it('closest takes the nearest, a tie to the furthest', () => {
    expect(pickTarget(0, 0, 30, modeEnemies, 'closest')).toBe(1);
    expect(pickTarget(0, 0, 30, [{ ...modeEnemies[1]!, x: 28 }, modeEnemies[0]!], 'closest')).toBe(1);
  });

  it('pickTargets orders by the mode, first the default', () => {
    expect(pickTargets(0, 0, 30, modeEnemies, 2)).toEqual([0, 1]);
    expect(pickTargets(0, 0, 30, modeEnemies, 2, 'strongest')).toEqual([1, 0]);
    expect(pickTargets(0, 0, 30, modeEnemies, 2, 'closest')).toEqual([1, 0]);
  });
});

describe('pickNearest', () => {
  const struck = { x: 100, y: 0, distance: 20, active: true, hp: 1 };
  const list = [
    struck, // the enemy that was just hit
    { x: 104, y: 0, distance: 21, active: true, hp: 1 }, // 4 away
    { x: 90, y: 0, distance: 15, active: true, hp: 1 }, // 10 away
    { x: 200, y: 0, distance: 60, active: true, hp: 1 }, // 100 away
    { x: 112, y: 0, distance: 24, active: false, hp: 1 }, // dead, 12 away
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
