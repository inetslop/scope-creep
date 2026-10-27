import Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { getWeapon } from '../content/weapons';
import type { WeaponDef } from '../content/types';
import type { RunState } from '../core/run';
import { fireRateMultiplier } from '../core/stats';
import { hook } from '../debug/testHook';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { FxSystem } from './FxSystem';

const DEG = Math.PI / 180;

/** Fires every weapon the player owns while firing, and ages projectiles. */
export class WeaponSystem {
  readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly cooldowns = new Map<string, number>();
  private readonly run: RunState;
  private readonly player: Player;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, fx: FxSystem, sfx: Sfx) {
    this.run = run;
    this.player = player;
    this.fx = fx;
    this.sfx = sfx;
    this.projectiles = scene.physics.add.group({ classType: Projectile, maxSize: 400, runChildUpdate: false });
  }

  update(dt: number, firing: boolean): void {
    for (const id of this.run.weapons) {
      const def = getWeapon(id);
      if (def.orbit || def.arc) continue; // orbit and arc weapons never fire volleys
      let cd = (this.cooldowns.get(id) ?? 0) - dt;
      if (firing && cd <= 0) {
        this.fireVolley(def);
        cd += 1 / (def.fireRate * fireRateMultiplier(this.run.stats, this.run.streak));
      }
      // Never bank shots while idle: the first shot after releasing fires immediately, no burst.
      this.cooldowns.set(id, Math.max(cd, 0));
    }
    for (const obj of this.projectiles.getChildren()) {
      const p = obj as Projectile;
      if (!p.active) continue;
      p.lifeLeft -= dt;
      if (p.lifeLeft <= 0) p.despawn();
    }
  }

  get activeCount(): number {
    return this.projectiles.countActive(true);
  }

  private fireVolley(def: WeaponDef): void {
    const stats = this.run.stats;
    const count = def.count + stats.extraProjectiles;
    const spread = (def.spreadDeg + (count - 1) * 4) * DEG;
    const muzzle = this.player.muzzle();
    for (let i = 0; i < count; i++) {
      const p = this.projectiles.get(muzzle.x, muzzle.y) as Projectile | null;
      if (!p) return; // pool exhausted: skip rather than allocate
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = this.player.aimAngle + t * spread + this.run.rng.range(-def.jitterDeg, def.jitterDeg) * DEG;
      p.fire({
        weapon: def,
        x: muzzle.x,
        y: muzzle.y,
        angle,
        speed: def.speed * stats.projectileSpeedMul,
        damage: def.damage * stats.damageMul,
        pierce: def.pierce + stats.extraPierce,
      });
      hook.stats.shotsFired += 1;
    }
    this.fx.muzzle(muzzle.x, muzzle.y, def.look.color);
    this.sfx.shoot(def.id);
  }
}
