import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { PLAYER_INVULN_MS } from '../config';
import type { RunState } from '../core/run';
import { hook } from '../debug/testHook';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';
import type { PickupSystem } from './PickupSystem';

/** Arcade overlap callbacks hand us loosely typed objects; our groups only contain these classes. */
const as = <T>(obj: unknown): T => obj as T;

/** Wires physics overlaps: projectiles vs enemies, enemies vs player, enemies vs enemies. */
export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly fx: FxSystem;
  private readonly pickups: PickupSystem;
  private readonly sfx: Sfx;
  private readonly damageNumbers: DamageNumbers;

  constructor(
    scene: Phaser.Scene,
    run: RunState,
    player: Player,
    groups: { enemies: Phaser.Physics.Arcade.Group; projectiles: Phaser.Physics.Arcade.Group; enemyShots: Phaser.Physics.Arcade.Group },
    fx: FxSystem,
    pickups: PickupSystem,
    sfx: Sfx,
    damageNumbers: DamageNumbers,
  ) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.fx = fx;
    this.pickups = pickups;
    this.sfx = sfx;
    this.damageNumbers = damageNumbers;
    scene.physics.add.overlap(groups.projectiles, groups.enemies, (p, e) => this.onProjectileHit(as<Projectile>(p), as<Enemy>(e)));
    scene.physics.add.overlap(player, groups.enemies, (_p, e) => this.onPlayerTouched(as<Enemy>(e)));
    scene.physics.add.overlap(player, groups.enemyShots, (_p, s) => this.onPlayerShot(as<EnemyBullet>(s)));
    scene.physics.add.collider(groups.enemies, groups.enemies);
  }

  private onProjectileHit(p: Projectile, e: Enemy): void {
    if (!p.active || !e.active || p.hitSerials.has(e.serial)) return;
    p.hitSerials.add(e.serial);
    const died = e.hit(p.damage, p, p.knockback);
    this.damageNumbers.show(e.x, e.y, p.damage);
    this.fx.hit(p.x, p.y, e.def.look.body);
    this.sfx.hit();
    if (died) this.killEnemy(e);
    p.pierceLeft -= 1;
    if (p.pierceLeft < 0) p.despawn();
  }

  private onPlayerTouched(e: Enemy): void {
    const now = this.scene.time.now;
    if (!e.active || this.player.isInvulnerable(now) || this.run.isDead) return;
    this.run.takeDamage(e.def.contactDamage);
    this.player.invulnerableUntil = now + PLAYER_INVULN_MS;
    e.hit(0, this.player, 320); // shove the enemy back so contact isn't continuous
    this.fx.playerHit();
    this.sfx.playerHurt();
  }

  private onPlayerShot(p: EnemyBullet): void {
    if (!p.active || this.player.isInvulnerable(this.scene.time.now) || this.run.isDead) return;
    this.run.takeDamage(p.damage);
    this.player.invulnerableUntil = this.scene.time.now + PLAYER_INVULN_MS;
    this.fx.playerHit();
    this.sfx.playerHurt();
    p.despawn();
  }

  killEnemy(e: Enemy): void {
    const look = e.def.look;
    this.fx.death(e.x, e.y, look.body, look.accent, look.radius);
    this.sfx.enemyDeath(look.radius);
    if (look.radius >= 24) this.fx.shake(90, 0.003);
    this.pickups.drop(e.x, e.y, e.def.xp);
    this.run.kills += 1;
    hook.stats.enemiesKilled += 1;
    e.despawn();
  }
}
