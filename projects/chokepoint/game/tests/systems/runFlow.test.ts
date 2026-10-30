import { describe, expect, it, vi } from 'vitest';

// RunFlow reaches debug/flags, which reads window.location at load — node has no window.
vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, debug: false, skipMenu: false, seed: undefined } }));

import { START } from '../../src/config';
import { RunState } from '../../src/core/run';
import { hook } from '../../src/debug/testHook';
import { SCENES } from '../../src/scenes/keys';
import type { GameScene } from '../../src/scenes/GameScene';
import { RunFlow, type RunSystems } from '../../src/systems/RunFlow';

/** A flow with only what startWaveNow touches; the wave start and sound are recorded. */
function fakeFlow(active: boolean) {
  const run = new RunState(1);
  run.startBuild(8);
  const state = { started: 0, sound: 0 };
  const flow = new RunFlow(
    { scene: { isActive: () => active } } as unknown as GameScene,
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
    const midFlow = new RunFlow({ scene: { isActive: () => true } } as unknown as GameScene, mid, { waves: { start: () => (state.started += 1) } } as unknown as RunSystems);
    expect(midFlow.startWaveNow()).toBe(0);
    expect(state.started).toBe(0);
  });
});

/** A mid-wave run with the board re-growth and the scene wiring clearWave touches; the beat's callback is kept for the test. */
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
    regrowBoard: (level: number) => calls.push(`regrow:${level}`),
    registry: { set: (key: string) => calls.push(`registry:${key}`) },
  };
  const flow = new RunFlow(
    scene as unknown as GameScene,
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

/** The level's last wave: the board re-grows a beat after the clear, then the draft opens on it. */
describe('RunFlow.clearWave, the level clears and the win', () => {
  it('clearing wave 10 sets level 2 and re-grows the board a beat later, then opens the draft', () => {
    const { run, flow, calls, fireBeat } = fakeClearFlow(10);
    const bonus = RunState.waveBonus(10);
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(run.gold).toBe(START.gold + bonus); // the bonus pays as on any clear
    expect(run.level).toBe(2);
    expect(flow.pendingLevelClear).toBe(10); // the banner's card, once per wave number
    expect(run.phase).toBe('draft'); // held in draft while the card is up
    expect(calls).not.toContain('regrow:2');
    fireBeat();
    expect(calls).toContain('regrow:2');
    expect(calls).toContain(`launch:${SCENES.draft}`);
  });

  it('clearing wave 20 does the same for level 3', () => {
    const { run, flow, calls, fireBeat } = fakeClearFlow(20);
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(run.level).toBe(3);
    expect(flow.pendingLevelClear).toBe(20);
    fireBeat();
    expect(calls).toContain('regrow:3');
    expect(calls).toContain(`launch:${SCENES.draft}`);
  });

  it('clearing wave 30 wins the run: the game-over card a beat later, no level card, no loss', () => {
    const { run, flow, calls, fireBeat } = fakeClearFlow(30);
    const lostBefore = hook.stats.runsLost;
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(run.phase).toBe('won');
    expect(run.over).toBe(true);
    expect(run.wavesCleared).toBe(30); // counts as wave 30 for the score and the best wave
    expect(flow.pendingLevelClear).toBe(0);
    fireBeat();
    expect(calls).toContain(`stop:${SCENES.hud}`);
    expect(calls).toContain(`start:${SCENES.gameOver}`);
    expect(calls).not.toContain('regrow:3');
    expect(hook.stats.runsLost).toBe(lostBefore); // a win is not a loss
  });

  it('an ordinary wave still goes straight to the draft, no re-growth', () => {
    const { run, flow, calls } = fakeClearFlow(5);
    run.leak(1); // make it dirty so the clean wave's beat is not taken
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(flow.pendingLevelClear).toBe(0);
    expect(run.level).toBe(1);
    expect(calls).toContain(`launch:${SCENES.draft}`); // immediate, no beat
    expect(calls).not.toContain('regrow:2');
  });
});
