import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

// RunFlow reaches debug/flags, which reads window.location at load — node has no window.
vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, debug: false, skipMenu: false, seed: undefined } }));
// The first-clean-wave teach (fx/streakTeach) draws on a Phaser scene the fakes below don't have: count its calls.
const teachCalls = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/systems/fx/streakTeach', () => ({ streakTeach: () => (teachCalls.n += 1) }));

import { START } from '../../src/config';
import { RunState } from '../../src/core/run';
import { hook } from '../../src/debug/testHook';
import { SCENES } from '../../src/scenes/keys';
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

/** A mid-wave run with the scene wiring clearWave touches; the beat's callback is kept for the test. */
function fakeClearFlow(wave: number) {
  const run = new RunState(1);
  run.wave = wave;
  run.phase = 'wave';
  const calls: string[] = [];
  let beat: (() => void) | undefined;
  const scene = {
    scene: {
      isActive: () => true,
      launch: (key: string) => calls.push(`launch:${key}`),
      pause: () => calls.push('pause'),
      resume: () => calls.push('resume'),
      stop: (key?: string) => calls.push(`stop:${key ?? ''}`),
      start: (key: string) => calls.push(`start:${key}`),
    },
    time: { delayedCall: (_ms: number, fn: () => void) => (beat = fn) },
    registry: { set: (key: string) => calls.push(`registry:${key}`) },
  };
  const flow = new RunFlow(
    scene as unknown as Phaser.Scene,
    run,
    {
      board: { width: 100, height: 100 },
      waves: { waveEnded: () => calls.push('waveEnded') },
      towers: { towers: [] },
      fx: { popText: () => calls.push('popText'), cleanLines: () => calls.push('cleanLines') },
      sfx: { waveClear: () => calls.push('waveClear'), waveSweep: () => calls.push('waveSweep') },
    } as unknown as RunSystems,
  );
  return { run, flow, calls, fireBeat: () => beat?.() };
}

/** A run is one board: waves 10, 20 and 30 clear like any other, and only lost lives end it. */
describe('RunFlow.clearWave, every wave the same', () => {
  it('a wave with a leak goes straight to the draft', () => {
    const { run, flow, calls } = fakeClearFlow(5);
    run.leak(1); // make it dirty so the clean wave's beat is not taken
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(run.gold).toBe(START.gold + RunState.waveBonus(5));
    expect(calls).toContain(`launch:${SCENES.draft}`); // immediate, no beat
    expect(calls).not.toContain('cleanLines');
  });

  for (const wave of [10, 20, 30]) {
    it(`clearing wave ${wave} cleanly is an ordinary clear: the clean beat, then the draft, the run goes on`, () => {
      const { run, flow, calls, fireBeat } = fakeClearFlow(wave);
      const lostBefore = hook.stats.runsLost;
      (flow as unknown as { clearWave(): void }).clearWave();
      expect(run.phase).toBe('draft');
      expect(run.over).toBe(false);
      expect(calls).toContain('cleanLines');
      expect(calls).not.toContain(`launch:${SCENES.draft}`); // held for the beat
      fireBeat();
      expect(calls).toContain(`launch:${SCENES.draft}`);
      expect(calls).not.toContain(`start:${SCENES.gameOver}`);
      expect(hook.stats.runsLost).toBe(lostBefore);
    });
  }
});
