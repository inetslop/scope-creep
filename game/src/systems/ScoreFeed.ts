import type Phaser from 'phaser';
import { DEPTH, SCORE_POINTS } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { textStyle } from '../ui/text';

const MAX_FEED = 32;
const LIFE_MS = 600;
const RISE = 24;

export type KillClass = 'enemy' | 'elite' | 'boss';

/** Kill feed: at the instant of a kill a pooled ink "+N" (the score value) rises above the corpse and fades. Cosmetic only. */
export class ScoreFeed {
  private readonly scene: Phaser.Scene;
  private readonly pool: Phaser.GameObjects.Text[] = [];
  private cursor = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < MAX_FEED; i++) {
      this.pool.push(scene.add.text(0, 0, '', textStyle(16, PALETTE.ink)).setOrigin(0.5).setDepth(DEPTH.fx + 1).setActive(false).setVisible(false));
    }
  }

  get activeCount(): number {
    let n = 0;
    for (const t of this.pool) if (t.active) n += 1;
    return n;
  }

  /** Pops "+points" at (x, y); a fixed ring of texts, recycled round-robin (same lifetime for every class, so oldest dies first). */
  showKill(x: number, y: number, cls: KillClass): void {
    const t = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_FEED;
    if (t.active) this.scene.tweens.killTweensOf(t);
    t.setText(`+${SCORE_POINTS[cls]}`);
    t.setStyle(this.style(cls));
    t.setPosition(x, y);
    t.setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({ targets: t, y: y - RISE, alpha: 0, duration: LIFE_MS, ease: 'Cubic.Out', onComplete: () => { t.setActive(false).setVisible(false); } });
  }

  private style(cls: KillClass): Phaser.Types.GameObjects.Text.TextStyle {
    const base = { stroke: cssColor(PALETTE.paperLight), strokeThickness: 3 };
    if (cls === 'boss') return textStyle(30, PALETTE.ink, { fontStyle: 'bold', ...base });
    if (cls === 'elite') return textStyle(22, PALETTE.ink, { fontStyle: 'bold', ...base });
    return textStyle(16, PALETTE.ink, base);
  }
}
