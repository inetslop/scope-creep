import { describe, expect, it } from 'vitest';
import { pickArcTargets, type ArcTarget } from '../../src/core/arc';

const ORIGIN = { x: 0, y: 0 };
const AIM = { x: 1, y: 0 };
const RANGE = 260;
const CONE_DEG = 30;
const CHAIN_RADIUS = 140;
const MAX_JUMPS = 3;

const t = (id: number, x: number, y: number): ArcTarget => ({ id, x, y });
const pick = (enemies: readonly ArcTarget[]): number[] => pickArcTargets(enemies, ORIGIN, AIM, RANGE, CONE_DEG, CHAIN_RADIUS, MAX_JUMPS);

describe('pickArcTargets', () => {
  it('returns nothing when there are no enemies', () => {
    expect(pick([])).toEqual([]);
  });

  it('hits the nearest enemy in the cone, then chains to everything within reach', () => {
    // e2 (100) is the nearest in-cone first hit; e1 (200) is 100 from e2 and e3 (259) is 59 from e1, so both chain.
    expect(pick([t(1, 200, 0), t(2, 100, 0), t(3, 259, 0)])).toEqual([2, 1, 3]);
  });

  it('whiffs when nothing is in the cone or in range', () => {
    // e1 is 250 away but straight to the side (outside the 30° cone); e2 is 300 away (beyond range).
    expect(pick([t(1, 0, 250), t(2, 300, 0)])).toEqual([]);
  });

  it('chains at most maxJumps after the first hit', () => {
    // e3 is exactly at range (260 <= 260); the 4th jump to e5 is excluded.
    expect(pick([t(1, 100, 0), t(2, 180, 0), t(3, 260, 0), t(4, 340, 0), t(5, 420, 0)])).toEqual([1, 2, 3, 4]);
  });

  it('chains from the last hit, not from the player', () => {
    // e2 is 320 from the player (beyond range) but only 120 from e1, so it chains.
    expect(pick([t(1, 200, 0), t(2, 320, 0)])).toEqual([1, 2]);
  });

  it('never hits the same enemy twice in one arc', () => {
    expect(pick([t(1, 100, 0), t(2, 120, 0)])).toEqual([1, 2]);
  });

  it('the nearest chain candidate wins', () => {
    // e2 is outside the first-hit cone; from e1, e3 (100 away) is nearer than e2 (104 away), then e2 chains last.
    expect(pick([t(1, 100, 0), t(2, 130, 100), t(3, 200, 0)])).toEqual([1, 3, 2]);
  });
});
