import { ENEMIES, getEnemy } from '../content/enemies';
import type { RunState } from '../core/run';
import { planWave, type WavePlan } from '../core/waves';
import { hook } from '../debug/testHook';
import type { EnemySystem } from './EnemySystem';

/** Sends one wave's enemies on schedule (see core/waves.ts for what a wave contains). */
export class WaveSystem {
  private readonly run: RunState;
  private readonly enemies: EnemySystem;
  private plan: WavePlan | undefined;
  private next = 0;
  private timer = 0;
  private planned: WavePlan | undefined;
  /** What the wave that just ended cost in lives (0 until a wave ends, 0 for a clean wave). The wave card wears it. */
  heldLost = 0;
  private livesAtStart = 0;

  constructor(run: RunState, enemies: EnemySystem) {
    this.run = run;
    this.enemies = enemies;
  }

  /** The wave the build phase leads to (the HUD's preview reads it; it is planned once at build start). */
  get nextPlan(): WavePlan | undefined {
    return this.planned;
  }

  /** The wave the board is sending now (the banner reads its tags; the preview reads nextPlan). */
  get currentPlan(): WavePlan | undefined {
    return this.plan;
  }

  /** Plans the run's next wave; RunFlow calls it when the build phase starts. */
  planNext(): void {
    this.planned = planWave(this.run.wave + 1, this.run.rng, ENEMIES);
  }

  /** Starts the run's next wave, planned at the build phase's start. */
  start(): void {
    this.run.startWave();
    this.livesAtStart = this.run.lives;
    this.heldLost = 0;
    this.plan = this.planned ?? planWave(this.run.wave, this.run.rng, ENEMIES);
    this.planned = undefined;
    this.next = 0;
    this.timer = 0;
    hook.stats.wavesStarted += 1;
  }

  /** The wave's last enemy is gone: record the lives its leaks took. RunFlow calls it as the wave ends. */
  waveEnded(): void {
    this.heldLost = Math.max(0, this.livesAtStart - this.run.lives);
  }

  /** Every enemy of the current wave has been sent. */
  get spawningDone(): boolean {
    return !this.plan || this.next >= this.plan.spawns.length;
  }

  /** Enemies of the current wave still to come. */
  get remaining(): number {
    return this.plan ? this.plan.spawns.length - this.next : 0;
  }

  update(dt: number): void {
    const plan = this.plan;
    if (!plan) return;
    this.timer += dt;
    while (this.next < plan.spawns.length && this.timer >= plan.spawns[this.next]!.delaySec) {
      const spawn = plan.spawns[this.next]!;
      this.timer -= spawn.delaySec;
      this.enemies.spawn(getEnemy(spawn.enemy), plan.hpMul);
      this.next += 1;
    }
  }
}
