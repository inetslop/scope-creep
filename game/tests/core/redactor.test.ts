import { describe, expect, it } from 'vitest';
import { shardXp } from '../../src/core/gilt';
import { inRedactRadius, redactSlowTick, redactorShardXp, RedactClock, REDACT_COOLDOWN_SEC, REDACT_FLASH_MS, REDACT_RADIUS, REDACT_SLOW_MUL, REDACT_SLOW_SEC } from '../../src/core/redactor';

describe('redactor rules', () => {
  it('exports the loadout and active tuning', () => {
    expect(REDACT_RADIUS).toBe(140);
    expect(REDACT_COOLDOWN_SEC).toBe(12);
    expect(REDACT_SLOW_SEC).toBe(2.5);
    expect(REDACT_SLOW_MUL).toBe(0.6);
    expect(REDACT_FLASH_MS).toBe(100);
  });

  describe('redactorShardXp', () => {
    it('leaves an unpicked run byte-identical to shardXp', () => {
      expect(redactorShardXp(5, false, false)).toBe(5);
      expect(redactorShardXp(5, true, false)).toBe(15);
      for (const [value, gilt] of [[1, false], [2, false], [4, false], [7, false], [1, true], [5, true], [9, true]] as const) {
        expect(redactorShardXp(value, gilt, false)).toBe(shardXp(value, gilt)); // no extra flooring on this path
      }
    });

    it('halves every shard when picked, rounded down', () => {
      expect(redactorShardXp(5, false, true)).toBe(2); // floor(2.5)
      expect(redactorShardXp(1, false, true)).toBe(0); // floor(0.5)
      expect(redactorShardXp(2, false, true)).toBe(1);
    });

    it('multiplies gilt by 3 before the halving', () => {
      expect(redactorShardXp(5, true, true)).toBe(7); // floor(15/2)
      expect(redactorShardXp(3, true, true)).toBe(4); // floor(9/2)
      expect(redactorShardXp(1, true, true)).toBe(1); // floor(3/2)
    });
  });

  describe('RedactClock', () => {
    it('starts ready and a trigger burns the full 12 s', () => {
      const clock = new RedactClock();
      expect(clock.ready).toBe(true);
      expect(clock.cdLeft).toBe(0);
      expect(clock.trigger()).toBe(true);
      expect(clock.ready).toBe(false);
      expect(clock.cdLeft).toBe(REDACT_COOLDOWN_SEC);
      clock.update(4);
      expect(clock.ready).toBe(false);
      expect(clock.cdLeft).toBe(8);
    });

    it('rejects a trigger mid-cooldown and leaves the clock untouched', () => {
      const clock = new RedactClock();
      clock.trigger();
      clock.update(5);
      expect(clock.trigger()).toBe(false);
      expect(clock.cdLeft).toBe(7);
    });

    it('returns the completion edge exactly once, across the 1e-9 float edge', () => {
      const clock = new RedactClock();
      clock.trigger();
      expect(clock.update(11.999)).toBe(false); // still a hair of cooldown left
      expect(clock.cdLeft).toBeGreaterThan(0);
      expect(clock.update(0.001)).toBe(true); // this frame crosses to ready and snaps cd to exactly 0
      expect(clock.ready).toBe(true);
      expect(clock.cdLeft).toBe(0);
      expect(clock.trigger()).toBe(true); // immediately re-armable
    });

    it('a big dt completes the cooldown in one frame', () => {
      const clock = new RedactClock();
      clock.trigger();
      expect(clock.update(60)).toBe(true);
      expect(clock.cdLeft).toBe(0);
    });
  });

  describe('redactSlowTick', () => {
    it('no slow means full speed', () => {
      expect(redactSlowTick(0, 0.016, false)).toEqual({ left: 0, mul: 1 });
      expect(redactSlowTick(-1, 0.016, false)).toEqual({ left: 0, mul: 1 });
    });

    it('ticks the slow down at 60% speed (binary-exact values)', () => {
      expect(redactSlowTick(2.5, 0.5, false)).toEqual({ left: 2, mul: 0.6 });
      expect(redactSlowTick(2, 0.5, false)).toEqual({ left: 1.5, mul: 0.6 });
    });

    it('the slow expires and speed returns to full', () => {
      expect(redactSlowTick(0.25, 0.5, false)).toEqual({ left: 0, mul: 1 });
      expect(redactSlowTick(0.5, 0.5, false)).toEqual({ left: 0, mul: 1 }); // exactly out: no slow left this frame
    });

    it('a retrigger refreshes the full 2.5 s window', () => {
      expect(redactSlowTick(0.4, 0.1, true)).toEqual({ left: 2.5, mul: 0.6 });
      expect(redactSlowTick(0, 0.1, true)).toEqual({ left: 2.5, mul: 0.6 });
    });
  });

  describe('inRedactRadius', () => {
    it('is a closed 140 u disk around the player', () => {
      expect(inRedactRadius(0, 0, 140, 0)).toBe(true); // exactly on the radius counts as in
      expect(inRedactRadius(0, 0, 141, 0)).toBe(false);
      expect(inRedactRadius(0, 0, 99, 98)).toBe(true); // 99^2 + 98^2 = 19405 < 19600
      expect(inRedactRadius(0, 0, 99, 99)).toBe(false); // 99^2 + 99^2 = 19602 > 19600
    });

    it('measures from the player, anywhere on the page', () => {
      expect(inRedactRadius(500, -300, 640, -300)).toBe(true);
      expect(inRedactRadius(500, -300, 641, -300)).toBe(false);
    });
  });
});
