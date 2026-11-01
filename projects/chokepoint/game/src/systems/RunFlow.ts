import type Phaser from 'phaser';
import { BUILD_SEC } from '../config';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import { draftPool, rollOffer } from '../core/augments';
import { farGateSplit } from '../core/farGate';
import type { RunState } from '../core/run';
import { isBossWave } from '../core/waves';
import { draftCardsFor } from '../core/techEffects';
import { heldPay } from '../content/tech/claim';
import { LEVEL_UNLOCK_WAVE, levelBuildSeconds } from '../core/levels';
import { clearSavedRun } from '../core/saveRun';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { SCENES } from '../scenes/keys';
import type { Sfx } from '../audio/Sfx';
import { viewSize } from '../ui/display';
import type { Board } from './Board';
import type { Building } from './Building';
import type { EnemySystem } from './EnemySystem';
import type { FxSystem } from './FxSystem';
import { farGateSend } from './fx/farGateSend';
import { buildHoldRoad, fadeHoldRoad, placeHoldRoad } from './fx/holdRoad';
import { streakTeach } from './fx/streakTeach';
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
  /** The profile still has no finished run (recordRun adds one only at run end): the wave-1 teach may show. */
  firstRun: boolean;
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
  /** The wave-1 teach's card while it is up; undefined while it fades out. */
  private holdBox: Phaser.GameObjects.Container | undefined;

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
    this.s.building.syncTeach(); // the first run's build teach re-derives each frame (T0319)
    this.s.building.syncPending(); // a drag or hover cleared the waiting placement's preview
    if (run.phase === 'build') {
      run.buildLeftSec -= dt;
      if (run.buildLeftSec <= 0) {
        this.s.building.cancelPending();
        this.s.waves.start();
        this.s.sfx?.waveStart();
        this.farGatePulse();
      }
    }
    if (run.phase === 'wave') {
      this.s.waves.update(dt);
      this.s.enemies.update(dt);
      this.s.towers.update(dt);
      this.s.projectiles.update(dt);
      if (run.over) {
        this.heldMoment(); // the death wave pays its held coins, like any other wave
        this.endRun();
        return;
      }
      if (this.s.waves.spawningDone && this.s.enemies.aliveCount === 0) this.clearWave();
      this.holdRoad(); // after: a clearWave this frame already turned the phase to draft and fades it in the same frame
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
    this.s.building.cancelPending();
    this.s.waves.start();
    this.s.sfx?.waveStart();
    this.farGatePulse();
    return banked;
  }

  /** Offers the draft's cards — three, four on every fifth draft (DraftScene); finishDraft starts the next build phase. */
  openDraft(): void {
    this.s.building.cancelPending();
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
    const base = this.run.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between;
    const seconds = levelBuildSeconds(base, this.run.level);
    this.buildTotalSec = seconds;
    this.run.startBuild(seconds);
    this.s.waves.planNext();
    this.scene.scene.resume();
    if (flags.smoke) this.s.building.autoBuild(); // a random tap may never build the first tower in time
  }

  /** The first run's wave-1 teach, "Hold the road": re-derived from the run on every wave frame (T0272's
   *  pattern, never stored) — up only while the profile has no finished run and wave 1 is in its wave phase,
   *  so a resumed first run re-shows it only while wave 1 is still going, and it is never up on wave 2+. */
  private holdRoad(): void {
    const on = this.s.firstRun && this.run.wave === 1 && this.run.phase === 'wave';
    if (on) {
      if (!this.holdBox) this.holdBox = buildHoldRoad(this.s.fx);
      else placeHoldRoad(this.holdBox, viewSize(this.scene).width); // a resize mid-wave keeps it centered
    } else if (this.holdBox) {
      fadeHoldRoad(this.s.fx, this.holdBox);
      this.holdBox = undefined;
    }
  }

  /** Held pays (the claim branch): a wave that ended having lost lives pays one coin per life
   * lost, with one small muted "+N" pop at the exit and the coin blip's low note. It reads the
   * wave the ledger just closed — the story's last record — so it also pays the death wave from
   * the run.over branch, once, and nothing when the node is not owned or the wave was clean. */
  private heldMoment(): void {
    const last = this.run.story[this.run.story.length - 1];
    if (!last || last.leaks <= 0 || heldPay(this.run.techOwned) <= 0) return;
    const pts = this.s.board.path.points; // the same exit anchor as the Toll blip's pop (tollLeak)
    const ex = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const ey = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    this.s.fx.popText(ex, ey, `+${last.leaks}`, PALETTE.muted);
    this.s.sfx?.coinBlip();
  }

  /** The far gate's send: one muted ring at the far gate when this wave sends its walkers out of it (T0360). */
  private farGatePulse(): void {
    const map = this.s.board.map;
    const fg = map.farGate;
    const plan = this.s.waves.currentPlan;
    // A boss wave sends none through it, and a wave under three has no gate share at all.
    if (!fg || !plan || isBossWave(plan.number) || farGateSplit(plan.spawns.length) <= 0) return;
    const c = this.s.board.centerOf(fg); // the far gate's own cell: where the art draws it (art/board.ts) and its walkers come in
    farGateSend(this.s.fx, c.x, c.y);
  }

  private clearWave(): void {
    const cleanBefore = this.run.cleanWaves;
    const streakPaidBefore = this.run.streakPaid;
    const bonus = this.run.clearWave();
    this.s.waves.waveEnded();
    if (flags.smoke && this.run.wave === 10) { this.scene.scene.pause(); return; } // TEMP T0279 playtest: freeze at the wave-10 clear for the smoke read
    const clean = this.run.cleanWaves > cleanBefore;
    hook.stats.wavesCleared += 1;
    this.s.sfx?.waveClear();
    this.s.sfx?.waveSweep();
    if (!streakPaidBefore && this.run.streakPaid) this.s.sfx?.streakPay(); // the one pay: the note on top of the sweep
    const cx = this.s.board.width / 2;
    const cy = this.s.board.height / 2;
    this.s.fx.popText(cx, cy, `Wave ${this.run.wave} cleared  +${bonus}`, PALETTE.greenDeep);
    this.heldMoment();
    if (clean) {
      const second = this.run.cleanStreakLine(!streakPaidBefore && this.run.streakPaid);
      // Under the wave-cleared text, for the beat before the draft veils the board.
      this.s.fx.cleanLines(cx, cy + 40, second);
      if (cleanBefore === 0) streakTeach(this.s.fx, cx, cy + 40 + 52); // run's first clean wave: cleanWaves still 0, the muted line names the pay
      this.scene.time.delayedCall(1000, () => this.proceedToDraft());
    } else {
      this.proceedToDraft();
    }
  }

  /** The wave-30 milestone opens in place of the draft, once per run; otherwise the draft opens. */
  private proceedToDraft(): void {
    if (this.run.wave === LEVEL_UNLOCK_WAVE && !this.run.milestone30Asked) {
      this.run.milestone30Asked = true;
      this.scene.scene.launch(SCENES.milestone);
      this.scene.scene.pause();
      return;
    }
    this.openDraft();
  }

  /** Quit from the pause card: the run can't be resumed, so it ends as if it were lost (the end
   * card opens titled "Run ended"), its save is cleared, and the run pays from wave 10 on. */
  endRunIntentionally(): void {
    this.run.phase = 'over';
    clearSavedRun(window.localStorage);
    this.scene.registry.set('runEnded', true);
    this.endRun(); // the private one: towerKills flag, hud stop, GameOverScene start
  }

  private endRun(): void {
    this.holdRoad(); // the phase is already 'over': it fades, and the game-over card takes its place
    hook.stats.runsLost += 1;
    this.scene.registry.set('towerKills', this.s.towers.towers.map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills })));
    this.scene.scene.stop(SCENES.hud);
    this.scene.scene.start(SCENES.gameOver);
  }
}
