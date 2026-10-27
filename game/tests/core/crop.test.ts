import { describe, expect, it } from 'vitest';
import { CROP, cropSafeFraction } from '../../src/core/crop';

describe('crop', () => {
  it('exposes the schedule constants', () => {
    expect(CROP).toEqual({ startSec: 720, endSec: 1020, endFraction: 0.7, burnPerSec: 5 });
  });

  it('keeps the whole arena safe before 12:00', () => {
    expect(cropSafeFraction(0)).toBe(1);
    expect(cropSafeFraction(719)).toBe(1);
  });

  it('is still 1.0 at 12:00 — the shrink has just begun', () => {
    expect(cropSafeFraction(720)).toBe(1);
  });

  it('reaches 0.85 at the 14:30 midpoint', () => {
    expect(cropSafeFraction(870)).toBeCloseTo(0.85);
  });

  it('never increases between 12:00 and 17:00', () => {
    const a = cropSafeFraction(720);
    const b = cropSafeFraction(810);
    const c = cropSafeFraction(900);
    const d = cropSafeFraction(1020);
    expect(a).toBeGreaterThanOrEqual(b);
    expect(b).toBeGreaterThanOrEqual(c);
    expect(c).toBeGreaterThanOrEqual(d);
  });

  it('clamps at 0.7 from 17:00 onward', () => {
    expect(cropSafeFraction(1020)).toBe(0.7);
    expect(cropSafeFraction(1021)).toBe(0.7);
    expect(cropSafeFraction(3600)).toBe(0.7);
  });
});
