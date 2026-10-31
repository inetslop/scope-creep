import { describe, expect, it } from 'vitest';
import { zippySquash } from '../src/content/monsters/zippy.ts';
import { sleeperCushion } from '../src/content/monsters/sleeper.ts';

describe('squash: the eased 0.8-1.2 crouch', () => {
  it('keeps the Zippy and the Sleeper within 20% of their size', () => {
    for (const phase of [0, 1, 2, 3]) {
      for (let t = 0; t <= 2; t += 0.01) {
        const k = zippySquash(phase, t);
        expect(1 + 0.2 * k).toBeLessThanOrEqual(1.2);
        expect(1 - 0.2 * k).toBeGreaterThanOrEqual(0.8);
      }
    }
    for (const state of [0, 1, 2]) {
      for (let t = 0; t <= 2; t += 0.01) {
        const [sx, sy] = sleeperCushion(state, t);
        expect(sx).toBeGreaterThanOrEqual(0.8);
        expect(sx).toBeLessThanOrEqual(1.2);
        expect(sy).toBeGreaterThanOrEqual(0.8);
        expect(sy).toBeLessThanOrEqual(1.2);
      }
    }
  });
  it('eases the wind-up in and the dash back over 0.15 s, never in one frame', () => {
    expect(zippySquash(1, 0)).toBe(0);
    expect(zippySquash(1, 0.02)).toBeGreaterThan(0);
    expect(zippySquash(1, 0.15)).toBeCloseTo(1);
    expect(zippySquash(2, 0)).toBeCloseTo(1); // starts out of the wind-up's crouch
    expect(zippySquash(2, 0.15)).toBeCloseTo(0); // springs back
  });
  it('is continuous across the phases 2 -> 3 -> 0', () => {
    expect(zippySquash(2, 2)).toBeCloseTo(0); // the dash ends at rest
    expect(zippySquash(3, 0)).toBeCloseTo(0); // the tired phase starts at rest
    expect(zippySquash(3, 2)).toBeCloseTo(0.5); // the tired phase settles at half
    expect(zippySquash(0, 0)).toBeCloseTo(0.5); // the crawl starts at that half
  });
  it('eases the sleeper cushion per state', () => {
    const flat: [number, number] = [1.15, 0.85];
    const up: [number, number] = [1.05, 0.95];
    const near = (got: [number, number], want: [number, number]): void => {
      expect(got[0]).toBeCloseTo(want[0]);
      expect(got[1]).toBeCloseTo(want[1]);
    };
    near(sleeperCushion(0, 5), flat); // asleep: settled on the flat cushion
    near(sleeperCushion(1, 0), flat); // waking: out of the flat cushion
    near(sleeperCushion(1, 0.15), up); // and up once the eyes are open
    near(sleeperCushion(0, 0), up); // sleep: out of the awake cushion
  });
});
