import type Phaser from 'phaser';
import { levelOfWave } from '../../core/level';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/**
 * The level-clear banner: the moment a level's last wave clears with lives left, the top-center
 * card says the road re-grows (the board itself does a beat later, on RunFlow's timer). One card
 * per cleared wave number, so a resumed run never re-shows it.
 */
export class LevelClearBanner implements HudPart {
  private readonly banner: TopBanner;
  /** The wave number whose card was already shown (the next cleared level has a new one). */
  private seen = 0;

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    const w = game.flow.pendingLevelClear;
    if (w > 0 && w !== this.seen) {
      this.seen = w;
      this.banner.show([`Level ${levelOfWave(w)} clear`, 'the road re-grows']);
    }
  }
}
