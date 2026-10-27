import { describe, expect, it } from 'vitest';
import { PRESS_WALL, PressWall } from '../../src/core/pressWall';

describe('PressWall timing', () => {
  it('has the spec constants: 1/150 advance, 5 s stamps with 1 s telegraph and 1/20 jump, rows at 3 s then 9 s, 1/16 retract over 0.6 s', () => {
    expect(PRESS_WALL).toEqual({
      advancePerSec: 1 / 150,
      stampPeriodSec: 5,
      stampTelegraphSec: 1,
      stampJump: 1 / 20,
      firstRowSec: 3,
      rowPeriodSec: 9,
      retractAmount: 1 / 16,
      retractSec: 0.6,
    });
  });

  it('advances at 1/150 of the safe height per second (4 s -> 4/150)', () => {
    const w = new PressWall();
    w.update(4);
    expect(w.progress).toBeCloseTo(4 / 150);
  });

  it('telegraphs in [stamp - 1, stamp): at 4.5, not at 3.99, not at 5.0', () => {
    const before = new PressWall();
    before.update(3.99);
    expect(before.stampTelegraph).toBe(false);
    const mid = new PressWall();
    mid.update(4.5);
    expect(mid.stampTelegraph).toBe(true);
    const at = new PressWall();
    at.update(5.0);
    expect(at.stampTelegraph).toBe(false);
  });

  it('telegraph alpha is the 0 -> 0.6 -> 0 triangle, 0 outside the window', () => {
    const w = new PressWall();
    w.update(3.99);
    expect(w.stampTelegraphAlpha).toBe(0);
    w.update(0.26); // t = 4.25: quarter into the 1 s window
    expect(w.stampTelegraphAlpha).toBeCloseTo(0.3);
    w.update(0.25); // t = 4.5: peak
    expect(w.stampTelegraphAlpha).toBeCloseTo(0.6);
    w.update(0.5); // t = 5.0: the stamp has fired, window closed
    expect(w.stampTelegraphAlpha).toBe(0);
  });

  it('stamps 0 -> 1 at exactly 5.0, and progress(5.0) = 5/150 + 1/20', () => {
    const before = new PressWall();
    before.update(4.999);
    expect(before.stamps).toBe(0);
    const at = new PressWall();
    at.update(5.0);
    expect(at.stamps).toBe(1);
    expect(at.progress).toBeCloseTo(5 / 150 + 1 / 20);
  });

  it('unopposed crossing: progress < 1 at 59.9 s, 1 (clamped) at 60.0 s', () => {
    const w = new PressWall();
    w.update(59.9);
    expect(w.progress).toBeLessThan(1);
    const done = new PressWall();
    done.update(60.0);
    expect(done.progress).toBeCloseTo(1, 10);
  });

  it('prints rows at 3, 12 and 21 s: 0 before 3, 1 at 3, 2 at 12, 3 at 21', () => {
    const rowsAt = (t: number): number => {
      const w = new PressWall();
      w.update(t);
      return w.rows;
    };
    expect(rowsAt(2.999)).toBe(0);
    expect(rowsAt(3.0)).toBe(1);
    expect(rowsAt(12.0)).toBe(2);
    expect(rowsAt(21.0)).toBe(3);
  });

  it('clearing a row retracts 1/16 over 0.6 s (clear at 12 s of 0.18 -> 0.18 - 1/16 at 12.6 s)', () => {
    const w = new PressWall();
    w.update(12);
    expect(w.progress).toBeCloseTo(0.18);
    w.clearRow();
    w.update(0.3); // halfway: partway back up
    expect(w.progress).toBeGreaterThan(0.18 - 1 / 16);
    expect(w.progress).toBeLessThan(0.18);
    w.update(0.3); // t = 12.6: retract done
    expect(w.progress).toBeCloseTo(0.18 - 1 / 16);
  });

  it('the retract clamps at the top (clear at 3.5 s -> 0 at 4.1 s)', () => {
    const w = new PressWall();
    w.update(3.5);
    w.clearRow();
    w.update(0.6);
    expect(w.progress).toBe(0);
  });

  it('clearRow is a no-op before the first row and while retracting', () => {
    const early = new PressWall();
    early.update(2);
    early.clearRow(); // rowCount === 0: no-op
    early.update(0.6);
    expect(early.progress).toBeCloseTo(2.6 / 150); // pure advance, no retract

    const busy = new PressWall();
    busy.update(12);
    busy.clearRow();
    busy.clearRow(); // already retracting: no-op
    busy.update(0.6);
    expect(busy.progress).toBeCloseTo(0.18 - 1 / 16); // exactly one retract
  });

  it('a 200 s run (cleared rows and all) never leaves [0, 1]', () => {
    const w = new PressWall();
    let seenRows = 0;
    for (let s = 0; s < 200; s++) {
      w.update(1);
      if (w.rows > seenRows) {
        seenRows = w.rows;
        w.clearRow();
      }
      expect(w.progress).toBeGreaterThanOrEqual(0);
      expect(w.progress).toBeLessThanOrEqual(1);
    }
  });

  it('a 200 s run left alone clamps at the bottom and stays there', () => {
    const w = new PressWall();
    for (let s = 0; s < 200; s++) w.update(1);
    expect(w.progress).toBe(1);
  });

  it('a stamp mid-retract shifts the retract endpoints by 1/20 (clear at 9.6, stamp at 10 -> 0.1015 at 10.2)', () => {
    // 9.6 s: 9.6/150 + 1/20 = 0.114. clearRow -> retractTo 0.114 - 1/16 = 0.0515.
    // The 10.0 s stamp fires mid-retract: retractTo 0.0515 + 1/20 = 0.1015, which is where the
    // retract completes at 10.2 s.
    const w = new PressWall();
    w.update(9.6);
    w.clearRow();
    w.update(0.4); // t = 10.0: the stamp lands while the retract is in flight
    expect(w.stamps).toBe(2);
    w.update(0.2); // t = 10.2: the retract finishes at the shifted endpoint
    expect(w.progress).toBeCloseTo(0.114 - 1 / 16 + 1 / 20);
  });

  it('supports a custom timing', () => {
    const w = new PressWall({
      advancePerSec: 0.1,
      stampPeriodSec: 2,
      stampTelegraphSec: 1,
      stampJump: 0.2,
      firstRowSec: 1,
      rowPeriodSec: 3,
      retractAmount: 0.25,
      retractSec: 1,
    });
    w.update(2);
    expect(w.progress).toBeCloseTo(2 * 0.1 + 0.2); // advance + one jump
    expect(w.stamps).toBe(1);
    expect(w.rows).toBe(1);
    w.clearRow();
    w.update(1); // t = 3: the custom 1 s retract completes
    expect(w.progress).toBeCloseTo(0.4 - 0.25);
  });

  it('reset puts it back to the top at t = 0', () => {
    const w = new PressWall();
    w.update(12);
    w.clearRow();
    w.reset();
    expect(w.progress).toBe(0);
    expect(w.stamps).toBe(0);
    expect(w.rows).toBe(0);
    expect(w.stampTelegraph).toBe(false);
    w.update(0.6);
    expect(w.progress).toBeCloseTo(0.6 / 150);
  });
});
