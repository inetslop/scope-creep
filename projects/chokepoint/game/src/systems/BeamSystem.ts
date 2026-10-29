import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor } from '../core/augments';
import { beamLines, inBeamRange, rayTargets } from '../core/beam';
import { hook } from '../debug/testHook';
import type { Sfx } from '../audio/Sfx';
import type { Enemy } from '../entities/Enemy';
import type { Tower } from '../entities/Tower';
import type { EnemySystem } from './EnemySystem';
import type { TowerSystem } from './TowerSystem';

/**
 * The beam (Beam): the first sustained attack. A continuous line from the muzzle on the enemy it
 * holds — no shots, no cooldown: the line appears the instant a target is locked and is gone the
 * instant there is none (the target rules in core/beam.ts). A Beam-first tower's main line is
 * sticky; a Bolt added to it adds a full-rate ray on the next enemy furthest along (core/beam.ts's
 * rayTargets, re-derived every frame); a Beam added adds a half-rate line on the enemy nearest the
 * main target. Rapid and Rally scale every line the same way. Damage goes through
 * EnemySystem.beamTick, so a beam kill pays through the normal kill
 * path — gold, the combo, the mints, the tower's kills — attributed to the beam's tower.
 */
export class BeamSystem {
  private readonly towers: TowerSystem;
  private readonly enemies: EnemySystem;
  private readonly sfx: Sfx | undefined;
  /** One Graphics for every line, cleared and redrawn each frame (the scene destroys it). */
  private readonly lines: Phaser.GameObjects.Graphics;
  /** Each beam tower's held targets from the last frame: [main line, one per Bolt ray, one per extra line]. */
  private readonly held = new Map<Tower, (Enemy | undefined)[]>();
  /** The beam towers whose hum is on (or asked for): it follows the main line's on/off. */
  private readonly humming = new Set<Tower>();

  constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem, sfx: Sfx | undefined) {
    this.towers = towers;
    this.enemies = enemies;
    this.sfx = sfx;
    this.lines = scene.add.graphics().setDepth(DEPTH.bars);
  }

  update(dt: number): void {
    const g = this.lines;
    g.clear();
    for (const t of this.towers.towers) {
      if (t.spec.beamDps <= 0 && t.spec.beamExtras.length === 0) continue;
      const wasHumming = this.humming.has(t);
      if (t.jammed) {
        if (wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
        continue; // a Mute holds it: no attack, no line
      }
      const range = t.spec.range * CELL;
      // held grows/shrinks with the tower's lines (an augment just placed): [main, rays, extras].
      let held = this.held.get(t);
      const size = 1 + t.spec.beamRays + t.spec.beamExtras.length;
      if (!held || held.length !== size) {
        // The rays sit between the main and the extras: keep the main in slot 0 and the old extras
        // at their new end; the ray slots start free.
        const next: (Enemy | undefined)[] = new Array<Enemy | undefined>(size).fill(undefined);
        const old = held ?? [];
        next[0] = old[0];
        const extras = t.spec.beamExtras.length;
        for (let i = 0; i < Math.min(old.length - 1, extras); i++) next[size - extras + i] = old[1 + i];
        held = next;
        this.held.set(t, held);
      }
      const { main, lines } = beamLines(held[0], held.slice(1 + t.spec.beamRays), this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');
      // Rapid's net factor times the Rally's speed: one factor for every line, the same as towerDps.
      const m = t.spec.beamRapidMul * t.rallyRateMul;
      const mainTarget = main === -1 ? undefined : this.enemies.all[main]!;
      // The rays are not sticky: re-derived every frame on the next enemies furthest along.
      const rays = mainTarget ? rayTargets(this.enemies.all, t.x, t.y, range, mainTarget, t.spec.beamRays) : [];
      // The beam is sustained: each line's per-second rate over the frame, through the normal hit.
      if (mainTarget) {
        if (!held[0]) hook.stats.shotsFired += 1; // a new lock: the tower attacked (the line then sustains)
        this.enemies.beamTick(mainTarget, t.spec.beamDps * m * dt, t);
        if (t.spec.kind === 'beam') t.aimAt(mainTarget.x, mainTarget.y); // the head tracks its line (no kick: it never fires)
      }
      for (const e of rays) this.enemies.beamTick(e, t.spec.beamDps * m * dt, t);
      for (let i = 0; i < lines.length; i++) {
        const e = lines[i];
        if (e) this.enemies.beamTick(e, t.spec.beamExtras[i]! * m * dt, t);
      }
      // A tick may have killed its target this frame: the line is gone the instant the target dies.
      const now: (Enemy | undefined)[] = [mainTarget, ...rays, ...lines];
      for (let i = 0; i < now.length; i++) {
        const e = now[i];
        if (e && !e.active) now[i] = undefined;
      }
      this.held.set(t, now);
      // The hum follows the line's own visibility: on at the lock, off with no target; a retarget
      // is on→on, so the hum stays up (now[0], not main: a beamTick kill drops the line this frame).
      const on = now[0] !== undefined;
      if (on && !wasHumming) { this.sfx?.beamHumStart(t); this.humming.add(t); }
      if (!on && wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
      if (main === -1) continue;
      const color = PALETTE[towerColor(t.augments) ?? 'faint'];
      const muzzle = t.muzzle(0);
      for (const e of now) {
        if (!e) continue;
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, e.x, e.y);
        // A small flat tick across the line at the hit end.
        const dx = e.x - muzzle.x;
        const dy = e.y - muzzle.y;
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
