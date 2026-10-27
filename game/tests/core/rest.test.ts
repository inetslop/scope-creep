import { describe, expect, it } from 'vitest';
import { REST, RestState } from '../../src/core/rest';
import { RunState } from '../../src/core/run';

describe('rest', () => {
  it('exposes the window constant', () => {
    expect(REST).toEqual({ windowSec: 30 });
  });

  it('starts uncovered and stays uncovered just short of the window', () => {
    const r = new RestState();
    expect(r.covered).toBe(false);
    r.tick(29.9);
    expect(r.since).toBeCloseTo(29.9);
    expect(r.covered).toBe(false);
  });

  it('is covered exactly at 30.0 s of peace', () => {
    const r = new RestState();
    r.tick(10);
    r.tick(10);
    r.tick(10);
    expect(r.since).toBe(30);
    expect(r.covered).toBe(true);
  });

  it('any damage at any point restarts the count', () => {
    const r = new RestState();
    r.tick(10);
    expect(r.discreteHit()).toBe(false);
    r.tick(20); // only 20 s of peace since the hit, not 30
    expect(r.covered).toBe(false);

    const b = new RestState();
    b.tick(29.9);
    b.burn(); // the gutter keeps you out of rest however close you were
    b.tick(0.5);
    expect(b.covered).toBe(false);
  });

  it('a negated hit restarts the count exactly — not covered again at 29.999 s after it, covered at 30.0 s', () => {
    const r = new RestState();
    r.tick(30);
    expect(r.discreteHit()).toBe(true);
    expect(r.since).toBe(0);
    expect(r.covered).toBe(false);
    r.tick(29.999);
    expect(r.covered).toBe(false); // 29.999 s of peace after the forgiven hit: not yet

    const again = new RestState();
    again.tick(30);
    expect(again.discreteHit()).toBe(true);
    again.tick(30);
    expect(again.since).toBe(30); // exactly 30.0 s after the negation
    expect(again.covered).toBe(true);
  });

  it('burns are never negated, and a burn on the rest-completing frame holds no rest', () => {
    const r = new RestState();
    r.tick(30);
    r.burn(); // 30 s of peace, then the crop burns: rest is gone
    expect(r.covered).toBe(false);
    expect(r.since).toBe(0);
    expect(r.discreteHit()).toBe(false); // the very next hit still lands
    expect(r.negations).toBe(0);
  });

  it('of two discrete hits in one pass only the first is negated', () => {
    const r = new RestState();
    r.tick(30);
    expect(r.discreteHit()).toBe(true);
    expect(r.discreteHit()).toBe(false); // covered was consumed synchronously
    expect(r.negations).toBe(1);
  });

  it('a non-negated hit does not increment negations', () => {
    const r = new RestState();
    r.tick(5);
    expect(r.discreteHit()).toBe(false);
    expect(r.negations).toBe(0);
  });
});

describe('RunState rest wiring', () => {
  it('takeDamage at rest returns 0 with hp and streak intact', () => {
    const run = new RunState(1);
    run.registerKill(); // streak 1
    run.rest.tick(30);
    const hpBefore = run.hp;
    expect(run.takeDamage(10)).toBe(0);
    expect(run.hp).toBe(hpBefore);
    expect(run.streak).toBe(1);
    expect(run.rest.negations).toBe(1);
    expect(run.rest.covered).toBe(false);
    expect(run.rest.since).toBe(0);
  });

  it('drain at rest still deals damage and restarts the count', () => {
    const run = new RunState(1);
    run.registerKill(); // streak 1
    run.rest.tick(30);
    const hpBefore = run.hp;
    expect(run.drain(2.5)).toBe(2.5);
    expect(run.hp).toBe(hpBefore - 2.5);
    expect(run.streak).toBe(0);
    expect(run.rest.negations).toBe(0); // burns are never negated
    expect(run.rest.covered).toBe(false);
    expect(run.rest.since).toBe(0);
  });
});
