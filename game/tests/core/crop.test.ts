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

  it('shrinks linearly between 12:00 and 17:00', () => {
    const mid = cropSafeFraction(870);
    expect(mid).toBeGreaterThan(0.7);
    expect(mid).toBeLessThan(1);
    expect(mid).toBeCloseTo(0.85);
  });

  it('holds at 0.7 from 17:00 onward', () => {
    expect(cropSafeFraction(1020)).toBe(0.7);
    expect(cropSafeFraction(1200)).toBe(0.7);
  });
});
