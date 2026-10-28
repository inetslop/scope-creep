import type Phaser from 'phaser';
import { PALETTE } from '../../content/palette';
import { artScale, COIN_TEXTURE, LIFE_TEXTURE } from '../../art/textures';
import { coinsForRun } from '../../core/profile';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/** Top left: lives and gold, and the run's coin tally so far. */
export class StatsCard implements HudPart {
  private readonly box: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly lives: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly coins: Phaser.GameObjects.Text;
  private readonly coinTallyIcon: Phaser.GameObjects.Image;
  private lastN = 0;
  private popping = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const card = makeCard(scene, 0, 0, 196, 72, 24);
    const lifeIcon = artScale(scene.add.image(-74, -14, LIFE_TEXTURE), 1.25);
    this.lives = scene.add.text(-56, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coinIcon = artScale(scene.add.image(14, -14, COIN_TEXTURE), 1.25);
    this.gold = scene.add.text(32, -13, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.coinTallyIcon = artScale(scene.add.image(-74, 16, COIN_TEXTURE), 12 / 28);
    this.coins = scene.add.text(-60, 17, '', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
    this.box = scene.add.container(0, 0, [card, lifeIcon, this.lives, coinIcon, this.gold, this.coinTallyIcon, this.coins]);
  }

  layout(): void {
    // Card top stays at y = 12, so the card is 12..84 and nothing is pushed off screen.
    this.box.setPosition(EDGE + 98, 12 + 72 / 2);
    // The gold number's screen position (CSS pixels), shared with the kill's coin (systems/enemyHooks/killCoin.ts).
    this.scene.registry.set('statsGold', { x: this.box.x + this.gold.x, y: this.box.y + this.gold.y });
  }

  update(game: GameScene): void {
    this.lives.setText(String(game.run.lives));
    this.gold.setText(String(game.run.gold));
    const n = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves });
    this.coins.setText(`+${n} coins`);
    if (n > this.lastN) this.pop();
    this.lastN = n;
  }

  /** One quiet pop per coin gain: tally and coin scale to 1.15 and back over ~150 ms; the coin
   * flashes white the same time. Skipped if one is already running. */
  private pop(): void {
    if (this.popping) return;
    this.popping = true;
    this.coinTallyIcon.setTintFill(0xffffff);
    const base = this.coinTallyIcon.scale;
    this.scene.tweens.add({ targets: this.coins, scale: 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.coins.setScale(1) });
    this.scene.tweens.add({ targets: this.coinTallyIcon, scale: base * 1.15, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => { this.popping = false; this.coinTallyIcon.setScale(base); this.coinTallyIcon.clearTint(); } });
  }
}
