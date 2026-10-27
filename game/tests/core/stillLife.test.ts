import { describe, expect, it } from 'vitest';
import { BUBBLE_COOLDOWN_SEC, BUBBLE_LIFE_SEC, BUBBLE_RADIUS, SLOW_FACTOR, StillLife } from '../../src/core/stillLife';

describe('StillLife', () => {
  it('is ready at the start of a run', () => {
    const s = new StillLife();
    expect(s.ready).toBe(true);
    expect(s.active).toBe(false);
    expect(s.cooldownFrac).toBe(1);
  });

  it('is not re-triggerable at 11.9 s, ready at 12.1 s', () => {
    const s = new StillLife();
    expect(s.trigger()).toBe(true);
    expect(s.ready).toBe(false);
    expect(s.active).toBe(true);
    for (let i = 0; i < 119; i++) s.update(0.1); // 11.9 s
    expect(s.ready).toBe(false);
    expect(s.trigger()).toBe(false);
    s.update(0.2); // 12.1 s total (never exactly 12.0, to dodge 1e-15 rounding)
    expect(s.ready).toBe(true);
    expect(s.trigger()).toBe(true);
  });

  it('ends after 5 s of updates, and the cooldown outlives the bubble', () => {
    const s = new StillLife();
    expect(s.trigger()).toBe(true);
    for (let i = 0; i < 49; i++) expect(s.update(0.1)).toBe(false);
    expect(s.update(0.11)).toBe(true); // 5.01 s total (never exactly 5.0, to dodge 1e-15 rounding)
    expect(s.active).toBe(false);
    expect(s.ready).toBe(false);
  });

  it('exposes the tuning constants', () => {
    expect(BUBBLE_LIFE_SEC).toBe(5);
    expect(BUBBLE_COOLDOWN_SEC).toBe(12);
    expect(BUBBLE_RADIUS).toBe(160);
    expect(SLOW_FACTOR).toBe(0.5);
  });
});
