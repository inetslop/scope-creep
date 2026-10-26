import Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { ARENA_SIZE } from '../config';
import { FRAME } from '../content/bosses/frame';
import { getEnemy } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { BossTimer, bossHpMultiplier } from '../core/boss';
import type { RunState } from '../core/run';
import { normalize, sub, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';
import type { PickupSystem } from './PickupSystem';
import type { SpawnSystem } from './SpawnSystem';

/** Arcade overlap callbacks hand us loosely typed objects; our groups only contain these classes. */
const as = <T>(obj: unknown): T => obj as T;

/** Seconds the "THE FRAME" warning shows before the boss slides in. */
const WARNING_SEC = 1;
/** Seconds the boss takes to slide from above the arena to its hover point. */
const ENTER_SEC = 0.5;
/** The boss hovers this far above the player. */
const HOVER_ABOVE = 320;
/** Margin kept from the arena walls when choosing the hover point. */
const HOVER_MARGIN = 100;

type Phase = 'off' | 'warning' | 'entering' | 'fighting';

/**
 * The boss encounter: schedules The Frame (core/boss.ts), runs its
 * warning -> slide-in -> fight state machine and attack cycle, and resolves
 * overlaps with the player's projectiles and the player. BossSystem owns the
 * writes to run.bossAlive/bossWarning/bossHp/bossMaxHp/bossKills.
 */
export class BossSystem {
  readonly boss: Boss;
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly spawns: SpawnSystem;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly damageNumbers: DamageNumbers;
  private readonly pickups: PickupSystem;
  private readonly timer = new BossTimer();
  private phase: Phase = 'off';
  private phaseTimer = 0;
  private cycleTimer = FRAME.attackCycleSec;
  private attackIndex = 0;
  private dashTimer = 0;
  private dashDir: Vec2 = { x: 0, y: 0 };
  private enterFrom: Vec2 = { x: 0, y: 0 };
  private enterTo: Vec2 = { x: 0, y: 0 };

  constructor(
    scene: Phaser.Scene,
    run: RunState,
    player: Player,
    spawns: SpawnSystem,
    projectiles: Phaser.Physics.Arcade.Group,
    fx: FxSystem,
    sfx: Sfx,
    damageNumbers: DamageNumbers,
    pickups: PickupSystem,
  ) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.spawns = spawns;
    this.fx = fx;
    this.sfx = sfx;
    this.damageNumbers = damageNumbers;
    this.pickups = pickups;
    this.boss = new Boss(scene);
    // Group-vs-sprite overlaps call back with (sprite, groupChild), so the boss must come first.
    scene.physics.add.overlap(this.boss, projectiles, (b, p) => this.onProjectileHit(as<Projectile>(p), as<Boss>(b)));
    scene.physics.add.overlap(player, this.boss, (_p, b) => this.onPlayerTouched(as<Boss>(b)));
  }

  update(dt: number): void {
    if (this.phase === 'off') {
      if (this.timer.due(this.run.timeSec, this.run.bossAlive)) this.startWarning();
      return;
    }
    if (this.phase === 'warning') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) this.startEntering();
      return;
    }
    if (this.phase === 'entering') this.updateEntering(dt);
    else this.updateFighting(dt);
  }

  private startWarning(): void {
    this.phase = 'warning';
    this.phaseTimer = WARNING_SEC;
    this.run.bossWarning = true;
    this.sfx.bossWarn();
  }

  private startEntering(): void {
    const half = ARENA_SIZE / 2;
    const x = Phaser.Math.Clamp(this.player.x, -half + HOVER_MARGIN, half - HOVER_MARGIN);
    const y = Phaser.Math.Clamp(this.player.y - HOVER_ABOVE, -half + HOVER_MARGIN, half - HOVER_MARGIN);
    const hp = Math.round(FRAME.hp * bossHpMultiplier(this.run.bossKills));
    this.enterFrom = { x, y: -half - 100 };
    this.enterTo = { x, y };
    this.boss.spawn(x, -half - 100, hp);
    this.run.bossWarning = false;
    this.run.bossAlive = true;
    this.run.bossHp = hp;
    this.run.bossMaxHp = hp;
    this.phase = 'entering';
    this.phaseTimer = ENTER_SEC;
  }

  /** Slides the boss in from above the arena; world bounds stay off until it is inside. */
  private updateEntering(dt: number): void {
    this.phaseTimer -= dt;
    const t = 1 - Phaser.Math.Clamp(this.phaseTimer, 0, ENTER_SEC) / ENTER_SEC;
    const e = t * t * (3 - 2 * t); // smoothstep: soft at both ends, fast in the middle
    this.boss.setPosition(
      this.enterFrom.x + (this.enterTo.x - this.enterFrom.x) * e,
      this.enterFrom.y + (this.enterTo.y - this.enterFrom.y) * e,
    );
    if (this.phaseTimer <= 0) {
      this.boss.setPosition(this.enterTo.x, this.enterTo.y);
      (this.boss.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      this.phase = 'fighting';
      this.cycleTimer = FRAME.attackCycleSec;
      this.dashTimer = 0;
    }
  }

  private updateFighting(dt: number): void {
    const b = this.boss;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      b.setVelocity(this.dashDir.x * FRAME.dashSpeed, this.dashDir.y * FRAME.dashSpeed);
    } else {
      const dir = normalize(sub(this.player, b));
      b.setVelocity(dir.x * FRAME.speed, dir.y * FRAME.speed);
    }

    this.cycleTimer -= dt;
    if (this.cycleTimer <= 0) {
      this.executeAttack();
      this.attackIndex = (this.attackIndex + 1) % 3;
      this.cycleTimer = FRAME.attackCycleSec;
    }

    if (b.flashMs > 0) b.flashMs -= dt * 1000;
    if (b.flashMs > 0) b.core.setTint(PALETTE.ink);
    else if (this.cycleTimer <= FRAME.telegraphSec) b.core.setTint(PALETTE.paperLight);
    else b.core.clearTint();
  }

  /** Runs the attack at `attackIndex`: charge, wedge ring, or radial dart burst. */
  private executeAttack(): void {
    const b = this.boss;
    switch (this.attackIndex) {
      case 0: {
        const dir = normalize(sub(this.player, b));
        if (dir.x !== 0 || dir.y !== 0) this.dashDir = dir; // keep the old direction if the player is exactly on top
        this.dashTimer = FRAME.dashDurationSec;
        break;
      }
      case 1: {
        const wedgeDef = getEnemy(FRAME.ringEnemyId);
        for (let i = 0; i < FRAME.ringCount; i++) {
          const a = (i / FRAME.ringCount) * Math.PI * 2;
          const e = this.spawns.spawn(wedgeDef, { x: b.x + Math.cos(a) * FRAME.ringRadius, y: b.y + Math.sin(a) * FRAME.ringRadius }, false, 1);
          if (e) e.setRotation(a); // face outward
        }
        break;
      }
      case 2: {
        const start = this.run.rng.range(0, Math.PI * 2);
        for (let i = 0; i < FRAME.burstCount; i++) {
          this.spawns.fireDart(b.x, b.y, start + (i / FRAME.burstCount) * Math.PI * 2);
        }
        break;
      }
    }
  }

  private onProjectileHit(p: Projectile, b: Boss): void {
    if (!p.active || !b.active || p.hitSerials.has(b.serial)) return;
    p.hitSerials.add(b.serial);
    const died = b.hit(p.damage);
    this.run.bossHp = Math.max(0, b.hp);
    this.damageNumbers.show(b.x, b.y, p.damage);
    this.fx.hit(p.x, p.y, PALETTE.ink);
    this.sfx.hit();
    p.pierceLeft -= 1;
    if (p.pierceLeft < 0) p.despawn();
    if (died) this.killBoss();
  }

  private onPlayerTouched(b: Boss): void {
    const now = this.scene.time.now;
    if (!b.active || this.player.isInvulnerable(now) || this.run.isDead) return;
    this.run.takeDamage(this.dashTimer > 0 ? FRAME.dashContactDamage : FRAME.contactDamage);
    this.player.hurt(now);
    this.fx.playerHit(this.player.x, this.player.y);
    this.sfx.playerHurt();
  }

  /** The boss shatters, the screen shakes, and its XP scatters as pickups. */
  private killBoss(): void {
    const b = this.boss;
    const x = b.x;
    const y = b.y;
    this.phase = 'off';
    this.run.bossAlive = false;
    this.run.bossHp = 0;
    this.run.bossKills += 1;
    hook.stats.bossKills += 1;
    this.timer.onBossKilled(this.run.timeSec);
    this.fx.shatter(x, y, 40);
    this.fx.shake(600, 0.02);
    this.sfx.enemyDeath(80);
    for (let i = 0; i < FRAME.deathPickups; i++) {
      const a = this.run.rng.range(0, Math.PI * 2);
      const r = this.run.rng.range(20, 140);
      this.pickups.drop(x + Math.cos(a) * r, y + Math.sin(a) * r, FRAME.deathXp / FRAME.deathPickups);
    }
    b.despawn();
  }
}
