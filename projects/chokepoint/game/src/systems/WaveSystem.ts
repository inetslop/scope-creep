import { ENEMIES, getEnemy } from '../content/enemies';
import { forkLane } from '../core/fork';
import { isFarGateSpawn } from '../core/farGate';
import { levelCountMul, levelSpeedMul } from '../core/levels';
import type { RunState } from '../core/run';
import { planWave, planWithLevel, type WavePlan, waveSpeedMul } from '../core/waves';
import { hook } from '../debug/testHook';
import type { EnemySystem } from './EnemySystem';

/** Sends one wave's enemies on schedule (see core/waves.ts for what a wave contains). */
export class WaveSystem {
  private readonly run: RunState;
  private readonly enemies: EnemySystem;
  /** Board units from the route start to the far gate (core/farGate.ts); 0 with no far gate. */
  private readonly farGateDistance: number;
  /** The board splits its road: each spawn takes a lane at the split (core/fork.ts). */
  private readonly hasFork: boolean;
  private plan: WavePlan | undefined;
  private next = 0;
  private timer = 0;
  private planned: WavePlan | undefined;
  /** What the wave that just ended cost in lives (0 until a wave ends, 0 for a clean wave). The wave card wears it. */
  heldLost = 0;
  private livesAtStart = 0;

  constructor(run: RunState, enemies: EnemySystem, farGateDistance = 0, hasFork = false) {
    this.run = run;
    this.enemies = enemies;
    this.farGateDistance = farGateDistance;
    this.hasFork = hasFork;
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
    this.planned = planWithLevel(planWave(this.run.wave + 1, this.run.rng, ENEMIES), levelCountMul(this.run.level));
  }

  /** Starts the run's next wave, planned at the build phase's start. */
  start(): void {
    this.run.startWave();
    this.livesAtStart = this.run.lives;
    this.heldLost = 0;
    this.plan = this.planned ?? planWithLevel(planWave(this.run.wave, this.run.rng, ENEMIES), levelCountMul(this.run.level));
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
    const waveMul = waveSpeedMul(plan.number);
    const speedMul = levelSpeedMul(this.run.level) * waveMul;
    this.timer += dt;
    while (this.next < plan.spawns.length && this.timer >= plan.spawns[this.next]!.delaySec) {
      const spawn = plan.spawns[this.next]!;
      this.timer -= spawn.delaySec;
      // The fork's lane is the spawn's (seed, wave, index) hash (core/fork.ts), never a draw on the run's rng.
      this.enemies.spawn(getEnemy(spawn.enemy), plan.hpMul * this.run.levelHpMul, speedMul, waveMul, isFarGateSpawn(this.next, plan, this.farGateDistance > 0) ? this.farGateDistance : 0, this.hasFork ? forkLane(this.run.seed, this.run.wave, this.next) : 0);
      this.next += 1;
    }
  }
}
