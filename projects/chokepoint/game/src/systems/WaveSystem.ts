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

  constructor(run: RunState, enemies: EnemySystem) {
    this.run = run;
    this.enemies = enemies;
  }

  /** Plans and starts the run's next wave. */
  start(): void {
    this.run.startWave();
    this.plan = planWave(this.run.wave, this.run.rng, ENEMIES);
    this.next = 0;
    this.timer = 0;
    hook.stats.wavesStarted += 1;
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
