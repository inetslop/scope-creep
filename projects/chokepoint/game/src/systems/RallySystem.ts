import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { RALLY_PCT, inRallyReach, rallyBuffed } from '../core/rally';
import type { FxSystem } from './FxSystem';
import type { TowerSystem } from './TowerSystem';

/**
 * Rally, the augment that works on other towers (core/rally.ts): every tower in reach of a
 * Rally attacks a flat +10% faster, never stacking. It shows the effect on the board so a
 * first-time player can read it: a soft teal ring pulses out to its range once a second
 * from each rally tower that has a neighbor, and a small yellow chevron floats over every
 * buffed tower.
 */
export class RallySystem {
  private readonly towers: TowerSystem;
  private readonly fx: FxSystem;
  /** One Graphics for every chevron, cleared and refilled each frame (the scene destroys it). */
  private readonly chevrons: Phaser.GameObjects.Graphics;
  /** Seconds since the last pulse; the rings go out once per second. */
  private pulseSec = 0;

  constructor(scene: Phaser.Scene, towers: TowerSystem, fx: FxSystem) {
    this.towers = towers;
    this.fx = fx;
    this.chevrons = scene.add.graphics().setDepth(DEPTH.bars);
  }

  update(dt: number): void {
    const list = this.towers.towers;
    const hasRally = list.map((t) => t.augments.some((c) => c.id === 'rally'));
    const attacks = list.map((t) => t.spec.attacks && t.spec.kind !== 'rally');
    const ranges = list.map((t) => t.spec.range);
    const buffed = rallyBuffed(list.map((t) => t.cell), hasRally, attacks, ranges);
    for (let i = 0; i < list.length; i++) list[i]!.rallyRateMul = buffed[i] ? 1 + RALLY_PCT : 1;

    // The chevron over each buffed tower, just above its body.
    const g = this.chevrons;
    g.clear();
    g.fillStyle(PALETTE.yellow, 1);
    for (let i = 0; i < list.length; i++) {
      if (!buffed[i]) continue;
      const x = list[i]!.x, y = list[i]!.y - 32;
      g.beginPath();
      g.moveTo(x - 7, y + 3);
      g.lineTo(x, y - 4);
      g.lineTo(x + 7, y + 3);
      g.lineTo(x + 7, y + 6.5);
      g.lineTo(x, y - 0.5);
      g.lineTo(x - 7, y + 6.5);
      g.closePath();
      g.fillPath();
    }

    // Once a second, each rally tower with a neighbor pulses its range.
    this.pulseSec += dt;
    if (this.pulseSec >= 1) {
      this.pulseSec -= 1;
      for (let i = 0; i < list.length; i++) {
        if (!hasRally[i]) continue;
        const t = list[i]!;
        const hasNeighbor = list.some((o, j) => j !== i && inRallyReach(t.cell, o.cell, t.spec.range));
        if (hasNeighbor) this.fx.ring(t.x, t.y, t.spec.range * CELL, PALETTE.teal);
      }
    }
  }
}
