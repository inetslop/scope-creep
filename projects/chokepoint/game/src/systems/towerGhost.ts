import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { getAugment } from '../content/augments';
import { deepOf, PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import type { Tower } from '../entities/Tower';
import { pipColor } from '../entities/towerLook';
import { fillRing } from '../ui/ring';

/**
 * The "what-if" markers: while a hand card is selected, a tower with a free slot shows, at half
 * alpha on its next free slot, the tier pip and a compact marker of what the card would add —
 * the same shapes towerLook paints on a tower (a barrel, a ring, a tick), in the augment's own
 * color. Display only: Building decides which towers show one, and the commit renders the real
 * thing exactly as before.
 */
export class TowerGhost {
  private readonly scene: Phaser.Scene;
  private readonly markers = new Map<Tower, Phaser.GameObjects.Graphics>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Towers currently showing a ghost marker. */
  get towers(): Tower[] {
    return [...this.markers.keys()];
  }

  /** Show (or move/replace) the what-if marker for `copy` on `tower`'s next free slot. */
  show(tower: Tower, copy: AugmentCopy): void {
    const p = tower.slotPoint(tower.augments.length); // slots fill in order
    this.clear(tower); // recreate: this is how a marker moves or changes
    const g = this.scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(p.x, p.y).setAlpha(0.5);
    g.fillStyle(pipColor(copy.tier), 1).fillCircle(0, 0, 4); // the pip, exactly where the real one will land
    TowerGhost.drawMarker(g, copy);
    this.markers.set(tower, g);
  }

  /** Remove `tower`'s marker, if any. */
  clear(tower: Tower): void {
    const g = this.markers.get(tower);
    if (g) { g.destroy(); this.markers.delete(tower); }
  }

  /** Remove every marker. */
  clearAll(): void {
    for (const t of [...this.markers.keys()]) this.clear(t);
  }

  /** What `copy` would add: one compact shape of the same kind towerLook paints on the tower. */
  static drawMarker(g: Phaser.GameObjects.Graphics, copy: AugmentCopy): void {
    const def = getAugment(copy.id);
    const added = def.added;
    const color = PALETTE[def.look.color];
    const y = -9; // the marker's center, just above the slot point
    if (added.extraShots) {
      g.fillStyle(color, 1); g.fillRoundedRect(-7, y - 4, 14, 8, 4); // a short capsule
    } else if (added.pierce) {
      g.fillStyle(color, 1); g.fillRoundedRect(-3, y - 8, 6, 16, 3); // a thin long rod
    } else if (added.splash) {
      g.fillStyle(color, 1); g.fillRoundedRect(-8, y - 4, 11, 8, 4); g.fillCircle(4, y, 4); // a capsule, a bulb at its mouth
    } else if (added.rangeMul) {
      g.fillStyle(color, 1); g.fillRoundedRect(-9, y - 3, 18, 6, 3); // a longer, thinner capsule
    } else if (added.slow) {
      fillRing(g, 0, y, 9, 3, 0, Math.PI * 2, color, 1);
    } else if (added.root) {
      fillRing(g, 0, y, 9, 3, 0, Math.PI * 2, color, 1);
      for (let i = 0; i < 4; i++) fillRing(g, 0, y, 9, 5, (i * Math.PI) / 2 - 0.12, (i * Math.PI) / 2 + 0.12, color, 1);
    } else if (added.mark) {
      fillRing(g, 0, y, 9, 2, 0, Math.PI * 2, color, 1);
      fillRing(g, 0, y, 9, 3, -0.14, 0.14, color, 1);
    } else if (added.burn) {
      fillRing(g, 0, y, 9, 3, -0.4, -0.1, color, 1); // a short thick arc
    } else if (added.rateMul) {
      fillRing(g, 0, y, 9, 3, 0, 0.28, color, 1); // a short thick band
    } else if (added.push) {
      g.fillStyle(color, 1); g.fillTriangle(0, y - 7, -5, y + 5, 5, y + 5); // a small arrowhead, pointing out
    } else if (added.goldPerKill) {
      g.fillStyle(deepOf(def.look.color), 1); g.fillCircle(0, y + 2, 5); // a coin, the deep one below
      g.fillStyle(color, 1); g.fillCircle(0, y, 5);
    } else {
      g.fillStyle(color, 1); g.fillCircle(0, y, 5); // Rally and the rest: a small token of its own color
    }
  }
}
