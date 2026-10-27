import Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { WeaponDef } from '../content/types';
import { WEAPON_BY_ID } from '../content/weapons';
import { pickArcTargets, type ArcTarget } from '../core/arc';
import type { RunState } from '../core/run';
import { fireRateMultiplier } from '../core/stats';
import { fromAngle, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';

/** Pooled ink lines; 4 covers the fastest realistic fire rate (see update()). */
const MAX_LINES = 4;

/**
 * Arc weapon: on its own cooldown a jagged ink bolt snaps from the player
 * toward the aim and chains between nearby enemies. No projectiles; targets
 * are picked by src/core/arc.ts, damage is applied immediately, and the bolt
 * is a fading ink polyline on a pooled Graphics.
 */
export class ArcSystem {
  readonly lines: Phaser.GameObjects.Graphics[] = [];
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly damageNumbers: DamageNumbers;
  private readonly kill: (e: Enemy) => void;
  private cooldown = 0;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, enemies: Phaser.Physics.Arcade.Group, fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, kill: (e: Enemy) => void) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.enemies = enemies;
    this.fx = fx;
    this.sfx = sfx;
    this.damageNumbers = damageNumbers;
    this.kill = kill;
  }

  update(dt: number, firing: boolean): void {
    const def = this.activeDef();
    if (!def || !def.arc) {
      this.cooldown = 0;
      return;
    }
    let cd = this.cooldown - dt;
    if (firing && cd <= 0) {
      this.fire(def);
      cd += 1 / (def.fireRate * fireRateMultiplier(this.run.stats, this.run.streak));
    }
    this.cooldown = Math.max(cd, 0);
  }

  /** The arc weapon the player owns, if any (found by field, not by id). */
  private activeDef(): WeaponDef | null {
    for (const id of this.run.weapons) {
      const w = WEAPON_BY_ID.get(id);
      if (w?.arc) return w;
    }
    return null;
  }

  private fire(def: WeaponDef): void {
    const spec = def.arc!;
    const stats = this.run.stats;
    const aim = fromAngle(this.player.aimAngle);
    const origin = this.player.muzzle();
    const bySerial = new Map<number, Enemy>();
    const list: ArcTarget[] = [];
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active) continue;
      bySerial.set(e.serial, e);
      list.push({ id: e.serial, x: e.x, y: e.y });
    }
    const ids = pickArcTargets(list, origin, aim, spec.range, spec.coneDeg, spec.chainRadius, spec.maxJumps);
    const points: Vec2[] = [origin];
    let from: Vec2 = origin;
    for (const id of ids) {
      const e = bySerial.get(id);
      if (!e || !e.active) continue; // killed mid-chain by an earlier jump: skip
      const crit = stats.critChance > 0 && this.run.rng.chance(stats.critChance);
      const dmg = (crit ? 2 : 1) * def.damage * stats.damageMul;
      const died = e.hit(dmg, from, def.knockback);
      from = { x: e.x, y: e.y };
      this.damageNumbers.show(e.x, e.y, dmg, crit);
      this.fx.hit(e.x, e.y, e.def.look.body);
      if (crit) {
        this.sfx.critHit();
        this.fx.critRing(e.x, e.y);
      } else {
        this.sfx.hit();
      }
      if (died) this.kill(e);
      points.push(from);
    }
    if (points.length === 1) points.push({ x: origin.x + aim.x * spec.range * 0.5, y: origin.y + aim.y * spec.range * 0.5 }); // whiff: short stub toward the aim
    this.sfx.shoot(def.id);
    hook.stats.shotsFired += 1;
    this.draw(points, spec.fadeMs);
  }

  /** Draws the bolt on a pooled Graphics and fades it out over `fadeMs`. */
  private draw(points: Vec2[], fadeMs: number): void {
    const line = this.acquireLine();
    if (!line) return; // pool full: skip the cosmetic rather than allocate
    const pts = this.jagged(points);
    line.clear();
    line.lineStyle(4, PALETTE.ink, 1);
    line.beginPath();
    line.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) line.lineTo(pts[i].x, pts[i].y);
    line.strokePath();
    line.setAlpha(1);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: fadeMs, ease: 'Linear', onComplete: () => line.clear() });
  }

  /** A pooled line whose fade finished (alpha <= 0), or a fresh one under the cap. */
  private acquireLine(): Phaser.GameObjects.Graphics | null {
    for (const line of this.lines) {
      if (line.alpha <= 0) {
        this.scene.tweens.killTweensOf(line); // never restart a fade mid-flight
        return line;
      }
    }
    if (this.lines.length >= MAX_LINES) return null;
    const line = this.scene.add.graphics().setDepth(DEPTH.fx);
    this.lines.push(line);
    return line;
  }

  /** Inserts 2-3 zigzag segments per leg so the bolt reads as a cracked ink line. */
  private jagged(points: Vec2[]): Vec2[] {
    const out: Vec2[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const segs = 2 + (this.run.rng.chance(0.5) ? 1 : 0);
      for (let s = 1; s < segs; s++) {
        if (len < 1e-6) break; // degenerate leg: no zigzag
        const t = s / segs;
        const off = this.run.rng.range(-16, 16);
        out.push({ x: a.x + dx * t - (dy / len) * off, y: a.y + dy * t + (dx / len) * off });
      }
      out.push(b);
    }
    return out;
  }
}
