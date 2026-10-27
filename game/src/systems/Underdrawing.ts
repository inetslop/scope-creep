import type Phaser from 'phaser';
import { drawBarOutline, drawShapeOutline } from '../art/shapes';
import { ELITE, DEPTH, UNDERDRAW } from '../config';
import { PALETTE } from '../content/palette';
import type { EnemyDef } from '../content/types';

const START_ALPHA = 0.5;

interface Sketch { def: EnemyDef; elite: boolean; x: number; y: number; age: number; }

/**
 * Pencil underdrawing: from UNDERDRAW.atSec on, each director spawn is sketched as a faint grey
 * outline at its fixed spawn spot leadSec before it lands, fading linearly to zero by landing.
 * Cosmetic only: no listeners, no physics, no input, no hitbox.
 */
export class Underdrawing {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly sketches: Sketch[] = [];

  constructor(scene: Phaser.Scene) { this.g = scene.add.graphics().setDepth(DEPTH.underdrawing).setVisible(false); }

  get activeCount(): number { return this.sketches.length; }

  /** Exactly once per announced spawn, at the spot the enemy will occupy. */
  sketch(def: EnemyDef, elite: boolean, x: number, y: number): void {
    this.sketches.push({ def, elite, x, y, age: 0 });
  }

  /** Ages sketches (fades to zero at leadSec) and redraws the single layer. */
  update(dt: number): void {
    for (let i = this.sketches.length - 1; i >= 0; i--) {
      const s = this.sketches[i]!;
      s.age += dt;
      if (s.age >= UNDERDRAW.leadSec) this.sketches.splice(i, 1); // removed the frame the enemy lands: never lingers
    }
    const g = this.g;
    g.clear();
    if (this.sketches.length === 0) { g.setVisible(false); return; }
    g.setVisible(true);
    for (const s of this.sketches) {
      const scale = s.elite ? ELITE.scale : 1;
      const look = s.def.look;
      const alpha = START_ALPHA * (1 - s.age / UNDERDRAW.leadSec);
      // A bar look appears as a length x thickness bar (see drawEnemy), so sketch that, not the 2:1 rect its radius implies.
      if (look.bar) drawBarOutline(g, s.x, s.y, look.bar.length * scale, look.bar.thickness * scale, PALETTE.pencil, 2, alpha);
      else drawShapeOutline(g, look.shape, s.x, s.y, look.radius * scale, PALETTE.pencil, 2, alpha, look.points);
    }
  }
}
