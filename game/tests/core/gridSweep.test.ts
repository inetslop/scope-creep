import { describe, expect, it } from 'vitest';
import { GRID_SWEEP, GridSweep, pointToSegmentDistance } from '../../src/core/gridSweep';

describe('GridSweep timing', () => {
  it('has a 4 s rest, 0.5 s telegraph, 1.5 s sweep (6 s cycle)', () => {
    expect(GRID_SWEEP).toEqual({ periodSec: 4, telegraphSec: 0.5, sweepSec: 1.5 });
    const sweep = new GridSweep();
    expect(sweep.cycleSec).toBe(6);
  });

  it('is retracted at rest', () => {
    const sweep = new GridSweep();
    expect(sweep.phase).toBe('rest');
    expect(sweep.sweepProgress).toBe(0);
    sweep.update(3.999);
    expect(sweep.phase).toBe('rest');
    expect(sweep.sweepProgress).toBe(0);
  });

  it('begins telegraphing after the 4 s period', () => {
    const sweep = new GridSweep();
    sweep.update(4);
    expect(sweep.phase).toBe('telegraph');
    expect(sweep.sweepProgress).toBe(0);
  });

  it('sweeps with progress 0 at the start of the sweep', () => {
    const sweep = new GridSweep();
    sweep.update(4.5);
    expect(sweep.phase).toBe('sweep');
    expect(sweep.sweepProgress).toBe(0);
  });

  it('is half swept at 5.25 s', () => {
    const sweep = new GridSweep();
    sweep.update(5.25);
    expect(sweep.phase).toBe('sweep');
    expect(sweep.sweepProgress).toBeCloseTo(0.5);
  });

  it('completes the sweep and restarts the cycle at 6 s', () => {
    const sweep = new GridSweep();
    sweep.update(6);
    expect(sweep.phase).toBe('rest');
    expect(sweep.sweepProgress).toBe(0);
  });

  it('resets to rest', () => {
    const sweep = new GridSweep();
    sweep.update(5.25);
    sweep.reset();
    expect(sweep.phase).toBe('rest');
    expect(sweep.sweepProgress).toBe(0);
  });

  it('supports a custom timing', () => {
    const timing = { periodSec: 1, telegraphSec: 1, sweepSec: 2 };
    expect(new GridSweep(timing).cycleSec).toBe(4);
    const tele = new GridSweep(timing);
    tele.update(1);
    expect(tele.phase).toBe('telegraph');
    const sweep = new GridSweep(timing);
    sweep.update(3);
    expect(sweep.phase).toBe('sweep');
    expect(sweep.sweepProgress).toBeCloseTo(0.5);
  });
});

describe('pointToSegmentDistance', () => {
  it('is 0 on the segment', () => {
    expect(pointToSegmentDistance(0.5, 0, 0, 0, 2, 0)).toBe(0);
    expect(pointToSegmentDistance(1, 1, 0, 0, 2, 2)).toBe(0);
  });

  it('is the perpendicular distance off the segment', () => {
    expect(pointToSegmentDistance(1, 3, 0, 0, 2, 0)).toBe(3);
  });

  it('clamps at the segment ends', () => {
    expect(pointToSegmentDistance(-1, 0, 0, 0, 2, 0)).toBe(1);
    expect(pointToSegmentDistance(3, 4, 0, 0, 2, 0)).toBeCloseTo(Math.sqrt(17));
  });

  it('handles a zero-length segment', () => {
    expect(pointToSegmentDistance(3, 4, 0, 0, 0, 0)).toBe(5);
  });
});
