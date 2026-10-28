import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { TOWER_BODY } from '../art/textures';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { Tower } from '../entities/Tower';
import { fillRing } from '../ui/ring';
import type { TowerSystem } from './TowerSystem';

/** The completed ring fades for this long after each gust. */
const FADE_SEC = 0.1;
/** At the plinth's edge, the same base ring as Mark's (entities/towerLook.ts); board units. */
const RING_R = TOWER_BODY * CELL * 1.95;
const RING_W = 2;

/**
 * The push windup: a thin ring in Push's own color at the tower's base, sweeping from the top
 * clockwise once per charge interval, so the next gust is readable before it lands. When the
 * gust fires the ring completes, fades over FADE_SEC, and the sweep restarts. The charge is the
 * tower's own cooldown (systems/TowerSystem.ts): it counts down to the next gust and jumps back
 * to the full interval the moment the gust fires. Driven by `dt`, so it freezes while paused.
 */
export class PushWindup {
  private readonly scene: Phaser.Scene;
  private readonly towers: TowerSystem;
  private readonly color: number;
  private readonly rings = new Map<Tower, { g: Phaser.GameObjects.Graphics; prev: number; fade: number }>();

  constructor(scene: Phaser.Scene, towers: TowerSystem) {
    this.scene = scene;
    this.towers = towers;
    this.color = PALETTE[getAugment('push').look.color];
  }

  update(dt: number): void {
    for (const t of this.towers.towers) {
      if (t.spec.firstId !== 'push') continue; // only Push towers wind up
      let ring = this.rings.get(t);
      if (!ring) {
        // Just built: the sweep starts from whatever charge is already left.
        ring = { g: this.scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(t.x, t.y), prev: t.cooldown, fade: 0 };
        this.rings.set(t, ring);
      }
      const fired = t.cooldown > ring.prev + 1e-6; // the gust fired this frame: cooldown jumped back up
      ring.fade = fired ? FADE_SEC : Math.max(0, ring.fade - dt);
      ring.prev = t.cooldown;
      const interval = 1 / (t.spec.rate * t.rallyRateMul);
      const progress = Math.min(1, Math.max(0, 1 - t.cooldown / interval));
      ring.g.clear();
      if (ring.fade > 0) fillRing(ring.g, 0, 0, RING_R, RING_W, 0, Math.PI * 2, this.color, ring.fade / FADE_SEC);
      if (progress > 0.004) fillRing(ring.g, 0, 0, RING_R, RING_W, 0, progress * Math.PI * 2, this.color, 1);
    }
  }

  /** Invariant: every windup ring sits on its tower with a finite position and state. */
  broken(): string | undefined {
    for (const [t, ring] of this.rings) {
      if (!Number.isFinite(ring.g.x) || !Number.isFinite(ring.g.y) || !Number.isFinite(ring.prev) || !Number.isFinite(ring.fade))
        return `push windup at (${t.cell.col}, ${t.cell.row})`;
    }
    return undefined;
  }
}
