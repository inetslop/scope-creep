import type { Sfx } from '../audio/Sfx';
import { ENEMIES, getEnemy } from '../content/enemies';
import { forkLane } from '../core/fork';
import { isFarGateSpawn } from '../core/farGate';
import { levelCountMul, levelSpeedMul } from '../core/levels';
import type { RunState } from '../core/run';
import { waveWalkFactor } from '../core/tech';
import { DOUBLE_SPEED_MUL, clumpsGap, doubleLull, doubleSplitAt, isClumpsWave, isDoubleWave, planWave, planWithLevel, shortCutSpawnDistance, type WavePlan, waveSpeedMul } from '../core/waves';
import { hook } from '../debug/testHook';
import { tagHaptic } from '../input/haptics';
import type { EnemySystem } from './EnemySystem';

/** Sends one wave's enemies on schedule (see core/waves.ts for what a wave contains). */
export class WaveSystem {
  private readonly run: RunState;
  private readonly enemies: EnemySystem;
  /** Board units from the route start to the far gate (core/farGate.ts); 0 with no far gate. */
  private readonly farGateDistance: number;
  /** The board splits its road: each spawn takes a lane at the split (core/fork.ts). */
  private readonly hasFork: boolean;
  /** The run's walk factor on every enemy (The thin road: 0.9); read once from the owned tech. */
  private readonly walkMul: number;
  private plan: WavePlan | undefined;
  private next = 0;
  private timer = 0;
  private planned: WavePlan | undefined;
  /** What the wave that just ended cost in lives (0 until a wave ends, 0 for a clean wave). The wave card wears it. */
  heldLost = 0;
  private livesAtStart = 0;
  private readonly sfx: Sfx | undefined;

  constructor(run: RunState, enemies: EnemySystem, farGateDistance = 0, hasFork = false, sfx: Sfx | undefined) {
    this.run = run;
    this.enemies = enemies;
    this.farGateDistance = farGateDistance;
    this.hasFork = hasFork;
    this.walkMul = waveWalkFactor(run.techOwned);
    this.sfx = sfx;
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
    const plan0 = this.planned ?? planWithLevel(planWave(this.run.wave, this.run.rng, ENEMIES), levelCountMul(this.run.level));
    // The double and the clumps (core/waves.ts) ride the plan actually sent: their lulls and gaps are cut here, after the level's extras.
    this.plan = isDoubleWave(plan0.number) ? doubleLull(plan0) : isClumpsWave(plan0.number) ? clumpsGap(plan0) : plan0;
    this.planned = undefined;
    this.next = 0;
    this.timer = 0;
    // A tagged wave (anything but the quiet breather) buzzes once, so a phone player feels it coming (T0449).
    if (this.plan && this.plan.tags.some((t) => t !== 'quiet')) tagHaptic();
    // The five march tags play the tag's note (Sfx.tagNote) as the banner lands, T0449's pair: the quiet breather and the boss's own horn (T0268) never do.
    if (this.plan && this.plan.tags.some((t) => ['tight', 'rush', 'short cut', 'double', 'clumps'].includes(t))) this.sfx?.tagNote();
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
    const speedMul = levelSpeedMul(this.run.level) * this.walkMul * waveMul;
    // The double (core/waves.ts): from the split on, the second front's walkers walk DOUBLE_SPEED_MUL faster (a Flyer never).
    const doubleAt = isDoubleWave(plan.number) ? doubleSplitAt(plan.spawns.length) : Infinity;
    this.timer += dt;
    while (this.next < plan.spawns.length && this.timer >= plan.spawns[this.next]!.delaySec) {
      const spawn = plan.spawns[this.next]!;
      this.timer -= spawn.delaySec;
      // The fork's lane is the spawn's (seed, wave, index) hash (core/fork.ts), never a draw on the run's rng.
      const lane = this.hasFork ? forkLane(this.run.seed, this.run.wave, this.next) : 0;
      // The short cut (core/waves.ts): the wave's road walkers come in 40% down the path they walk, from the entrance they walk in from.
      const entrance = isFarGateSpawn(this.next, plan, this.farGateDistance > 0) ? this.farGateDistance : 0;
      const def = getEnemy(spawn.enemy);
      this.enemies.spawn(def, plan.hpMul * this.run.levelHpMul, speedMul * (this.next >= doubleAt && !def.flies ? DOUBLE_SPEED_MUL : 1), waveMul, this.walkMul, shortCutSpawnDistance(plan.number, this.enemies.routeForLane(lane).length, entrance), lane);
      this.next += 1;
    }
  }
}
