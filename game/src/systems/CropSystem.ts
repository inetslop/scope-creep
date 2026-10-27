import type Phaser from 'phaser';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS } from '../config';
import { PALETTE } from '../content/palette';
import { CROP, cropSafeFraction } from '../core/crop';
import type { RunState } from '../core/run';
import type { Player } from '../entities/Player';
import type { DamageNumbers } from './DamageNumbers';

/** Crop-mark leg length (world units) and the gap between burn numbers. */
const MARK = 24;
const NUMBER_EVERY = 0.5;

/**
 * Late-run pressure: after 12:00 the page gets cropped — the safe rectangle
 * shrinks toward the center, the margin is darker paper with ink crop marks on
 * its corners, and the player burns while any part of them is in the margin.
 * The burn is a continuous drain (no armor, no invulnerability window, no shake);
 * a small red number pops every 0.5 s. Enemies, bullets, shards and bosses are
 * unaffected. See src/core/crop.ts for the schedule.
 */
export class CropSystem {
  /** Total burn dealt this run; GameScene reports it as hook.stats.cropDamageTaken. */
  totalDamage = 0;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly damageNumbers: DamageNumbers;
  private readonly g: Phaser.GameObjects.Graphics;
  private numberTimer = 0;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, damageNumbers: DamageNumbers) {
    this.run = run;
    this.player = player;
    this.damageNumbers = damageNumbers;
    this.g = scene.add.graphics().setDepth(DEPTH.floor + 1); // above the floor, below the arena walls
  }

  update(dt: number): void {
    const g = this.g;
    g.clear();
    if (this.run.timeSec < CROP.startSec) return; // before 12:00: no marks, no margin, no burn
    const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
    const a = ARENA_SIZE / 2;
    g.fillStyle(PALETTE.paperDark, 1); // margin: four darker-paper strips (Graphics has no holes)
    g.fillRect(-a, -a, ARENA_SIZE, -half + a);
    g.fillRect(-a, half, ARENA_SIZE, a - half);
    g.fillRect(-a, -half, -half + a, 2 * half);
    g.fillRect(half, -half, a - half, 2 * half);
    g.lineStyle(3, PALETTE.ink, 1); // crop marks: ink L at each safe-rect corner, legs into the margin
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      g.lineBetween(sx * half, sy * half, sx * (half + MARK), sy * half);
      g.lineBetween(sx * half, sy * half, sx * half, sy * (half + MARK));
    }
    const outside = this.player.x - PLAYER_RADIUS < -half || this.player.x + PLAYER_RADIUS > half ||
      this.player.y - PLAYER_RADIUS < -half || this.player.y + PLAYER_RADIUS > half;
    if (outside && !this.run.isDead) {
      this.totalDamage += this.run.drain(CROP.burnPerSec * dt);
      this.numberTimer -= dt;
      if (this.numberTimer <= 0) {
        this.numberTimer = NUMBER_EVERY;
        this.damageNumbers.show(this.player.x, this.player.y - 24, CROP.burnPerSec * NUMBER_EVERY, false, true);
      }
    } else {
      this.numberTimer = 0; // re-entering the margin pops a number immediately
    }
  }
}
