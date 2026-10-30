import type Phaser from 'phaser';
import { CELL, DEPTH, TICK_SEC } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor } from '../core/augments';
import { beamLines, inBeamRange, rayTargets } from '../core/beam';
import { beamEffectLines, beamFx } from '../core/beamEffects';
import { EMPTY_BEAM_HOLD, beamHoldStep } from '../core/beamHold';
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
 * holds — the line appears the instant a target is locked and is gone the instant there is none
 * (the target rules in core/beam.ts). Each line deals its rate in ticks: one hit per TICK_SEC
 * held, a quarter of its rate (core/beamHold.ts). A Beam-first tower's main line is sticky; a
 * Bolt added to it adds a full-rate ray on the next enemy furthest along (core/beam.ts's
 * rayTargets, re-derived every frame); a Beam added adds a half-rate line on the enemy nearest the
 * main target. Rapid and Rally scale every line the same way. Every tick goes through
 * EnemySystem.beamTick, so it credits kills, gold, the combo, the mints and the tower's kills
 * like a shot, attributed to the beam's tower.
 */
export class BeamSystem {
  private readonly towers: TowerSystem;
  private readonly enemies: EnemySystem;
  private readonly sfx: Sfx | undefined;
  /** One Graphics for every line, cleared and redrawn each frame (the scene destroys it). */
  private readonly lines: Phaser.GameObjects.Graphics;
  /** Each beam tower's line state (core/beamHold.ts): the tick clock per line
   * [main line, one per Bolt ray, one per extra line], and the pierce and the scorch shapes'
   * clocks, which tick with the main line. */
  private readonly state = new Map<Tower, { lines: BeamHold[]; pierce: BeamHold; scorch: BeamHold }>();
  /** The beam towers whose hum is on (or asked for): it follows the main line's on/off. */
  private readonly humming = new Set<Tower>();

  constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem, sfx: Sfx | undefined) {
    this.towers = towers;
    this.enemies = enemies;
    this.sfx = sfx;
    this.lines = scene.add.graphics().setDepth(DEPTH.bars);
  }

  /** This tower's line state, grown or shrunk in lockstep when its line count changes (an augment
   * just placed): the main and the old extras keep their clocks, new slots start empty so their
   * first tick comes a full TICK_SEC into the next hold; the pierce and the scorch keep running. */
  private stateFor(t: Tower, size: number): { lines: BeamHold[]; pierce: BeamHold; scorch: BeamHold } {
    let st = this.state.get(t);
    if (!st || st.lines.length !== size) {
      // The rays sit between the main and the extras, like in the old `held` resize: keep the main
      // in slot 0 and the old extras at their new end; the ray slots start free.
      const old = st?.lines ?? [];
      const next: BeamHold[] = new Array<BeamHold>(size).fill(EMPTY_BEAM_HOLD);
      next[0] = old[0] ?? EMPTY_BEAM_HOLD;
      const extras = t.spec.beamExtras.length;
      for (let i = 0; i < Math.min(old.length - 1, extras); i++) next[size - extras + i] = old[1 + i]!;
      st = { lines: next, pierce: st?.pierce ?? EMPTY_BEAM_HOLD, scorch: st?.scorch ?? EMPTY_BEAM_HOLD };
      this.state.set(t, st);
    }
    return st;
  }

  update(dt: number): void {
    const g = this.lines;
    g.clear();
    for (const t of this.towers.towers) {
      if (t.spec.beamDps <= 0 && t.spec.beamExtras.length === 0) continue;
      const wasHumming = this.humming.has(t);
      if (t.jammed) {
        t.setBeamOn(false); // a Mute holds it: no attack, no line, no pulse
        if (wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
        t.setBeamOn(false);
        t.beamHolding = false; // a Mute holds it: no attack, no line (a stale hold would keep the quiet dot off)
        continue;
      }
      const range = t.spec.range * CELL;
      // The tower's lines: [main, one per Bolt ray, one per extra line], each with its tick clock.
      const size = 1 + t.spec.beamRays + t.spec.beamExtras.length;
      const st = this.stateFor(t, size);
      // The effects the tower's lines carry (core/beamEffects.ts): none on a plain beam or a
      // Beam added to another kind.
      const fx = beamFx(t.spec);
      const { main, lines } = beamLines(
        st.lines[0]!.enemy as Enemy | undefined,
        st.lines.slice(1 + t.spec.beamRays).map((h) => h.enemy as Enemy | undefined),
        this.enemies.all, t.x, t.y, range, t.spec.kind === 'beam');
      // Rapid's net factor times the Rally's speed: one factor for every line, the same as towerDps.
      const m = t.spec.beamRapidMul * t.rallyRateMul;
      const mainTarget = main === -1 ? undefined : this.enemies.all[main]!;
      // The rays are not sticky: re-derived every frame on the next enemies furthest along.
      const rays = mainTarget ? rayTargets(this.enemies.all, t.x, t.y, range, mainTarget, t.spec.beamRays) : [];
      // What every line holds this frame, in the lines' slot order [main, rays, extras]: a ray
      // with no enemy this frame holds undefined, so its clock starts fresh with the next lock.
      const targets: (Enemy | undefined)[] = [mainTarget];
      for (let i = 0; i < t.spec.beamRays; i++) targets.push(i < rays.length ? rays[i]! : undefined);
      for (let i = 0; i < lines.length; i++) targets.push(lines[i]);
      // One frame of every line's tick clock (core/beamHold.ts): a missing or new target deals
      // nothing for its partial tick and starts a fresh clock; a pulse rides every 4th tick.
      const steps = targets.map((e, i) => beamHoldStep(st.lines[i]!, e, dt));
      // The beam is sustained: each line deals one tick per TICK_SEC held, a quarter of its rate.
      if (mainTarget) {
        if (!st.lines[0]!.enemy) hook.stats.shotsFired += 1; // a new lock: the tower attacked (the line then sustains)
        for (let k = 0; k < steps[0]!.ticks; k++) this.enemies.beamTick(mainTarget, t.spec.beamDps * m * TICK_SEC, t);
      }
      // The main line's shapes (core/beamShapes.ts): Lance pierces past the target in a straight
      // corridor at the full rate, Splash scorches the nearest others around it at half. Both tick
      // with the main line and die with the main target: a tick that killed it leaves no line, so
      // no shapes either.
      let pierced: number[] = [];
      let scorched: number[] = [];
      const scorch = beamScorch(t.spec);
      const held = mainTarget && mainTarget.active;
      const pierceStep = beamHoldStep(st.pierce, held ? mainTarget : undefined, dt);
      const scorchStep = beamHoldStep(st.scorch, held ? mainTarget : undefined, dt);
      if (held) {
        if (t.spec.kind === 'beam' && t.spec.pierce > 0) {
          pierced = beamPierceVictims(this.enemies.all, t.x, t.y, range, mainTarget, t.spec.pierce);
          if (pierceStep.ticks > 0) for (const i of pierced) this.enemies.beamTick(this.enemies.all[i]!, t.spec.beamDps * m * TICK_SEC, t); // full rate, the same feed
        }
        if (scorch) {
          scorched = pickNearest(mainTarget, scorch.radius, this.enemies.all, scorch.cap);
          if (scorchStep.ticks > 0) for (const i of scorched) this.enemies.beamTick(this.enemies.all[i]!, scorch.rate * m * TICK_SEC, t);
        }
      }
      for (let i = 1; i <= t.spec.beamRays; i++) {
        const e = targets[i];
        if (e) for (let k = 0; k < steps[i]!.ticks; k++) this.enemies.beamTick(e, t.spec.beamDps * m * TICK_SEC, t);
      }
      for (let i = 0; i < lines.length; i++) {
        const e = lines[i];
        if (e) for (let k = 0; k < steps[1 + t.spec.beamRays + i]!.ticks; k++) this.enemies.beamTick(e, t.spec.beamExtras[i]! * m * TICK_SEC, t);
      }
      // The hold's effects, only on the targets still alive after the tick (it may have killed one).
      if (fx) {
        for (let i = 0; i < targets.length; i++) {
          const e = targets[i];
          if (e && e.active && steps[i]!.ticks > 0) this.enemies.beamEffects(e, fx, steps[i]!.pulse, t);
        }
      }
      // A tick may have killed its target this frame: the line is gone the instant the target dies,
      // and a dead line's clock resets, so a recycled pool object never resumes a stale hold.
      const now: (Enemy | undefined)[] = [];
      for (let i = 0; i < targets.length; i++) {
        const e = targets[i];
        const alive = e && e.active;
        now.push(alive ? e : undefined);
        st.lines[i] = alive ? steps[i]!.hold : EMPTY_BEAM_HOLD;
      }
      // The shapes die with the main target too: a tick that killed it clears their clocks.
      const mainAlive = mainTarget && mainTarget.active;
      st.pierce = mainAlive ? pierceStep.hold : EMPTY_BEAM_HOLD;
      st.scorch = mainAlive ? scorchStep.hold : EMPTY_BEAM_HOLD;
      // A held line counts as firing: a shot+beam tower's quiet dot stays off while the beam holds one.
      t.beamHolding = now.some((e) => e !== undefined);
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
        hitPulse(g, muzzle, mainE, 1 - st.lines[0]!.acc / TICK_SEC);
        for (const i of pierced) {
          const e = this.enemies.all[i]!;
          if (e.active) {
            hitTick(g, muzzle, e);
            hitPulse(g, muzzle, e, 1 - st.pierce.acc / TICK_SEC);
          }
        }
      } else if (mainE) {
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, mainE.x, mainE.y);
        fxLines(g, muzzle, mainE, fxs);
        hitTick(g, muzzle, mainE);
        hitPulse(g, muzzle, mainE, 1 - st.lines[0]!.acc / TICK_SEC);
      }
      for (let i = 1; i < now.length; i++) {
        const e = now[i];
        if (!e) continue;
        g.lineStyle(4, color, 1);
        g.lineBetween(muzzle.x, muzzle.y, e.x, e.y);
        fxLines(g, muzzle, e, fxs);
        hitTick(g, muzzle, e);
        hitPulse(g, muzzle, e, 1 - st.lines[i]!.acc / TICK_SEC);
      }
      if (scorch && mainE && scorched.length > 0) {
        g.lineStyle(2, color, 0.3); // the scorch ring: faint, only while someone is scorched
        g.strokeCircle(mainE.x, mainE.y, scorch.radius);
      }
    }
  }

  /** Invariant: no held beam target is inactive or out of its tower's range, and no hold state
   * disagrees with its line (one hold per line, its clock in [0, TICK_SEC), the pierce and the
   * scorch on the main line's target). */
  broken(): string | undefined {
    for (const [t, st] of this.state) {
      // A Mute holds it: the lines are off and the holds are frozen; beamLines re-validates
      // every one of them the frame the jam lifts, so a stale target never beams.
      if (t.jammed) continue;
      const range = t.spec.range * CELL;
      for (const h of st.lines) {
        const e = h.enemy as Enemy | undefined;
        if (e && (!e.active || !inBeamRange(e, t.x, t.y, range))) return `a beam from (${t.cell.col}, ${t.cell.row}) holds an out-of-range target`;
        if (!Number.isFinite(h.acc) || h.acc < 0 || h.acc >= TICK_SEC) return `a beam from (${t.cell.col}, ${t.cell.row}) holds ${h.acc}s into its tick`;
        if (!Number.isFinite(h.ticks) || h.ticks < 0) return `a beam from (${t.cell.col}, ${t.cell.row}) has dealt ${h.ticks} ticks`;
      }
      if (st.pierce.enemy !== st.lines[0]!.enemy || st.scorch.enemy !== st.lines[0]!.enemy) return `a beam from (${t.cell.col}, ${t.cell.row}) keeps its shapes off its main line`;
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

/** A short brightening of the hit tick: the beam's tick pulse, bright at the tick, faded by the next. */
function hitPulse(g: Phaser.GameObjects.Graphics, from: { x: number; y: number }, to: { x: number; y: number }, glow: number): void {
  if (glow < 0.05) return;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const px = -dy / d;
  const py = dx / d;
  g.lineStyle(2, PALETTE.road, glow);
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
