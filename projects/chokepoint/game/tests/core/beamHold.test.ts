import { describe, expect, it } from 'vitest';
import { TICK_SEC } from '../../src/config';
import { BEAM_PULSE_EVERY, EMPTY_BEAM_HOLD, beamHoldStep } from '../../src/core/beamHold';

/** A stand-in for a pooled enemy: the hold tracks the object reference. */
const enemy = {};
const other = {};

/** A lock that counts no seconds: the hold starts at the empty clock. */
const locked = () => beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0).hold;

describe('beamHoldStep', () => {
  it('deals nothing on the lock step, and the first tick comes at the 0.25 s of hold', () => {
    const lock = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.1);
    expect(lock.ticks).toBe(0);
    expect(lock.pulse).toBe(false);
    expect(lock.hold.enemy).toBe(enemy);
    expect(lock.hold.acc).toBe(0); // the lock frame starts the clock; it does not count toward the first tick
    const a = beamHoldStep(lock.hold, enemy, 0.1);
    expect(a.ticks).toBe(0);
    const b = beamHoldStep(a.hold, enemy, 0.1);
    expect(b.ticks).toBe(0);
    const at = beamHoldStep(b.hold, enemy, 0.1); // 0.4 s of hold: the first tick (it comes at the 0.25 s)
    expect(at.ticks).toBe(1);
    expect(at.pulse).toBe(false);
    expect(at.hold.enemy).toBe(enemy);
  });

  it('holds 8 ticks over 20 steps of 0.1 s', () => {
    let hold = locked();
    let ticks = 0;
    for (let i = 0; i < 20; i++) {
      const step = beamHoldStep(hold, enemy, 0.1);
      ticks += step.ticks;
      hold = step.hold;
    }
    expect(ticks).toBe(8); // 2 s of hold at 4 ticks per second
  });

  it('over 12 ticks the pulse comes on every 4th, once per second of hold', () => {
    let hold = locked();
    let total = 0;
    const pulsingOn: number[] = [];
    for (let i = 0; i < 30; i++) {
      const step = beamHoldStep(hold, enemy, 0.1);
      expect(step.ticks).toBeLessThanOrEqual(1); // a 0.1 s step covers at most one tick
      total += step.ticks;
      if (step.pulse) pulsingOn.push(total);
      hold = step.hold;
    }
    expect(total).toBe(12);
    expect(pulsingOn).toEqual([4, 8, 12]); // at the one-, two- and three-second marks of the hold
  });

  it('a spike step fires every tick it covers at once', () => {
    const lock = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.1);
    const step = beamHoldStep(lock.hold, enemy, 0.5); // a 0.5 s spike: two ticks at once
    expect(step.ticks).toBe(2);
    expect(step.pulse).toBe(false);
    expect(step.hold.acc).toBeCloseTo(0);
  });

  it('a switch mid-tick deals nothing for the partial, and the new target ticks 0.25 s later', () => {
    let hold = EMPTY_BEAM_HOLD;
    for (let i = 0; i < 3; i++) hold = beamHoldStep(hold, enemy, 0.1).hold; // 0.2 s into the hold
    const step = beamHoldStep(hold, other, 0.1);
    expect(step.ticks).toBe(0);
    expect(step.pulse).toBe(false);
    expect(step.hold.enemy).toBe(other);
    expect(step.hold.acc).toBe(0); // the partial tick is lost; the new target starts a fresh clock
    const a = beamHoldStep(step.hold, other, 0.1);
    expect(a.ticks).toBe(0);
    const b = beamHoldStep(a.hold, other, 0.1);
    expect(b.ticks).toBe(0);
    const c = beamHoldStep(b.hold, other, 0.1); // 0.3 s of the new hold: its first tick
    expect(c.ticks).toBe(1);
    expect(c.pulse).toBe(false);
  });

  it('a step holding nothing deals nothing and resets to the empty hold', () => {
    let hold = EMPTY_BEAM_HOLD;
    for (let i = 0; i < 3; i++) hold = beamHoldStep(hold, enemy, 0.1).hold;
    const empty = beamHoldStep(hold, undefined, 0.1);
    expect(empty.ticks).toBe(0);
    expect(empty.pulse).toBe(false);
    expect(empty.hold).toBe(EMPTY_BEAM_HOLD);
    // Re-locking the same object starts its clock fresh: its first tick comes 0.25 s later.
    const relock = beamHoldStep(empty.hold, enemy, 0.1);
    expect(relock.ticks).toBe(0);
    expect(relock.hold.enemy).toBe(enemy);
    expect(relock.hold.acc).toBe(0);
  });

  it('acc stays in [0, TICK_SEC) over 600 mixed-dt steps', () => {
    expect(BEAM_PULSE_EVERY).toBe(Math.round(1 / TICK_SEC));
    let hold = EMPTY_BEAM_HOLD;
    for (let i = 0; i < 600; i++) {
      hold = beamHoldStep(hold, i % 23 === 0 ? other : enemy, i % 3 === 0 ? 0.05 : 0.1).hold;
      if (hold.enemy) {
        expect(hold.acc).toBeGreaterThanOrEqual(0);
        expect(hold.acc).toBeLessThan(TICK_SEC);
        expect(Number.isFinite(hold.ticks)).toBe(true);
        expect(hold.ticks).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
