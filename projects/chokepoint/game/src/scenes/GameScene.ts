import Phaser from 'phaser';
import { MusicBed } from '../audio/music';
import { GRID, HUD, ROCKS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { capLevelChoice } from '../core/levels';
import { cellsBesidePath, generateMap } from '../core/map';
import { loadProfile } from '../core/profile';
import { RunState } from '../core/run';
import type { SavedRun } from '../core/saveRun';
import { boardBends, boardChokes, boardLengthMul, startBonuses } from '../core/tech';
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
    const iron = this.registry.pop('ironMode') === true;
    const seed = saved ? saved.seed : (flags.seed ?? ghost?.seed ?? Math.floor(Math.random() * 2 ** 31));
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
      // New and ghost runs take the profile's level-augment choice, capped at its slots.
      this.run.level = capLevelChoice(profile.levelSlots, profile.levelOn);
    }
    // The board's tech nodes wind new runs' roads one turn further, lengthen them, and with
    // "Two chokes" fold them back for a second choke cell; a resumed run keeps its saved board
    // (its own bends, length and chokes), and a ghost run replays the best board as generated
    // (0 bends, length 1, the owned nodes' choke count).
    const bends = saved ? saved.bends : ghost === undefined ? boardBends(loadProfile(window.localStorage).purchased) : 0;
    const lengthMul = saved ? saved.lengthMul : ghost === undefined ? boardLengthMul(loadProfile(window.localStorage).purchased) : 1;
    const chokes = saved ? saved.chokes : boardChokes(loadProfile(window.localStorage).purchased);
    const view = viewSize(this);
    const portrait = saved ? saved.rows > saved.cols : view.height > view.width;
    const map = generateMap(this.run.rng, portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, bends, lengthMul, this.run.bgen, chokes);
    this.mapLengthMul = lengthMul;
    this.mapChokes = chokes;

    this.board = new Board(this, map);
    this.fx = new FxSystem(this, sfx);
    this.enemies = new EnemySystem(this, this.board, this.run, this.fx, sfx);
    this.exitWarn = new ExitWarning(this, this.board, this.enemies, sfx);
    this.music = new MusicBed(sfx);
    this.leakCost = new LeakCost(this.run, this.fx, this.board);
    this.waves = new WaveSystem(this.run, this.enemies);
    this.projectiles = new ProjectileSystem(this, this.enemies);
    this.towers = new TowerSystem(this, this.board, this.run, this.enemies, this.projectiles, this.fx, sfx);
    this.enemies.towers = () => this.towers.towers; // a kill pays the mints around it (core/mint.ts)
    this.enemies.projectiles = () => this.projectiles; // a beam's kill needles fly through the projectile pool (T0242)
    this.registry.set('waves', this.waves);
    this.ghost = new TowerGhost(this);
    this.building = new Building(this.run, this.board, this.towers, this.fx, sfx, this.ghost);
    this.flow = new RunFlow(this, this.run, {
      board: this.board,
      building: this.building,
      waves: this.waves,
      enemies: this.enemies,
      towers: this.towers,
      projectiles: this.projectiles,
      fx: this.fx,
      sfx,
    });
    this.speed = new WaveSpeed();
    this.rally = new RallySystem(this, this.towers, this.fx);
    this.haste = new HasteSystem(this.towers, this.enemies);
    this.beams = new BeamSystem(this, this.towers, this.enemies, sfx);
    this.saver = new RunSave(this, window.localStorage);
    if (saved) this.saver.restore(saved);
    this.windup = new PushWindup(this, this.towers);
    this.comboBar = new ComboBar(this, this.fx);

    this.board.layout(view.width, view.height);
    onResize(this, (w, h) => this.board.layout(w, h));
    new BoardGestures(this, this.board, {
      tap: (p) => {
        if (this.inPlayArea(p)) this.building.tap(p.worldX, p.worldY);
      },
      hover: (p) => this.building.hover(this.inPlayArea(p) ? p.worldX : undefined, p.worldY),
      dragStart: () => { this.board.showHover(undefined, false, 0); this.building.dragStarted(); },
    });
    bindHotkeys(this);
    registerRunChecks(this);
    // Only spots on screen between the HUD bars: zoomed in, some cells are out of view.
    hook.setBuildSpots(() =>
      cellsBesidePath(map)
        .filter((c) => this.board.canBuild(c))
        .map((c) => this.board.toScreen(this.board.centerOf(c)))
        .filter((p) => p.x > 0 && p.x < viewSize(this).width && p.y > HUD.top && p.y < viewSize(this).height - HUD.bottom),
    );
    this.events.once('shutdown', () => {
      sfx?.stopBeamHums(); // held hums must not outlive the run (the Sfx singleton does)
      this.music.stop(); // the bed's fade and ringing notes must not outlive the run (the Sfx singleton does)
      hook.clearInvariants();
      hook.setBuildSpots(() => []);
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

  openPause(): void {
    if (!this.scene.isActive() || this.run.phase === 'over') return;
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
    this.music.update(simDt, this.run.phase === 'wave', this.exitWarn.live); // after, so `live` is this frame's
    this.leakCost.update(simDt);
    this.rally.update(simDt);
    this.haste.update(simDt);
    this.beams.update(simDt);
    this.windup.update(simDt);
    this.comboBar.update();
    syncHookStats(this);
  }
}
