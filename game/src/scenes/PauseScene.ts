import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { UpgradeDef } from '../content/types';
import { UPGRADE_BY_ID } from '../content/upgrades';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, onResize, SCENES } from './keys';

/** Pause overlay above a paused GameScene. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.pause);
  }

  create(): void {
    hook.overlay = SCENES.pause;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.paper, 0.88).setOrigin(0).setInteractive();
    this.add.text(width / 2, height * 0.3, 'PAUSED', titleStyle(Math.min(60, width * 0.12), PALETTE.ink, PALETTE.blue)).setOrigin(0.5);
    makeButton(this, width / 2, height * 0.52, 'Resume', () => this.resumeGame());
    makeButton(this, width / 2, height * 0.52 + 70, 'Quit to menu', () => this.quitToMenu(), { color: PALETTE.red });
    this.input.keyboard?.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.once('keydown-P', () => this.resumeGame());
    onResize(this, () => this.scene.restart());
    this.buildPicksColumn(width, height);
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
  private buildPicksColumn(width: number, height: number): void {
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
      return;
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
  }
}
