import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { UpgradeDef } from '../content/types';
import { UPGRADE_BY_ID } from '../content/upgrades';
import { loadRedactorPick } from '../core/redactor';
import { hook } from '../debug/testHook';
import type { InputDevice } from '../input/Controls';
import { makeButton } from '../ui/button';
import { textStyle, titleStyle } from '../ui/text';
import { getControls, getRun, onResize, SCENES } from './keys';

/** Every input for each device, shown on the pause screen's CONTROLS card. */
const CONTROLS_BY_DEVICE: Record<InputDevice, string[]> = {
  keyboard: [
    'WASD / Arrows — move',
    'Mouse — aim',
    'Hold left click — fire',
    'Esc / P — pause',
    'M — mute',
    '1 / 2 / 3 — pick a card',
  ],
  gamepad: [
    'Left stick — move',
    'Right stick — aim and fire',
    'R2 — fire',
  ],
  touch: [
    'Left thumb — move',
    'Right thumb — aim and fire',
    'II button — pause',
  ],
};

/** Pause overlay above a paused GameScene. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    hook.overlay = SCENES.pause;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.paper, 0.88).setOrigin(0).setInteractive();
    const title = this.add.text(width / 2, height * 0.3, 'PAUSED', titleStyle(Math.min(60, width * 0.12), PALETTE.ink, PALETTE.blue)).setOrigin(0.5);
    makeButton(this, width / 2, height * 0.52, 'Resume', () => this.resumeGame());
    makeButton(this, width / 2, height * 0.52 + 70, 'Quit to menu', () => this.quitToMenu(), { color: PALETTE.red });
    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.once('keydown-P', () => this.resumeGame());
    onResize(this, () => this.scene.restart());
    const picksColTop = this.buildPicksColumn(width, height);
    this.buildControlsCard(title, width, height, picksColTop);
  }

  private resumeGame(): void {
    this.scene.resume(SCENES.game);
    this.scene.stop();
  }

  private quitToMenu(): void {
    this.scene.stop(SCENES.hud);
    this.scene.stop(SCENES.game);
    this.scene.start(SCENES.menu);
  }

  /** The run's build in a narrow ink column: one line per distinct upgrade, most recently picked first. */
  private buildPicksColumn(width: number, height: number): number {
    const run = getRun(this);
    const COL_W = 200, PIP = 8, PIP_GAP = 4, HEADER_H = 16, HEADER_GAP = 8, MAX_ROWS = 16;
    const rows: { def: UpgradeDef; index: number }[] = [];
    run.upgradeHistory.forEach((id, i) => {
      const def = UPGRADE_BY_ID.get(id);
      if (!def) return;
      const existing = rows.find((r) => r.def.id === id);
      if (existing) existing.index = i; // keep the LAST index: the decision you just made sorts to the top
      else rows.push({ def, index: i });
    });
    rows.sort((a, b) => b.index - a.index);
    const picked = rows.slice(0, MAX_ROWS); // the pool bounds the column at 16 lines

    const horizontal = width >= 760; // same breakpoint as LevelUpScene
    const top = horizontal ? 12 : height * 0.52 + 70 + 26 + 12; // portrait: below Quit (52 px tall) + 12 paper margin
    const bottom = height - 12;
    const centerX = horizontal ? width / 2 + 110 + 28 + COL_W / 2 : width / 2; // landscape: 28 right of the centered 220 px buttons
    const rowH = Math.max(0, Math.min(18, Math.floor((bottom - top - HEADER_H - HEADER_GAP) / MAX_ROWS)));
    const colH = HEADER_H + HEADER_GAP + rowH * MAX_ROWS; // always reserve the full band so the empty state sits in the same spot
    const colTop = (top + bottom - colH) / 2;
    const colLeft = centerX - COL_W / 2;
    const colRight = centerX + COL_W / 2;

    this.add.text(centerX, colTop, 'PICKS', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    const firstRowY = colTop + HEADER_H + HEADER_GAP + rowH / 2;
    if (picked.length === 0) {
      this.add.text(colLeft, firstRowY, 'NOTHING PICKED YET', textStyle(13, PALETTE.inkSoft, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      return colTop;
    }
    const g = this.add.graphics();
    picked.forEach((r, i) => {
      const y = firstRowY + i * rowH;
      this.add.text(colLeft, y, r.def.name.toUpperCase(), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const level = Math.min(run.upgradeLevel(r.def.id), r.def.maxLevel); // pips never exceed the card's max level
      for (let p = 0; p < level; p++) {
        const x = colRight - PIP / 2 - p * (PIP + PIP_GAP);
        g.fillStyle(r.def.color, 1);
        g.fillRect(x - PIP / 2, y - PIP / 2, PIP, PIP);
        g.lineStyle(1, PALETTE.ink, 1);
        g.strokeRect(x - PIP / 2, y - PIP / 2, PIP, PIP);
      }
    });
    return colTop;
  }

  /** CONTROLS card: every input for the device last used, in The Index's ink type. */
  private buildControlsCard(title: Phaser.GameObjects.Text, width: number, height: number, picksColTop: number): void {
    const controls = getControls(this);
    const touch = !!controls && (controls.touch.everTouched || this.sys.game.device.input.touch);
    const device: InputDevice = touch ? 'touch' : controls?.device === 'gamepad' ? 'gamepad' : 'keyboard';
    const lines = [...CONTROLS_BY_DEVICE[device]];
    if (loadRedactorPick()) lines.push(touch ? 'REDACT — ERASE' : device === 'gamepad' ? 'REDACT — Y' : 'REDACT — SPACE');
    const COL_W = 200, HEADER_H = 16, HEADER_GAP = 8, ROW_H = 18, MARGIN = 12;
    const colH = HEADER_H + HEADER_GAP + ROW_H * lines.length;
    const horizontal = width >= 760;
    const centerX = horizontal ? width / 2 - 110 - 28 - COL_W / 2 : width / 2; // landscape: mirror of The Index
    let colTop = picksColTop; // landscape: top-aligned with The Index
    if (!horizontal) {
      const resumeTop = height * 0.52 - 26; // top edge of the 52 px Resume button
      colTop = Math.min(title.y + title.height / 2 + MARGIN, resumeTop - MARGIN - colH);
      title.setY(Math.max(height * 0.18, colTop - MARGIN - title.height / 2)); // title yields, never above 18%
    }
    const colLeft = centerX - COL_W / 2;
    this.add.text(centerX, colTop, 'CONTROLS', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    const g = this.add.graphics();
    g.lineStyle(1, PALETTE.ink, 1);
    g.lineBetween(colLeft, colTop + HEADER_H, colLeft + COL_W, colTop + HEADER_H);
    lines.forEach((line, i) => {
      this.add.text(colLeft, colTop + HEADER_H + HEADER_GAP + ROW_H / 2 + i * ROW_H, line, textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    });
  }
}
