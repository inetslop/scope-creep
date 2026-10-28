import { describe, expect, it } from 'vitest';
import { isLastStand, killGold } from '../../src/core/lastStand';
import { RunState } from '../../src/core/run';

describe('isLastStand', () => {
  it('is on at exactly one life, off at two or more, and a state that turns back on', () => {
    const r = new RunState(1);
    expect(r.lives).toBe(20); // a new run starts with 20 lives
    r.lives = 1; // a leak brings it to one life
    expect(isLastStand(r)).toBe(true);
    r.lives = 2; // the streak's payback raises it
    expect(isLastStand(r)).toBe(false);
    r.lives = 3;
    expect(isLastStand(r)).toBe(false);
    r.lives = 1; // a later leak back to one life turns it on again
    expect(isLastStand(r)).toBe(true);
  });
});

describe('killGold', () => {
  it('pays the bounty normally and doubles it while last stand is on', () => {
    const r = new RunState(1);
    expect(killGold(r, 4)).toBe(4);
    r.lives = 1;
    expect(killGold(r, 4)).toBe(8);
    r.lives = 2;
    expect(killGold(r, 4)).toBe(4); // back to normal the moment a life comes back
  });
});
