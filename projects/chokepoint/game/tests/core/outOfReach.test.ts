import { describe, expect, it } from 'vitest';
import { outOfReachLeg, type OutOfReachSpec } from '../../src/core/outOfReach';

/** The Colossus's beat: half health triggers, a 0.5 s flash, 2.5 s out, every 8 s. */
const spec: OutOfReachSpec = { hpFrac: 0.5, telegraphSec: 0.5, phaseSec: 2.5, periodSec: 8 };

describe('outOfReachLeg', () => {
  it('is idle before the trigger (clock -1)', () => {
    expect(outOfReachLeg(spec, -1)).toBe('idle');
    expect(outOfReachLeg(spec, -0.001)).toBe('idle');
  });
  it('flashes for the first 0.5 s after the trigger', () => {
    expect(outOfReachLeg(spec, 0)).toBe('flash');
    expect(outOfReachLeg(spec, 0.49)).toBe('flash');
  });
  it('is out from the end of the flash for 2.5 s', () => {
    expect(outOfReachLeg(spec, 0.5)).toBe('out');
    expect(outOfReachLeg(spec, 2.99)).toBe('out');
  });
  it('is idle until the next beat, and the beat repeats every 8 s', () => {
    expect(outOfReachLeg(spec, 3)).toBe('idle');
    expect(outOfReachLeg(spec, 7.99)).toBe('idle');
    expect(outOfReachLeg(spec, 8)).toBe('flash');
    expect(outOfReachLeg(spec, 10.5)).toBe('out');
    expect(outOfReachLeg(spec, 13.01)).toBe('idle');
    expect(outOfReachLeg(spec, 16)).toBe('flash');
    expect(outOfReachLeg(spec, 32.4)).toBe('flash'); // four full periods
  });
});
