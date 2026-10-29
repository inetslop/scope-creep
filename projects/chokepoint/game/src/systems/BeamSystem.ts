import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor } from '../core/augments';
import { beamLines, inBeamRange } from '../core/beam';
import { hook } from '../debug/testHook';
import type { Enemy } from '../entities/Enemy';
import type { Tower } from '../entities/Tower';
import type { EnemySystem } from './EnemySystem';
import type { TowerSystem } from './TowerSystem';

/**
 * The beam (Beam): the first sustained attack. A continuous line from the muzzle on the enemy it
 * holds — no shots, no cooldown: the line appears the instant a target is locked and is gone the
 * instant there is none (the target rules in core/beam.ts). A Beam-first tower's main line is
 * sticky; a Beam added to another tower adds a half-rate line on the enemy nearest the main
 * target. Damage goes through EnemySystem.beamTick, so a beam kill pays through the normal kill
 * path — gold, the combo, the mints, the tower's kills — attributed to the beam's tower.
 */
export class BeamSystem {
  private readonly towers: TowerSystem;
  private readonly enemies: EnemySystem;
  /** One Graphics for every line, cleared and redrawn each frame (the scene destroys it). */
  private readonly lines: Phaser.GameObjects.Graphics;
  /** Each beam tower's held targets from the last frame: [main line, one per extra line]. */
  private readonly held = new Map<Tower, (Enemy | undefined)[]>();

  constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem) {
    this.towers = towers;
    this.enemies = enemies;
    this.lines = scene.add.graphics().setDepth(DEPTH.bars);
  }

  update(dt: number): void {
    const g = this.lines;
    g.clear();
    for (const t of this.towers.towers) {
      if (t.spec.beamDps <= 0 && t.spec.beamExtras.length === 0) continue;
      if (t.jammed) continue; // a Mute holds it: no attack, no line
      const range = t.spec.range * CELL;
      // held grows/shrinks with the number of extra lines (an augment just placed).
      let held = this.held.get(t);
      const size = 1 + t.spec.beamExtras.length;
      if (!held || held.length !== size) {
        held = Array.from({ length: size }, (_, i) => held?.[i]);
        this.held.set(t, held);
      }
      const { main, lines } = beamLines(held, this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');
      // The beam is sustained: its per-second rate over the frame, through the normal hit.
      if (main !== -1) {
        if (!held[0]) hook.stats.shotsFired += 1; // a new lock: the tower attacked (the line then sustains)
        const m = this.enemies.all[main]!;
        this.enemies.beamTick(m, t.spec.beamDps * dt, t);
        if (t.spec.kind === 'beam') t.aimAt(m.x, m.y); // the head tracks its line (no kick: it never fires)
      }
      for (let i = 0; i < lines.length; i++) {
        const e = lines[i];
        if (e) this.enemies.beamTick(e, t.spec.beamExtras[i]! * dt, t);
      }
      // A tick may have killed its target this frame: the line is gone the instant the target dies.
      const now: (Enemy | undefined)[] = [main === -1 ? undefined : this.enemies.all[main]!, ...lines];
      for (let i = 0; i < now.length; i++) {
        const e = now[i];
        if (e && !e.active) now[i] = undefined;
      }
      this.held.set(t, now);
      if (main === -1) continue;
      const color = PALETTE[towerColor(t.augments) ?? 'faint'];
      const m = t.muzzle(0);
      for (const e of now) {
        if (!e) continue;
        g.lineStyle(4, color, 1);
        g.lineBetween(m.x, m.y, e.x, e.y);
        // A small flat tick across the line at the hit end.
        const dx = e.x - m.x;
        const dy = e.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d < 1) continue;
        const px = -dy / d;
        const py = dx / d;
        g.lineBetween(e.x - px * 4, e.y - py * 4, e.x + px * 4, e.y + py * 4);
      }
    }
  }

  /** Invariant: no held beam target is inactive or out of its tower's range. */
  broken(): string | undefined {
    for (const [t, held] of this.held) {
      // A Mute holds it: the lines are off and the held targets are frozen; beamLines re-validates
      // every one of them the frame the jam lifts, so a stale target never beams.
      if (t.jammed) continue;
      const range = t.spec.range * CELL;
      for (const e of held) {
        if (e && (!e.active || !inBeamRange(e, t.x, t.y, range))) return `a beam from (${t.cell.col}, ${t.cell.row}) holds an out-of-range target`;
      }
    }
    return undefined;
  }
}
