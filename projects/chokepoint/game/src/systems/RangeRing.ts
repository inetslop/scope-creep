import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { Building } from './Building';

/** The ring fades for this long after the panel closes. */
const FADE_SEC = 0.15;

/**
 * The selected tower's range ring: while a tower's panel is open (systems/Building.ts), a thin
 * ring in the placement ring's own look (systems/Board.ts showHover) sits at the tower's base,
 * with radius exactly the tower's current range — the same number the panel's stats line says,
 * re-read from the spec each frame, so a committed slot that changes the range (a Reach) is
 * picked up the next frame, and a tower sliding from a move is tracked for free. A readout, not
 * an event: no pulse, no sound, it blocks nothing; it fades out over FADE_SEC the moment the
 * panel closes. The point is stored, never read from the tower during the fade (it may be sold).
 */
export class RangeRing {
  private readonly scene: Phaser.Scene;
  private readonly building: Building;
  /** Lazy: created on the first draw, cleared per frame, dies with the scene. */
  private g: Phaser.GameObjects.Graphics | undefined;
  private pos: { x: number; y: number; r: number } | undefined;
  private fade = 0;

  constructor(scene: Phaser.Scene, building: Building) {
    this.scene = scene;
    this.building = building;
  }

  update(dt: number): void {
    const t = this.building.selectedTower;
    if (t) {
      this.pos = { x: t.x, y: t.y, r: t.spec.range * CELL };
      this.fade = 1;
      this.draw(this.fade);
      return;
    }
    this.fade -= dt / FADE_SEC;
    if (this.fade <= 0) { this.fade = 0; this.clear(); this.pos = undefined; return; }
    this.draw(this.fade);
  }

  /** The placement ring's look (systems/Board.ts showHover's ok branch), at the stored point. */
  private draw(a: number): void {
    const p = this.pos;
    if (!p || p.r <= 0) return;
    if (!this.g) this.g = this.scene.add.graphics().setDepth(DEPTH.preview);
    const g = this.g;
    g.clear();
    g.fillStyle(PALETTE.teal, 0.07 * a);
    g.fillCircle(p.x, p.y, p.r);
    g.lineStyle(2, PALETTE.teal, 0.45 * a);
    g.strokeCircle(p.x, p.y, p.r);
  }

  private clear(): void {
    this.g?.clear();
  }

  /** Invariant: the fade sits in [0,1] and the stored point is finite. */
  broken(): string | undefined {
    if (this.fade < 0 || this.fade > 1) return `range ring fade ${this.fade}`;
    const p = this.pos;
    if (p && (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.r) || p.r < 0))
      return `range ring at (${p.x}, ${p.y}) r ${p.r}`;
    return undefined;
  }
}
