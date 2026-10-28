import type Phaser from 'phaser';
import { BUILD_SEC } from '../config';
import { AUGMENTS } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { rollOffer } from '../core/augments';
import type { RunState } from '../core/run';
import { hook } from '../debug/testHook';
import { SCENES } from '../scenes/keys';
import type { Sfx } from '../audio/Sfx';
import type { Board } from './Board';
import type { Building } from './Building';
import type { EnemySystem } from './EnemySystem';
import type { FxSystem } from './FxSystem';
import type { ProjectileSystem } from './ProjectileSystem';
import type { TowerSystem } from './TowerSystem';
import type { WaveSystem } from './WaveSystem';

/** Everything RunFlow moves along each frame. */
export interface RunSystems {
  board: Board;
  building: Building;
  waves: WaveSystem;
  enemies: EnemySystem;
  towers: TowerSystem;
  projectiles: ProjectileSystem;
  fx: FxSystem;
  sfx: Sfx | undefined;
}

/**
 * The run's phases: draft (pick an augment, DraftScene) -> build (countdown, place towers) ->
 * wave (enemies come, towers fire) -> draft ... until the lives run out (GameOverScene). The run
 * opens with a draft for the first augment. update() runs the systems that belong to the phase.
 */
export class RunFlow {
  /** Offered augment copies while the draft is open (DraftScene reads them). */
  offer: AugmentCopy[] = [];
  /** Length of the current build countdown (the HUD draws its ring from it). */
  buildTotalSec = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly s: RunSystems,
  ) {}

  /** Enemies of the current wave still to come or alive. */
  get enemiesLeft(): number {
    return this.s.waves.remaining + this.s.enemies.aliveCount;
  }

  update(dt: number): void {
    const run = this.run;
    if (run.phase === 'build') {
      run.buildLeftSec -= dt;
      if (run.buildLeftSec <= 0) {
        this.s.waves.start();
        this.s.sfx?.waveStart();
      }
    }
    if (run.phase === 'wave') {
      this.s.waves.update(dt);
      this.s.enemies.update(dt);
      this.s.towers.update(dt);
      this.s.projectiles.update(dt);
      if (run.over) {
        this.endRun();
        return;
      }
      if (this.s.waves.spawningDone && this.s.enemies.aliveCount === 0) this.clearWave();
    } else {
      // Bolts in flight finish (or fizzle) between waves.
      this.s.projectiles.update(dt);
    }
    this.s.enemies.drawBars();
  }

  /** "Next wave" button / Space: skip the rest of the build countdown. */
  startWaveNow(): void {
    if (this.run.phase === 'build' && this.scene.scene.isActive()) this.run.buildLeftSec = 0;
  }

  /** Offers three augment copies (DraftScene); finishDraft starts the next build phase. */
  openDraft(): void {
    this.run.phase = 'draft';
    this.offer = rollOffer(this.run.rng, AUGMENTS, 3, this.run.wave === 0);
    if (this.offer.length === 0) {
      this.finishDraft(undefined);
      return;
    }
    this.scene.scene.launch(SCENES.draft);
    this.scene.scene.pause();
  }

  /** DraftScene picked an augment copy (or none): it goes into the hand, and the next build phase starts. */
  finishDraft(pick: AugmentCopy | undefined): void {
    if (this.run.phase !== 'draft') return;
    if (pick && this.offer.some((o) => o.id === pick.id && o.tier === pick.tier)) {
      this.run.takeAugment(pick);
      hook.stats.augmentsTaken += 1;
      this.s.building.cardAdded();
    }
    this.offer = [];
    const seconds = this.run.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between;
    this.buildTotalSec = seconds;
    this.run.startBuild(seconds);
    this.scene.scene.resume();
  }

  private clearWave(): void {
    const bonus = this.run.clearWave();
    hook.stats.wavesCleared += 1;
    this.s.sfx?.waveClear();
    this.s.fx.popText(this.s.board.width / 2, this.s.board.height / 2, `Wave ${this.run.wave} cleared  +${bonus}`, PALETTE.greenDeep);
    this.openDraft();
  }

  private endRun(): void {
    hook.stats.runsLost += 1;
    this.scene.scene.stop(SCENES.hud);
    this.scene.scene.start(SCENES.gameOver);
  }
}
