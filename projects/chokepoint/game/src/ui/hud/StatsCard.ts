import type Phaser from 'phaser';
import { HUD } from '../../config';
import { PALETTE } from '../../content/palette';
import { artScale, COIN_TEXTURE, LIFE_TEXTURE } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/** Top left: lives and gold. */
export class StatsCard implements HudPart {
  private readonly box: Phaser.GameObjects.Container;
  private readonly lives: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const card = makeCard(scene, 0, 0, 196, 48, 24);
    const lifeIcon = artScale(scene.add.image(-74, 0, LIFE_TEXTURE), 1.25);
    this.lives = scene.add.text(-56, 1, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const coinIcon = artScale(scene.add.image(14, 0, COIN_TEXTURE), 1.25);
    this.gold = scene.add.text(32, 1, '', textStyle(22, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.box = scene.add.container(0, 0, [card, lifeIcon, this.lives, coinIcon, this.gold]);
  }

  layout(): void {
    this.box.setPosition(EDGE + 98, HUD.top / 2);
  }

  update(game: GameScene): void {
    this.lives.setText(String(game.run.lives));
    this.gold.setText(String(game.run.gold));
  }
}
