import type Phaser from 'phaser';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const W = 120;
const H_NUM = 48; // the number's row, as today
const GAP = 6;
const CHIP = 18;
const LINE = 16; // one line of the 11px teach

/** Top right, left of the pause button: the wave number ("Ready" before the first), and from wave 1 a muted
 *  "level N · w/10" line under it (N the run's level, w the wave's place in it — hidden while it reads "Ready",
 *  and in the build phase the wave about to start); and, from the moment a wave ends with lives lost until the
 *  next starts, a muted "held · N" chip for what the wave cost, with a one-time teach line on the run's first
 *  held wave. The card's top stays at y = 12 and it grows down to fit. */
export class WaveCard implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Image;
  private readonly wave: Phaser.GameObjects.Text;
  private chip: Phaser.GameObjects.Container | undefined;
  private teach: Phaser.GameObjects.Text | undefined;
  private line: Phaser.GameObjects.Text | undefined;
  private width = 0;
  private h = H_NUM;
  private shownLost = 0;
  private shownTeach = false;
  private shownLine = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.wave = scene.add.text(0, 1, '', textStyle(18, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.card = makeCard(scene, 0, 0, W, H_NUM, 24);
    this.box = scene.add.container(0, 0, [this.card, this.wave]);
  }

  layout(width: number): void {
    this.width = width;
    this.place();
  }

  update(game: GameScene): void {
    const lost = game.waves.heldLost;
    const teach = lost > 0 && game.run.wavesCleared - game.run.cleanWaves === 1; // the run's first held wave
    const wave = game.run.wave;
    this.wave.setText(wave > 0 ? `Wave ${wave}` : 'Ready');
    const lineWave = wave > 0 && game.run.phase === 'build' ? wave + 1 : wave; // in build, the wave about to start
    const line = lineWave > 0 ? `level ${Math.floor((lineWave - 1) / 10) + 1} · ${((lineWave - 1) % 10) + 1}/10` : '';
    if (lost !== this.shownLost || teach !== this.shownTeach || line !== this.shownLine) this.wear(lost, teach, line);
  }

  /** Top edge at y = 12, right edge 10 px left of the pause button; the card grows down. */
  private place(): void {
    this.box.setPosition(this.width - EDGE - 48 - 10 - W / 2, 12 + this.h / 2);
  }

  private wear(lost: number, teach: boolean, line: string): void {
    const scene = this.scene;
    if (this.chip) this.scene.tweens.killTweensOf(this.chip);
    this.chip?.destroy(true); // with children: its graphics and label are not destroyed otherwise
    this.chip = undefined;
    this.teach?.destroy();
    this.teach = undefined;
    this.line?.destroy();
    this.line = undefined;
    const hasTag = lost > 0;
    const hasLine = line !== '';
    this.h = H_NUM + (hasLine ? GAP + LINE : 0) + (hasTag ? GAP + CHIP + (teach ? GAP + LINE * 2 : 0) : 0);
    this.card.setTexture(cardTexture(scene, W, this.h, 24));
    this.wave.setY(-this.h / 2 + 25);
    if (hasLine) {
      this.line = scene.add.text(0, -this.h / 2 + H_NUM + GAP + LINE / 2, line, textStyle(11, PALETTE.muted)).setOrigin(0.5);
      this.box.add(this.line);
    }
    if (hasTag) {
      const label = scene.add.text(0, 0, `held · ${lost}`, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.muted, 1);
      g.fillRoundedRect(-(label.width + 14) / 2, -CHIP / 2, label.width + 14, CHIP, CHIP / 2);
      this.chip = scene.add.container(0, -this.h / 2 + H_NUM + GAP + LINE + GAP + CHIP / 2, [g, label]);
      this.chip.setScale(0); // ~150 ms scale-in
      scene.tweens.add({ targets: this.chip, scale: 1, duration: 150, ease: 'Quad.easeOut' });
      if (teach) {
        this.teach = scene.add.text(0, -this.h / 2 + H_NUM + GAP + LINE + GAP + CHIP + GAP + LINE, 'held: lives lost\nthis wave', textStyle(11, PALETTE.muted)).setOrigin(0.5);
      }
      this.box.add(this.chip);
      if (this.teach) this.box.add(this.teach);
    }
    this.shownLost = lost;
    this.shownTeach = teach;
    this.shownLine = line;
    this.place();
  }
}
