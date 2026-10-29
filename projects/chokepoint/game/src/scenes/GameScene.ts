import Phaser from 'phaser';
import { GRID, HUD, ROCKS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { cellsBesidePath, generateMap } from '../core/map';
import { RunState } from '../core/run';
import type { SavedRun } from '../core/saveRun';
import { flags } from '../debug/flags';
import { registerRunChecks, syncHookStats } from '../debug/runChecks';
import { hook } from '../debug/testHook';
import { BoardGestures } from '../input/BoardGestures';
import { bindHotkeys } from '../input/hotkeys';
import { BeamSystem } from '../systems/BeamSystem';
import { Board } from '../systems/Board';
import { Building } from '../systems/Building';
import { EnemySystem } from '../systems/EnemySystem';
import { ExitWarning } from '../systems/ExitWarning';
import { FxSystem } from '../systems/FxSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { PushWindup } from '../systems/PushWindup';
import { RallySystem } from '../systems/RallySystem';
import { RunFlow } from '../systems/RunFlow';
import { RunSave } from '../systems/RunSave';
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
  board!: Board;
  building!: Building;
  flow!: RunFlow;
  saver!: RunSave;
  speed!: WaveSpeed;
  rally!: RallySystem;
  beams!: BeamSystem;
  towers!: TowerSystem;
  enemies!: EnemySystem;
  waves!: WaveSystem;
  projectiles!: ProjectileSystem;
  fx!: FxSystem;
  exitWarn!: ExitWarning;
  windup!: PushWindup;

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
    const ghostSeed = this.registry.pop('ghostSeed') as number | undefined;
    this.run = new RunState(saved ? saved.seed : (flags.seed ?? ghostSeed ?? Math.floor(Math.random() * 2 ** 31)));
    this.registry.set('run', this.run);
    const view = viewSize(this);
    const portrait = saved ? saved.rows > saved.cols : view.height > view.width;
    const map = generateMap(this.run.rng, portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS);

    this.board = new Board(this, map);
    this.fx = new FxSystem(this);
    this.enemies = new EnemySystem(this, this.board, this.run, this.fx, sfx);
    this.exitWarn = new ExitWarning(this, this.board, this.enemies, sfx);
    this.waves = new WaveSystem(this.run, this.enemies);
    this.projectiles = new ProjectileSystem(this, this.enemies);
    this.towers = new TowerSystem(this, this.board, this.run, this.enemies, this.projectiles, this.fx, sfx);
    this.enemies.towers = () => this.towers.towers; // a kill pays the mints around it (core/mint.ts)
    this.building = new Building(this.run, this.board, this.towers, this.fx, sfx);
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
    this.beams = new BeamSystem(this, this.towers, this.enemies);
    this.saver = new RunSave(this, window.localStorage);
    if (saved) this.saver.restore(saved);
    this.windup = new PushWindup(this, this.towers);

    this.board.layout(view.width, view.height);
    onResize(this, (w, h) => this.board.layout(w, h));
    new BoardGestures(this, this.board, {
      tap: (p) => {
        if (this.inPlayArea(p)) this.building.tap(p.worldX, p.worldY);
      },
      hover: (p) => this.building.hover(this.inPlayArea(p) ? p.worldX : undefined, p.worldY),
      dragStart: () => this.board.showHover(undefined, false, 0),
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
    this.rally.update(simDt);
    this.beams.update(simDt);
    this.windup.update(simDt);
    syncHookStats(this);
  }
}
