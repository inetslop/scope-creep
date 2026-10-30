import Phaser from 'phaser';
import { artScale, enemyTexture } from '../art/textures';
import { CELL } from '../config';
import { ENEMIES } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { WAVE_TAG_ROWS, nextTaggedWave } from '../core/waveTags';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, onResize, SCENES } from './keys';

/**
 * The waves reference: the three wave tags in the order the run meets them, each with its own
 * chip, the preview's own teach wording, when it comes and the next wave it is on (read off the
 * run's wave and the game's own tag rules). One white rounded card that scales to fit the
 * screen; the pause sits dimmed behind. Read-only: nothing on it is tappable but back, it plays
 * no sound and paints nothing on the board.
 */
export class WavesScene extends Phaser.Scene {
  private panelW = 340;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.waves);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.waves;
    this.closed = false;
    // The pause stays behind: the shade dims it, and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      hook.overlay = SCENES.pause;
      this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
    };
    // The back button: a round ink card with a white arrow, top right (the enemies reference's).
    this.back = makeButton(this, 0, 0, '', doBack, { width: 48, height: 48, radius: 24, fill: PALETTE.ink });
    const arrow = this.add.graphics();
    arrow.fillStyle(PALETTE.card, 1);
    arrow.fillTriangle(3, -7, 3, 7, -8, 0);
    this.back.content.add(arrow);
    this.build();
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      // The whole card scales to fit, like the enemies reference: no scroll, no clip.
      this.box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
      this.back.container.setPosition(width - EDGE - 24, 40);
    };
    const size = viewSize(this);
    layout(size.width, size.height);
    onResize(this, layout);
    // A smoke tap on the pause can land on the new button; back out so the run is not stranded here.
    if (flags.smoke) this.time.delayedCall(1000, doBack);
  }

  private build(): void {
    const run = getRun(this);
    // The boss's on-board token, only once it exists in the content: no placeholder before then.
    const bossDef = ENEMIES.find((e) => e.id === 'colossus');
    const PAD = 16, HEADER = 64, BOTTOM = 20, ROW_GAP = 10, GAP = 8, CHIP_H = 18, TOKEN_R = 14;
    const innerW = this.panelW - PAD * 2;
    // Pass 1: lay each row's texts out at (0,0) with their final wrap width to measure them.
    const rows = WAVE_TAG_ROWS.map((row) => {
      const tokenW = row.tag === 'boss' && bossDef ? TOKEN_R * 2 + GAP : 0;
      const label = this.add.text(0, 0, row.tag, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      const chipW = Math.ceil(label.width) + 14; // the preview's exact chip
      const chip = this.add.graphics();
      chip.fillStyle(row.chip, 1);
      chip.fillRoundedRect(-chipW / 2, -9, chipW, CHIP_H, 9);
      const chipBox = this.add.container(0, 0, [chip, label]);
      const name = this.add.text(0, 0, row.name, titleStyle(14)).setOrigin(0, 0.5);
      const when = this.add.text(0, 0, `${row.when} · next: wave ${nextTaggedWave(run.wave, row.rule)}`, textStyle(12, PALETTE.muted));
      const meaning = this.add.text(0, 0, row.meaning, textStyle(12, PALETTE.muted, { wordWrap: { width: innerW - chipW - GAP - name.width - GAP - tokenW } })).setOrigin(0, 0.5);
      const l1 = Math.max(CHIP_H + 2, name.height, meaning.height);
      return { row, chipBox, chipW, name, when, meaning, l1, h: l1 + 4 + when.height };
    });
    this.panelH = HEADER + rows.reduce((n, r) => n + r.h + ROW_GAP, 0) - ROW_GAP + BOTTOM;
    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28)];
    parts.push(this.add.text(0, -this.panelH / 2 + 42, 'Waves', titleStyle(28)).setOrigin(0.5));
    const left = -this.panelW / 2 + PAD;
    let rowTop = -this.panelH / 2 + HEADER;
    for (const r of rows) {
      r.chipBox.setPosition(left + r.chipW / 2, rowTop + r.l1 / 2);
      r.name.setPosition(left + r.chipW + GAP, rowTop + r.l1 / 2);
      r.meaning.setPosition(left + r.chipW + GAP + r.name.width + GAP, rowTop + r.l1 / 2);
      r.when.setPosition(left, rowTop + r.l1 + 4);
      parts.push(r.chipBox, r.name, r.meaning, r.when);
      if (r.row.tag === 'boss' && bossDef) {
        parts.push(artScale(this.add.image(left + innerW - TOKEN_R, rowTop + r.h / 2, enemyTexture('colossus')), TOKEN_R / (bossDef.look.size * CELL)));
      }
      rowTop += r.h + ROW_GAP;
    }
    this.box = this.add.container(0, 0, parts);
  }
}
