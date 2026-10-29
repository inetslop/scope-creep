import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

// RunFlow reaches debug/flags, which reads window.location at load — node has no window.
vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, debug: false, skipMenu: false, seed: undefined } }));

import { START } from '../../src/config';
import { RunState } from '../../src/core/run';
import { RunFlow, type RunSystems } from '../../src/systems/RunFlow';

/** A flow with only what startWaveNow touches; the wave start and sound are recorded. */
function fakeFlow(active: boolean) {
  const run = new RunState(1);
  run.startBuild(8);
  const state = { started: 0, sound: 0 };
  const flow = new RunFlow(
    { scene: { isActive: () => active } } as unknown as Phaser.Scene,
    run,
    { waves: { start: () => (state.started += 1) }, sfx: { waveStart: () => (state.sound += 1) } } as unknown as RunSystems,
  );
  return { run, flow, state };
}

describe('RunFlow.startWaveNow, the one start-wave path', () => {
  it('banks 2 gold per whole second left and starts the wave', () => {
    const { run, flow, state } = fakeFlow(true);
    expect(flow.startWaveNow()).toBe(16); // 8 s left
    expect(run.gold).toBe(START.gold + 16);
    expect(run.buildLeftSec).toBe(0);
    expect(state).toEqual({ started: 1, sound: 1 });
  });
  it('banks nothing with under a second left and still starts the wave', () => {
    const { run, flow, state } = fakeFlow(true);
    run.buildLeftSec = 0.4;
    expect(flow.startWaveNow()).toBe(0);
    expect(run.gold).toBe(START.gold);
    expect(state.started).toBe(1);
  });
  it('does nothing when the scene is not active or the phase is not build', () => {
    const { flow, state } = fakeFlow(false);
    expect(flow.startWaveNow()).toBe(0);
    expect(state.started).toBe(0);
    const mid = new RunState(1);
    mid.phase = 'wave'; // a fresh run is in 'build' with 0 s left; this one is mid-wave
    const midFlow = new RunFlow({ scene: { isActive: () => true } } as unknown as Phaser.Scene, mid, { waves: { start: () => (state.started += 1) } } as unknown as RunSystems);
    expect(midFlow.startWaveNow()).toBe(0);
    expect(state.started).toBe(0);
  });
});
