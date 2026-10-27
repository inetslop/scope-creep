import { describe, expect, it } from 'vitest';
import { VIGNETTE, VignetteState } from '../../src/core/vignette';
import { RunState } from '../../src/core/run';

describe('vignette latch', () => {
  it('exposes the hysteresis constants', () => {
    expect(VIGNETTE).toEqual({ onAt: 0.25, offAt: 0.3 });
  });

  it('is off above 30%, whether starting off or coming from an on state', () => {
    const v = new VignetteState();
    v.tick(0.31);
    expect(v.on).toBe(false);

    const fromOn = new VignetteState();
    fromOn.tick(0.2); // latch on first
    fromOn.tick(0.31);
    expect(fromOn.on).toBe(false);
  });

  it('is on at exactly 25%, and still off a hair above it', () => {
    const v = new VignetteState();
    v.tick(0.2500001);
    expect(v.on).toBe(false);
    v.tick(0.25);
    expect(v.on).toBe(true);
  });

  it('latches in both directions between the thresholds', () => {
    const on = new VignetteState();
    on.tick(0.2);
    on.tick(0.27); // in the band: holds on
    expect(on.on).toBe(true);

    const off = new VignetteState();
    off.tick(0.5);
    off.tick(0.27); // in the band: holds off
    expect(off.on).toBe(false);
  });

  it('holds on at exactly 30% and releases a hair above it', () => {
    const v = new VignetteState();
    v.tick(0.2);
    v.tick(0.3); // offAt is inclusive: 30% still holds
    expect(v.on).toBe(true);
    v.tick(0.3000001);
    expect(v.on).toBe(false);
  });

  it('toggles in on -> off -> on order', () => {
    const v = new VignetteState();
    v.tick(0.2);
    expect(v.on).toBe(true);
    v.tick(0.35);
    expect(v.on).toBe(false);
    v.tick(0.2);
    expect(v.on).toBe(true);
  });
});

describe('RunState vignette wiring', () => {
  it('the latch rides on the run and ticks off the real HP fraction', () => {
    const run = new RunState(1);
    expect(run.vignette.on).toBe(false);
    run.vignette.tick(run.hp / run.stats.maxHp); // at full HP: stays off
    expect(run.vignette.on).toBe(false);
  });
});
