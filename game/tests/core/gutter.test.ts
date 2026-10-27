import { describe, expect, it } from 'vitest';
import { GUTTER, gutterAt } from '../../src/core/gutter';

describe('gutter', () => {
  it('exposes the schedule constants', () => {
    expect(GUTTER).toEqual({ startSec: 840, periodSec: 20, widthUnits: 40, crossSec: 4, telegraphSec: 1.5, burnPerSec: 4 });
  });

  it('does nothing before the first telegraph (838.5 s)', () => {
    for (const t of [0, 720, 838.49, 838.4999]) {
      expect(gutterAt(t).active).toBe(false);
      expect(gutterAt(t).telegraph).toBe(false);
      expect(gutterAt(t).telegraphAlpha).toBe(0);
    }
  });

  it('telegraphs in the half-open window [entry − 1.5, entry), never with the band', () => {
    expect(gutterAt(838.5).telegraph).toBe(true);
    expect(gutterAt(839.999).telegraph).toBe(true);
    expect(gutterAt(840).telegraph).toBe(false);
    expect(gutterAt(858.5).telegraph).toBe(true);
    expect(gutterAt(860).telegraph).toBe(false);
  });

  it('enters at 840 s, then every 20 s, alternating direction', () => {
    expect(gutterAt(840)).toMatchObject({ active: true, sweep: 0, direction: 1, centerFraction: 0 });
    expect(gutterAt(860)).toMatchObject({ active: true, sweep: 1, direction: -1, centerFraction: 1 });
    expect(gutterAt(880)).toMatchObject({ active: true, sweep: 2, direction: 1, centerFraction: 0 });
    expect(gutterAt(900)).toMatchObject({ active: true, direction: -1, centerFraction: 1 });
  });

  it('crosses the safe width in exactly 4.0 s', () => {
    expect(gutterAt(842).centerFraction).toBe(0.5);
    expect(gutterAt(843.999).active).toBe(true);
    expect(gutterAt(844).active).toBe(false);
    expect(gutterAt(850).active).toBe(false);
  });

  it('pulses the telegraph 0 → 0.6 → 0 on a 1 s period anchored at the window start', () => {
    expect(gutterAt(838.5).telegraphAlpha).toBe(0);
    expect(gutterAt(839).telegraphAlpha).toBeCloseTo(0.6);
    expect(gutterAt(839.5).telegraphAlpha).toBeCloseTo(0);
    expect(gutterAt(839.75).telegraphAlpha).toBeCloseTo(0.3);
  });
});
