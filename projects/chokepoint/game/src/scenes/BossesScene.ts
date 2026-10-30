import Phaser from 'phaser';
import { artScale, enemyTexture } from '../art/textures';
import { CELL } from '../config';
import { ENEMIES } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { isBossWave, waveBudget } from '../core/waves';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onResize, SCENES } from './keys';

/**
 * The bosses reference: the boss encounters in wave order, each with its on-board token, name,
 * the wave it comes on and its trick in the preview's own teach wording (the def's description).
 * A boss def is the wave itself: spawnOnly, on a boss wave (the every-10 rule) with the wave's
 * whole budget as its threat — a split piece (a Splinter, a Shard, the soon Guard) has a small
 * threat and gets no row. One white rounded card that scales to fit the screen; the pause sits
 * dimmed behind. It reads the defs and the every-10 rule and owns no state — a boss def added
 * later shows up on the next open with no change to this scene.
 */
export class BossesScene extends Phaser.Scene {
  private panelW = 340;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.bosses);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.bosses;
    this.closed = false;
    // The pause stays behind: the shade dims it, and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
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
    const PAD = 16, TOKEN = 36, GAP_T = 12, GAP_R = 12, HEADER = 64, BOTTOM = 20, ROW_GAP = 10, MIN_ROW = 40;
    const innerW = this.panelW - PAD * 2;
    const textW = innerW - TOKEN - GAP_T;
    // A boss def is the wave itself: it never joins a normal mix (spawnOnly), its wave is a boss
    // wave (the every-10 rule) and its threat is the wave's whole budget. A split piece (a Splinter,
    // a Shard, the soon Guard) has a small threat: no row.
    const bosses = ENEMIES
      .filter((e) => e.spawnOnly && isBossWave(e.fromWave) && e.threat === waveBudget(e.fromWave))
      .sort((a, b) => a.fromWave - b.fromWave); // today: 10 (Colossus), 30 (Orb)
    // Pass 1: lay each row's texts out at (0,0) with their final wrap width to measure them.
    const rows = bosses.map((def) => {
      const name = this.add.text(0, 0, def.name, titleStyle(14)).setOrigin(0, 0.5);
      const wave = this.add.text(0, 0, `wave ${def.fromWave}`, textStyle(12, PALETTE.muted)).setOrigin(1, 0.5);
      const desc = this.add.text(0, 0, def.description, textStyle(12, PALETTE.muted, { wordWrap: { width: textW } }));
      return { def, name, wave, desc, h: Math.max(MIN_ROW, name.height + 3 + desc.height) };
    });
    this.panelH = HEADER + rows.reduce((n, r) => n + r.h + ROW_GAP, 0) - ROW_GAP + BOTTOM;
    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28)];
    parts.push(this.add.text(0, -this.panelH / 2 + 42, 'Bosses', titleStyle(28)).setOrigin(0.5));
    const textX = -this.panelW / 2 + PAD + TOKEN + GAP_T;
    let rowTop = -this.panelH / 2 + HEADER;
    for (const row of rows) {
      const top = rowTop + (row.h - (row.name.height + 3 + row.desc.height)) / 2; // center the text block in its row
      // 2x the wave preview's 16 px icon: the token's radius is 16 px (~32 px), like EnemiesScene's scale
      parts.push(artScale(this.add.image(-this.panelW / 2 + PAD + TOKEN / 2, rowTop + row.h / 2, enemyTexture(row.def.id)), 16 / (row.def.look.size * CELL)));
      row.name.setPosition(textX, top + row.name.height / 2);
      row.wave.setPosition(-this.panelW / 2 + innerW - GAP_R, top + row.name.height / 2);
      row.desc.setPosition(textX, top + row.name.height + 3);
      parts.push(row.name, row.wave, row.desc);
      rowTop += row.h + ROW_GAP;
    }
    this.box = this.add.container(0, 0, parts);
  }
}
