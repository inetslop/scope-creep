import { describe, expect, it } from 'vitest';
import { DECOY_COOLDOWN_SEC, DECOY_LIFE_SEC, Understudy } from '../../src/core/understudy';

describe('Understudy', () => {
  it('is ready at the start of a run', () => {
    const u = new Understudy();
    expect(u.ready).toBe(true);
    expect(u.active).toBe(false);
    expect(u.cooldownFrac).toBe(1);
  });

  it('is not ready for 8 s after a drop, then ready again', () => {
    const u = new Understudy();
    expect(u.drop()).toBe(true);
    expect(u.ready).toBe(false);
    expect(u.active).toBe(true);
    for (let i = 0; i < 79; i++) u.update(0.1); // 7.9 s
    expect(u.ready).toBe(false);
    expect(u.drop()).toBe(false);
    u.update(0.2); // 8.1 s total
    expect(u.ready).toBe(true);
    expect(u.drop()).toBe(true);
  });

  it('pops after 3 s of updates', () => {
    const u = new Understudy();
    expect(u.drop()).toBe(true);
    for (let i = 0; i < 29; i++) expect(u.update(0.1)).toBe(false);
    expect(u.update(0.1)).toBe(true);
    expect(u.active).toBe(false);
  });

  it('exposes the tuning constants', () => {
    expect(DECOY_LIFE_SEC).toBe(3);
    expect(DECOY_COOLDOWN_SEC).toBe(8);
  });
});
