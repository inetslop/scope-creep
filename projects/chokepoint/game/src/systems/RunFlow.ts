import { BUILD_SEC } from '../config';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { draftPool, rollOffer } from '../core/augments';
import { isLevelClear, isRunWin, levelOfWave } from '../core/level';
import type { RunState } from '../core/run';
import { draftCardsFor } from '../core/techEffects';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import type { GameScene } from '../scenes/GameScene';
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
  /** The ids of the last offer: the next draft (and its reroll) does not offer them again. */
  private lastOffer: string[] = [];
  /** The wave the open draft rolls its odds for (the one after run.wave). */
  draftWave = 1;
  /** Length of the current build countdown (the HUD draws its ring from it). */
  buildTotalSec = 0;
  /** The cleared wave that re-grows the board (10 or 20); the LevelClearBanner shows its card once per wave number. */
  pendingLevelClear = 0;

  constructor(
    private readonly scene: GameScene,
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

  /** "Next wave" button / Space: bank the build countdown — 2 gold per whole second left — then start the wave the way the countdown end does.
   * Returns the gold banked (0 in the last partial second: it just starts the wave). */
  startWaveNow(): number {
    if (this.run.phase !== 'build' || !this.scene.scene.isActive()) return 0;
    const banked = this.run.bankSend();
    this.s.waves.start();
    this.s.sfx?.waveStart();
    return banked;
  }

  /** Offers the draft's cards — three, four on every fifth draft (DraftScene); finishDraft starts the next build phase. */
  openDraft(): void {
    this.run.phase = 'draft';
    this.draftWave = this.run.wave + 1;
    // The pool respects the tech-gated augments (Haste): owned at run start, or not at all.
    this.offer = rollOffer(this.run.rng, draftPool(this.run.techOwned), draftCardsFor(this.draftWave, this.run.fourthCard), this.draftWave, this.run.wave === 0, this.lastOffer);
    this.lastOffer = this.offer.map((c) => c.id);
    if (this.offer.length === 0) {
      this.finishDraft(undefined);
      return;
    }
    this.scene.scene.launch(SCENES.draft);
    this.scene.scene.pause();
  }

  /** The draft's reroll: pay for the run's next one (the price climbs with the run's count) and re-roll all of the draft's cards. */
  rerollOffer(): boolean {
    if (this.run.phase !== 'draft') return false;
    if (!this.run.reroll()) return false;
    this.offer = rollOffer(this.run.rng, draftPool(this.run.techOwned), draftCardsFor(this.draftWave, this.run.fourthCard), this.draftWave, this.run.wave === 0, this.lastOffer);
    this.lastOffer = this.offer.map((c) => c.id);
    return true;
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
    this.s.waves.planNext();
    this.scene.scene.resume();
    if (flags.smoke) this.s.building.autoBuild(); // a random tap may never build the first tower in time
  }

  private clearWave(): void {
    const cleanBefore = this.run.cleanWaves;
    const streakPaidBefore = this.run.streakPaid;
    const bonus = this.run.clearWave();
    this.s.waves.waveEnded();
    const clean = this.run.cleanWaves > cleanBefore;
    hook.stats.wavesCleared += 1;
    this.s.sfx?.waveClear();
    this.s.sfx?.waveSweep();
    const cx = this.s.board.width / 2;
    const cy = this.s.board.height / 2;
    this.s.fx.popText(cx, cy, `Wave ${this.run.wave} cleared  +${bonus}`, PALETTE.greenDeep);
    if (isRunWin(this.run.wave)) {
      // Wave 30: the run is won — the game-over card a beat after the cleared text.
      this.run.phase = 'won';
      this.scene.time.delayedCall(1000, () => this.winRun());
      return;
    }
    if (isLevelClear(this.run.wave)) {
      // Wave 10 or 20: the level is done — the banner shows, the board re-grows, then the draft.
      this.run.level = levelOfWave(this.run.wave + 1);
      this.pendingLevelClear = this.run.wave;
      if (clean) this.s.fx.cleanLines(cx, cy + 40, this.run.cleanStreakLine(!streakPaidBefore && this.run.streakPaid));
      this.scene.time.delayedCall(1000, () => { this.scene.regrowBoard(this.run.level); this.openDraft(); });
      return;
    }
    if (clean) {
      const second = this.run.cleanStreakLine(!streakPaidBefore && this.run.streakPaid);
      // Under the wave-cleared text, for the beat before the draft veils the board.
      this.s.fx.cleanLines(cx, cy + 40, second);
      this.scene.time.delayedCall(1000, () => this.openDraft());
    } else {
      this.openDraft();
    }
  }

  private endRun(): void {
    hook.stats.runsLost += 1;
    this.toGameOver();
  }

  /** Wave 30 cleared: the win ends the run the same way a loss does (no loss count). */
  private winRun(): void {
    this.toGameOver();
  }

  private toGameOver(): void {
    this.scene.registry.set('towerKills', this.s.towers.towers.map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills })));
    this.scene.scene.stop(SCENES.hud);
    this.scene.scene.start(SCENES.gameOver);
  }
}
