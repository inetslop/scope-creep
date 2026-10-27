import Phaser from 'phaser';
import type { Music } from '../audio/Music';
import type { Sfx } from '../audio/Sfx';
import { drawShape, SHADOW_OFFSET } from '../art/shapes';
import { paletteSwatchTextureKey, TEX } from '../art/textures';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS, SCORE_POINTS } from '../config';
import type { FrameBossDef, GridBossDef, PaletteBossDef } from '../content/bosses';
import { getEnemy } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { BossTimer, bossForKill, bossHpMultiplier } from '../core/boss';
import { GridSweep, pointToSegmentDistance, type GridSweepPhase } from '../core/gridSweep';
import type { RunState } from '../core/run';
import { SWATCH_CASCADE, SwatchCascade, type SwatchCascadePhase } from '../core/swatchCascade';
import { underexposureDamage } from '../core/underexposure';
import { normalize, sub, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { GAME_EVENTS } from '../scenes/keys';
import type { DamageNumbers } from './DamageNumbers';
import type { FxSystem } from './FxSystem';
import type { Marginalia } from './Marginalia';
import type { PickupSystem } from './PickupSystem';
import type { ScoreFeed } from './ScoreFeed';
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
/** The Palette's ink rail, this far inside the top edge of the arena. */
const RAIL_INSET = 8;
const RAIL_THICKNESS = 10;
/** How far below the rail's centerline the docked swatch tiles hang. */
const DOCK_DROP = 20;
const RAIL_Y = -ARENA_SIZE / 2 + RAIL_INSET;
/** Seconds a sunk swatch's ink stain stays on the paper. */
const STAIN_FADE_SEC = 3;
/** Invulnerability after a falling swatch touches the player, ms. */
const SWATCH_INVULN_MS = 1000;
/** Radius of the even shard ring dropped where a swatch shatters. */
const SWATCH_SHARD_SPREAD = 26;

type Phase = 'off' | 'approach' | 'warning' | 'entering' | 'fighting';

/**
 * The boss encounter: schedules the next boss (core/boss.ts: Frame, Grid and
 * Palette rotate), runs its approach -> warning -> slide-in -> fight state
 * machine and attack cycle, and resolves overlaps with the player's
 * projectiles and the player. The 5 s 'approach' phase (core/boss.ts:
 * BOSS_WARNING_SEC) opens when the timer enters its warning window and ends
 * only when due() fires, so the window is exactly [nextAt - 5, nextAt) in run
 * time. BossSystem owns the writes to run.bossAlive/bossWarning/bossApproach/
 * bossId/bossHp/bossMaxHp/bossKills.
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
  private readonly feed: ScoreFeed;
  private readonly pickups: PickupSystem;
  private readonly marginalia: Marginalia;
  /** The Grid's sweeping arm bar: a plain image (Arcade bodies do not rotate), hit-tested by hand. */
  readonly arm: Phaser.GameObjects.Image;
  private readonly hint: Phaser.GameObjects.Graphics;
  /** The Palette's ink rail with the docked swatches (plain graphics: not shootable). */
  private readonly rail: Phaser.GameObjects.Graphics;
  /** Fading ink stains where Palette swatches have sunk into the paper. */
  private readonly stain: Phaser.GameObjects.Graphics;
  /** The Palette's swatch cascade (core/swatchCascade.ts); BossSystem owns the writes. */
  readonly cascade: SwatchCascade;
  private readonly timer = new BossTimer();
  private phase: Phase = 'off';
  private phaseTimer = 0;
  /** Seconds until the next count-in thud; only read while in the 'approach' phase. */
  private approachThudTimer = 1;
  /** The boss for the current or next encounter; chosen when the approach window opens. */
  private def: FrameBossDef | GridBossDef | PaletteBossDef = bossForKill(0);
  /** Last-seen cascade phase, so BossSystem reacts to transitions once each. */
  private cascadePhase: SwatchCascadePhase = 'idle';
  /** The falling swatch already touched the player this swatch. */
  private swatchHit = false;
  /** The falling swatch was destroyed (so its resolve is a shatter, not a sink). */
  private swatchDestroyed = false;
  /** Where the last resolved swatch was: the boss-death FX anchor for the palette. */
  private lastSwatchPos: Vec2 = { x: 0, y: 0 };
  private stains: { x: number; age: number }[] = [];
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
    feed: ScoreFeed,
    pickups: PickupSystem,
    marginalia: Marginalia,
  ) {
    this.scene = scene;
    this.run = run;
    this.player = player;
    this.spawns = spawns;
    this.fx = fx;
    this.sfx = sfx;
    this.music = music;
    this.damageNumbers = damageNumbers;
    this.feed = feed;
    this.pickups = pickups;
    this.marginalia = marginalia;
    this.boss = new Boss(scene);
    this.arm = scene.add.image(0, 0, TEX.bossGridArm).setVisible(false).setDepth(DEPTH.enemies + 1);
    this.hint = scene.add.graphics().setDepth(DEPTH.enemies + 1).setVisible(false);
    this.rail = scene.add.graphics().setDepth(DEPTH.enemies + 1).setVisible(false);
    this.stain = scene.add.graphics().setDepth(DEPTH.arena + 1).setVisible(false);
    this.cascade = new SwatchCascade(ARENA_SIZE, run.rng);
    // Group-vs-sprite overlaps call back with (sprite, groupChild), so the boss must come first.
    scene.physics.add.overlap(this.boss, projectiles, (b, p) => this.onProjectileHit(as<Projectile>(p), as<Boss>(b)));
    scene.physics.add.overlap(player, this.boss, (_p, b) => this.onPlayerTouched(as<Boss>(b)));
  }

  /** True while the boss body is on the page: always once in, except the palette, whose body is only active while a swatch falls. */
  get bodyActive(): boolean {
    if (this.phase === 'off' || this.phase === 'warning') return false;
    if (this.def.behavior === 'palette') return this.cascade.phase === 'falling';
    return true;
  }

  update(dt: number): void {
    if (this.phase === 'off') {
      if (this.timer.due(this.run.timeSec, this.run.bossAlive)) this.startWarning();
      else if (this.timer.inWarningWindow(this.run.timeSec, this.run.bossAlive)) this.startApproach();
      return;
    }
    if (this.phase === 'approach') {
      // The approach ends when the spawn is due, never on its own timer: no gap, no overlap with the warning.
      if (this.timer.due(this.run.timeSec, this.run.bossAlive)) this.startWarning();
      else {
        // Count-in: one low thud per whole second of the window; the first already played in startApproach.
        this.approachThudTimer -= dt;
        if (this.approachThudTimer <= 0) {
          this.sfx.bossApproach();
          this.approachThudTimer = 1;
        }
      }
      return;
    }
    if (this.phase === 'warning') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) this.startEntering();
      return;
    }
    if (this.phase === 'entering') {
      // The cascade clock starts at the sting, so the first swatch detaches 1.0 s
      // after the palette appears, not 0.5 s after the rail slide finishes.
      if (this.def.behavior === 'palette') this.cascade.update(dt);
      this.updateEntering(dt);
    } else this.updateFighting(dt);
  }

  /** Opens the 5 s approach window: the page trembles (BossApproachSystem) and the thud count-in starts. */
  private startApproach(): void {
    this.def = bossForKill(this.run.bossKills);
    this.run.bossId = this.def.id;
    this.phase = 'approach';
    this.run.bossApproach = true;
    this.sfx.bossApproach();
    this.approachThudTimer = 1; // the window's own thud just played; the next one is 1 s later
  }

  private startWarning(): void {
    this.def = bossForKill(this.run.bossKills);
    this.run.bossApproach = false;
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
    const mult = bossHpMultiplier(this.run.bossKills);
    // Palette: round per swatch, then multiply. round(450 * mult) can be 2 less than
    // 5 * round(90 * mult) (e.g. at mult = 2.25) and would break the bar total.
    const hp = this.def.behavior === 'palette'
      ? SWATCH_CASCADE.count * Math.round(this.def.swatchHp * mult)
      : Math.round(this.def.hp * mult);
    this.enterFrom = { x, y: -half - 100 };
    this.enterTo = { x, y };
    this.boss.spawn(x, -half - 100, hp, this.def);
    if (this.def.behavior === 'palette') {
      // Hidden until the first swatch detaches; disableBody also clears active/visible,
      // which the invariants read. The docked rail is pure graphics, not shootable.
      this.boss.disableBody(true, true);
      this.cascade.reset();
      this.cascadePhase = 'idle';
      this.swatchHit = false;
      this.swatchDestroyed = false;
      this.lastSwatchPos = { x: 0, y: 0 };
      this.stains.length = 0;
      this.redrawStains();
      this.drawRail(this.def);
      this.rail.setVisible(true).setPosition(0, -half - 100);
    }
    this.run.bossWarning = false;
    this.run.bossAlive = true;
    this.run.bossHp = hp;
    this.run.bossMaxHp = hp;
    this.sfx.bossSting(); // the boss is on the page: one deep thump and a music swell, same frame
    this.music.bossSwell();
    this.music.bossEnter(this.run.timeSec); // the score glides down to the 64 BPM boss hold
    if (this.run.firstBossSighting(this.def.id)) this.scene.events.emit(GAME_EVENTS.bossNameplate, this.def.name);
    this.phase = 'entering';
    this.phaseTimer = ENTER_SEC;
  }

  /** Slides the boss in from above the arena; world bounds stay off until it is inside. */
  private updateEntering(dt: number): void {
    this.phaseTimer -= dt;
    const t = 1 - Phaser.Math.Clamp(this.phaseTimer, 0, ENTER_SEC) / ENTER_SEC;
    const e = t * t * (3 - 2 * t); // smoothstep: soft at both ends, fast in the middle
    if (this.def.behavior === 'palette') {
      // Only the rail slides in; the boss body stays hidden until the first swatch detaches.
      const half = ARENA_SIZE / 2;
      this.rail.setPosition(0, -half - 100 + (100 + RAIL_INSET) * e);
      if (this.phaseTimer <= 0) {
        this.rail.setPosition(0, RAIL_Y);
        this.phase = 'fighting';
        if (this.run.bossKills === 2) {
          // The first palette of the run: a small note above the docked rail.
          this.marginalia.noteAt(0, RAIL_Y - 40, 'SHOOT THE SWATCHES', 2.5);
        }
      }
      return;
    }
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
    else if (def.behavior === 'grid') this.updateGridFighting(dt, def);
    else this.updatePaletteFighting(dt, def);
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
        const rested = this.run.rest.covered;
        this.run.takeDamage(grid.armDamage);
        if (rested) this.restForgive();
        else {
          this.player.hurt(now);
          this.fx.playerHit(this.player.x, this.player.y);
          this.sfx.playerHurt();
        }
      }
    }

    if (b.flashMs > 0) b.flashMs -= dt * 1000;
    if (b.flashMs > 0) b.core.setTint(PALETTE.paperLight);
    else b.core.clearTint();
    if (ph === 'telegraph') b.setTint(PALETTE.red); // the body (not the red core) flashes red
    else b.clearTint();
  }

  /** The Palette: five swatches fall one at a time; shoot each before it sinks into the paper. */
  private updatePaletteFighting(dt: number, def: PaletteBossDef): void {
    this.cascade.update(dt);
    for (let i = this.stains.length - 1; i >= 0; i--) {
      const s = this.stains[i]!;
      s.age += dt;
      if (s.age >= STAIN_FADE_SEC) this.stains.splice(i, 1);
    }
    this.redrawStains();
    if (this.cascade.phase !== this.cascadePhase) {
      const prev = this.cascadePhase;
      this.cascadePhase = this.cascade.phase;
      if (this.cascade.phase === 'falling') this.onSwatchDetach(def);
      // A sunk swatch still counts as dodged (stain + ring stripe), even the fifth one.
      else if (prev === 'falling' && !this.swatchDestroyed) this.onSwatchSunk(def);
    }
    if (this.cascade.phase === 'done') {
      this.killBoss();
      return;
    }
    this.run.bossHp = this.paletteHpRemaining(def);
  }

  /** A swatch leaves the rail and starts falling; it is the boss body while it is down. */
  private onSwatchDetach(def: PaletteBossDef): void {
    const i = this.cascade.activeIndex;
    const x = this.cascade.activeX;
    this.boss.spawn(x, -ARENA_SIZE / 2, this.swatchHpNow(def), def);
    this.boss.setTexture(paletteSwatchTextureKey(i));
    // Velocity rather than per-frame setPosition: Arcade overlaps see the integrated position.
    this.boss.setVelocity(0, ARENA_SIZE / SWATCH_CASCADE.fallSec);
    this.swatchHit = false;
    this.swatchDestroyed = false;
    this.drawRail(def);
  }

  /** The falling swatch reached the bottom edge: it sinks into the paper as a fading stain. */
  private onSwatchSunk(def: PaletteBossDef): void {
    const x = this.cascade.activeX;
    this.lastSwatchPos = { x, y: ARENA_SIZE / 2 };
    this.stains.push({ x, age: 0 });
    this.boss.setPosition(x, ARENA_SIZE / 2);
    this.resolveSwatch(def);
  }

  /** A swatch is resolved (destroyed or sunk): hide the body, and paint a ring stripe if it never touched the player. */
  private resolveSwatch(def: PaletteBossDef): void {
    this.boss.disableBody(true, true);
    if (!this.swatchHit) {
      const i = this.cascade.resolvedCount - 1;
      this.player.paintStripe(def.swatchColors[i]!, i);
    }
  }

  /** The falling swatch took damage; if it shattered, it bursts, drops shards and resolves. */
  private onSwatchHit(def: PaletteBossDef, died: boolean): void {
    if (!died) {
      this.run.bossHp = this.paletteHpRemaining(def);
      return;
    }
    const x = this.boss.x;
    const y = this.boss.y;
    this.lastSwatchPos = { x, y };
    this.cascade.destroyActive();
    const i = this.cascade.resolvedCount - 1;
    this.fx.death(x, y, def.swatchColors[i]!, PALETTE.ink, 30);
    this.sfx.enemyDeath(30);
    for (let j = 0; j < def.shardCount; j++) {
      const a = (j / def.shardCount) * Math.PI * 2;
      this.pickups.drop(x + Math.cos(a) * SWATCH_SHARD_SPREAD, y + Math.sin(a) * SWATCH_SHARD_SPREAD, 1);
    }
    this.swatchDestroyed = true;
    this.resolveSwatch(def);
    this.run.bossHp = this.paletteHpRemaining(def);
    if (this.cascade.phase === 'done') this.killBoss();
  }

  /** Total HP left across the undeployed swatches and the falling one. */
  private paletteHpRemaining(def: PaletteBossDef): number {
    const per = this.swatchHpNow(def);
    if (this.cascade.phase === 'falling') {
      return (SWATCH_CASCADE.count - 1 - this.cascade.resolvedCount) * per + Math.max(0, this.boss.hp);
    }
    return (SWATCH_CASCADE.count - this.cascade.resolvedCount) * per;
  }

  /** One swatch's HP at the current respawn multiplier. */
  private swatchHpNow(def: PaletteBossDef): number {
    return Math.round(def.swatchHp * bossHpMultiplier(this.run.bossKills));
  }

  /** The ink rail with the undeployed swatches docked in it; local y = 0 is the rail centerline. */
  private drawRail(def: PaletteBossDef): void {
    const half = ARENA_SIZE / 2;
    const g = this.rail;
    g.clear();
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillRect(-half + SHADOW_OFFSET, -RAIL_THICKNESS / 2 + SHADOW_OFFSET, ARENA_SIZE, RAIL_THICKNESS);
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(-half, -RAIL_THICKNESS / 2, ARENA_SIZE, RAIL_THICKNESS);
    // Docked swatches hang below the bar, left to right.
    const first = this.cascade.resolvedCount + (this.cascade.phase === 'falling' ? 1 : 0);
    for (let i = first; i < SWATCH_CASCADE.count; i++) {
      const dockX = -half + (ARENA_SIZE * (i + 0.5)) / SWATCH_CASCADE.count;
      drawShape(g, 'rect', dockX, DOCK_DROP, def.swatchWidth / 2, def.swatchColors[i]!, { outlineWidth: 3 });
    }
  }

  /** The faint ink stains where swatches have sunk, fading over STAIN_FADE_SEC. */
  private redrawStains(): void {
    const g = this.stain;
    g.clear();
    for (const s of this.stains) {
      g.fillStyle(PALETTE.ink, 0.25 * (1 - s.age / STAIN_FADE_SEC));
      g.fillEllipse(s.x, ARENA_SIZE / 2 - 12, 80, 24);
    }
    g.setVisible(this.stains.length > 0);
  }

  private onProjectileHit(p: Projectile, b: Boss): void {
    if (!p.active || !b.active || p.hitSerials.has(b.serial)) return;
    p.hitSerials.add(b.serial);
    const wound = underexposureDamage(this.run.stats.woundThreshold, b.hp, b.maxHp, p.damage);
    const died = b.hit(wound.damage);
    this.run.bossHp = Math.max(0, b.hp);
    this.damageNumbers.show(b.x, b.y, wound.damage, false, false, wound.doubled);
    this.fx.hit(p.x, p.y, PALETTE.ink);
    this.sfx.hit();
    p.pierceLeft -= 1;
    if (p.pierceLeft < 0) p.despawn();
    if (this.def.behavior === 'palette') {
      this.onSwatchHit(this.def, died);
      return;
    }
    this.run.bossHp = Math.max(0, b.hp);
    if (died) this.killBoss();
  }

  private onPlayerTouched(b: Boss): void {
    const now = this.scene.time.now;
    if (!b.active || this.player.isInvulnerable(now) || this.run.isDead) return;
    const def = this.def;
    if (def.behavior === 'palette' && this.swatchHit) return; // the falling swatch hits once per swatch
    let damage = def.contactDamage;
    if (def.behavior === 'frame' && this.dashTimer > 0) damage = def.dashContactDamage;
    if (def.behavior === 'palette') this.swatchHit = true;
    const rested = this.run.rest.covered;
    this.run.takeDamage(damage);
    if (rested) {
      this.restForgive();
      return;
    }
    this.player.hurt(now);
    if (def.behavior === 'palette') this.player.invulnerableUntil = Math.max(this.player.invulnerableUntil, now + SWATCH_INVULN_MS);
    this.fx.playerHit(this.player.x, this.player.y);
    this.sfx.playerHurt();
  }

  /** A hit forgiven at rest: the low blip and a small flat ink ring — no hurt frame, no platemark, no shake. */
  private restForgive(): void {
    this.fx.critRing(this.player.x, this.player.y);
    this.sfx.streakBreak();
  }

  /** The boss shatters, the screen shakes, and its XP scatters as pickups. */
  private killBoss(): void {
    const b = this.boss;
    const def = this.def;
    // The palette's body may be hidden (between swatches), so anchor its death to the last swatch.
    const x = def.behavior === 'palette' ? this.lastSwatchPos.x : b.x;
    const y = def.behavior === 'palette' ? this.lastSwatchPos.y : b.y;
    this.phase = 'off';
    this.run.bossAlive = false;
    this.run.bossHp = 0;
    this.run.bossKills += 1;
    this.run.addScore(SCORE_POINTS.boss);
    this.feed.showKill(x, y - def.bodyRadius - 12, 'boss');
    this.fx.critRing(x, y);
    hook.stats.bossKills += 1;
    if (def.behavior === 'grid') {
      hook.stats.gridKills += 1;
      this.arm.setVisible(false);
      this.hint.setVisible(false);
    } else if (def.behavior === 'palette') {
      hook.stats.paletteKills += 1;
      // updatePaletteFighting stops running, so the rail and stains must be cleared here
      // or they freeze on the page.
      this.rail.setVisible(false);
      this.stain.clear().setVisible(false);
      this.stains.length = 0;
    }
    this.run.bossId = '';
    this.timer.onBossKilled(this.run.timeSec);
    this.fx.shatter(x, y, 40);
    this.fx.shake(14, 500);
    this.sfx.enemyDeath(80);
    this.music.bossLeave(this.run.timeSec); // the score glides back to the run tempo curve
    for (let i = 0; i < def.deathPickups; i++) {
      const a = this.run.rng.range(0, Math.PI * 2);
      const r = this.run.rng.range(20, 140);
      this.pickups.drop(x + Math.cos(a) * r, y + Math.sin(a) * r, def.deathXp / def.deathPickups);
    }
    b.despawn();
  }
}
