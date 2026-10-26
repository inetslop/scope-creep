import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { WeaponDef } from '../content/types';
import { WEAPON_BY_ID } from '../content/weapons';
import type { RunState } from '../core/run';
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
  private readonly lastHit = new Map<number, number>();
  private angle = 0;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, enemies: Phaser.Physics.Arcade.Group, fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, kill: (e: Enemy) => void) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.enemies = enemies;
    this.fx = fx;
    this.sfx = sfx;
    this.damageNumbers = damageNumbers;
    this.kill = kill;
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
      const a = this.angle + (i / count) * Math.PI * 2;
      const cx = this.player.x + Math.cos(a) * radius;
      const cy = this.player.y + Math.sin(a) * radius;
      this.circles[i].setVisible(true).setPosition(cx, cy);
      for (const obj of this.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        const dx = e.x - cx;
        const dy = e.y - cy;
        const r = circleRadius + e.def.look.radius;
        if (dx * dx + dy * dy > r * r) continue;
        const last = this.lastHit.get(e.serial);
        if (last !== undefined && now - last < cooldownMs) continue; // at most one orbit hit per enemy per 0.6 s
        this.lastHit.set(e.serial, now);
        const dmg = def.damage * this.run.stats.damageMul;
        const died = e.hit(dmg, { x: cx, y: cy }, def.knockback);
        this.damageNumbers.show(e.x, e.y, dmg);
        this.fx.hit(cx, cy, e.def.look.body);
        this.sfx.hit();
        if (died) this.kill(e);
      }
    }
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
