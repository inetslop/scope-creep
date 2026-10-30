import type Phaser from 'phaser';
import { artScale, STAR_MUTED_TEXTURE, STAR_TEXTURE } from '../../art/textures';
import { loadProfile } from '../../core/profile';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { getSfx } from '../../scenes/keys';
import { cardTexture, makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const W = 120;
const H_NUM = 48; // the number's row, as today
const GAP = 6;
const CHIP = 18;
const LINE = 16; // one line of the 11px teach

/** Top right, left of the pause button: the wave number ("Ready" before the first), and, from the moment a wave
 *  ends with lives lost until the next starts, a muted "held · N" chip for what the wave cost, with a one-time
 *  teach line on the run's first held wave. The card's top stays at y = 12 and it grows down to fit. */
export class WaveCard implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Image;
  private readonly wave: Phaser.GameObjects.Text;
  private chip: Phaser.GameObjects.Container | undefined;
  private teach: Phaser.GameObjects.Text | undefined;
  private width = 0;
  private h = H_NUM;
  private shownLost = 0;
  private shownTeach = false;
  /** The wave that makes the record's moment fire; -1 when this run has none (no saved best, or it starts at or above it).
   *  undefined until the first update: the first that can see the run's mode and starting wave. */
  private recordAt: number | undefined;

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
    this.wave.setText(game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready');
    if (lost !== this.shownLost || teach !== this.shownTeach) this.wear(lost, teach);
    this.record(game);
  }

  /** The record's moment: the first time the number becomes this session's saved best wave, a star pops
   *  to its right and the note plays; a run that starts at or above its best has no moment. */
  private record(game: GameScene): void {
    if (this.recordAt === undefined) {
      const profile = loadProfile(window.localStorage);
      const best = game.run.mode === 'iron' ? profile.ironBestWave : profile.bestWave;
      this.recordAt = best > game.run.wave ? best : -1;
    }
    if (this.recordAt > 0 && this.recordAt === game.run.wave) {
      this.recordAt = -1;
      this.recordStar(game);
      getSfx(game)?.recordNote();
    }
  }

  /** The star's one pass: ~150 ms scale-in to the right of the number, ~0.7 s hold, ~150 ms fade, then gone. */
  private recordStar(game: GameScene): void {
    const star = artScale(this.scene.add.image(this.wave.width / 2 + 13, this.wave.y, game.run.mode === 'iron' ? STAR_MUTED_TEXTURE : STAR_TEXTURE), 14 / 16); // ~14 px
    const full = star.scale; // artScale's own scale; the texture is 3x and shows at a fraction of it
    star.setScale(0);
    this.box.add(star);
    this.scene.tweens.add({ targets: star, scale: full, duration: 150, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: star, alpha: 0, duration: 150, delay: 850, ease: 'Quad.easeIn', onComplete: () => { star.destroy(); } });
  }

  /** Top edge at y = 12, right edge 10 px left of the pause button; the card grows down. */
  private place(): void {
    this.box.setPosition(this.width - EDGE - 48 - 10 - W / 2, 12 + this.h / 2);
  }

  private wear(lost: number, teach: boolean): void {
    const scene = this.scene;
    if (this.chip) this.scene.tweens.killTweensOf(this.chip);
    this.chip?.destroy(true); // with children: its graphics and label are not destroyed otherwise
    this.chip = undefined;
    this.teach?.destroy();
    this.teach = undefined;
    const hasTag = lost > 0;
    this.h = H_NUM + (hasTag ? GAP + CHIP + (teach ? GAP + LINE * 2 : 0) : 0);
    this.card.setTexture(cardTexture(scene, W, this.h, 24));
    this.wave.setY(-this.h / 2 + 25);
    if (hasTag) {
      const label = scene.add.text(0, 0, `held · ${lost}`, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
      const g = scene.add.graphics();
      g.fillStyle(PALETTE.muted, 1);
      g.fillRoundedRect(-(label.width + 14) / 2, -CHIP / 2, label.width + 14, CHIP, CHIP / 2);
      this.chip = scene.add.container(0, -this.h / 2 + H_NUM + GAP + CHIP / 2, [g, label]);
      this.chip.setScale(0); // ~150 ms scale-in
      scene.tweens.add({ targets: this.chip, scale: 1, duration: 150, ease: 'Quad.easeOut' });
      if (teach) {
        this.teach = scene.add.text(0, -this.h / 2 + H_NUM + GAP + CHIP + GAP + LINE, 'held: lives lost\nthis wave', textStyle(11, PALETTE.muted)).setOrigin(0.5);
      }
      this.box.add(this.chip);
      if (this.teach) this.box.add(this.teach);
    }
    this.shownLost = lost;
    this.shownTeach = teach;
    this.place();
  }
}
