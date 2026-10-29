import { describe, expect, it } from 'vitest';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { AUGMENTS } from '../../src/content/augments';
import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { RALLY_PCT, RALLY_RANGE, inRallyReach, rallyBuffed } from '../../src/core/rally';
import type { Cell } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

const cell = (col: number, row: number): Cell => ({ col, row });
const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('rally range and reach', () => {
  it('is 2 cells and a flat 10% buff', () => {
    expect(RALLY_RANGE).toBe(2);
    expect(RALLY_PCT).toBeCloseTo(0.1);
  });

  it('reaches the circle its range ring shows, not a square', () => {
    expect(inRallyReach(cell(0, 0), cell(2, 0), RALLY_RANGE)).toBe(true); // two straight out is on the circle
    expect(inRallyReach(cell(0, 0), cell(0, -2), RALLY_RANGE)).toBe(true);
    expect(inRallyReach(cell(0, 0), cell(1, 1), RALLY_RANGE)).toBe(true);
    expect(inRallyReach(cell(0, 0), cell(2, 1), RALLY_RANGE)).toBe(false); // 2.24 cells: outside the ring
    expect(inRallyReach(cell(0, 0), cell(2, 2), RALLY_RANGE)).toBe(false); // the square's far corner is out
    expect(inRallyReach(cell(0, 0), cell(3, 0), RALLY_RANGE)).toBe(false);
  });
});

describe('rallyBuffed', () => {
  it('a lone beacon is not buffed; a bolt two cells away is, three away is not', () => {
    const cells = [cell(0, 0), cell(2, 0), cell(3, 0)];
    expect(rallyBuffed(cells, [true, false, false], [false, true, true], [RALLY_RANGE, RALLY_RANGE, RALLY_RANGE])).toEqual([false, true, false]);
  });

  it('two rallies around one bolt still buff it only once (a boolean never stacks)', () => {
    const cells = [cell(-2, 0), cell(0, 0), cell(2, 0)];
    expect(rallyBuffed(cells, [true, false, true], [false, true, false], [RALLY_RANGE, RALLY_RANGE, RALLY_RANGE])).toEqual([false, true, false]);
  });

  it('an attacking tower with rally added is buffed while alone', () => {
    expect(rallyBuffed([cell(0, 0)], [true], [true], [RALLY_RANGE])).toEqual([true]);
  });

  it('a rally with reach (2.7) buffs a tower 2.5 cells away, not 3', () => {
    const cells = [cell(0, 0), cell(2.5, 0), cell(3, 0)];
    expect(rallyBuffed(cells, [true, false, false], [false, true, true], [2.7, 0, 0])).toEqual([false, true, false]);
  });

  it('two rallies with different reaches each use their own', () => {
    const cells = [cell(0, 0), cell(2.5, 0), cell(5, 0)];
    expect(rallyBuffed(cells, [true, false, true], [false, true, true], [RALLY_RANGE, 0, 2.7])).toEqual([false, true, true]);
  });
});

describe('the tower panel line', () => {
  it('says the tower own reach, the ring it shows', () => {
    expect(describeSpec(spec('rally'))).toBe('Towers within 2 cells attack 10% faster.');
    expect(describeSpec(spec('rally', 'reach'))).toBe('Towers within 2.7 cells attack 10% faster.');
  });
});

describe('the draft rolls Rally only as Epic', () => {
  it('every rally offered across many seeds is epic, and at least one comes up', () => {
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      for (const wave of [1, 5, 10]) {
        const rng = new Rng(seed);
        for (const c of rollOffer(rng, AUGMENTS, 3, wave, false)) {
          if (c.id === 'rally') {
            seen += 1;
            expect(c.tier).toBe('epic');
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
