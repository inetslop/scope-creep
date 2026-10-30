import { describe, expect, it } from 'vitest';
import { controlScale, noteControl, tickControl, type ControlState } from '../../src/core/control';

const fresh = (): ControlState => ({ controlCount: 0, controlQuietSec: 0 });

describe('control fatigue (core/control.ts)', () => {
  it('each push or root in the streak halves the next one, and after 1.5s without any it is back to full', () => {
    const s = fresh();
    expect(controlScale(s)).toBe(1);
    noteControl(s);
    expect(controlScale(s)).toBe(0.5);
    noteControl(s);
    expect(controlScale(s)).toBe(0.25);
    tickControl(s, 1.49);
    expect(controlScale(s)).toBe(0.25); // still inside the window
    tickControl(s, 0.02);
    expect(controlScale(s)).toBe(1); // the streak recovered
  });

  it('two pushes of 1 cell in a row queue 1.5 cells, not 2', () => {
    const s = fresh();
    let pushLeft = 0;
    const push = (u: number) => {
      pushLeft += u * controlScale(s);
      noteControl(s);
    };
    push(1);
    push(1);
    expect(pushLeft).toBeCloseTo(1.5);
  });

  it('an enemy rooted nonstop (a 0.5s root every 0.2s) is stopped for far less than half of 10s', () => {
    const s = fresh();
    let rootLeft = 0;
    let rooted = 0;
    let next = 0;
    const dt = 1 / 60;
    for (let t = 0; t < 10; t += dt) {
      if (t >= next) {
        next += 0.2;
        if (rootLeft > 0) {
          // a root while rooted does nothing and does not count
        } else {
          const scaled = 0.5 * controlScale(s);
          if (scaled < 0.05) noteControl(s); // skipped, but the streak still grows
          else {
            rootLeft = scaled;
            noteControl(s);
          }
        }
      }
      if (rootLeft > 0) {
        rooted += dt;
        rootLeft -= dt;
        if (rootLeft <= 0) rootLeft = 0;
      }
      tickControl(s, dt);
    }
    expect(rooted).toBeLessThan(1);
  });

  it('a lone pulse at 1.8s and at 2.6s cadence always lands at full strength', () => {
    for (const period of [1.8, 2.6]) {
      const s = fresh();
      let hits = 0;
      let next = 0;
      const dt = 1 / 60;
      for (let t = 0; t < 20; t += dt) {
        if (t >= next) {
          expect(controlScale(s)).toBe(1);
          noteControl(s);
          next += period;
          hits += 1;
        }
        tickControl(s, dt);
      }
      expect(hits).toBeGreaterThan(0);
    }
  });
});
