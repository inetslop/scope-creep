import type Phaser from 'phaser';
import { isLastStand } from '../../core/lastStand';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/**
 * The last-stand banner: the moment a leak brings the run to 1 life, the top-center card
 * teaches the rule where it triggers. Shows on every entry into 1 life (a later leak back to 1
 * shows it again); never when lives are 2 or more.
 */
export class LastStandBanner implements HudPart {
  private readonly banner: TopBanner;
  private wasOne = false;

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    const one = isLastStand(game.run);
    if (one && !this.wasOne) this.banner.show(['Last stand', 'kills pay double']);
    this.wasOne = one;
  }
}
