import Phaser from 'phaser';
import { MusicBed } from '../audio/music';
import { BuildBed } from '../audio/buildBed';
import { GRID, HUD, ROCKS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import type { DailyPick } from '../core/daily';
import { farGateDistance } from '../core/farGate';
import { isLastStand } from '../core/lastStand';
import { cellsBesidePath, generateMap } from '../core/map';
import { markedCell } from '../core/markedCell';
import { loadProfile } from '../core/profile';
import { RunState } from '../core/run';
import type { SavedRun } from '../core/saveRun';
import { boardBends, boardChokes, boardFarGate, boardFold, boardLengthMul, startBonuses } from '../core/tech';
import { draftTech } from '../core/techEffects';
import { flags } from '../debug/flags';
import { registerRunChecks, syncHookStats } from '../debug/runChecks';
import { hook } from '../debug/testHook';
import { BoardGestures } from '../input/BoardGestures';
import { bindHotkeys } from '../input/hotkeys';
import { BeamSystem } from '../systems/BeamSystem';
import { Board } from '../systems/Board';
import { Building } from '../systems/Building';
import { ComboBar } from '../systems/ComboBar';
import { EnemySystem } from '../systems/EnemySystem';
import { ExitWarning } from '../systems/ExitWarning';
import { FxSystem } from '../systems/FxSystem';
import { HasteSystem } from '../systems/HasteSystem';
import { LeakCost } from '../systems/LeakCost';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { PushWindup } from '../systems/PushWindup';
import { RallySystem } from '../systems/RallySystem';
import { RunFlow } from '../systems/RunFlow';
import { RunSave } from '../systems/RunSave';
import { TowerGhost } from '../systems/towerGhost';
import { TowerSystem } from '../systems/TowerSystem';
import { WaveSpeed } from '../systems/WaveSpeed';
import { WaveSystem } from '../systems/WaveSystem';
import { pointerCss, viewSize } from '../ui/display';
import type { PlaceButtonsOnScreen } from '../ui/hud/PlaceConfirm';
import { getSfx, onResize, SCENES } from './keys';

/**
 * One run. This scene only wires things together; each concern has its own module:
 * - systems/RunFlow.ts: the phases (draft, build, wave, game over) and what runs in each;
 * - systems/Building.ts: the hand, the selection, what a tap on the board does;
 * - input/BoardGestures.ts and input/hotkeys.ts: pointers and keys;
 * - systems/*: the board, waves, enemies, towers, projectiles, effects;
 * - debug/runChecks.ts: the smoke test's invariants and live stats.
 * The HUD (ui/hud/) and the overlays reach the systems through getGameScene().
 */
export class GameScene extends Phaser.Scene {
  run!: RunState;
  /** The extra starting lives from owned life nodes (the run's invariants allow for them). */
  techLife = 0;
  /** The road length multiplier this board was generated with (the save round-trips it; the board shape can't tell a long road from a plain one). */
  mapLengthMul = 1;
  /** The choke cells this board was generated with (the save round-trips it; 2 for the "Two chokes" node). */
  mapChokes = 1;
  /** The switchback fold this board was generated with (the save round-trips it; 1 for the "The switchback" node). */
  mapFold = 0;
  board!: Board;
  building!: Building;
  ghost!: TowerGhost;
  flow!: RunFlow;
  saver!: RunSave;
  speed!: WaveSpeed;
  rally!: RallySystem;
  haste!: HasteSystem;
  beams!: BeamSystem;
  towers!: TowerSystem;
  enemies!: EnemySystem;
  waves!: WaveSystem;
  projectiles!: ProjectileSystem;
  fx!: FxSystem;
  exitWarn!: ExitWarning;
  music!: MusicBed;
  buildBed!: BuildBed;
  leakCost!: LeakCost;
  windup!: PushWindup;
  comboBar!: ComboBar;

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    hook.scene = SCENES.game;
    hook.overlay = '';
    hook.stats.runsStarted += 1;
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const sfx = getSfx(this);

    const saved = this.registry.pop('resumeRun') as SavedRun | undefined;
    const ghost = this.registry.pop('ghostSeed') as { seed: number; bgen: number } | undefined;
    const pick = this.registry.pop('dailyPick') as DailyPick | undefined;
    const iron = this.registry.pop('ironMode') === true;
    const seed = saved ? saved.seed : (pick ? pick.seed : (flags.seed ?? ghost?.seed ?? Math.floor(Math.random() * 2 ** 31)));
    const bgen = saved ? saved.bgen : (ghost ? ghost.bgen : 2);
    // The profile's purchased tech nodes at run start gate the draft's pool (Haste's `tech`).
    const purchased = loadProfile(window.localStorage).purchased;
    this.run = new RunState(seed, purchased, bgen);
    this.registry.set('run', this.run);
    // New and ghost runs start with the owned tech tree's bonuses; a resumed run keeps its saved numbers.
    if (!saved) {
      const profile = loadProfile(window.localStorage);
      const tech = startBonuses(profile.purchased);
      this.run.gold += tech.gold;
      if (iron) { this.run.mode = 'iron'; this.run.lives = 1; } // the "Life +1" nodes don't apply; gold still does (line above)
      else { this.run.lives += tech.life; this.techLife = tech.life; }
      const draft = draftTech(profile.purchased);
      this.run.slotDiscount = draft.slotDiscount;
      this.run.fourthCard = draft.fourthCard;
      // The picked board's augments; ghost and "again" runs play at level 0 (no pick step).
      this.run.level = pick ? pick.level : [];
    }
    // The board's tech nodes wind new runs' roads one turn further, lengthen them, with "Two
    // chokes" fold them back for a second choke cell, and with "The switchback" give them a fold
    // on themselves mid-board; with the wave branch's "The door" every board also carries the far
    // gate (it is not saved: a resumed board regrows it from the seed); a resumed run keeps its
    // saved board (its own bends, length, chokes and fold), and a ghost run replays the best board
    // as generated (0 bends, length 1, the owned nodes' choke count and fold).
    const bends = saved ? saved.bends : ghost === undefined ? boardBends(loadProfile(window.localStorage).purchased) : 0;
    const lengthMul = saved ? saved.lengthMul : ghost === undefined ? boardLengthMul(loadProfile(window.localStorage).purchased) : 1;
    const chokes = saved ? saved.chokes : boardChokes(loadProfile(window.localStorage).purchased);
    const fold = saved ? saved.fold === 1 : boardFold(loadProfile(window.localStorage).purchased);
    const farGate = boardFarGate(loadProfile(window.localStorage).purchased);
    const view = viewSize(this);
    const portrait = saved ? saved.rows > saved.cols : view.height > view.width;
    const map = generateMap(this.run.rng, portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, bends, lengthMul, this.run.bgen, chokes, fold, farGate);
    const marked = markedCell(map, seed); // the board's one +25% cell: from its own seed, never run.rng
    this.mapLengthMul = lengthMul;
    this.mapChokes = chokes;
    this.mapFold = fold ? 1 : 0;

    this.board = new Board(this, map, marked);
    this.fx = new FxSystem(this, sfx);
    this.enemies = new EnemySystem(this, this.board, this.run, this.fx, sfx);
    this.exitWarn = new ExitWarning(this, this.board, this.enemies, sfx);
    this.music = new MusicBed(sfx);
    this.buildBed = new BuildBed(sfx);
    this.leakCost = new LeakCost(this.run, this.fx, this.board);
    this.waves = new WaveSystem(this.run, this.enemies, farGateDistance(map), map.fork !== undefined);
    this.projectiles = new ProjectileSystem(this, this.enemies);
    this.towers = new TowerSystem(this, this.board, this.run, this.enemies, this.projectiles, this.fx, sfx);
    this.enemies.towers = () => this.towers.towers; // a kill pays the mints around it (core/mint.ts)
    this.registry.set('waves', this.waves);
    this.ghost = new TowerGhost(this);
    this.building = new Building(this.run, this.board, this.towers, this.fx, sfx, this.ghost, loadProfile(window.localStorage).runsPlayed);
    this.flow = new RunFlow(this, this.run, {
      board: this.board,
      building: this.building,
      waves: this.waves,
      enemies: this.enemies,
      towers: this.towers,
      projectiles: this.projectiles,
      fx: this.fx,
      sfx,
      firstRun: loadProfile(window.localStorage).runsPlayed === 0, // a resumed first run is still first: the profile only counts finished runs
    });
    this.speed = new WaveSpeed(sfx);
    this.rally = new RallySystem(this, this.towers, this.fx);
    this.haste = new HasteSystem(this, this.towers, this.enemies);
    this.beams = new BeamSystem(this, this.towers, this.enemies, sfx);
    this.saver = new RunSave(this, window.localStorage);
    if (saved) this.saver.restore(saved);
    this.windup = new PushWindup(this, this.towers);
    this.comboBar = new ComboBar(this, this.fx);

    this.board.layout(view.width, view.height);
    onResize(this, (w, h) => this.board.layout(w, h));
    new BoardGestures(this, this.board, {
      tap: (p) => {
        if (this.overPlaceButtons(p)) return; // a tap on the ✓/✗ is the buttons', not the board's
        if (this.inPlayArea(p)) this.building.tap(p.worldX, p.worldY, p.wasTouch);
      },
      hover: (p) => this.building.hover(this.inPlayArea(p) ? p.worldX : undefined, p.worldY),
      dragStart: () => { this.board.showHover(undefined, false, 0); this.building.dragStarted(); },
    });
    bindHotkeys(this);
    registerRunChecks(this);
    // Only spots on screen between the HUD bars: zoomed in, some cells are out of view. While a
    // touch placement waits, the ✓'s point comes first: a tap on it builds the waiting tower.
    hook.setBuildSpots(() => {
      const spots = cellsBesidePath(map)
        .filter((c) => this.board.canBuild(c))
        .map((c) => this.board.toScreen(this.board.centerOf(c)))
        .filter((p) => p.x > 0 && p.x < viewSize(this).width && p.y > HUD.top && p.y < viewSize(this).height - HUD.bottom);
      const b = this.registry.get('placeButtons') as { confirm: { x: number; y: number } } | undefined;
      return b ? [{ x: b.confirm.x, y: b.confirm.y }, ...spots] : spots;
    });
    this.events.once('shutdown', () => {
      sfx?.stopBeamHums(); // held hums must not outlive the run (the Sfx singleton does)
      sfx?.skyNoteStop(); // the sky's note must not outlive the run, like the hums
      this.music.stop(); // the bed's fade and ringing notes must not outlive the run (the Sfx singleton does)
      this.buildBed.stop(); // the build bed's fade and ringing notes must not outlive the run
      hook.clearInvariants();
      hook.setBuildSpots(() => []);
      this.registry.set('placeButtons', undefined); // a stale skip must not leak into the next run
    });

    this.scene.launch(SCENES.hud);
    if (!saved) this.flow.openDraft();
  }

  /**
   * Between the HUD bars. Zoomed in, the board runs on under the HUD; a tap or hover there (between
   * the cards) would build where the player can barely see, so only drags and pinches work there.
   */
  private inPlayArea(p: Phaser.Input.Pointer): boolean {
    const y = pointerCss(p).y;
    return y > HUD.top && y < viewSize(this).height - HUD.bottom;
  }

  /** On the ✓/✗ of the waiting touch placement (ui/hud/PlaceConfirm.ts): the tap is theirs, not the board's. */
  private overPlaceButtons(p: Phaser.Input.Pointer): boolean {
    const b = this.registry.get('placeButtons') as PlaceButtonsOnScreen | undefined;
    if (!b) return false;
    const at = pointerCss(p);
    return Phaser.Math.Distance.Between(at.x, at.y, b.confirm.x, b.confirm.y) <= b.confirm.r
      || Phaser.Math.Distance.Between(at.x, at.y, b.cancel.x, b.cancel.y) <= b.cancel.r;
  }

  openPause(): void {
    if (!this.scene.isActive() || this.run.phase === 'over') return;
    this.building.cancelPending();
    this.scene.launch(SCENES.pause);
    this.scene.pause();
  }

  /** PauseScene closed. */
  closePause(): void {
    this.scene.resume();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const simDt = this.speed.scale(dt, this.run.phase === 'wave');
    this.flow.update(simDt);
    this.saver.update();
    this.exitWarn.update(simDt);
    this.music.update(dt, simDt, this.run.phase === 'wave', isLastStand(this.run), this.exitWarn.live); // after, so `live` is this frame's
    this.buildBed.update(dt, this.run.phase === 'build', isLastStand(this.run)); // real seconds: the build countdown never fast-forwards
    this.leakCost.update(simDt);
    this.rally.update(simDt);
    this.haste.update(simDt);
    this.beams.update(simDt);
    this.windup.update(simDt);
    this.comboBar.update();
    syncHookStats(this);
  }
}
