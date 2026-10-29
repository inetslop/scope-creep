import type Phaser from 'phaser';
import { CELL, HUD } from '../../config';
import { getEnemy } from '../../content/enemies';
import { PALETTE } from '../../content/palette';
import { isQuietWave, isTightWave, waveCounts, type WavePlan } from '../../core/waves';
import type { RunState } from '../../core/run';
import { artScale, enemyTexture } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, SEND_BTN, isNarrow, NEXT_SIZE, type HudPart } from './hud';

const LINE_H = 20;
const ROW_GAP = 6;
const TEACH_H = 18;
const PAD = 16;
const GROUP_GAP = 8;

/** The one-time teach line for each tag: the tag's word, then its promise in plain words. Taught once the run has held `first` or more
 *  waves (the tag's first wave), so it is re-derived from the run and never stored. */
const TEACH: { tag: string; first: number; text: string }[] = [
  { tag: 'quiet', first: 4, text: 'quiet: fewer, double gold' },
  { tag: 'tight', first: 6, text: 'tight: they come bunched' },
];

/**
 * Directly above the next-wave button while the build phase runs: what the next wave sends, straight from its
 * plan (game.waves.nextPlan), so a new enemy shows up here with no change to this file. Each type
 * is its on-board token (~16 px) and its count. Pops in at the build phase's start, gone by the
 * wave's.
 */
export class NextWavePreview implements HudPart {
  private readonly scene: Phaser.Scene;
  private box: Phaser.GameObjects.Container | undefined;
  private cardW = 0;
  private cardH = 0;
  private size = { width: 0, height: 0 };
  private planNumber = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** The card's screen rect while it is visible (the Stay put row sits under it). */
  get rect(): { x: number; y: number; width: number; height: number } | undefined {
    const box = this.box;
    return box?.visible ? { x: box.x, y: box.y, width: this.cardW, height: this.cardH } : undefined;
  }

  layout(width: number, height: number): void {
    this.size = { width, height };
    if (this.box) this.place();
  }

  update(game: GameScene): void {
    // On a narrow screen the tower panel grows up into this corner while it's open, so the card waits out of the way.
    const hidden = isNarrow(this.size.width) && game.building.selectedTower !== undefined;
    const plan = !hidden && game.run.phase === 'build' ? game.waves.nextPlan : undefined;
    if (!plan) {
      if (this.box) {
        this.scene.tweens.killTweensOf(this.box);
        this.box.setVisible(false);
      }
      return;
    }
    if (this.planNumber !== plan.number) {
      this.planNumber = plan.number;
      if (this.box) {
        this.scene.tweens.killTweensOf(this.box);
        this.box.destroy();
      }
      this.box = this.build(plan, this.teachLine(plan, game.run));
      this.place();
      this.box.setScale(0.4 * this.fitScale()); // pop in like a new tower does
      this.scene.tweens.add({ targets: this.box, scale: this.fitScale(), duration: 200, ease: 'Back.easeOut' });
    } else if (this.box && !this.box.visible) {
      // The panel closed and the same wave is still coming: back to its corner.
      this.scene.tweens.killTweensOf(this.box);
      this.box.setScale(this.fitScale()); // a killed pop-in may have left it smaller
      this.box.setVisible(true);
    }
  }

  /** Full size, or shrunk to fit the screen's corner: a row wider than it must keep its chip and every count on screen. */
  private fitScale(): number {
    return Math.min(1, (this.size.width - EDGE * 2) / Math.max(1, this.cardW));
  }

  /** Above the big button: one row up for the Stay put button under the card, above the button's words on
   * narrow screens, above its ring on wide. */
  private place(): void {
    const box = this.box;
    if (!box) return;
    const { width, height } = this.size;
    const bottom = height - HUD.bottom / 2;
    const x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - this.cardW / 2);
    const above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10;
    box.setScale(this.fitScale()).setPosition(x, above - SEND_BTN.height - SEND_BTN.gap - this.cardH / 2);
  }

  /** The one-time line that teaches this wave's tag on first preview, or none (taught once per run, derived from the run's held-wave count). */
  private teachLine(plan: WavePlan, run: RunState): string | undefined {
    for (const t of TEACH) {
      if (plan.tags.includes(t.tag) && run.wavesCleared < t.first) return t.text;
    }
    return undefined;
  }

  private build(plan: WavePlan, teach: string | undefined): Phaser.GameObjects.Container {
    const scene = this.scene;
    const counts = waveCounts(plan); // a quiet wave's plan is already halved, so the counts come out small
    const countsPieces: (Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container)[] = [];
    let cursor = 0;
    if (isQuietWave(plan.number) || isTightWave(plan.number)) {
      // A small muted-blue "quiet" tag at the card's left edge: relief, so blue (never the red leak warning).
      const isQuiet = isQuietWave(plan.number);
      const label = scene.add.text(0, 0, isQuiet ? 'quiet' : 'tight', textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      const chipW = Math.ceil(label.width) + 14;
      const chip = scene.add.graphics();
      chip.fillStyle(isQuiet ? PALETTE.blueDeep : PALETTE.muted, 1);
      chip.fillRoundedRect(-chipW / 2, -9, chipW, 18, 9);
      countsPieces.push(scene.add.container(chipW / 2, 0, [chip, label])); // its left edge sits on the card's content edge
      cursor += chipW + GROUP_GAP;
    }
    counts.forEach((c, i) => {
      if (i > 0) {
        const dot = scene.add.text(0, 0, '·', textStyle(14, PALETTE.faint, { fontStyle: 'bold' })).setOrigin(0.5);
        dot.setPosition(cursor + GROUP_GAP + dot.width / 2, 0);
        countsPieces.push(dot);
        cursor += GROUP_GAP * 2 + dot.width;
      }
      const icon = artScale(scene.add.image(0, 0, enemyTexture(c.id)), 8 / (getEnemy(c.id).look.size * CELL));
      icon.setPosition(cursor + 8, 0);
      countsPieces.push(icon);
      cursor += 16;
      const count = scene.add.text(0, 0, `×${c.count}`, textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      count.setPosition(cursor + 5, 0);
      countsPieces.push(count);
      cursor += 5 + count.width;
    });
    const countsW = Math.ceil(cursor);
    let teachText: Phaser.GameObjects.Text | undefined;
    if (teach) teachText = scene.add.text(0, 0, teach, textStyle(14, PALETTE.muted)).setOrigin(0.5);
    this.cardW = Math.max(countsW, teachText ? Math.ceil(teachText.width) : 0) + PAD * 2;
    this.cardH = LINE_H + (teach ? ROW_GAP + TEACH_H : 0) + PAD * 2;
    const contentH = this.cardH - PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of countsPieces) { p.x += left; p.y += -contentH / 2 + LINE_H / 2; }
    if (teachText) teachText.setPosition(0, -contentH / 2 + LINE_H + ROW_GAP + TEACH_H / 2);
    const pieces: Phaser.GameObjects.GameObject[] = [...countsPieces];
    if (teachText) pieces.push(teachText);
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, this.cardH, this.cardH / 2)); // pill, like before
    return scene.add.container(0, 0, pieces);
  }
}
