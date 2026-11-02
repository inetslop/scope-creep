import type Phaser from 'phaser';
import { CELL, HUD } from '../../config';
import { getEnemy } from '../../content/enemies';
import { PALETTE } from '../../content/palette';
import { waveCounts, isBossWave, type WavePlan } from '../../core/waves';
import { tagChip } from '../../core/waveTags';
import { farGateSplit } from '../../core/farGate';
import type { RunState } from '../../core/run';
import { artScale, enemyTexture } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';

const LINE_H = 20;
const ROW_GAP = 6;
const TEACH_H = 18;
const CHIP_H = 18;
const CHIP_GAP = 4;
const PAD = 16;
const GROUP_GAP = 8;

/** The one-time teach line for each tag: the tag's word, then its promise in plain words. Taught once the run has held `first` or more
 *  waves (the tag's first wave), so it is re-derived from the run and never stored. */
const TEACH: { tag: string; first: number; text: string }[] = [
  { tag: 'quiet', first: 4, text: 'quiet: fewer, double gold' },
  { tag: 'tight', first: 6, text: 'tight: they come bunched' },
  { tag: 'boss', first: 10, text: 'boss: one big shape instead of a crowd' },
  { tag: 'rush', first: 11, text: 'rush: the walkers move 1.5× faster' },
  { tag: 'short cut', first: 34, text: 'short cut — they come in mid-road' },
];

/** The one-time teach for the run's first build phase: the big button's "+N" pill banks the seconds left as gold. Shown while `wavesCleared` is 0, re-derived from the run, never stored. */
const EARLY_SEND = 'start early — the button banks the seconds left as gold';

/** The one-time teach for the run's first build phase: the bank pays 5% of the gold at the wave start, capped. Shown while `wavesCleared` is 0, re-derived from the run, never stored. */
const BANK_PAY = 'bank pays 5% at wave start · up to +10';

/** The Flyer's one-time teach: the build before its first wave names that it doesn't walk the road. Shown while the next plan carries a Flyer and `wavesCleared` is below the Flyer's `fromWave` (13), re-derived from the run, never stored. */
const FLYER_TEACH = "the flyer doesn't walk the road";

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
      const farCount = game.board.map.farGate && !isBossWave(plan.number) ? farGateSplit(plan.spawns.length) : 0;
      this.box = this.build(plan, this.teachLines(plan, game.run), farCount > 0 ? `far gate ×${farCount}` : undefined);
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

  /** Directly above the big button: above its words on narrow screens, above its ring on wide. */
  private place(): void {
    const box = this.box;
    if (!box) return;
    const { width, height } = this.size;
    const bottom = height - HUD.bottom / 2;
    const s = this.fitScale();
    const x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - (this.cardW / 2) * s);
    const above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10;
    box.setScale(s).setPosition(x, above - (this.cardH / 2) * s);
  }

  /** The one-time lines under the counts: the first build phase (no wave cleared yet) teaches the early send
   *  and the bank's pay; after that, this wave's tag on first preview; the build before the Flyer's first wave
   *  names that it doesn't walk the road. Re-derived from the run, never stored. */
  private teachLines(plan: WavePlan, run: RunState): string[] {
    if (run.wavesCleared === 0) return [EARLY_SEND, BANK_PAY];
    for (const t of TEACH) {
      if (plan.tags.includes(t.tag) && run.wavesCleared < t.first) return [t.text];
    }
    if (plan.spawns.some((s) => s.enemy === 'flyer') && run.wavesCleared < getEnemy('flyer').fromWave) return [FLYER_TEACH];
    return [];
  }

  private build(plan: WavePlan, teach: string[], farLine: string | undefined): Phaser.GameObjects.Container {
    const scene = this.scene;
    const counts = waveCounts(plan); // a quiet wave's plan is already halved, so the counts come out small
    const countsPieces: (Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Container)[] = [];
    let cursor = 0;
    const tag = plan.tags[0];
    let chip: Phaser.GameObjects.Container | undefined;
    let chipW = 0;
    if (tag) {
      // The tag's own chip, in its own muted color (never the red leak warning), on its own line under the row.
      const label = scene.add.text(0, 0, tag, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      chipW = Math.ceil(label.width) + 14;
      const chipBg = scene.add.graphics();
      chipBg.fillStyle(tagChip(tag), 1);
      chipBg.fillRoundedRect(-chipW / 2, -9, chipW, 18, 9);
      chip = scene.add.container(0, 0, [chipBg, label]);
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
    const lines: Phaser.GameObjects.Text[] = [];
    if (farLine) lines.push(scene.add.text(0, 0, farLine, textStyle(14, PALETTE.muted)).setOrigin(0.5));
    for (const line of teach) lines.push(scene.add.text(0, 0, line, textStyle(14, PALETTE.muted)).setOrigin(0.5));
    this.cardW = Math.max(countsW, chipW, ...lines.map((t) => Math.ceil(t.width))) + PAD * 2;
    const chipRow = chip ? CHIP_GAP + CHIP_H : 0;
    this.cardH = LINE_H + chipRow + lines.length * (ROW_GAP + TEACH_H) + PAD * 2;
    const contentH = this.cardH - PAD * 2;
    const left = -this.cardW / 2 + PAD;
    for (const p of countsPieces) { p.x += left; p.y += -contentH / 2 + LINE_H / 2; }
    if (chip) chip.setPosition(0, -contentH / 2 + LINE_H + CHIP_GAP + CHIP_H / 2); // centered, like the lines below it
    let ly = -contentH / 2 + LINE_H + chipRow + ROW_GAP + TEACH_H / 2;
    for (const t of lines) { t.setPosition(0, ly); ly += ROW_GAP + TEACH_H; }
    const pieces: Phaser.GameObjects.GameObject[] = [...countsPieces, ...(chip ? [chip] : []), ...lines];
    pieces.unshift(makeCard(scene, 0, 0, this.cardW, this.cardH, this.cardH / 2)); // pill, like before
    return scene.add.container(0, 0, pieces);
  }
}
