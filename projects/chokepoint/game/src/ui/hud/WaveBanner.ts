import type Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/** "Wave N" top-center as a wave starts: the shared card slides in, holds, fades (~1 s). */
export class WaveBanner implements HudPart {
  private readonly banner: TopBanner;
  private seenWave = 0; // so each wave number shows once, as it starts

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    if (game.run.wave > this.seenWave) {
      this.seenWave = game.run.wave;
      this.banner.show([`Wave ${game.run.wave}`], game.waves.currentPlan?.tags ?? []);
    }
  }
}
