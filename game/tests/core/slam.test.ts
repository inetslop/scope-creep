import { describe, expect, it } from 'vitest';
import { PLATEN_SLAM, SLAM, SlamCycle } from '../../src/core/slam';

describe('SlamCycle tuning', () => {
  it('has a 5 s crawl, 0.5 s telegraph, 0.25 s ripple (5.75 s cycle)', () => {
    expect(PLATEN_SLAM).toEqual({ periodSec: 5, telegraphSec: 0.5, rippleSec: 0.25 });
    expect(new SlamCycle().cycleSec).toBe(5.75);
  });

  it('exposes the shove tuning', () => {
    expect(SLAM).toEqual({ radius: 160, playerKnock: 220, enemyKnock: 120, flatten: 0.4 });
  });

  it('is idle with progress 0 until the 5 s crawl ends', () => {
    const cycle = new SlamCycle();
    expect(cycle.phase).toBe('idle');
    expect(cycle.phaseProgress).toBe(0);
    cycle.update(5);
    expect(cycle.phase).toBe('telegraph');
    expect(cycle.phaseProgress).toBe(0);
  });

  it('ramps the telegraph to full over 0.5 s', () => {
    const cycle = new SlamCycle();
    cycle.update(5.25);
    expect(cycle.phase).toBe('telegraph');
    expect(cycle.phaseProgress).toBeCloseTo(0.5);
  });

  it('ripples with progress 0 at the start and 0.5 at 5.625 s', () => {
    const cycle = new SlamCycle();
    expect(cycle.update(5.5)).toBe(true);
    expect(cycle.phase).toBe('ripple');
    expect(cycle.phaseProgress).toBe(0);
    cycle.update(0.125);
    expect(cycle.phase).toBe('ripple');
    expect(cycle.phaseProgress).toBeCloseTo(0.5);
  });

  it('wraps back to idle at the end of the cycle', () => {
    const cycle = new SlamCycle();
    cycle.update(5.75);
    expect(cycle.phase).toBe('idle');
    expect(cycle.phaseProgress).toBe(0);
  });

  it('supports a custom timing', () => {
    const timing = { periodSec: 1, telegraphSec: 1, rippleSec: 2 };
    expect(new SlamCycle(timing).cycleSec).toBe(4);
    const tele = new SlamCycle(timing);
    tele.update(1);
    expect(tele.phase).toBe('telegraph');
    const rip = new SlamCycle(timing);
    rip.update(3);
    expect(rip.phase).toBe('ripple');
    expect(rip.phaseProgress).toBeCloseTo(0.5);
  });
});

describe('SlamCycle firing', () => {
  it('fires exactly once, at t = 5.5 s after reset', () => {
    const cycle = new SlamCycle();
    expect(cycle.update(5.49)).toBe(false);
    expect(cycle.update(0.01)).toBe(true); // crosses 5.5
    expect(cycle.update(0.01)).toBe(false);
  });

  it('does not fire again until the cycle repeats (5.75 s later)', () => {
    const cycle = new SlamCycle();
    let firstAt: number | null = null;
    let t = 0;
    while (firstAt === null) {
      t += 0.25;
      if (cycle.update(0.25)) firstAt = t;
    }
    expect(firstAt).toBeCloseTo(5.5);
    let secondAt = t;
    while (true) {
      secondAt += 0.25;
      if (cycle.update(0.25)) break;
    }
    expect(secondAt).toBeCloseTo(firstAt + 5.75);
  });

  it('never fires on a wrap across the cycle boundary', () => {
    const cycle = new SlamCycle();
    cycle.update(5.7); // mid-ripple
    expect(cycle.update(0.35)).toBe(false); // 5.7 -> 0.3
    expect(cycle.phase).toBe('idle');
  });

  it('reset() restarts the cycle from idle', () => {
    const cycle = new SlamCycle();
    cycle.update(5.6); // first slam already fired
    cycle.update(0.2); // 5.8 wraps to 0.05
    expect(cycle.phase).toBe('idle');
    cycle.reset();
    expect(cycle.phase).toBe('idle');
    expect(cycle.phaseProgress).toBe(0);
    expect(cycle.update(5.5)).toBe(true);
  });
});
