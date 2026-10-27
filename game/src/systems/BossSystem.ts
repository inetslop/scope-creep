import Phaser from 'phaser';
import type { Music } from '../audio/Music';
import type { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS, SCORE_POINTS } from '../config';
import type { FrameBossDef, GridBossDef } from '../content/bosses';
import { getEnemy } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { BossTimer, bossForKill, bossHpMultiplier } from '../core/boss';
import { GridSweep, pointToSegmentDistance, type GridSweepPhase } from '../core/gridSweep';
import type { RunState } from '../core/run';
import { normalize, sub, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { GAME_EVENTS } from '../scenes/keys';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';
import type { PickupSystem } from './PickupSystem';
import type { SpawnSystem } from './SpawnSystem';

/** Arcade overlap callbacks hand us loosely typed objects; our groups only contain these classes. */
const as = <T>(obj: unknown): T => obj as T;

/** Seconds the boss-name warning shows before the boss slides in. */
const WARNING_SEC = 1;
/** Seconds the boss takes to slide from above the arena to its hover point. */
const ENTER_SEC = 0.5;
/** The boss hovers this far above the player. */
const HOVER_ABOVE = 320;
/** Margin kept from the arena walls when choosing the hover point. */
const HOVER_MARGIN = 100;

type Phase = 'off' | 'warning' | 'entering' | 'fighting';

/**
 * The boss encounter: schedules the next boss (core/boss.ts: Frame and Grid
 * alternate), runs its warning -> slide-in -> fight state machine and attack
 * cycle, and resolves overlaps with the player's projectiles and the player.
 * BossSystem owns the writes to run.bossAlive/bossWarning/bossId/bossHp/
 * bossMaxHp/bossKills.
 */
export class BossSystem {
  readonly boss: Boss;
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly spawns: SpawnSystem;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly music: Music;
  private readonly damageNumbers: DamageNumbers;
  private readonly pickups: PickupSystem;
  /** The Grid's sweeping arm bar: a plain image (Arcade bodies do not rotate), hit-tested by hand. */
  readonly arm: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Graphics;
  private readonly timer = new BossTimer();
  private phase: Phase = 'off';
  private phaseTimer = 0;
  /** The boss for the current or next encounter; chosen per spawn in startWarning. */
  private def: FrameBossDef | GridBossDef = bossForKill(0);
  private readonly sweep = new GridSweep();
  private sweepPhase: GridSweepPhase = 'rest';
  /** Where the arm sweep starts from, locked once per rest -> telegraph edge. */
  private sweepStartAngle = 0;
  private sweepDir = 1;
  private cycleTimer = 0;
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
    music: Music,
    damageNumbers: DamageNumbers,
    pickups: PickupSystem,
  ) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.spawns = spawns;
    this.fx = fx;
    this.sfx = sfx;
    this.music = music;
    this.damageNumbers = damageNumbers;
    this.pickups = pickups;
    this.boss = new Boss(scene);
    this.arm = scene.add.image(0, 0, TEX.bossGridArm).setVisible(false).setDepth(DEPTH.enemies + 1);
    this.hint = scene.add.graphics().setDepth(DEPTH.enemies + 1).setVisible(false);
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
    this.def = bossForKill(this.run.bossKills);
    this.run.bossId = this.def.id;
    this.phase = 'warning';
    this.phaseTimer = WARNING_SEC;
    this.run.bossWarning = true;
    this.sfx.bossWarn();
  }

  private startEntering(): void {
    const half = ARENA_SIZE / 2;
    const x = Phaser.Math.Clamp(this.player.x, -half + HOVER_MARGIN, half - HOVER_MARGIN);
    const y = Phaser.Math.Clamp(this.player.y - HOVER_ABOVE, -half + HOVER_MARGIN, half - HOVER_MARGIN);
    const hp = Math.round(this.def.hp * bossHpMultiplier(this.run.bossKills));
    this.enterFrom = { x, y: -half - 100 };
    this.enterTo = { x, y };
    this.boss.spawn(x, -half - 100, hp, this.def);
    this.run.bossWarning = false;
    this.run.bossAlive = true;
    this.run.bossHp = hp;
    this.run.bossMaxHp = hp;
    this.sfx.bossSting(); // the boss is on the page: one deep thump and a music swell, same frame
    this.music.bossSwell();
    if (this.run.firstBossSighting(this.def.id)) this.scene.events.emit(GAME_EVENTS.bossNameplate, this.def.name);
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
      if (this.def.behavior === 'frame') {
        this.cycleTimer = this.def.attackCycleSec;
        this.dashTimer = 0;
      } else {
        this.sweep.reset();
        this.sweepPhase = 'rest';
        this.sweepStartAngle = 0;
        this.sweepDir = 1;
        this.arm.setVisible(false);
        this.hint.setVisible(false);
      }
    }
  }

  private updateFighting(dt: number): void {
    const def = this.def;
    if (def.behavior === 'frame') this.updateFrameFighting(dt, def);
    else this.updateGridFighting(dt, def);
  }

  private updateFrameFighting(dt: number, def: FrameBossDef): void {
    const b = this.boss;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      b.setVelocity(this.dashDir.x * def.dashSpeed, this.dashDir.y * def.dashSpeed);
    } else {
      const dir = normalize(sub(this.player, b));
      b.setVelocity(dir.x * def.speed, dir.y * def.speed);
    }

    this.cycleTimer -= dt;
    if (this.cycleTimer <= 0) {
      this.executeAttack(def);
      this.attackIndex = (this.attackIndex + 1) % 3;
      this.cycleTimer = def.attackCycleSec;
    }

    if (b.flashMs > 0) b.flashMs -= dt * 1000;
    if (b.flashMs > 0) b.core.setTint(PALETTE.ink);
    else if (this.cycleTimer <= def.telegraphSec) b.core.setTint(PALETTE.paperLight);
    else b.core.clearTint();
  }

  /** Runs the attack at `attackIndex`: charge, wedge ring, or radial dart burst. */
  private executeAttack(def: FrameBossDef): void {
    const b = this.boss;
    switch (this.attackIndex) {
      case 0: {
        const dir = normalize(sub(this.player, b));
        if (dir.x !== 0 || dir.y !== 0) this.dashDir = dir; // keep the old direction if the player is exactly on top
        this.dashTimer = def.dashDurationSec;
        break;
      }
      case 1: {
        const wedgeDef = getEnemy(def.ringEnemyId);
        for (let i = 0; i < def.ringCount; i++) {
          const a = (i / def.ringCount) * Math.PI * 2;
          const e = this.spawns.spawn(wedgeDef, { x: b.x + Math.cos(a) * def.ringRadius, y: b.y + Math.sin(a) * def.ringRadius }, false, 1);
          if (e) e.setRotation(a); // face outward
        }
        break;
      }
      case 2: {
        const start = this.run.rng.range(0, Math.PI * 2);
        for (let i = 0; i < def.burstCount; i++) {
          this.spawns.fireDart(b.x, b.y, start + (i / def.burstCount) * Math.PI * 2);
        }
        break;
      }
    }
  }

  /** The Grid drifts and spins; its cycle is a 4 s rest, a red telegraph, then a 180 degree arm sweep. */
  private updateGridFighting(dt: number, grid: GridBossDef): void {
    const b = this.boss;
    const dir = normalize(sub(this.player, b));
    b.setVelocity(dir.x * grid.speed, dir.y * grid.speed);
    b.setRotation(b.rotation + grid.spinRadPerSec * dt);

    this.sweep.update(dt);
    const ph = this.sweep.phase;
    if (ph !== this.sweepPhase) {
      // Lock the sweep's start angle and direction exactly once, on the rest -> telegraph edge.
      this.sweepPhase = ph;
      if (ph === 'telegraph') {
        const d = sub(this.player, b);
        this.sweepStartAngle = d.x !== 0 || d.y !== 0 ? Math.atan2(d.y, d.x) : b.rotation;
        this.sweepDir = this.run.rng.chance(0.5) ? 1 : -1;
        this.hint.setVisible(true);
      } else if (ph === 'sweep') {
        this.hint.setVisible(false);
        this.arm.setVisible(true);
      } else {
        this.arm.setVisible(false); // retract: straight back to rest
      }
    }

    if (ph === 'telegraph') {
      this.hint.clear().setPosition(b.x, b.y).setRotation(this.sweepStartAngle);
      this.hint.lineStyle(2, PALETTE.ink, 0.3);
      this.hint.lineBetween(-grid.armLength, 0, grid.armLength, 0);
    } else if (ph === 'sweep') {
      const angle = this.sweepStartAngle + this.sweepDir * this.sweep.sweepProgress * Math.PI;
      this.arm.setPosition(b.x, b.y).setRotation(angle);
      const dx = Math.cos(angle) * grid.armLength;
      const dy = Math.sin(angle) * grid.armLength;
      const now = this.scene.time.now;
      if (
        pointToSegmentDistance(this.player.x, this.player.y, b.x - dx, b.y - dy, b.x + dx, b.y + dy) <= grid.armThickness / 2 + PLAYER_RADIUS &&
        !this.player.isInvulnerable(now) &&
        !this.run.isDead
      ) {
        this.run.takeDamage(grid.armDamage);
        this.player.hurt(now);
        this.fx.playerHit(this.player.x, this.player.y);
        this.sfx.playerHurt();
      }
    }

    if (b.flashMs > 0) b.flashMs -= dt * 1000;
    if (b.flashMs > 0) b.core.setTint(PALETTE.paperLight);
    else b.core.clearTint();
    if (ph === 'telegraph') b.setTint(PALETTE.red); // the body (not the red core) flashes red
    else b.clearTint();
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
    const def = this.def;
    let damage = def.contactDamage;
    if (def.behavior === 'frame' && this.dashTimer > 0) damage = def.dashContactDamage;
    this.run.takeDamage(damage);
    this.player.hurt(now);
    this.fx.playerHit(this.player.x, this.player.y);
    this.sfx.playerHurt();
  }

  /** The boss shatters, the screen shakes, and its XP scatters as pickups. */
  private killBoss(): void {
    const b = this.boss;
    const x = b.x;
    const y = b.y;
    const def = this.def;
    this.phase = 'off';
    this.run.bossAlive = false;
    this.run.bossHp = 0;
    this.run.bossKills += 1;
    this.run.addScore(SCORE_POINTS.boss);
    hook.stats.bossKills += 1;
    if (def.behavior === 'grid') {
      hook.stats.gridKills += 1;
      this.arm.setVisible(false);
      this.hint.setVisible(false);
    }
    this.run.bossId = '';
    this.timer.onBossKilled(this.run.timeSec);
    this.fx.shatter(x, y, 40);
    this.fx.shake(14, 500);
    this.sfx.enemyDeath(80);
    for (let i = 0; i < def.deathPickups; i++) {
      const a = this.run.rng.range(0, Math.PI * 2);
      const r = this.run.rng.range(20, 140);
      this.pickups.drop(x + Math.cos(a) * r, y + Math.sin(a) * r, def.deathXp / def.deathPickups);
    }
    b.despawn();
  }
}
