import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/core/rng';
import { SWATCH_CASCADE, SwatchCascade } from '../../src/core/swatchCascade';

const ARENA = 3200;

describe('SwatchCascade timing', () => {
  it('has the spec constants: 5 swatches, 1 s first detach, 1.2 s between, 6 s fall, 120 gap, 60 margin', () => {
    expect(SWATCH_CASCADE).toEqual({ count: 5, firstDetachSec: 1, detachDelaySec: 1.2, fallSec: 6, minGap: 120, edgeMargin: 60 });
  });

  it('is idle until 1.0 s, then falling with swatch 0 at the top edge', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    expect(c.phase).toBe('idle');
    c.update(0.999);
    expect(c.phase).toBe('idle');
    c.update(0.001);
    expect(c.phase).toBe('falling');
    expect(c.activeIndex).toBe(0);
    expect(c.activeY).toBeCloseTo(-ARENA / 2);
  });

  it('still falling just before 6 s, sunk exactly at 6.000 s', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    c.update(1);
    expect(c.phase).toBe('falling');
    c.update(5.999);
    expect(c.phase).toBe('falling');
    expect(c.activeY).toBeGreaterThan(ARENA / 2 - 1);
    c.update(0.001);
    expect(c.phase).toBe('waiting');
    expect(c.resolvedCount).toBe(1);
  });

  it('detaches the next swatch 1.2 s after destroyActive', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    c.update(1);
    expect(c.phase).toBe('falling');
    c.destroyActive();
    expect(c.phase).toBe('waiting');
    expect(c.resolvedCount).toBe(1);
    c.update(1.199);
    expect(c.phase).toBe('waiting');
    // 0.002 s nudge: 1 + 1.199 + 0.001 can round just below 1 + 1.2 in float.
    c.update(0.002);
    expect(c.phase).toBe('falling');
    expect(c.activeIndex).toBe(1);
  });

  it('resolves all five swatches in dock order, then done', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    const order: number[] = [];
    let guard = 0;
    while (c.phase !== 'done' && guard++ < 1000) {
      c.update(0.25);
      if (c.phase === 'falling') {
        order.push(c.activeIndex);
        c.destroyActive();
      }
    }
    expect(order).toEqual([0, 1, 2, 3, 4]);
    expect(c.phase).toBe('done');
    expect(c.resolvedCount).toBe(5);
  });

  it('keeps every X inside the margin, at least 120 from the previous one', () => {
    const xs: number[] = [];
    for (const seed of [1, 7, 42]) {
      const c = new SwatchCascade(ARENA, new Rng(seed));
      const run: number[] = [];
      let guard = 0;
      while (c.phase !== 'done' && guard++ < 1000) {
        c.update(0.25);
        if (c.phase === 'falling') {
          run.push(c.activeX);
          c.destroyActive();
        }
      }
      expect(run).toHaveLength(5);
      for (const x of run) {
        expect(x).toBeGreaterThanOrEqual(-ARENA / 2 + 60);
        expect(x).toBeLessThanOrEqual(ARENA / 2 - 60);
      }
      for (let i = 1; i < run.length; i++) expect(Math.abs(run[i]! - run[i - 1]!)).toBeGreaterThanOrEqual(120);
      xs.push(...run);
    }
    expect(xs).toHaveLength(15);
  });

  it('is deterministic: the same seed gives the same X sequence', () => {
    const seq = (): number[] => {
      const c = new SwatchCascade(ARENA, new Rng(42));
      const out: number[] = [];
      let guard = 0;
      while (c.phase !== 'done' && guard++ < 1000) {
        c.update(0.25);
        if (c.phase === 'falling') {
          out.push(c.activeX);
          c.destroyActive();
        }
      }
      return out;
    };
    expect(seq()).toEqual(seq());
  });

  it('destroyActive is a no-op when idle', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    c.destroyActive();
    expect(c.phase).toBe('idle');
    expect(c.resolvedCount).toBe(0);
  });

  it('reset puts it back to the idle state at t = 0', () => {
    const c = new SwatchCascade(ARENA, new Rng(1));
    c.update(2);
    expect(c.phase).toBe('falling');
    c.destroyActive();
    c.reset();
    expect(c.phase).toBe('idle');
    expect(c.resolvedCount).toBe(0);
    c.update(0.999);
    expect(c.phase).toBe('idle');
    c.update(0.001);
    expect(c.phase).toBe('falling');
    expect(c.activeIndex).toBe(0);
  });

  it('supports a custom timing', () => {
    const timing = { count: 3, firstDetachSec: 0.5, detachDelaySec: 0.3, fallSec: 1, minGap: 50, edgeMargin: 10 };
    const c = new SwatchCascade(200, new Rng(1), timing);
    c.update(0.4);
    expect(c.phase).toBe('idle');
    c.update(0.1); // t = 0.5: first detach
    expect(c.phase).toBe('falling');
    c.update(0.899); // 0.899 s into the 1 s fall: still falling, near the bottom
    expect(c.phase).toBe('falling');
    expect(c.activeY).toBeGreaterThan(79);
    c.update(0.101); // exactly 1.0 s into the fall: sunk
    expect(c.phase).toBe('waiting');
    expect(c.resolvedCount).toBe(1);
    c.update(0.3); // 0.3 s after the resolve: second detach
    expect(c.phase).toBe('falling');
    expect(c.activeIndex).toBe(1);
  });
});
