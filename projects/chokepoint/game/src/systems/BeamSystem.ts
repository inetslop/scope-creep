import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor } from '../core/augments';
import { beamLines, inBeamRange, rayTargets } from '../core/beam';
import { beamEffectLines, beamFx } from '../core/beamEffects';
import { EMPTY_BEAM_HOLD, BEAM_HIT_SEC, beamHoldStep } from '../core/beamHold';
import type { BeamHold } from '../core/beamHold';
import { beamPierceVictims, beamScorch } from '../core/beamShapes';
import { pickNearest } from '../core/targeting';
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
  /** Each beam tower's hold state per line (core/beamHold.ts): the same slots as `held`, kept only
   * while its spec carries a beam effect (core/beamEffects.ts). */
  private readonly holds = new Map<Tower, BeamHold[]>();
  /** The beam towers whose hum is on (or asked for): it follows the main line's on/off. */
  private readonly humming = new Set<Tower>();

  constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem, sfx: Sfx | undefined) {
    this.towers = towers;
    this.enemies = enemies;
    this.sfx = sfx;
    this.lines = scene.add.graphics().setDepth(DEPTH.bars);
  }

  /** This tower's hold state per line, grown or shrunk in lockstep with `held` when its line
   * count changes (an augment just placed): the main and the old extras keep theirs, new slots
   * start empty so the first lock pulses at once. */
  private holdsFor(t: Tower, size: number): BeamHold[] {
    let holds = this.holds.get(t);
    if (!holds || holds.length !== size) {
      // The rays sit between the main and the extras, like in the `held` resize: keep the main in
      // slot 0 and the old extras at their new end; the ray slots start free.
      const next: BeamHold[] = new Array<BeamHold>(size).fill(EMPTY_BEAM_HOLD);
      const old = holds ?? [];
      next[0] = old[0] ?? EMPTY_BEAM_HOLD;
      const extras = t.spec.beamExtras.length;
      for (let i = 0; i < Math.min(old.length - 1, extras); i++) next[size - extras + i] = old[1 + i]!;
      holds = next;
      this.holds.set(t, holds);
    }
    return holds;
  }

  update(dt: number): void {
    const g = this.lines;
    g.clear();
    for (const t of this.towers.towers) {
      if (t.spec.beamDps <= 0 && t.spec.beamExtras.length === 0) continue;
      const wasHumming = this.humming.has(t);
      if (t.jammed) {
        if (wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
        t.setBeamOn(false);
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
      // The effects the tower's lines carry (core/beamEffects.ts): none on a plain beam or a
      // Beam added to another kind, and then there is no hold state to keep either.
      const fx = beamFx(t.spec);
      const holds = fx ? this.holdsFor(t, size) : undefined;
      const { main, lines } = beamLines(held[0], held.slice(1 + t.spec.beamRays), this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');
      // Rapid's net factor times the Rally's speed: one factor for every line, the same as towerDps.
      const m = t.spec.beamRapidMul * t.rallyRateMul;
      const mainTarget = main === -1 ? undefined : this.enemies.all[main]!;
      // The rays are not sticky: re-derived every frame on the next enemies furthest along.
      const rays = mainTarget ? rayTargets(this.enemies.all, t.x, t.y, range, mainTarget, t.spec.beamRays) : [];
      // What every line holds this frame, in the lines' slot order [main, rays, extras]: a ray
      // with no enemy this frame holds undefined, so its hold resets with it.
      const targets: (Enemy | undefined)[] = [mainTarget];
      for (let i = 0; i < t.spec.beamRays; i++) targets.push(i < rays.length ? rays[i]! : undefined);
      for (let i = 0; i < lines.length; i++) targets.push(lines[i]);
      const steps = holds ? targets.map((e, i) => beamHoldStep(holds[i]!, e, dt)) : undefined;
      // The beam is sustained: each line's per-second rate over the frame, through the normal hit.
      if (mainTarget) {
        if (!held[0]) hook.stats.shotsFired += 1; // a new lock: the tower attacked (the line then sustains)
        this.enemies.beamTick(mainTarget, t.spec.beamDps * m * dt, t);
      }
      // The main line's shapes (core/beamShapes.ts): Lance pierces past the target in a straight
      // corridor at the full rate, Splash scorches the nearest others around it at half. Both die
      // with the main target: a tick that killed it leaves no line, so no shapes either.
      let pierced: number[] = [];
      let scorched: number[] = [];
      const scorch = beamScorch(t.spec);
      if (mainTarget && mainTarget.active) {
        if (t.spec.kind === 'beam' && t.spec.pierce > 0) {
          pierced = beamPierceVictims(this.enemies.all, t.x, t.y, range, mainTarget, t.spec.pierce);
          for (const i of pierced) this.enemies.beamTick(this.enemies.all[i]!, t.spec.beamDps * m * dt, t); // full rate, the same feed
        }
        if (scorch) {
          scorched = pickNearest(mainTarget, scorch.radius, this.enemies.all, scorch.cap);
          for (const i of scorched) this.enemies.beamTick(this.enemies.all[i]!, scorch.rate * m * dt, t);
        }
      }
      for (const e of rays) this.enemies.beamTick(e, t.spec.beamDps * m * dt, t);
      for (let i = 0; i < lines.length; i++) {
        const e = lines[i];
        if (e) this.enemies.beamTick(e, t.spec.beamExtras[i]! * m * dt, t);
      }
      // The hold's effects, only on the targets still alive after the tick (it may have killed one).
      if (fx && steps) {
        for (let i = 0; i < targets.length; i++) {
          const e = targets[i];
          if (e && e.active) this.enemies.beamEffects(e, fx, steps[i]!.pulse, t);
        }
      }
      // A tick may have killed its target this frame: the line is gone the instant the target dies,
      // and a dead line's hold resets, so a recycled pool object never resumes a stale contact.
      const now: (Enemy | undefined)[] = [];
      for (let i = 0; i < targets.length; i++) {
        const e = targets[i];
        const alive = e && e.active;
        now.push(alive ? e : undefined);
        if (holds && steps) holds[i] = alive ? steps[i]!.hold : EMPTY_BEAM_HOLD;
      }
      this.held.set(t, now);
      t.setBeamOn(main !== -1); // the orb's disc pulses only while the beam is on
      // The hum follows the line's own visibility: on at the lock, off with no target; a retarget
      // is on→on, so the hum stays up (now[0], not main: a beamTick kill drops the line this frame).
      const on = now[0] !== undefined;
      if (on && !wasHumming) { this.sfx?.beamHumStart(t); this.humming.add(t); }
      if (!on && wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
      if (main === -1) continue;
      const color = PALETTE[towerColor(t.augments) ?? 'faint'];
      // The effects the beam carries ride it as thin lines beside it, one per effect (at most two).
      const fxs = fx ? beamEffectLines(t.augments) : [];
      const muzzle = t.muzzle(0);
      const mainE = now[0];
      if (t.spec.kind === 'beam' && t.spec.pierce > 0 && mainE) {
        // The main line is straight: it runs through the pierced enemies to the last one struck,
        // or to the range edge along the aim when none is.
        const end = pierceEnd(t.x, t.y, mainE, range, this.enemies.all, pierced);
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, end.x, end.y);
        fxLines(g, muzzle, end, fxs);
        hitTick(g, muzzle, mainE);
        for (const i of pierced) {
          const e = this.enemies.all[i]!;
          if (e.active) hitTick(g, muzzle, e);
        }
      } else if (mainE) {
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, mainE.x, mainE.y);
        fxLines(g, muzzle, mainE, fxs);
        hitTick(g, muzzle, mainE);
      }
      for (let i = 1; i < now.length; i++) {
        const e = now[i];
        if (!e) continue;
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, e.x, e.y);
        fxLines(g, muzzle, e, fxs);
        hitTick(g, muzzle, e);
      }
      if (scorch && mainE && scorched.length > 0) {
        g.lineStyle(2, color, 0.3); // the scorch ring: faint, only while someone is scorched
        g.strokeCircle(mainE.x, mainE.y, scorch.radius);
      }
    }
  }

  /** Invariant: no held beam target is inactive or out of its tower's range, and no hold state
   * disagrees with its line (one hold per line, nextHit counting down in (0, BEAM_HIT_SEC]). */
  broken(): string | undefined {
    for (const [t, held] of this.held) {
      // A Mute holds it: the lines are off and the held targets are frozen; beamLines re-validates
      // every one of them the frame the jam lifts, so a stale target never beams.
      if (t.jammed) continue;
      const range = t.spec.range * CELL;
      for (const e of held) {
        if (e && (!e.active || !inBeamRange(e, t.x, t.y, range))) return `a beam from (${t.cell.col}, ${t.cell.row}) holds an out-of-range target`;
      }
      const holds = this.holds.get(t);
      if (!holds) continue;
      if (holds.length !== held.length) return `a beam from (${t.cell.col}, ${t.cell.row}) keeps ${holds.length} holds for its ${held.length} lines`;
      for (let i = 0; i < holds.length; i++) {
        const h = holds[i]!;
        if ((h.enemy !== undefined) !== (held[i] !== undefined)) return `a beam from (${t.cell.col}, ${t.cell.row}) has a hold that disagrees with its line`;
        if (h.enemy && (!Number.isFinite(h.nextHit) || h.nextHit < 0 || h.nextHit > BEAM_HIT_SEC)) return `a beam from (${t.cell.col}, ${t.cell.row}) holds ${h.nextHit}s to its next hit`;
      }
    }
    return undefined;
  }
}

/** A small flat tick across the line at the hit end. */
function hitTick(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, to: { x: number; y: number }): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const px = -dy / d;
  const py = dx / d;
  g.lineBetween(to.x - px * 4, to.y - py * 4, to.x + px * 4, to.y + py * 4);
}

/** The thin effect lines that ride beside a beam line (core/beamEffects.ts), one per effect. */
function fxLines(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, to: { x: number; y: number }, fxs: readonly { id: string; color: number }[]): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const px = -dy / d;
  const py = dx / d;
  for (let i = 0; i < fxs.length; i++) {
    const off = 5 + i * 4;
    g.lineStyle(2, fxs[i]!.color, 0.5);
    g.lineBetween(from.x + px * off, from.y + py * off, to.x + px * off, to.y + py * off);
  }
}

/** Where the pierced main line ends: the last enemy struck, or the range edge along the aim when none is. */
function pierceEnd(
  x: number,
  y: number,
  main: { x: number; y: number },
  range: number,
  enemies: readonly { x: number; y: number; active: boolean }[],
  pierced: readonly number[],
): { x: number; y: number } {
  const dx = main.x - x;
  const dy = main.y - y;
  const d = Math.hypot(dx, dy) || 1;
  let last: { x: number; y: number } | undefined;
  for (const i of pierced) {
    const e = enemies[i]!;
    if (e.active) last = e;
  }
  return last ?? { x: x + (dx / d) * range, y: y + (dy / d) * range };
}
