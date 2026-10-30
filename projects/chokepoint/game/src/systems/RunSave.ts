import { BUILD_SEC } from '../config';
import { mapExtraBends } from '../core/map';
import type { RunPhase } from '../core/run';
import { clearSavedRun, saveRun, type RunStore, type SavedRun } from '../core/saveRun';
import { Tower } from '../entities/Tower';
import type { GameScene } from '../scenes/GameScene';

/**
 * Keeps a run alive when the tab closes: writes the save when the run enters the build phase
 * (after every draft) or the wave phase (when the countdown ends), each overwriting the last,
 * clears it when the run is over, and puts a saved run back when the menu resumes it.
 */
export class RunSave {
  private phase: RunPhase | '' = '';

  constructor(
    private readonly game: GameScene,
    private readonly store: RunStore,
  ) {}

  /** Each frame: on a phase change, save into build or wave, clear into over; never into draft. */
  update(): void {
    const phase = this.game.run.phase;
    if (phase === this.phase) return;
    this.phase = phase;
    if (phase === 'build' || phase === 'wave') this.persist(phase);
    else if (phase === 'over') clearSavedRun(this.store);
  }

  private persist(phase: 'build' | 'wave'): void {
    const run = this.game.run;
    saveRun(this.store, {
      v: 1,
      seed: run.seed,
      bgen: run.bgen,
      cols: this.game.board.map.cols,
      rows: this.game.board.map.rows,
      bends: mapExtraBends(this.game.board.map),
      lengthMul: this.game.mapLengthMul,
      gold: run.gold,
      lives: run.lives,
      mode: run.mode,
      wave: run.wave,
      phase,
      hand: run.hand.map((c) => ({ id: c.id, tier: c.tier })),
      kills: run.kills,
      cleanWaves: run.cleanWaves,
      streakPaid: run.streakPaid,
      rerollsUsed: run.rerollsUsed,
      level: [...run.level],
      towers: this.game.towers.towers.map((t) => ({
        col: t.cell.col,
        row: t.cell.row,
        slots: t.slots,
        augments: t.augments.map((a) => ({ id: a.id, tier: a.tier })),
      })),
    });
  }

  /** Puts a saved run back on this fresh scene: the board already came from its seed, now the rest. */
  restore(saved: SavedRun): void {
    const game = this.game;
    const run = game.run;
    run.gold = saved.gold;
    run.lives = saved.lives;
    run.mode = saved.mode;
    run.level = saved.level;
    run.wave = saved.wave;
    run.kills = saved.kills;
    run.cleanWaves = saved.cleanWaves;
    run.streakPaid = saved.streakPaid;
    run.rerollsUsed = saved.rerollsUsed;
    run.hand = saved.hand.map((c) => ({ id: c.id, tier: c.tier }));
    for (const t of saved.towers) {
      const cell = { col: t.col, row: t.row };
      // Not through TowerSystem.build(): that would spend gold and play the build sound.
      const c = game.board.centerOf(cell);
      const tower = new Tower(game, c.x, c.y, cell);
      game.board.place(cell, tower);
      game.towers.towers.push(tower);
      tower.slots = t.slots;
      for (const a of t.augments) tower.addAugment(a);
    }
    if (saved.phase === 'build') {
      const seconds = saved.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between;
      game.flow.buildTotalSec = seconds;
      run.startBuild(seconds);
      game.waves.planNext(); // the countdown leads into this wave (its plan feeds the preview and the waves.next check)
    } else {
      // startWave() counts the wave back up and replans it from its first spawn.
      run.wave = saved.wave - 1;
      run.phase = 'build';
      game.waves.start();
    }
    if (run.hand.length > 0) game.building.cardAdded();
  }
}
