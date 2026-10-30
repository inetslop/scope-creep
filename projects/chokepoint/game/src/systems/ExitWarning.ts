import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { paintExitWarn } from '../art/board';
import { artScale } from '../art/textures';
import type { Board } from './Board';
import type { EnemySystem } from './EnemySystem';
import type { Sfx } from '../audio/Sfx';

/**
 * The leak warning: when the enemy closest to the exit is within 3 s of reaching it, a red copy
 * of the exit gate pulses over it, with a quiet tick per pulse, so a leak is never a surprise.
 * Driven by `dt` from GameScene, so it freezes while the scene is paused; the single `t`
 * accumulator keeps the scale and the tick in sync — exactly one tick per 0.4 s pulse, no
 * matter how many enemies are in range.
 */
export class ExitWarning {
  private readonly board: Board;
  private readonly enemies: EnemySystem;
  private readonly sfx: Sfx | undefined;
  private readonly img: Phaser.GameObjects.Image;
  private t = 0;
  private active = false;

  constructor(scene: Phaser.Scene, board: Board, enemies: EnemySystem, sfx: Sfx | undefined) {
    this.board = board;
    this.enemies = enemies;
    this.sfx = sfx;
    const pts = board.path.points;
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    this.img = scene.add.image(x, y, paintExitWarn(scene));
    artScale(this.img);
    this.img.setDepth(DEPTH.preview).setVisible(false);
  }

  /** The warning's own state: any living enemy within 3 s of the exit (the wave bed reads it). */
  get live(): boolean { return this.active; }

  update(dt: number): void {
    if (!this.inRange()) {
      this.active = false;
      this.t = 0;
      this.img.setVisible(false);
      return;
    }
    if (!this.active) {
      this.active = true;
      this.t = 0;
      this.sfx?.leakWarn();
    }
    this.t += dt;
    while (this.t >= 0.4) {
      this.t -= 0.4;
      this.sfx?.leakWarn();
    }
    artScale(this.img, 1 + 0.15 * Math.sin((this.t / 0.4) * Math.PI));
    this.img.setVisible(true);
  }

  /** Any alive enemy within 3 s of the exit, at its current speed (slows included). */
  private inRange(): boolean {
    const len = this.board.path.length;
    for (const e of this.enemies.all) {
      if (!e.active) continue;
      const speed = e.speed * (1 - e.slowPct);
      if (speed > 0 && (len - e.distance) / speed <= 3) return true;
    }
    return false;
  }

  /** Invariant: a visible warning has a finite position and scale. */
  broken(): string | undefined {
    if (!this.img.visible) return undefined;
    return Number.isFinite(this.img.x) && Number.isFinite(this.img.scaleX)
      ? undefined
      : `exit warn at (${this.img.x}, ${this.img.y})`;
  }
}
