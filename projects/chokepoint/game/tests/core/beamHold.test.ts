import { describe, expect, it } from 'vitest';
import { BEAM_HIT_SEC, EMPTY_BEAM_HOLD, beamHoldStep } from '../../src/core/beamHold';

/** A stand-in for a pooled enemy: the hold tracks the object reference. */
const enemy = {};
const other = {};

describe('beamHoldStep', () => {
  it('the first step on a target is contact and a pulse (the hit at the moment of lock)', () => {
    const step = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 1 / 60);
    expect(step.contact).toBe(true);
    expect(step.pulse).toBe(true);
    expect(step.hold.enemy).toBe(enemy);
    expect(step.hold.nextHit).toBe(BEAM_HIT_SEC);
  });

  it('holding the same enemy pulses exactly on the one-second step, and only then', () => {
    const lock = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.1); // the hit at the lock
    expect(lock.pulse).toBe(true);
    const a = beamHoldStep(lock.hold, enemy, 0.4); // 0.4 s of contact: not yet
    expect(a.contact).toBe(true);
    expect(a.pulse).toBe(false);
    expect(a.hold.enemy).toBe(enemy);
    const at = beamHoldStep(a.hold, enemy, 0.6); // 1.0 s of contact: the pulse
    expect(at.contact).toBe(true);
    expect(at.pulse).toBe(true);
    expect(at.hold.nextHit).toBe(BEAM_HIT_SEC); // the count restarts for the next second
  });

  it('a 0.4 s + 0.6 s hold after the lock pulses on the 1.0 s step', () => {
    const hold = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.2).hold; // lock
    expect(beamHoldStep(hold, enemy, 0.4).pulse).toBe(false);
    expect(beamHoldStep(beamHoldStep(hold, enemy, 0.4).hold, enemy, 0.6).pulse).toBe(true);
  });

  it('a new target pulses immediately on the switch step, and the old contact is forgotten', () => {
    const hold = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.9).hold; // 0.9 s into the contact
    const step = beamHoldStep(hold, other, 0.1);
    expect(step.contact).toBe(true);
    expect(step.pulse).toBe(true);
    expect(step.hold.enemy).toBe(other);
    expect(step.hold.nextHit).toBe(BEAM_HIT_SEC);
  });

  it('a step holding nothing resets the hold, and re-locking the same object pulses again', () => {
    const held = beamHoldStep(EMPTY_BEAM_HOLD, enemy, 0.5).hold;
    const empty = beamHoldStep(held, undefined, 0.5);
    expect(empty.contact).toBe(false);
    expect(empty.pulse).toBe(false);
    expect(empty.hold).toBe(EMPTY_BEAM_HOLD);
    const relock = beamHoldStep(empty.hold, enemy, 0.1);
    expect(relock.contact).toBe(true);
    expect(relock.pulse).toBe(true);
    expect(relock.hold.enemy).toBe(enemy);
  });

  it('nextHit stays in (0, BEAM_HIT_SEC] through clamped dt steps', () => {
    let hold = EMPTY_BEAM_HOLD;
    for (let i = 0; i < 600; i++) {
      hold = beamHoldStep(hold, enemy, i % 2 === 0 ? 0.05 : 0.1).hold;
      expect(hold.enemy).toBe(enemy);
      expect(hold.nextHit).toBeGreaterThan(0);
      expect(hold.nextHit).toBeLessThanOrEqual(BEAM_HIT_SEC);
    }
  });

  it('keeps contacting through every step while it holds the same enemy, pulsing once per second', () => {
    let hold = EMPTY_BEAM_HOLD;
    let pulses = 0;
    for (let i = 0; i < 10; i++) {
      const step = beamHoldStep(hold, enemy, 0.2);
      expect(step.contact).toBe(true);
      pulses += step.pulse ? 1 : 0;
      hold = step.hold;
    }
    expect(pulses).toBe(2); // at the lock and at the one-second mark of 10 x 0.2 s
  });
});
