import type Phaser from 'phaser';
import { chainAlive } from '../core/feast';
import type { Tower } from '../entities/Tower';
import type { FxSystem } from './FxSystem';

/**
 * The lit/dim state of the Feast plates (entities/Tower.ts): a Feast-first tower's yellow ring is
 * at full opacity while the run's kill chain lives, half while it is broken, so the buff's state
 * is visible on the tower where it is spent. It runs in every phase (GameScene.update, not an
 * enemy hook — hooks only update during a wave): the chain can expire while the draft is open.
 * The state is never cached here — a freshly built plate must read the live chain; the per-tower
 * guard lives in setFeastPlateLit.
 */
export class FeastGlow {
  private readonly scene: Phaser.Scene;
  private readonly fx: FxSystem;
  private readonly towers: () => readonly Tower[];

  constructor(scene: Phaser.Scene, fx: FxSystem, towers: () => readonly Tower[]) {
    this.scene = scene;
    this.fx = fx;
    this.towers = towers;
  }

  update(): void {
    const alive = chainAlive(this.fx.chain, this.scene.time.now, this.fx.comboLastKill, this.fx.comboWindowMs);
    for (const t of this.towers()) if (t.spec.firstId === 'feast') t.setFeastPlateLit(alive);
  }
}
