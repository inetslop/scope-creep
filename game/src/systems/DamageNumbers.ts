import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { textStyle } from '../ui/text';

const MAX_NUMBERS = 60;
const LIFE_MS = 450;
const RISE = 24;

/** Floating damage numbers: a pool of at most 60 Text objects that pop up from hit enemies and fade. Cosmetic only. */
export class DamageNumbers {
  private readonly scene: Phaser.Scene;
  private readonly pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get activeCount(): number {
    let n = 0;
    for (const t of this.pool) if (t.active) n += 1;
    return n;
  }

  /** Pops a number at (x, y); dropped if all 60 slots are busy. */
  show(x: number, y: number, amount: number, crit = false): void {
    let i = this.pool.findIndex((t) => !t.active);
    if (i === -1) {
      if (this.pool.length >= MAX_NUMBERS) return; // pool exhausted: skip rather than allocate
      i = this.pool.length;
      this.pool.push(this.scene.add.text(0, 0, '', this.style(crit)).setOrigin(0.5).setDepth(DEPTH.fx + 1));
    }
    const t = this.pool[i];
    t.setText(String(Math.round(amount)));
    t.setStyle(this.style(crit));
    t.setPosition(x + (Math.random() * 2 - 1) * 10, y); // small jitter so numbers don't stack exactly
    t.setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({
      targets: t,
      y: y - RISE,
      alpha: 0,
      duration: LIFE_MS,
      ease: 'Cubic.Out',
      onComplete: () => t.setActive(false).setVisible(false),
    });
  }

  private style(crit: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return textStyle(crit ? 28 : 20, crit ? PALETTE.red : PALETTE.ink, {
      fontStyle: 'bold',
      stroke: cssColor(PALETTE.paperLight),
      strokeThickness: 3,
    });
  }
}
