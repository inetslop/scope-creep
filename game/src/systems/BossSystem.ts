import Phaser from 'phaser';
import type { Music } from '../audio/Music';
import type { Sfx } from '../audio/Sfx';
import { drawShape, SHADOW_OFFSET } from '../art/shapes';
import { paletteSwatchTextureKey, TEX } from '../art/textures';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS, SCORE_POINTS } from '../config';
import type { FrameBossDef, GridBossDef, PaletteBossDef, PressBossDef } from '../content/bosses';
import { getEnemy } from '../content/enemies';
import { PALETTE } from '../content/palette';
import { BossTimer, bossForKill, bossHpMultiplier } from '../core/boss';
import { cropSafeFraction } from '../core/crop';
import { GridSweep, pointToSegmentDistance, type GridSweepPhase } from '../core/gridSweep';
import { PressWall } from '../core/pressWall';
import type { RunState } from '../core/run';
import { SWATCH_CASCADE, SwatchCascade, type SwatchCascadePhase } from '../core/swatchCascade';
import { underexposureDamage } from '../core/underexposure';
import { normalize, sub, type Vec2 } from '../core/vec';
import { hook } from '../debug/testHook';
import { Boss } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { TypeBlock } from '../entities/TypeBlock';
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
 * The boss encounter: schedules the next boss (core/boss.ts: Frame, Grid,
 * Palette and Press rotate), runs its approach -> warning -> slide-in -> fight
 * state machine and attack cycle, and resolves overlaps with the player's
 * projectiles and the player. The 5 s 'approach' phase (core/boss.ts:
 * BOSS_WARNING_SEC) opens when the timer enters its warning window and ends
 * only when due() fires, so the window is exactly [nextAt - 5, nextAt) in run
 * time. BossSystem owns the writes to run.bossAlive/bossWarning/bossApproach/
 * bossId/bossHp/bossMaxHp/bossKills/pressLeadY.
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
  /** The Press's wall schedule (core/pressWall.ts); BossSystem owns the writes. */
  readonly pressWall = new PressWall();
  /** The Press's type blocks: a pooled boss part (not the enemy group), so no XP/score/kill count. */
  readonly blocks: Phaser.Physics.Arcade.Group;
  /** The Press's visible ink band (plain graphics; the boss body is the hit region only). */
  private readonly band: Phaser.GameObjects.Graphics;
  /** Reusable band rect handed to OrbitSystem by pressWallRect(). */
  private readonly wallRect = new Phaser.Geom.Rectangle();
  /** Lazy pool of shatter fragments (at most 6, one per shatter slot). */
  private fragments: (Phaser.GameObjects.Image | null)[] = [];
  private readonly timer = new BossTimer();
  private phase: Phase = 'off';
  private phaseTimer = 0;
  /** Seconds until the next count-in thud; only read while in the 'approach' phase. */
  private approachThudTimer = 1;
  /** The boss for the current or next encounter; chosen when the approach window opens. */
  private def: FrameBossDef | GridBossDef | PaletteBossDef | PressBossDef = bossForKill(0);
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
  /** Last-seen wall counters, so BossSystem reacts to each stamp/row edge once. */
  private pressStamps = 0;
  private pressRows = 0;
  /** Whether the wall's stamp telegraph is up (edge-detects the low thud). */
  private pressTelegraphing = false;
  /** Timer for the wall-burn damage numbers (gutter idiom). */
  private pressBurnTimer = 0;
  /** The safe width the wall body was last sized to (resized only when the crop moves it). */
  private pressBandWidth = 0;
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
    enemyShots: Phaser.Physics.Arcade.Group,
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
    this.band = scene.add.graphics().setDepth(DEPTH.arena + 1).setVisible(false);
    this.cascade = new SwatchCascade(ARENA_SIZE, run.rng);
    this.blocks = scene.physics.add.group({ classType: TypeBlock, maxSize: 4, runChildUpdate: false });
    // Group-vs-sprite overlaps call back with (sprite, groupChild), so the boss must come first.
    scene.physics.add.overlap(this.boss, projectiles, (b, p) => this.onProjectileHit(as<Projectile>(p), as<Boss>(b)));
    scene.physics.add.overlap(player, this.boss, (_p, b) => this.onPlayerTouched(as<Boss>(b)));
    // The Press: type blocks take the player's shots and touch the player; enemy shots die on the band.
    scene.physics.add.overlap(this.blocks, projectiles, (blk, p) => this.onBlockHit(as<Projectile>(p), as<TypeBlock>(blk)));
    scene.physics.add.overlap(player, this.blocks, (_p, blk) => this.onBlockTouched(as<TypeBlock>(blk)));
    scene.physics.add.overlap(this.boss, enemyShots, (b, s) => this.onEnemyShotWall(as<EnemyBullet>(s), as<Boss>(b)));
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
    if (this.def.behavior === 'press') {
      // The wall: the (invisible) body sits at the top of the safe area and the
      // visible band is the graphics below. No slide-in: updatePress places it.
      const def = this.def;
      const halfSafe = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
      this.boss.spawn(0, -halfSafe - def.bandThickness / 2, hp, def);
      this.pressWall.reset();
      this.pressStamps = 0;
      this.pressRows = 0;
      this.pressTelegraphing = false;
      this.pressBurnTimer = 0;
      this.pressBandWidth = 0;
      this.run.pressLeadY = -halfSafe; // the leading edge starts at the top of the safe area
      for (const obj of this.blocks.getChildren()) (obj as TypeBlock).despawn();
      this.band.clear().setVisible(true);
      if (this.run.bossKills === 3) {
        // The first Press of the run: a small note above the band.
        this.marginalia.noteAt(0, -halfSafe - 80, 'SHOOT THE TYPE BLOCKS', 2.5);
      }
    } else {
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
    if (this.def.behavior === 'press') {
      // The wall is already at the top of the safe area; it only advances while
      // the slide-in timer runs. updatePress owns the wall clock (one step/frame).
      this.updatePress(dt);
      if (this.phaseTimer <= 0) this.phase = 'fighting';
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
    else if (def.behavior === 'palette') this.updatePaletteFighting(dt, def);
    else this.updatePress(dt);
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

  /**
   * The Press: the wall advances down the page, stamps every 5 s, prints rows
   * of type blocks, and pushes anything it catches. The wall body (the boss)
   * takes the player's shots; the blocks are boss parts. BossSystem owns the
   * writes to run.pressLeadY. See src/core/pressWall.ts for the schedule.
   */
  private updatePress(dt: number): void {
    const def = this.def as PressBossDef;
    const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec); // the crop moves the wall's pixels, not its progress
    this.pressWall.update(dt);
    const wall = this.pressWall;
    const leadY = -half + wall.progress * 2 * half;
    this.run.pressLeadY = leadY;

    if (wall.stamps > this.pressStamps) {
      this.pressStamps = wall.stamps;
      this.fx.shake(4, 150); // the stamp: the smallest shake amplitude
    }
    if (wall.stampTelegraph && !this.pressTelegraphing) this.sfx.slam(); // the existing low thud, once per telegraph
    this.pressTelegraphing = wall.stampTelegraph;
    if (wall.rows > this.pressRows) {
      this.pressRows = wall.rows;
      this.printPressRow(leadY, half, def);
    }
    this.placeBand(leadY, half, def);
    this.updatePressBlocks(leadY, half, dt);
    this.pushPress(leadY, dt, def);
  }

  /** The Press prints a row of 4 type blocks on the leading edge; a new row reprints over the old. */
  private printPressRow(leadY: number, half: number, def: PressBossDef): void {
    // The Press reprints: any undestroyed old blocks vanish.
    for (const obj of this.blocks.getChildren()) (obj as TypeBlock).despawn();
    for (let i = 0; i < 4; i++) {
      const blk = this.blocks.get() as TypeBlock | null;
      if (!blk) break;
      blk.spawn(-half + ((i + 1) / 5) * 2 * half, leadY, def.blockHp, def.blockSize, def.blockContactDamage);
      blk.slot = i;
    }
  }

  /** Sizes the (invisible) wall body to the safe width and moves it with the leading edge. */
  private placeBand(leadY: number, half: number, def: PressBossDef): void {
    const width = 2 * half;
    const b = this.boss;
    if (Math.abs(width - this.pressBandWidth) > 0.01) {
      const body = b.body as Phaser.Physics.Arcade.Body;
      body.setSize(width, def.bandThickness);
      body.setOffset((b.width - width) / 2, (b.height - def.bandThickness) / 2);
      this.pressBandWidth = width;
    }
    b.setPosition(0, leadY - def.bandThickness / 2);
    this.drawBand(leadY, half, def);
  }

  /** The visible ink band with its paper-cut shadow, and the red rule during the stamp telegraph. */
  private drawBand(leadY: number, half: number, def: PressBossDef): void {
    const g = this.band;
    g.clear();
    const t = def.bandThickness;
    const y0 = leadY - t;
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillRect(-half + SHADOW_OFFSET, y0 + SHADOW_OFFSET, 2 * half, t);
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(-half, y0, 2 * half, t);
    if (this.pressWall.stampTelegraph) {
      g.fillStyle(PALETTE.red, this.pressWall.stampTelegraphAlpha);
      g.fillRect(-half, leadY - 2, 2 * half, 2);
    }
  }

  /** Pins the live type blocks to the leading edge (the wall carries them) and fades their hit flash. */
  private updatePressBlocks(leadY: number, half: number, dt: number): void {
    for (const obj of this.blocks.getChildren()) {
      const blk = obj as TypeBlock;
      if (!blk.active) continue;
      blk.setPosition(-half + ((blk.slot + 1) / 5) * 2 * half, leadY);
      if (blk.flashMs > 0) {
        blk.flashMs -= dt * 1000;
        if (blk.flashMs > 0) blk.setTint(PALETTE.ink);
        else blk.clearTint();
      }
    }
  }

  /** The wall is a moving floor: it pushes the player and enemies down; the player burns while in contact. */
  private pushPress(leadY: number, dt: number, def: PressBossDef): void {
    const p = this.player;
    if (!this.run.isDead && p.y - PLAYER_RADIUS < leadY) {
      // The leading edge catches the player: push it clear and burn (the crop/gutter drain idiom).
      p.setPosition(p.x, leadY + PLAYER_RADIUS);
      this.run.drain(def.contactDamage * dt);
      this.pressBurnTimer -= dt;
      if (this.pressBurnTimer <= 0) {
        this.pressBurnTimer = 0.5;
        this.damageNumbers.show(p.x, p.y - 24, def.contactDamage * 0.5, false, true);
      }
    } else {
      this.pressBurnTimer = 0;
    }
    // Enemies are pushed, not damaged.
    for (const obj of this.spawns.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active) continue;
      const body = e.body as Phaser.Physics.Arcade.Body;
      if (body.top < leadY) e.setPosition(e.x, leadY + body.halfHeight);
    }
  }

  /** The Orbit weapon contacts the wall: it damages the boss like a projectile hit (orbit contacts included). */
  hitWallFromOrbit(x: number, y: number, damage: number, crit: boolean): void {
    const b = this.boss;
    if (this.def.behavior !== 'press' || !b.active) return;
    const wound = underexposureDamage(this.run.stats.woundThreshold, b.hp, b.maxHp, damage);
    const died = b.hit(wound.damage);
    this.run.bossHp = Math.max(0, b.hp);
    this.damageNumbers.show(x, y, wound.damage, crit, false, wound.doubled);
    this.fx.hit(x, y, PALETTE.ink);
    if (crit) {
      this.sfx.critHit();
      this.fx.critRing(x, y);
    } else {
      this.sfx.hit();
    }
    if (died) this.killBoss();
  }

  /** The wall's band as a rect for the Orbit weapon's hit test, or null when the Press is off the page. */
  pressWallRect(): Phaser.Geom.Rectangle | null {
    if (this.def.behavior !== 'press' || !this.boss.active) return null;
    const leadY = this.run.pressLeadY;
    if (!Number.isFinite(leadY)) return null;
    const def = this.def as PressBossDef;
    const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
    this.wallRect.x = -half;
    this.wallRect.y = leadY - def.bandThickness;
    this.wallRect.width = 2 * half;
    this.wallRect.height = def.bandThickness;
    return this.wallRect;
  }

  /** A player projectile hits a type block: normal damage (crits and underexposure), no XP/score/kill. */
  private onBlockHit(p: Projectile, blk: TypeBlock): void {
    if (!p.active || !blk.active || p.hitSerials.has(blk.serial)) return;
    p.hitSerials.add(blk.serial);
    const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
    const wound = underexposureDamage(this.run.stats.woundThreshold, blk.hp, blk.maxHp, crit ? p.damage * 2 : p.damage);
    const died = blk.hit(wound.damage);
    this.damageNumbers.show(blk.x, blk.y, wound.damage, crit, false, wound.doubled);
    this.fx.hit(p.x, p.y, PALETTE.ink);
    if (crit) {
      this.sfx.critHit();
      this.fx.critRing(p.x, p.y);
    } else {
      this.sfx.hit();
    }
    p.pierceLeft -= 1;
    if (p.pierceLeft < 0) p.despawn();
    if (!died) return;
    this.fx.death(blk.x, blk.y, PALETTE.gray, PALETTE.ink, 24);
    this.sfx.enemyDeath(24);
    blk.despawn();
    // A fully cleared row pulls the wall back (the pure rule in core/pressWall.ts).
    if (this.blocks.countActive(true) === 0 && this.pressRows > 0) this.pressWall.clearRow();
  }

  /** A type block touches the player: contact damage with the normal invulnerability window. */
  private onBlockTouched(blk: TypeBlock): void {
    const now = this.scene.time.now;
    if (!blk.active || this.player.isInvulnerable(now) || this.run.isDead) return;
    this.run.takeDamage(blk.contactDamage);
    this.player.hurt(now);
    this.fx.playerHit(this.player.x, this.player.y);
    this.sfx.playerHurt();
  }

  /** Enemy shots die on the wall's underside (the Press only; other bosses ignore enemy shots). */
  private onEnemyShotWall(s: EnemyBullet, b: Boss): void {
    if (this.def.behavior !== 'press' || !b.active || !s.active) return;
    s.despawn();
  }

  private onProjectileHit(p: Projectile, b: Boss): void {
    if (!p.active || !b.active || p.hitSerials.has(b.serial)) return;
    p.hitSerials.add(b.serial);
    const wound = underexposureDamage(this.run.stats.woundThreshold, b.hp, b.maxHp, p.damage);
    const died = b.hit(wound.damage);
    this.run.bossHp = Math.max(0, b.hp);
    // The press body is a full-width band, so show the number at the impact, not the band's center.
    this.damageNumbers.show(this.def.behavior === 'press' ? p.x : b.x, this.def.behavior === 'press' ? p.y : b.y, wound.damage, false, false, wound.doubled);
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
    if (this.def.behavior === 'press') return; // the wall pushes and burns in pushPress; no contact hit
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
    } else if (def.behavior === 'press') {
      hook.stats.pressKills += 1;
      // updatePress stops running, so the wall must return to a valid idle state here:
      // the band shatters, the blocks vanish, and pressLeadY goes back to NaN.
      const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
      const leadY = Number.isFinite(this.run.pressLeadY) ? this.run.pressLeadY : 0;
      this.shatterPressBand(leadY, half, def);
      this.run.pressLeadY = Number.NaN;
      this.band.clear().setVisible(false);
      for (const obj of this.blocks.getChildren()) (obj as TypeBlock).despawn();
      this.pressBandWidth = 0;
      this.pressBurnTimer = 0;
      this.pressTelegraphing = false;
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

  /** The band shatters into 4-6 flat ink fragments that drop 40-80 u and fade over 1 s. */
  private shatterPressBand(leadY: number, half: number, def: PressBossDef): void {
    const count = 4 + Math.floor(this.run.rng.range(0, 3));
    for (let i = 0; i < count; i++) {
      let frag = this.fragments[i];
      if (!frag) {
        frag = this.scene.add.image(0, 0, TEX.pressFragment).setDepth(DEPTH.enemies + 1);
        this.fragments[i] = frag;
      }
      this.scene.tweens.killTweensOf(frag);
      const x = Phaser.Math.Clamp(this.run.rng.range(-half, half), -half + 40, half - 40);
      const y = leadY - def.bandThickness / 2;
      frag.setVisible(true).setAlpha(1).setScale(this.run.rng.range(0.7, 1.8)).setPosition(x, y);
      this.scene.tweens.add({
        targets: frag,
        y: y + this.run.rng.range(40, 80),
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.In',
        onComplete: () => frag.setVisible(false),
      });
    }
  }
}
