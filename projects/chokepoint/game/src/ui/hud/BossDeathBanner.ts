import type Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/**
 * The boss's name card: the moment the boss dies (systems/enemyHooks/bossDeath.ts sets the flag)
 * the shared top-center card names it — its name in bold ink over a muted "stopped" (~1 s,
 * topBanner's own timing). Listed before the other banners in HudScene, so on the same frame it
 * takes the top card over the last stand and the level clear. A resumed run shows none: the flag
 * is cleared here.
 */
export class BossDeathBanner implements HudPart {
  private readonly banner: TopBanner;

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
    scene.registry.pop('bossDeathName'); // a flag left by the run that ended never shows
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    const name = game.registry.pop('bossDeathName') as string | undefined; // consumed: one card per death
    if (name === undefined) return;
    this.banner.show([name, 'stopped']);
  }
}
