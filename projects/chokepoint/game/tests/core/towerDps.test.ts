import { describe, expect, it } from 'vitest';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { towerSpec } from '../../src/core/augments';
import { towerDps } from '../../src/core/towerDps';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('towerDps', () => {
  it('an empty tower deals no damage', () => {
    expect(towerDps(spec())).toBe(0);
  });

  it('a tower deals its damage times its rate per second', () => {
    expect(towerDps(spec('bolt'))).toBeCloseTo(19.2);
    expect(towerDps(spec('rapid'))).toBeCloseTo(20);
    expect(towerDps(spec('reach'))).toBeCloseTo(18.9);
    expect(towerDps(spec('splash'))).toBeCloseTo(15);
    expect(towerDps(spec('lance'))).toBeCloseTo(13.32);
  });

  it('an added augment changes the damage per second', () => {
    expect(towerDps(spec('bolt', 'rapid'))).toBeCloseTo(21.6);
    expect(towerDps(spec('bolt', 'rapid', 'frost'))).toBeCloseTo(21.6);
    expect(towerDps(spec('bolt', 'frost'))).toBeCloseTo(19.2); // slows only: the same hits
    expect(towerDps(spec('bolt', 'bolt'))).toBeCloseTo(19.2); // a second Bolt: more shots, the same per second
  });

  it('the burn counts at its rate, on top of the hits that set it', () => {
    expect(towerDps(spec('ember'))).toBeCloseTo(3);
    expect(towerDps(spec('bolt', 'ember'))).toBeCloseTo(19.2 + 3);
  });

  it('a support tower adds nothing', () => {
    expect(towerDps(spec('frost'))).toBe(0);
    expect(towerDps(spec('mark'))).toBe(0);
    expect(towerDps(spec('push'))).toBe(0);
    expect(towerDps(spec('anchor'))).toBe(0);
    expect(towerDps(spec('mint'))).toBe(0);
    expect(towerDps(spec('rally'))).toBe(0);
    expect(towerDps(spec('frost', 'anchor', 'rally'))).toBe(0); // only support augments: nothing to deal damage
  });

  it('a lone beam deals its per-second rate (the panel used to show 0 for it)', () => {
    expect(towerDps(spec('beam'))).toBe(14);
    expect(towerDps(towerSpec([copy('beam', 'rare')]))).toBe(20);
  });

  it('each Bolt adds a ray at the beam\'s own rate', () => {
    expect(towerDps(spec('beam', 'bolt'))).toBe(28);
    expect(towerDps(towerSpec([copy('beam', 'rare'), copy('bolt')]))).toBe(40);
  });

  it('a Rapid added scales every ray by its net factor, 1.5 x 0.75', () => {
    expect(towerDps(towerSpec([copy('beam', 'rare'), copy('bolt'), copy('rapid')]))).toBeCloseTo(45);
  });

  it('the Rally\'s speed scales the beam like every other attack', () => {
    expect(towerDps(spec('beam'), 1.1)).toBeCloseTo(15.4);
    expect(towerDps(towerSpec([copy('beam', 'rare'), copy('bolt'), copy('rapid')]), 1.1)).toBeCloseTo(49.5);
  });

  it('a Beam added is a line at its own rate, scaled by the same factor', () => {
    expect(towerDps(spec('beam', 'beam'))).toBe(17);
    expect(towerDps(spec('beam', 'beam', 'rapid'))).toBeCloseTo(19.125);
  });
});
