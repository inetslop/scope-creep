import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { artScale, CHIP_TEXTURE } from '../art/textures';
import { fillRing } from '../ui/ring';
import { textStyle } from '../ui/text';

/**
 * Short-lived feedback on the board: rings, waves, chips and floating text. Soft and quick.
 * A new effect goes in its own file, systems/fx/<name>.ts: a function that takes this FxSystem,
 * returns early when `full`, creates its objects on `scene` and hands each to `track()`.
 */
export class FxSystem {
  /** The game scene (effects in systems/fx/ create their objects on it). */
  readonly scene: Phaser.Scene;
  /** Live effects, capped so a big wave can't flood the scene. */
  private live = 0;
  private static readonly MAX = 160;

  /** Kill chain for the rising ×N counter: count, last kill time, live objects. */
  private comboN = 0;
  private lastKill = 0;
  private comboText: Phaser.GameObjects.Text | null = null;
  private comboPop: Phaser.Tweens.Tween | null = null;
  private comboFade: Phaser.Tweens.Tween | null = null;
  private comboTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get count(): number {
    return this.live;
  }

  /** At the cap of live effects: a new effect should not start (a big wave can't flood the scene). */
  get full(): boolean {
    return this.live >= FxSystem.MAX;
  }

  /** The current kill chain (the rising ×N counter), 0 between chains. */
  get chain(): number {
    return this.comboN;
  }

  /** Tweens `obj` to `props` over `durationMs`, then destroys it; it counts as a live effect until then. */
  track<T extends Phaser.GameObjects.GameObject>(obj: T, durationMs: number, props: Record<string, number | string>): void {
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

  /** A flat light-blue ring out to `radius`: the anchor's root coming. */
  rootWave(x: number, y: number, radius: number): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
    fillRing(g, 0, 0, radius, 4, 0, Math.PI * 2, PALETTE.ice, 0.9);
    g.setScale(0.2);
    this.track(g, 200, { scale: 1, alpha: 0, ease: 'Cubic.easeOut' });
  }

  /** A quick ink ring at a tower's base when one of its hits marks an enemy. */
  markFlash(x: number, y: number, radius: number): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics().setDepth(DEPTH.fx).setPosition(x, y);
    fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, PALETTE.ink, 0.9);
    g.setScale(0.5);
    this.track(g, 200, { scale: 1.25, alpha: 0, ease: 'Quad.easeOut' });
  }

  /** Rounded chips that scatter where an enemy died, plus a white pop. `double` scatters 12 chips instead of 6 (the ×10 milestone kill). */
  burst(x: number, y: number, color: number, double: boolean = false): void {
    if (this.live < FxSystem.MAX) {
      const pop = this.scene.add.graphics().setDepth(DEPTH.fx).setPosition(x, y);
      pop.fillStyle(0xffffff, 0.9);
      pop.fillCircle(0, 0, 16);
      pop.setScale(0.5);
      this.track(pop, 180, { scale: 1.3, alpha: 0 });
    }
    const n = double ? 12 : 6;
    for (let i = 0; i < n && this.live < FxSystem.MAX; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const d = 22 + Math.random() * 14;
      const chip = artScale(this.scene.add.image(x, y, CHIP_TEXTURE), 0.6 + Math.random() * 0.5).setTint(color).setDepth(DEPTH.fx);
      this.track(chip, 380, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 6, alpha: 0, angle: 120, scale: chip.scale * 0.5, ease: 'Quad.easeOut' });
    }
  }

  /** One kill for the chain: within 1.5 s it continues, a longer gap resets it. From ×2 up the
   * counter sits above the latest kill's chips, each step 8 px up, popping 1.2 → 1.0; 1.5 s idle fades it. */
  killCount(x: number, y: number): boolean {
    const now = this.scene.time.now;
    if (now - this.lastKill >= 1500) this.comboN = 0;
    this.lastKill = now;
    this.comboN += 1;
    if (this.comboN < 2) return false;
    this.comboTimer?.remove();
    if (this.comboFade) {
      this.comboFade.remove();
      this.comboFade = null;
      this.comboText?.destroy();
      this.comboText = null;
      this.comboPop = null;
    }
    const fresh = !this.comboText;
    const t = this.comboText ?? this.scene.add
      .text(x, y - 40, '', textStyle(14, PALETTE.muted, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.fx);
    this.comboText = t;
    t.setText(`×${this.comboN}`);
    if (this.comboN === 10) t.setStyle(textStyle(14, PALETTE.yellow, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }));
    if (!fresh) t.setY(t.y - 8);
    t.setScale(1.2);
    this.comboPop?.remove();
    this.comboPop = this.scene.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Quad.easeOut' });
    this.comboTimer = this.scene.time.delayedCall(1500, () => this.comboFadeStart());
    return this.comboN === 10;
  }

  /** A leak: the run's kill-combo chain breaks - the count goes back to zero and the ×N counter,
   * if up, fades out in place over 200 ms (no pop, no scale); with no counter up, nothing visible. */
  breakCombo(): void {
    this.comboN = 0;
    this.comboTimer?.remove();
    this.comboTimer = null;
    this.comboPop?.remove();
    this.comboPop = null;
    if (!this.comboText) return;
    const t = this.comboText;
    this.comboFade?.remove();
    this.comboFade = this.scene.tweens.add({
      targets: t,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        t.destroy();
        if (this.comboText === t) {
          this.comboText = null;
          this.comboFade = null;
        }
      },
    });
  }

  /** The chain ended: fade the counter out over 400 ms, then destroy it. */
  private comboFadeStart(): void {
    this.comboTimer = null;
    const t = this.comboText;
    if (!t) return;
    this.comboFade = this.scene.tweens.add({
      targets: t,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        t.destroy();
        if (this.comboText === t) {
          this.comboText = null;
          this.comboFade = null;
          this.comboPop = null;
        }
      },
    });
  }

  /** A green "Clean" chip: the wave ended with no leak. Pops in at the exit, holds, fades out.
   * An optional tag sits under the pill and pops, fades and is destroyed with the chip. */
  cleanChip(x: number, y: number, tag: { text: string; color: number } | undefined = undefined): void {
    if (this.live >= FxSystem.MAX) return;
    const g = this.scene.add.graphics();
    g.fillStyle(PALETTE.greenDeep, 1);
    g.fillRoundedRect(-33, -12, 66, 30, 15); // side face
    g.fillStyle(PALETTE.green, 1);
    g.fillRoundedRect(-33, -15, 66, 30, 15); // pill body
    const label = this.scene.add.text(0, -1, 'Clean', textStyle(16, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
    const tagText = tag ? this.scene.add.text(0, 28, tag.text, textStyle(12, tag.color, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5) : null;
    const chip = this.scene.add.container(x, y, tagText ? [g, label, tagText] : [g, label]).setDepth(DEPTH.fx).setScale(0);
    this.live += 1;
    this.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: chip, alpha: 0, delay: 1200, duration: 400, ease: 'Quad.easeIn', onComplete: () => { this.live -= 1; chip.destroy(); } });
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

  /** Mint's +1 pops: one small gold "+1" per bonus the kill was paid, side by side, 100 ms after the kill gold. */
  mintPop(x: number, y: number, count: number): void {
    const xs: number[] = [];
    for (let i = 0; i < count; i++) xs.push(x + (i - (count - 1) / 2) * 22);
    this.scene.time.delayedCall(100, () => {
      for (const px of xs) {
        if (this.live >= FxSystem.MAX) break;
        const t = this.scene.add
          .text(px, y, '+1', textStyle(14, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
          .setOrigin(0.5).setDepth(DEPTH.fx);
        this.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
      }
    });
  }
}
