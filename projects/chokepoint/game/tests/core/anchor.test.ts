import { describe, expect, it } from 'vitest';
import { anchor } from '../../src/content/augments/anchor';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, towerSpec } from '../../src/core/augments';
import { tierAddedLine, tierTowerLine } from '../../src/core/tiers';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('anchor (root)', () => {
  it('a lone Anchor is a support pulse: no damage, roots everything in 2.5 cells every 3s', () => {
    expect(spec('anchor')).toMatchObject({ kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 3, root: { sec: 0.75 } });
  });

  it('a second Anchor in the same tower lengthens every root it applies by 0.25s', () => {
    expect(spec('anchor', 'anchor').root?.sec).toBeCloseTo(1);
  });

  it('each extra Anchor adds 0.25s to the roots of the tower it is in', () => {
    expect(spec('bolt', 'anchor', 'anchor').root?.sec).toBeCloseTo(0.75); // 0.5 + 0.25, not the second copy's own 0.5
    expect(spec('frost', 'anchor', 'anchor').root?.sec).toBeCloseTo(0.75);
  });

  it('tiers lengthen the roots: rare 1s, epic 1.5s; an Epic first plus an extra copy is 1.75s', () => {
    expect(towerSpec([copy('anchor', 'rare')]).root?.sec).toBeCloseTo(1);
    expect(towerSpec([copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1.5);
    expect(towerSpec([copy('anchor', 'epic'), copy('anchor')]).root?.sec).toBeCloseTo(1.75);
  });

  it('a Rare Anchor added roots for 0.75s, an Epic one for 1s', () => {
    expect(towerSpec([copy('bolt'), copy('anchor', 'rare')]).root?.sec).toBeCloseTo(0.75);
    expect(towerSpec([copy('bolt'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1);
  });

  it('Frost and Anchor keep both: the slow and the root', () => {
    const s = spec('frost', 'anchor');
    expect(s.slow?.pct).toBe(0.4);
    expect(s.root?.sec).toBeCloseTo(0.5);
  });

  it("the card's lines show the tier's numbers", () => {
    expect(tierTowerLine(anchor, 'common')).toBe(anchor.asTower);
    expect(tierTowerLine(anchor, 'rare')).toBe('Roots everything within 2.5 cells for 1s, every 3s.');
    expect(tierAddedLine(anchor, 'epic')).toBe('Hits root for 1s (+0.25s per extra Anchor).');
  });

  it('the tower line says what the combination does', () => {
    expect(describeSpec(spec('anchor'))).toMatch(/Roots everything around it for 0.75s/);
    expect(describeSpec(spec('bolt', 'anchor'))).toMatch(/roots them for 0.5s/);
  });
});
