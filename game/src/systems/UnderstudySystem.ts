import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { Vec2 } from '../core/vec';
import { Understudy } from '../core/understudy';
import { hook } from '../debug/testHook';
import type { Player } from '../entities/Player';
import type { FxSystem } from './FxSystem';

/**
 * Understudy: a stationary decoy at the player's position that draws enemy
 * targeting for the decoy's life. A plain Image with no physics body, so
 * weapons, shards and damage numbers ignore it and it blocks nothing.
 */
export class UnderstudySystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly timing = new Understudy();
  private readonly image: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, player: Player, fx: FxSystem, sfx: Sfx) {
    this.scene = scene;
    this.player = player;
    this.fx = fx;
    this.sfx = sfx;
    this.image = scene.add.image(0, 0, TEX.decoy).setDepth(DEPTH.enemies).setVisible(false);
  }

  /** The decoy's position while it is alive, else null. SpawnSystem steers and shoots at it. */
  get target(): Vec2 | null {
    return this.timing.active ? { x: this.image.x, y: this.image.y } : null;
  }

  get ready(): boolean {
    return this.timing.ready;
  }

  get cooldownFrac(): number {
    return this.timing.cooldownFrac;
  }

  /** Drops the decoy at the player's position. False while cooling or while an overlay is up. */
  trigger(): boolean {
    if (!this.scene.sys.isActive() || !this.timing.drop()) return false;
    this.image.setPosition(this.player.x, this.player.y).setVisible(true);
    hook.stats.understudyDrops += 1;
    this.sfx.decoyDrop();
    return true;
  }

  /** Ages the decoy; on the pop tick it bursts and hides. */
  update(dt: number): void {
    if (!this.timing.update(dt)) return;
    this.image.setVisible(false);
    this.fx.decoyPop(this.image.x, this.image.y);
    this.sfx.decoyPop();
  }
}
