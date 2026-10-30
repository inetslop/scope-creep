import { describe, expect, it } from 'vitest';
import { leadPoint } from '../../src/core/aim';

describe('leadPoint', () => {
  it('a stationary target: aim at its spot', () => {
    expect(leadPoint(0, 0, 10, 3, 4, 1, 0, 0)).toEqual({ x: 3, y: 4 });
  });

  it('moving away: ahead of it, at the spot the shot arrives', () => {
    expect(leadPoint(0, 0, 10, 10, 0, 1, 0, 2)).toEqual({ x: 12.5, y: 0 });
  });

  it('moving toward: between them, where the two meet', () => {
    const p = leadPoint(0, 0, 10, 10, 0, -1, 0, 2);
    expect(p.x).toBeCloseTo(8.3333, 3);
    expect(p.y).toBeCloseTo(0, 6);
  });

  it('perpendicular: where the shot line and the target road cross', () => {
    const p = leadPoint(0, 0, 10, 0, 10, 1, 0, 5);
    expect(p.x).toBeCloseTo((5 * 10) / Math.sqrt(75), 6);
    expect(p.y).toBeCloseTo(10, 6);
  });

  it('a target as fast as the shot: never caught, aim at its spot', () => {
    expect(leadPoint(0, 0, 10, 10, 0, 1, 0, 10)).toEqual({ x: 10, y: 0 });
  });

  it('a target faster than the shot: aim at its spot', () => {
    expect(leadPoint(0, 0, 10, 10, 0, 1, 0, 12)).toEqual({ x: 10, y: 0 });
  });

  it('a target on top of the shot: its spot', () => {
    expect(leadPoint(5, 5, 10, 5, 5, 1, 0, 3)).toEqual({ x: 5, y: 5 });
  });
});
