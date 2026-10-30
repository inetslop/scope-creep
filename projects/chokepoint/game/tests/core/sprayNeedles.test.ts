import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { towerSpec } from '../../src/core/augments';
import { NEEDLE_REACH_CELLS, needleCount, needleTargets } from '../../src/core/sprayNeedles';
import type { TargetCandidate } from '../../src/core/targeting';
import type { AugmentCopy } from '../../src/content/types';

const copy = (id: string): AugmentCopy => ({ id, tier: 'common' });

describe('needleCount', () => {
  it('one per Spray in the tower, only when the beam is its own attack', () => {
    expect(needleCount(towerSpec([copy('beam'), copy('spray'), copy('spray')]))).toBe(2); // one per added Spray
    expect(needleCount(towerSpec([copy('beam')]))).toBe(0); // no Sprays added: no needles
    expect(needleCount(towerSpec([copy('spray'), copy('spray')]))).toBe(0); // a Spray tower's blast is not a beam kill
    expect(needleCount(towerSpec([copy('bolt'), copy('spray')]))).toBe(0); // a shot tower with Sprays still shoots
  });
});

describe('needleTargets', () => {
  const corpse = (): TargetCandidate => ({ x: 0, y: 0, distance: 0, active: true });
  const foe = (x: number, y: number, active = true): TargetCandidate => ({ x, y, distance: 0, active });

  it('nothing within reach is no target', () => {
    expect(needleTargets(corpse(), 3, [])).toEqual([]);
    // The far corner of a two-cell square is out: nearest first only counts what is near.
    expect(needleTargets(corpse(), 1, [foe(3 * CELL, 0), foe(0, 3 * CELL), foe(NEEDLE_REACH_CELLS * CELL, NEEDLE_REACH_CELLS * CELL)])).toEqual([]);
  });

  it('the nearest first, one distinct enemy per needle', () => {
    const foes = [foe(CELL, 0), foe(1.5 * CELL, 0), foe(0.5 * CELL, 0)];
    expect(needleTargets(corpse(), 2, foes)).toEqual([2, 0]); // the 0.5 and the 1 cell ones, not the 1.5
  });

  it('the corpse itself is never a target', () => {
    const c = corpse();
    expect(needleTargets(c, 3, [foe(0.5 * CELL, 0), c, foe(CELL, 0)])).toEqual([0, 2]); // it is the nearest enemy in the pool, and still skipped
  });

  it('reaches exactly NEEDLE_REACH_CELLS out, not just past', () => {
    expect(needleTargets(corpse(), 1, [foe(NEEDLE_REACH_CELLS * CELL, 0)])).toEqual([0]); // on the edge is in
    expect(needleTargets(corpse(), 1, [foe(NEEDLE_REACH_CELLS * CELL + 1, 0)])).toEqual([]); // one board unit past is out
  });

  it('fewer in reach than needles is fine', () => {
    const foes = [foe(CELL, 0), foe(-CELL, 0)];
    expect(needleTargets(corpse(), 4, foes)).toHaveLength(2);
  });

  it('an enemy that is not alive is no target', () => {
    expect(needleTargets(corpse(), 1, [foe(0.5 * CELL, 0, false), foe(CELL, 0)])).toEqual([1]);
  });

  it('no count is no needles', () => {
    expect(needleTargets(corpse(), 0, [foe(CELL, 0)])).toEqual([]);
  });
});
