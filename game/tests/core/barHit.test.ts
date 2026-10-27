import { describe, expect, it } from 'vitest';
import { barContains } from '../../src/core/barHit';

/** 120x16 bar: halfLength 60, halfThickness 8, centered at the origin. */
const HL = 60;
const HT = 8;

describe('barContains', () => {
  it('axis-aligned bar contains points on the axis, inside the caps and within the thickness', () => {
    expect(barContains(0, 0, 0, HL, HT, 60, 0)).toBe(true); // on the axis, at the end
    expect(barContains(0, 0, 0, HL, HT, 65, 0)).toBe(true); // inside the end cap (capsule extends to 68)
    expect(barContains(0, 0, 0, HL, HT, 30, 5)).toBe(true); // within the thickness
  });

  it('axis-aligned bar excludes points beyond the cap and beyond the thickness', () => {
    expect(barContains(0, 0, 0, HL, HT, 70, 0)).toBe(false); // beyond the cap (68)
    expect(barContains(0, 0, 0, HL, HT, 0, 12)).toBe(false); // beyond the thickness (8)
  });

  it('rotated 90 degrees: the bar runs along the Y axis', () => {
    expect(barContains(0, 0, Math.PI / 2, HL, HT, 0, 60)).toBe(true);
    expect(barContains(0, 0, Math.PI / 2, HL, HT, 12, 0)).toBe(false);
  });

  it('the boundary is inclusive: the cap rim and the edge of the thickness are inside', () => {
    expect(barContains(0, 0, 0, HL, HT, 68, 0)).toBe(true); // exactly at the cap rim
    expect(barContains(0, 0, 0, HL, HT, 0, 8)).toBe(true); // exactly at the thickness edge
  });

  it('a point 50 units along the axis is inside at any rotation', () => {
    for (const a of [Math.PI / 4, Math.PI, -Math.PI / 3]) {
      expect(barContains(0, 0, a, HL, HT, Math.cos(a) * 50, Math.sin(a) * 50), `angle ${a}`).toBe(true);
    }
  });
});
