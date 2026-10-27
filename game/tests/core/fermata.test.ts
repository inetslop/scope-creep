import { describe, expect, it } from 'vitest';
import { FERMATA_SEC, Fermata } from '../../src/core/fermata';

describe('Fermata timing', () => {
  it('holds for exactly 0.6 s', () => {
    expect(FERMATA_SEC).toBe(0.6);
  });

  it('is inactive until armed, full window once armed', () => {
    const f = new Fermata();
    expect(f.active).toBe(false);
    expect(f.leftSec).toBe(0);
    f.arm();
    expect(f.active).toBe(true);
    expect(f.leftSec).toBeCloseTo(0.6);
  });

  it('expires exactly when the window runs out', () => {
    const f = new Fermata();
    f.arm();
    expect(f.update(0.3)).toBe(false);
    expect(f.update(0.2)).toBe(false);
    expect(f.update(0.1)).toBe(true); // 0.3 + 0.2 + 0.1 = 0.6
    expect(f.active).toBe(false);
    expect(f.leftSec).toBe(0);
  });

  it('expires on a single update of the full window', () => {
    const f = new Fermata();
    f.arm();
    expect(f.update(FERMATA_SEC)).toBe(true);
    expect(f.active).toBe(false);
  });

  it('an oversized dt expires and never wraps negative', () => {
    const f = new Fermata();
    f.arm();
    expect(f.update(5)).toBe(true);
    expect(f.active).toBe(false);
    expect(f.leftSec).toBe(0);
  });
});

describe('Fermata retrigger', () => {
  it('a second pick gives a FRESH full window, not the remainder', () => {
    const f = new Fermata();
    f.arm();
    f.update(0.3); // 0.3 s consumed
    expect(f.leftSec).toBeCloseTo(0.3);
    f.arm();
    expect(f.leftSec).toBeCloseTo(0.6); // fresh, not 0.9
  });

  it('a retriggers hold runs 0.6 s from the later pick, never stacked', () => {
    const f = new Fermata();
    f.arm();
    f.update(0.3);
    f.arm();
    expect(f.update(0.3)).toBe(false);
    expect(f.update(0.3)).toBe(true); // 0.6 after the retrigger, not 0.9
    expect(f.update(0.1)).toBe(false); // definitely over
  });

  it('a retrigger right before expiry still gets the full window', () => {
    const f = new Fermata();
    f.arm();
    f.update(0.59);
    expect(f.leftSec).toBeGreaterThan(0);
    f.arm();
    expect(f.update(0.6)).toBe(true);
  });
});

describe('Fermata no-op', () => {
  it('update while inactive is a no-op', () => {
    const f = new Fermata();
    expect(f.update(1)).toBe(false);
    expect(f.active).toBe(false);
    expect(f.leftSec).toBe(0);
  });

  it('update after expiry stays inactive', () => {
    const f = new Fermata();
    f.arm();
    f.update(0.6);
    expect(f.update(0.1)).toBe(false);
    expect(f.leftSec).toBe(0);
  });
});
