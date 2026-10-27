import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { WeaponDef } from '../content/types';
import { WEAPON_BY_ID } from '../content/weapons';
import type { RunState } from '../core/run';
import { underexposureDamage } from '../core/underexposure';
import type { Vec2 } from '../core/vec';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';

/**
 * Orbit weapon: circles that revolve around the player and damage enemies they
 * touch. No projectiles; a per-enemy cooldown caps it at one orbit hit per
 * `hitCooldownSec`. Circles are plain images (no physics bodies) — hits are
 * manual distance checks against the enemy's look radius.
 */
export class OrbitSystem {
  readonly circles: Phaser.GameObjects.Image[] = [];
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly damageNumbers: DamageNumbers;
  private readonly kill: (e: Enemy) => void;
  /** The Press wall's band as a rect, or null when the Press is off the page. */
  private readonly pressWallRect: () => Phaser.Geom.Rectangle | null;
  /** Reports an orbit contact with the Press wall (BossSystem.hitWallFromOrbit). */
  private readonly pressWallHit: (x: number, y: number, damage: number, crit: boolean) => void;
  private readonly lastHit = new Map<number, number>();
  /** Last orbit hit on the Press wall (scene time, ms); one shared cooldown. */
  private wallLastHit = -Infinity;
  private angle = 0;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, enemies: Phaser.Physics.Arcade.Group, fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, kill: (e: Enemy) => void, pressWallRect: () => Phaser.Geom.Rectangle | null, pressWallHit: (x: number, y: number, damage: number, crit: boolean) => void) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.enemies = enemies;
    this.fx = fx;
    this.sfx = sfx;
    this.damageNumbers = damageNumbers;
    this.kill = kill;
    this.pressWallRect = pressWallRect;
    this.pressWallHit = pressWallHit;
    this.angle = run.rng.range(0, Math.PI * 2);
  }

  update(dt: number): void {
    const def = this.activeDef();
    if (!def || !def.orbit) {
      for (const c of this.circles) c.setVisible(false);
      return;
    }
    const { count, radius, speed, circleRadius, hitCooldownSec } = def.orbit;
    while (this.circles.length < count) this.circles.push(this.scene.add.image(0, 0, TEX.orbit).setDepth(DEPTH.projectiles));
    this.angle += speed * dt;
    const now = this.scene.time.now;
    const cooldownMs = hitCooldownSec * 1000;
    for (const [serial, t] of this.lastHit) if (now - t > cooldownMs) this.lastHit.delete(serial); // keep the map tiny
    for (let i = 0; i < count; i++) {
      const { x: cx, y: cy } = this.circlePos(i, count, radius);
      this.circles[i].setVisible(true).setPosition(cx, cy);
      for (const obj of this.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        const dx = e.x - cx;
        const dy = e.y - cy;
        const r = circleRadius + e.def.look.radius;
        if (dx * dx + dy * dy > r * r) continue;
        if (e.def.look.bar && !e.hitTestPoint(cx, cy, circleRadius)) continue; // precise capsule gate (the coarse circle is a superset)
        const last = this.lastHit.get(e.serial);
        if (last !== undefined && now - last < cooldownMs) continue; // at most one orbit hit per enemy per 0.6 s
        this.lastHit.set(e.serial, now);
        const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
        const wound = underexposureDamage(this.run.stats.woundThreshold, e.hp, e.maxHp, (crit ? 2 : 1) * def.damage * this.run.stats.damageMul);
        const dmg = wound.damage;
        const died = e.hit(dmg, { x: cx, y: cy }, def.knockback);
        this.damageNumbers.show(e.x, e.y, dmg, crit, false, wound.doubled);
        this.fx.hit(cx, cy, e.def.look.body);
        this.sfx.orbitHum();
        if (crit) this.fx.critRing(cx, cy);
        if (died) this.kill(e);
      }
      // The Press wall: a circle reaching the band is absorbed and damages the boss.
      const wall = this.pressWallRect();
      if (wall) {
        const qx = Math.max(wall.x, Math.min(wall.right, cx));
        const qy = Math.max(wall.y, Math.min(wall.bottom, cy));
        const dx = cx - qx;
        const dy = cy - qy;
        if (dx * dx + dy * dy <= circleRadius * circleRadius && now - this.wallLastHit >= cooldownMs) {
          this.wallLastHit = now;
          const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
          this.pressWallHit(cx, cy, (crit ? 2 : 1) * def.damage * this.run.stats.damageMul, crit);
        }
      }
    }
  }

  /** Re-places the circles around the player after physics has moved it this frame (visual only, hits stay in update()). */
  pinToPlayer(): void {
    const orbit = this.activeDef()?.orbit;
    if (!orbit) return;
    for (let i = 0; i < orbit.count && i < this.circles.length; i++) {
      const { x, y } = this.circlePos(i, orbit.count, orbit.radius);
      this.circles[i].setPosition(x, y);
    }
  }

  private circlePos(i: number, count: number, radius: number): Vec2 {
    const a = this.angle + (i / count) * Math.PI * 2;
    return { x: this.player.x + Math.cos(a) * radius, y: this.player.y + Math.sin(a) * radius };
  }

  /** The orbit weapon the player owns, if any (found by field, not by id). */
  private activeDef(): WeaponDef | null {
    for (const id of this.run.weapons) {
      const w = WEAPON_BY_ID.get(id);
      if (w?.orbit) return w;
    }
    return null;
  }
}
