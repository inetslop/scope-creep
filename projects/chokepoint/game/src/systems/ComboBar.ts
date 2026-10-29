import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { FxSystem } from './FxSystem';

/**
 * The drain bar under the ×N kill-combo counter (FxSystem.killCount): a thin rounded bar in the
 * counter's own color (the muted ink; the milestone yellow from ×10 up) over a ~20%-alpha muted-ink
 * track, sitting just under the counter and centered on it. The fill is full right after a kill and
 * drains to empty over the chain's 1.5 s window, so the bar empties at exactly the moment the chain
 * would break. It appears, tracks and fades exactly with the counter: no bar while the counter is
 * gone, no bar on a single kill. A persistent draw, like the Push windup ring, not a tracked effect.
 */
export class ComboBar {
  private readonly scene: Phaser.Scene;
  private readonly fx: FxSystem;
  private bar: Phaser.GameObjects.Graphics | null = null;
  private static readonly Y = 15; // bar centre under the counter centre; board units

  constructor(scene: Phaser.Scene, fx: FxSystem) {
    this.scene = scene;
    this.fx = fx;
  }

  update(): void {
    const t = this.fx.counterText;
    if (!t) {
      if (this.bar) this.bar.clear();
      return;
    }
    if (!this.bar) this.bar = this.scene.add.graphics().setDepth(DEPTH.fx);
    const g = this.bar;
    // The chain window is on the scene clock (the same clock FxSystem.killCount uses),
    // so the fill empties at exactly the moment the chain breaks, at 1x and 2x alike.
    const frac = Math.min(1, Math.max(0, 1 - (this.scene.time.now - this.fx.comboLastKill) / 1500));
    g.clear();
    g.fillStyle(PALETTE.muted, 0.2);
    g.fillRoundedRect(-13, -2, 26, 4, 2); // track
    if (frac > 0.001) {
      g.fillStyle(this.fx.chain >= 10 ? PALETTE.yellow : PALETTE.muted, 1);
      g.fillRoundedRect(-13, -2, 26 * frac, 4, Math.min(2, (26 * frac) / 2)); // fill, drains right→left
    }
    g.setPosition(t.x, t.y + ComboBar.Y);
    g.setAlpha(t.alpha); // appears and fades exactly with the counter
  }

  /** Invariant: the bar, when up, sits on the board with a finite position. */
  broken(): string | undefined {
    if (this.bar && (!Number.isFinite(this.bar.x) || !Number.isFinite(this.bar.y))) return 'combo bar off-board';
    return undefined;
  }
}
