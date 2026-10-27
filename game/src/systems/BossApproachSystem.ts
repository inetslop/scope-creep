import type Phaser from 'phaser';
import { ARENA_SIZE, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { cropSafeFraction } from '../core/crop';
import type { RunState } from '../core/run';

/** Peak opacity of the pulsing warning line. */
const PULSE_ALPHA = 0.6;
/** One full 0 -> peak -> 0 pulse takes this many seconds. */
const PULSE_PERIOD_SEC = 1;

/**
 * The boss approach warning: in the 5 s before a scheduled boss spawn
 * (core/boss.ts: BOSS_WARNING_SEC) a red ink line pulses along the current
 * safe-area boundary, following the crop marks from 12:00 on. Driven by
 * run.bossApproach, which BossSystem sets and clears; the one soft thud plays
 * from Sfx.bossApproach() there, not here. No persistent art: the Graphics is
 * cleared and hidden the moment the window closes.
 */
export class BossApproachSystem {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly run: RunState;
  private started = false;
  private age = 0;
  private alpha = 0;

  constructor(scene: Phaser.Scene, run: RunState) {
    this.run = run;
    this.g = scene.add.graphics().setDepth(DEPTH.arena + 1).setVisible(false); // above the arena walls, below pickups
  }

  get pulseVisible(): boolean {
    return this.g.visible;
  }

  get pulseAlpha(): number {
    return this.alpha;
  }

  update(dt: number): void {
    if (!this.run.bossApproach) {
      if (this.started) {
        this.started = false;
        this.alpha = 0;
        this.g.clear().setVisible(false);
      }
      return;
    }
    if (!this.started) this.age = 0; // a fresh window starts its pulse from 0
    this.started = true;
    this.age += dt;
    const t = (this.age % PULSE_PERIOD_SEC) / PULSE_PERIOD_SEC;
    this.alpha = PULSE_ALPHA * (1 - Math.abs(2 * t - 1)); // 0 -> 0.6 -> 0 over 1 s
    const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
    this.g.clear().setVisible(true);
    this.g.lineStyle(2, PALETTE.red, this.alpha);
    this.g.strokeRect(-half, -half, 2 * half, 2 * half);
  }
}
