import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

// RunFlow reaches debug/flags, which reads window.location at load — node has no window.
vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, debug: false, skipMenu: false, seed: undefined } }));

import { STAY_PUT, START } from '../../src/config';
import { RunState } from '../../src/core/run';
import { RunFlow, type RunSystems } from '../../src/systems/RunFlow';

/** A flow with only what buyBuildTime touches. */
function fakeFlow(active: boolean) {
  const run = new RunState(1);
  run.startBuild(8);
  const flow = new RunFlow(
    { scene: { isActive: () => active, resume: () => {} } } as unknown as Phaser.Scene,
    run,
    { waves: { start: () => {}, planNext: () => {} } } as unknown as RunSystems,
  );
  flow.buildTotalSec = 8; // finishDraft's job in a real run
  return { run, flow };
}

describe('RunFlow.buyBuildTime, the Stay put buy', () => {
  it('spends the gold and grows the countdown and the ring total it is drawn from', () => {
    const { run, flow } = fakeFlow(true);
    expect(flow.buyBuildTime()).toBe(true);
    expect(run.gold).toBe(START.gold - STAY_PUT.cost);
    expect(run.buildLeftSec).toBe(8 + STAY_PUT.sec);
    expect(flow.buildTotalSec).toBe(8 + STAY_PUT.sec);
  });
  it('refuses with under the cost: no gold spent, no seconds gained', () => {
    const { run, flow } = fakeFlow(true);
    run.gold = STAY_PUT.cost - 1;
    expect(flow.buyBuildTime()).toBe(false);
    expect(run.gold).toBe(STAY_PUT.cost - 1);
    expect(run.buildLeftSec).toBe(8);
    expect(flow.buildTotalSec).toBe(8);
  });
  it('refuses the second buy in the same build phase, and the next build phase gets a fresh one', () => {
    const { run, flow } = fakeFlow(true);
    expect(flow.buyBuildTime()).toBe(true);
    expect(flow.buyBuildTime()).toBe(false); // the phase's one buy is spent
    expect(run.gold).toBe(START.gold - STAY_PUT.cost);
    expect(run.buildLeftSec).toBe(8 + STAY_PUT.sec);
    run.phase = 'draft';
    flow.finishDraft(undefined); // into the next build phase
    expect(flow.buyBuildTime()).toBe(true);
    expect(run.gold).toBe(START.gold - STAY_PUT.cost * 2);
    expect(run.buildLeftSec).toBe(8 + STAY_PUT.sec);
  });
  it('refuses when the scene is not active or the phase is not build', () => {
    const { run, flow } = fakeFlow(false);
    expect(flow.buyBuildTime()).toBe(false);
    expect(run.gold).toBe(START.gold);
    const mid = new RunState(1);
    mid.phase = 'wave'; // a fresh run is in 'build'; this one is mid-wave
    const midFlow = new RunFlow({ scene: { isActive: () => true } } as unknown as Phaser.Scene, mid, { waves: { start: () => {} } } as unknown as RunSystems);
    expect(midFlow.buyBuildTime()).toBe(false);
    expect(mid.buildLeftSec).toBe(0);
  });
});
