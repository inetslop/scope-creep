import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, towerSpec } from '../../src/core/augments';
import { BEAM_PIERCE_HALF_WIDTH, beamPierceVictims, beamScorch } from '../../src/core/beamShapes';
import type { TargetCandidate } from '../../src/core/targeting';

const e = (x: number, y: number, distance: number, active = true): TargetCandidate => ({ x, y, distance, active });
const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const R = 4.5 * CELL; // the beam's range: the tower sits at (0, 0)

describe('beamPierceVictims (Lance in a beam-first tower)', () => {
  // The main target at (200, 0); the victims sit behind it in the corridor, all in range.
  const main = e(200, 0, 10);
  const a = e(230, 0, 30);
  const b = e(260, 0, 40);
  const c = e(285, 0, 50);

  it('returns up to count enemies past the main target, nearest to the tower first', () => {
    expect(beamPierceVictims([main, a, b, c], 0, 0, R, main, 1)).toEqual([1]);
    expect(beamPierceVictims([main, a, b, c], 0, 0, R, main, 2)).toEqual([1, 2]);
    expect(beamPierceVictims([main, a, b, c], 0, 0, R, main, 3)).toEqual([1, 2, 3]);
    expect(beamPierceVictims([main, a, b, c], 0, 0, R, main, 5)).toEqual([1, 2, 3]); // more than are there
  });

  it('sorts by distance along the line, not by the array order', () => {
    expect(beamPierceVictims([main, c, a, b], 0, 0, R, main, 2)).toEqual([2, 3]);
  });

  it('excludes enemies not past the main target', () => {
    const behind = e(150, 0, 5);
    expect(beamPierceVictims([main, behind], 0, 0, R, main, 3)).toEqual([]);
  });

  it('excludes enemies outside the corridor (a bit wider than half the road)', () => {
    expect(beamPierceVictims([main, e(230, 30, 30)], 0, 0, R, main, 3)).toEqual([]);
    expect(beamPierceVictims([main, e(230, BEAM_PIERCE_HALF_WIDTH - 0.2, 30)], 0, 0, R, main, 3)).toEqual([1]);
  });

  it('excludes enemies out of the tower range, and inactive ones', () => {
    expect(beamPierceVictims([main, e(300, 0, 30), e(400, 0, 40), e(500, 0, 50)], 0, 0, R, main, 3)).toEqual([]);
    expect(beamPierceVictims([main, a, e(260, 0, 40, false)], 0, 0, R, main, 3)).toEqual([1]);
  });

  it('never returns the main target, and is empty without a line', () => {
    expect(beamPierceVictims([main, a], 0, 0, R, main, 0)).toEqual([]);
    expect(beamPierceVictims([main, a], 0, 0, R, main, -1)).toEqual([]);
    expect(beamPierceVictims([e(0.5, 0, 1), a], 0, 0, R, e(0.5, 0, 1), 3)).toEqual([]); // the target sits on the tower
  });
});

describe('beamScorch (Splash in a beam-first tower)', () => {
  it('is undefined for a non-beam tower and a beam without Splash', () => {
    expect(beamScorch(towerSpec([copy('bolt')]))).toBeUndefined();
    expect(beamScorch(towerSpec([copy('beam')]))).toBeUndefined();
  });

  it('is half the beam rate on the nearest SPLASH_CAP - 1 others, within the splash radius', () => {
    expect(beamScorch(towerSpec([copy('beam'), copy('splash')]))).toEqual({ rate: 3, cap: 2, radius: CELL });
    expect(beamScorch(towerSpec([copy('beam'), copy('splash'), copy('splash')]))).toEqual({ rate: 3, cap: 5, radius: 2 * CELL }); // splashes accumulate cells
  });

  it('the radius follows the Splash tier, the rate the Beam tier', () => {
    expect(beamScorch(towerSpec([copy('beam'), copy('splash', 'rare')]))!.radius).toBeCloseTo(1.5 * CELL);
    expect(beamScorch(towerSpec([copy('beam'), copy('splash', 'epic')]))!.radius).toBeCloseTo(2 * CELL);
    expect(beamScorch(towerSpec([copy('beam', 'rare'), copy('splash')]))!.rate).toBe(4);
    expect(beamScorch(towerSpec([copy('beam', 'epic'), copy('splash')]))!.rate).toBe(5);
  });
});

describe('the shapes compose with tiers and the panel line', () => {
  it('Lance pierces 1, 2, 3 by tier on a beam tower', () => {
    for (const [tier, pierce] of [['common', 1], ['rare', 2], ['epic', 3]] as const) {
      expect(towerSpec([copy('beam'), copy('lance', tier)]).pierce).toBe(pierce);
    }
  });

  it('Splash reaches 1, 1.5, 2 cells by tier on a beam tower', () => {
    for (const [tier, splash] of [['common', 1], ['rare', 1.5], ['epic', 2]] as const) {
      expect(towerSpec([copy('beam'), copy('splash', tier)]).splash).toBe(splash);
    }
  });

  it('the beam keeps its tier rate under its shapes', () => {
    for (const [tier, dps] of [['common', 6], ['rare', 8], ['epic', 10]] as const) {
      expect(towerSpec([copy('beam', tier), copy('lance'), copy('splash')]).beamDps).toBe(dps);
    }
  });

  it('the panel line gains one clause per shape', () => {
    expect(describeSpec(towerSpec([copy('beam'), copy('lance')]))).toBe('Beams the furthest enemy: 6 per second, the beam pierces 1 more.');
    expect(describeSpec(towerSpec([copy('beam'), copy('lance', 'epic')]))).toContain('pierces 3 more');
    expect(describeSpec(towerSpec([copy('beam'), copy('splash')]))).toContain('and scorches 2 nearby at 3 per second');
    expect(describeSpec(towerSpec([copy('beam', 'epic'), copy('splash', 'epic')]))).toContain('and scorches 2 nearby at 5 per second');
    expect(describeSpec(towerSpec([copy('beam'), copy('splash'), copy('splash')]))).toContain('scorches 5 nearby');
    expect(describeSpec(towerSpec([copy('beam'), copy('lance'), copy('splash')]))).toBe(
      'Beams the furthest enemy: 6 per second, the beam pierces 1 more, and scorches 2 nearby at 3 per second.',
    );
  });
});
