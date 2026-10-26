import Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { UpgradeDef } from '../content/types';
import { UPGRADE_BY_ID } from '../content/upgrades';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { textStyle, titleStyle } from '../ui/text';
import { getRun, onResize, SCENES } from './keys';

interface LevelUpData {
  choices: string[];
}

/** Pauses the run and offers upgrade cards. Click/tap a card or press 1-3. */
export class LevelUpScene extends Phaser.Scene {
  private chosen = false;
  /** Ignore input briefly so a held fire button / thumb doesn't pick a card by accident. */
  private armed = false;

  constructor() {
    super(SCENES.levelUp);
  }

  create(data: LevelUpData): void {
    hook.overlay = SCENES.levelUp;
    this.chosen = false;
    this.armed = false;
    const defs = data.choices.map((id) => UPGRADE_BY_ID.get(id)).filter((d): d is UpgradeDef => d !== undefined);
    const run = getRun(this);
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, PALETTE.paper, 0.88).setOrigin(0).setInteractive();
    this.add.text(width / 2, height * 0.12, 'LEVEL UP', titleStyle(Math.min(56, width * 0.1), PALETTE.ink, PALETTE.yellow)).setOrigin(0.5);
    this.add.text(width / 2, height * 0.12 + 44, 'Choose an upgrade', textStyle(20, PALETTE.inkSoft)).setOrigin(0.5);

    const horizontal = width >= 760;
    const cardW = horizontal ? Math.min(240, (width - 80) / 3) : Math.min(420, width - 40);
    const cardH = horizontal ? 220 : Math.min(130, (height * 0.7) / 3 - 12);
    defs.forEach((def, i) => {
      const x = horizontal ? width / 2 + (i - (defs.length - 1) / 2) * (cardW + 20) : width / 2;
      const y = horizontal ? height * 0.55 : height * 0.3 + i * (cardH + 14) + cardH / 2;
      this.makeCard(def, x, y, cardW, cardH, run.upgradeLevel(def.id), i + 1);
    });

    this.time.delayedCall(300, () => (this.armed = true));
    const keys = ['ONE', 'TWO', 'THREE'];
    defs.forEach((def, i) => this.input.keyboard?.once(`keydown-${keys[i]}`, () => this.choose(def)));
    if (flags.smoke && defs[0]) this.time.delayedCall(250, () => this.choose(defs[0] as UpgradeDef, true));

    onResize(this, () => this.scene.restart(data));
  }

  private makeCard(def: UpgradeDef, x: number, y: number, w: number, h: number, level: number, index: number): void {
    const band = 14;
    const g = this.add.graphics();
    g.fillStyle(def.color, 1);
    g.fillRect(-w / 2 + 6, -h / 2 + 6, w, h); // hard offset shadow in the upgrade's color
    g.fillStyle(PALETTE.paperLight, 1);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(def.color, 1);
    g.fillRect(-w / 2, -h / 2, w, band);
    g.lineStyle(3, PALETTE.ink, 1);
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineBetween(-w / 2, -h / 2 + band, w / 2, -h / 2 + band);
    const wrap = { wordWrap: { width: w - 24 }, align: 'center' as const };
    const name = this.add.text(0, -h / 2 + band + 12, `${index}. ${def.name}`, textStyle(20, PALETTE.ink, { fontStyle: 'bold', ...wrap })).setOrigin(0.5, 0);
    const desc = this.add.text(0, band / 2, def.description, textStyle(16, PALETTE.inkSoft, wrap)).setOrigin(0.5);
    const lvl = this.add.text(0, h / 2 - 12, level === 0 ? 'NEW' : `Lv ${level} → ${level + 1}`, textStyle(13, PALETTE.gray)).setOrigin(0.5, 1);
    const card = this.add.container(x, y, [g, name, desc, lvl]).setSize(w, h).setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setScale(1.04));
    card.on('pointerout', () => card.setScale(1));
    card.on('pointerup', () => this.choose(def));
  }

  private choose(def: UpgradeDef, force = false): void {
    if (this.chosen || (!this.armed && !force)) return;
    this.chosen = true;
    getRun(this).applyUpgrade(def);
    hook.stats.upgradesTaken += 1;
    this.scene.resume(SCENES.game);
    this.scene.stop();
  }
}
