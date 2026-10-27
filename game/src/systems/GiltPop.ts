import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { textStyle } from '../ui/text';

const MAX_POPS = 16;
const LIFE_MS = 600;
const RISE = 24;

/** Gilt shard pickup: a pooled yellow "+N" (the XP actually granted) rises above the pickup point and fades. Cosmetic only. */
export class GiltPop {
  private readonly scene: Phaser.Scene;
  private readonly pool: Phaser.GameObjects.Text[] = [];
  private cursor = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < MAX_POPS; i++) {
      this.pool.push(scene.add.text(0, 0, '', textStyle(16, PALETTE.yellow, { stroke: cssColor(PALETTE.ink), strokeThickness: 3 })).setOrigin(0.5).setDepth(DEPTH.fx + 1).setActive(false).setVisible(false));
    }
  }

  get activeCount(): number {
    let n = 0;
    for (const t of this.pool) if (t.active) n += 1;
    return n;
  }

  /** Pops "+xp" at (x, y); a fixed ring of texts, recycled round-robin (oldest dies first). */
  show(x: number, y: number, xp: number): void {
    const t = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_POPS;
    if (t.active) this.scene.tweens.killTweensOf(t);
    t.setText(`+${xp}`);
    t.setPosition(x, y);
    t.setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({ targets: t, y: y - RISE, alpha: 0, duration: LIFE_MS, ease: 'Cubic.Out', onComplete: () => { t.setActive(false).setVisible(false); } });
  }
}
