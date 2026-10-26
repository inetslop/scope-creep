import type Phaser from 'phaser';
import type { RunState } from '../core/run';
import { hook } from '../debug/testHook';
import type { Player } from '../entities/Player';
import { Shard } from '../entities/Shard';
import type { FxSystem } from './FxSystem';

const COLLECT_DISTANCE = 22;
const MAGNET_ACCEL = 2400;
const MAX_SHARDS = 350;

/** Shard (XP) drops: magnet toward the player inside pickupRadius, collect on touch. */
export class PickupSystem {
  readonly shards: Phaser.GameObjects.Group;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly fx: FxSystem;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, fx: FxSystem) {
    this.run = run;
    this.player = player;
    this.fx = fx;
    this.shards = scene.add.group({ classType: Shard, maxSize: MAX_SHARDS });
  }

  get activeCount(): number {
    return this.shards.countActive(true);
  }

  drop(x: number, y: number, value: number): void {
    const s = this.shards.get(x, y) as Shard | null;
    if (!s) {
      this.collect(value); // pool full: award it directly instead of losing it
      return;
    }
    s.drop(x, y, value);
  }

  update(dt: number): void {
    const px = this.player.x;
    const py = this.player.y;
    const radius = this.run.stats.pickupRadius;
    for (const obj of this.shards.getChildren()) {
      const s = obj as Shard;
      if (!s.active) continue;
      const dx = px - s.x;
      const dy = py - s.y;
      const dist = Math.hypot(dx, dy);
      if (dist < COLLECT_DISTANCE) {
        this.collect(s.value);
        this.fx.pickup(s.x, s.y);
        s.despawn();
        continue;
      }
      if (dist < radius) s.magnetized = true;
      if (s.magnetized) {
        s.vx += (dx / dist) * MAGNET_ACCEL * dt;
        s.vy += (dy / dist) * MAGNET_ACCEL * dt;
        const damp = Math.exp(-3 * dt);
        s.vx *= damp;
        s.vy *= damp;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      s.rotation += dt * 2;
    }
  }

  private collect(value: number): void {
    this.run.addXp(value);
    hook.stats.shardsCollected += 1;
  }
}
