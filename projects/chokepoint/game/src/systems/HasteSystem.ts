import type Phaser from 'phaser';
import { CELL } from '../config';
import { inRallyReach } from '../core/rally';
import { towerColor } from '../core/augments';
import { PALETTE } from '../content/palette';
import type { EnemySystem } from './EnemySystem';
import type { TowerSystem } from './TowerSystem';
import type { Tower } from '../entities/Tower';
import { hasteRing } from './fx/hasteRing';

/**
 * Haste, the first aura that works on enemies and towers at once: while an enemy's center is
 * inside a haste tower's range it walks (1 + its hastePct) of its speed, and every tower in reach
 * (its own included) attacks that much faster — off the moment they leave. It is continuous, no
 * duration, no re-application, no shrug-off. One aura per haste tower; the copies in it deepen
 * the percent (30% + 15% each). The base ring is dim while nobody is inside, full while at least
 * one enemy is, and brightens for a beat each time an enemy enters (the working-aura beat).
 * The working ring: while at least one enemy is inside, a thin ring in the tower's own color
 * re-pulses at ground level out to the full radius once a second of scene.time
 * (systems/fx/hasteRing.ts); gone the frame the last one leaves.
 */
export class HasteSystem {
  private readonly scene: Phaser.Scene;
  private readonly towers: TowerSystem;
  private readonly enemies: EnemySystem;
  /** Each aura's ring beat: how many enemies it held the last frame, the entry beat's seconds left, and the last working-ring pulse's ms. */
  private readonly beats = new Map<Tower, { prev: number; flash: number; pulse: number }>();
  /** One live working ring per haste tower: its Graphics and its tween, dropped when it stops. */
  private readonly rings = new Map<Tower, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween }>();

  constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem) {
    this.scene = scene;
    this.towers = towers;
    this.enemies = enemies;
  }

  update(dt: number): void {
    const auras = this.towers.towers.filter((t) => t.spec.hasteCount > 0);
    // The aura holds only while inside: everyone starts the frame unhasted, then each aura adds its share.
    for (const e of this.enemies.all) e.hastePct = 0;
    const inside = new Map<Tower, number>();
    for (const h of auras) {
      const r2 = (h.spec.range * CELL) ** 2;
      let n = 0;
      for (const e of this.enemies.all) {
        if (!e.active) continue;
        const dx = e.x - h.base.x;
        const dy = e.y - h.base.y;
        if (dx * dx + dy * dy <= r2) {
          e.hastePct += h.spec.hastePct;
          n += 1;
        }
      }
      inside.set(h, n);
    }
    // The tower side: the host counts for its own aura, the other auras reach it cell-to-cell.
    for (const t of this.towers.towers) {
      let pct = t.spec.hasteCount > 0 ? t.spec.hastePct : 0;
      for (const h of auras) {
        if (h !== t && inRallyReach(h.cell, t.cell, h.spec.range)) pct += h.spec.hastePct;
      }
      t.hasteRatePct = pct;
    }
    // The working ring: once a second of scene.time while at least one enemy is inside; gone the frame they all leave.
    const now = this.scene.time.now;
    for (const h of auras) {
      const n = inside.get(h)!;
      let beat = this.beats.get(h);
      if (!beat) { beat = { prev: 0, flash: 0, pulse: 0 }; this.beats.set(h, beat); }
      if (n > beat.prev) beat.flash = 0.2;
      beat.prev = n;
      if (n === 0) beat.flash = Math.max(0, beat.flash - dt);
      if (h.hasteRing) h.hasteRing.setAlpha(n > 0 || beat.flash > 0 ? 1 : 0.4);
      if (n === 0) this.dropRing(h);
      else if (now - beat.pulse >= 1000) {
        beat.pulse = now;
        this.dropRing(h); // the last beat is fading out; a no-op once it has faded
        const color = towerColor(h.augments);
        this.rings.set(h, hasteRing(this.scene, h.base.x, h.base.y, h.spec.range * CELL, color ? PALETTE[color] : PALETTE.faint));
      }
    }
    for (const [t] of this.beats) if (!this.towers.towers.includes(t)) { this.dropRing(t); this.beats.delete(t); } // the tower was sold or the board re-grew
  }

  /** The frame the aura stops (or the tower is sold): the ring is gone, even mid-beat. */
  private dropRing(h: Tower): void {
    const r = this.rings.get(h);
    if (!r) return;
    this.rings.delete(h);
    r.tw.remove();
    r.g.destroy();
  }
}
