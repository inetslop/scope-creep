import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { getAugment } from '../../src/content/augments';
import { lead } from '../../src/content/augments/lead';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { towerSpec } from '../../src/core/augments';
import { LEAD_HIT_RADIUS, leadAim, leadCells } from '../../src/core/lead';
import { tierAddedLine, tierFirst, tierTowerLine } from '../../src/core/tiers';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));
/** An enemy walking along +x, in cells from the tower at the origin. */
const enemy = (xCells: number, yCells: number, speedCells = 2, slowPct = 0) => ({
  x: xCells * CELL,
  y: yCells * CELL,
  dirX: 1,
  dirY: 0,
  speed: speedCells * CELL,
  slowPct,
});

describe('the lead', () => {
  it('a still enemy is not led, and neither is a shot that does not fly', () => {
    expect(leadCells(4, 0, 8, 1.2)).toBe(0);
    expect(leadCells(4, 2, 0, 1.2)).toBe(0);
  });

  it('leads by the shot travel time times the enemy speed', () => {
    expect(leadCells(4, 2, 8, 1.2)).toBeCloseTo(1.0);
    expect(leadCells(2, 2, 8, 1.2)).toBeCloseTo(0.5);
  });

  it('never leads further than the cap', () => {
    expect(leadCells(8, 2, 8, 1.2)).toBeCloseTo(1.2);
    expect(leadCells(2, 10, 8, 1.2)).toBeCloseTo(1.2);
  });

  it('aims at the enemy itself when it stands still', () => {
    const e = enemy(2, 3, 0);
    expect(leadAim(0, 0, e, 8 * CELL, 1.2)).toEqual({ x: e.x, y: e.y });
  });

  it('aims ahead of a walking enemy: travel time times speed along its walk', () => {
    // 4 cells away at 2 cells/s, shot at 8 cells/s: lead = 1 cell, along the walk.
    const e = enemy(4, 0, 2);
    const aim = leadAim(0, 0, e, 8 * CELL, 1.2);
    expect(aim.x - e.x).toBeCloseTo(CELL);
    expect(aim.y - e.y).toBeCloseTo(0);
  });

  it('a slowed enemy is led less; a fast one is led up to the cap', () => {
    const slowed = enemy(4, 0, 2, 0.5);
    expect(leadAim(0, 0, slowed, 8 * CELL, 1.2).x - slowed.x).toBeCloseTo(CELL / 2);
    const fast = enemy(4, 0, 10);
    expect(leadAim(0, 0, fast, 8 * CELL, 1.2).x - fast.x).toBeCloseTo(1.2 * CELL);
  });

  it('the tower lead cap: 1.2 for the first Lead, +0.6 per extra, in any slot', () => {
    expect(spec('lead')).toMatchObject({ lead: 1.2, leadCount: 1 });
    expect(spec('bolt', 'lead')).toMatchObject({ lead: 1.2, leadCount: 1 });
    expect(spec('lead', 'lead')).toMatchObject({ leadCount: 2 });
    expect(spec('lead', 'lead').lead).toBeCloseTo(1.8);
    expect(spec('lead', 'lead', 'lead')).toMatchObject({ leadCount: 3 });
    expect(spec('lead', 'lead', 'lead').lead).toBeCloseTo(2.4);
    // An added Lead on a non-aimed attack sets the spec but never aims a pulse.
    expect(spec('splash', 'lead')).toMatchObject({ kind: 'pulse', lead: 1.2, leadCount: 1 });
    expect(spec('bolt')).toMatchObject({ lead: 0, leadCount: 0 });
  });

  it('a Lead first tower is a slow heavy shot with a 1.2 lead cap', () => {
    const s = spec('lead');
    expect(s).toMatchObject({ attacks: true, kind: 'shot', firstId: 'lead', damage: 16, range: 4.5, projectileSpeed: 8, shots: 1 });
    expect(s.rate).toBeCloseTo(1 / 1.2);
  });

  it('the tiers raise the damage and quicken the shot; range, speed and lead stay', () => {
    const rows: [Tier, number, number][] = [
      ['common', 16, 1 / 1.2],
      ['rare', 20, 1 / 1.05],
      ['epic', 24, 1 / 0.9],
    ];
    for (const [tier, damage, rate] of rows) {
      const f = tierFirst(lead, tier);
      expect(f.damage).toBeCloseTo(damage);
      expect(f.rate).toBeCloseTo(rate);
      expect(f.range).toBeCloseTo(4.5);
      expect(f.projectileSpeed).toBe(8);
      expect(f.lead).toBe(1.2);
    }
  });

  it('the card lines: each tier shows its own damage, the added line is the same at every tier', () => {
    expect(tierTowerLine(lead, 'common')).toBe('Aims where the enemy will be: heavy shot.');
    expect(tierTowerLine(lead, 'rare')).toBe('Aims where the enemy will be: 20-damage heavy shot.');
    expect(tierTowerLine(lead, 'epic')).toBe('Aims where the enemy will be: 24-damage heavy shot.');
    for (const tier of ['common', 'rare', 'epic'] as Tier[]) expect(tierAddedLine(lead, tier)).toBe('Shots lead +0.6 cells per extra Lead.');
  });

  it('is green and chevron-shaped, like the Sprinter it chases', () => {
    expect(getAugment('lead').look).toMatchObject({ shape: 'chevron', color: 'green' });
    expect(LEAD_HIT_RADIUS).toBeGreaterThan(0);
    expect(LEAD_HIT_RADIUS).toBeLessThan(1.2);
  });
});
