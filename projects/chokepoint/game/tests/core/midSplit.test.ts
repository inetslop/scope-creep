import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import { atSplitLine, splitChildHp } from '../../src/core/midSplit';

const orb = getEnemy('orb');
const dot = getEnemy('dot');

describe('midSplit (the Orb)', () => {
  it('atSplitLine: alive and at or below half its max, never above the line, never a corpse', () => {
    expect(atSplitLine(orb, 360, 720)).toBe(true); // exactly half of the Orb's base 720
    expect(atSplitLine(orb, 359, 720)).toBe(true);
    expect(atSplitLine(orb, 361, 720)).toBe(false);
    expect(atSplitLine(orb, 0, 720)).toBe(false); // a corpse is an ordinary kill, not a split
  });

  it('never fires for an enemy without a split line', () => {
    expect(atSplitLine(dot, 1, 2)).toBe(false);
  });

  it('splitChildHp: half the parent hp after the triggering hit, minimum 1', () => {
    // The pinned case: a hit from 60% to 44% of the Orb's base 720 leaves two Shards at 22% each.
    expect(splitChildHp(316.8)).toBe(158);
    expect(splitChildHp(2)).toBe(1);
    expect(splitChildHp(0.4)).toBe(1);
  });
});
