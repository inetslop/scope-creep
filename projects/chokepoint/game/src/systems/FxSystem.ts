import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { artScale, CHIP_TEXTURE } from '../art/textures';
import { fillRing } from '../ui/ring';
import { textStyle } from '../ui/text';

/** Short-lived feedback on the board: rings, waves, chips and floating text. Soft and quick. */
export class FxSystem {
  private readonly scene: Phaser.Scene;
  /** Live effects, capped so a big wave can't flood the scene. */
  private live = 0;
  private static readonly MAX = 160;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get count(): number {
    return this.live;
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T, durationMs: number, props: Record<string, number | string>): void {
    this.live += 1;
    this.scene.tweens.add({
      targets: obj,
      duration: durationMs,
      ...props,
      onComplete: () => {
        this.live -= 1;
        obj.destroy();
      },
    });
  }

  /** A ring that grows and fades, e.g. a tower being built. */
  ring(x: number, y: number, radius: number, color: number): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics().setDepth(DEPTH.fx).setPosition(x, y);
    fillRing(g, 0, 0, radius, 4, 0, Math.PI * 2, color);
    g.setScale(0.4);
    this.track(g, 320, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
  }

  /** A soft filled wave out to `radius`, e.g. a pulse tower firing. */
  wave(x: number, y: number, radius: number, color: number): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
    g.fillStyle(color, 0.16);
    g.fillCircle(0, 0, radius);
    fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, color, 0.7);
    g.setScale(0.2);
    this.track(g, 360, { scale: 1, alpha: 0, ease: 'Cubic.easeOut' });
  }

  /** A quick ink ring at a tower's base when one of its hits marks an enemy. */
  markFlash(x: number, y: number, radius: number): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics().setDepth(DEPTH.fx).setPosition(x, y);
    fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, PALETTE.ink, 0.9);
    g.setScale(0.5);
    this.track(g, 200, { scale: 1.25, alpha: 0, ease: 'Quad.easeOut' });
  }

  /** Rounded chips that scatter where an enemy died, plus a white pop. */
  burst(x: number, y: number, color: number): void {
    if (this.live < FxSystem.MAX) {
      const pop = this.scene.add.graphics().setDepth(DEPTH.fx).setPosition(x, y);
      pop.fillStyle(0xffffff, 0.9);
      pop.fillCircle(0, 0, 16);
      pop.setScale(0.5);
      this.track(pop, 180, { scale: 1.3, alpha: 0 });
    }
    for (let i = 0; i < 6 && this.live < FxSystem.MAX; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.6;
      const d = 22 + Math.random() * 14;
      const chip = artScale(this.scene.add.image(x, y, CHIP_TEXTURE), 0.6 + Math.random() * 0.5).setTint(color).setDepth(DEPTH.fx);
      this.track(chip, 380, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 6, alpha: 0, angle: 120, scale: chip.scale * 0.5, ease: 'Quad.easeOut' });
    }
  }

  /** Floating text that rises and fades, e.g. "+4" gold. */
  popText(x: number, y: number, text: string, color: number = PALETTE.goldText): void {
    if (this.live >= FxSystem.MAX) return;
    const t = this.scene.add
      .text(x, y, text, textStyle(22, color, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 6 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.fx);
    this.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
  }
}
