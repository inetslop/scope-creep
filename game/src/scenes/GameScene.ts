import Phaser from 'phaser';
import { MUSIC_VOLUME, Music } from '../audio/Music';
import { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS, VIEW_SHORT_SIDE } from '../config';
import { PALETTE } from '../content/palette';
import { UPGRADES, UPGRADE_BY_ID } from '../content/upgrades';
import { loadBestScore, saveBestScore } from '../core/bestScore';
import { loadRedactorPick, REDACT_COOLDOWN_SEC, REDACT_SLOW_SEC } from '../core/redactor';
import { REST } from '../core/rest';
import { RunState } from '../core/run';
import { cropSafeFraction } from '../core/crop';
import { STREAK_FIRE_BONUS, STREAK_FIRE_BONUS_STREAK, streakFireBonus } from '../core/stats';
import { SWATCH_CASCADE } from '../core/swatchCascade';
import { rollUpgradeChoices } from '../core/upgrades';
import { length } from '../core/vec';
import { VIGNETTE } from '../core/vignette';
import { drawWarmStartPick, isWarmStartEarned, loadWarmStart, saveWarmStart } from '../core/warmStart';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Projectile } from '../entities/Projectile';
import { Player } from '../entities/Player';
import { Controls } from '../input/Controls';
import { ArcSystem } from '../systems/ArcSystem';
import { BossApproachSystem } from '../systems/BossApproachSystem';
import { BossSystem } from '../systems/BossSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CropSystem } from '../systems/CropSystem';
import { FermataSystem } from '../systems/FermataSystem';
import { GiltPop } from '../systems/GiltPop';
import { GutterSystem } from '../systems/GutterSystem';
import { DamageNumbers } from '../systems/DamageNumbers';
import { Marginalia } from '../systems/Marginalia';
import { FxSystem } from '../systems/FxSystem';
import { OrbitSystem } from '../systems/OrbitSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { PuddleSystem } from '../systems/PuddleSystem';
import { RedactSystem } from '../systems/RedactSystem';
import { ScoreFeed } from '../systems/ScoreFeed';
import { SpawnSystem } from '../systems/SpawnSystem';
import { Underdrawing } from '../systems/Underdrawing';
import { VignetteSystem } from '../systems/VignetteSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { GAME_EVENTS, onResize, SCENES } from './keys';

export interface RunSummary {
  timeSec: number;
  level: number;
  kills: number;
  bestStreak: number;
  /** Points earned this run. */
  score: number;
  /** All-time best score (max of this run and the stored one). */
  best: number;
  seed: number;
}

/**
 * One run of the game. Owns the world, the player and all systems.
 * Order of work each frame is in update(); systems never call each other's update().
 */
export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private player!: Player;
  private controls!: Controls;
  private fx!: FxSystem;
  private puddles!: PuddleSystem;
  private damageNumbers!: DamageNumbers;
  private feed!: ScoreFeed;
  private giltPop!: GiltPop;
  private marginalia!: Marginalia;
  private sfx!: Sfx;
  private music!: Music;
  private weapons!: WeaponSystem;
  private combat!: CombatSystem;
  private crop!: CropSystem;
  private gutter!: GutterSystem;
  private boss!: BossSystem;
  private bossApproach!: BossApproachSystem;
  private vignette!: VignetteSystem;
  private orbit!: OrbitSystem;
  private arc!: ArcSystem;
  private underdrawing!: Underdrawing;
  private spawns!: SpawnSystem;
  private fermata!: FermataSystem;
  private pickups!: PickupSystem;
  private redact!: RedactSystem;
  private bounds!: Phaser.Geom.Rectangle;
  private trailTimer = 0;
  private ending = false;
  /** All-time best score loaded at run start; written back in endRun(). */
  private storedBest = 0;
  /** Warm-start upgrade name pending for the HUD note: set in create(), cleared once emitted on the first tick. */
  private warmStartName = '';

  constructor() {
    super(SCENES.game);
  }

  create(): void {
    hook.scene = SCENES.game;
    hook.overlay = '';
    hook.stats.runsStarted += 1;
    this.ending = false;

    this.run = new RunState(flags.seed ?? Math.floor(Math.random() * 2 ** 31));
    this.registry.set('run', this.run);
    const redactorPicked = loadRedactorPick(); // the loadout is read once, at run start
    this.storedBest = loadBestScore();
    this.warmStartName = '';
    if (loadWarmStart()) {
      saveWarmStart(false); // consumed by this run whatever its outcome
      const def = drawWarmStartPick(this.run.rng, UPGRADES, (id) => this.run.upgradeLevel(id), this.run.weapons);
      this.run.applyUpgrade(def);
      this.warmStartName = def.name;
      hook.stats.upgradesTaken += 1;
    }

    const half = ARENA_SIZE / 2;
    this.bounds = new Phaser.Geom.Rectangle(-half, -half, ARENA_SIZE, ARENA_SIZE);
    this.physics.world.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    this.add.tileSprite(this.bounds.x, this.bounds.y, ARENA_SIZE, ARENA_SIZE, TEX.floor).setOrigin(0).setDepth(DEPTH.floor);
    this.drawArenaWalls();

    this.player = new Player(this, 0, 0);
    this.registry.set('player', this.player);
    this.player.setBuildDepth(Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0));
    this.fx = new FxSystem(this);
    this.puddles = new PuddleSystem(this);
    this.damageNumbers = new DamageNumbers(this);
    this.feed = new ScoreFeed(this);
    this.giltPop = new GiltPop(this);
    this.crop = new CropSystem(this, this.run, this.player, this.damageNumbers);
    this.marginalia = new Marginalia(this, this.bounds);
    this.sfx = new Sfx(this);
    this.registry.set('sfx', this.sfx);
    this.gutter = new GutterSystem(this, this.run, this.player, this.marginalia, this.damageNumbers, this.sfx);
    this.music = new Music(this, this.sfx);
    this.registry.set('music', this.music);
    this.pickups = new PickupSystem(this, this.run, this.player, this.fx, this.sfx, this.giltPop, redactorPicked);
    this.weapons = new WeaponSystem(this, this.run, this.player, this.fx, this.sfx);
    this.underdrawing = new Underdrawing(this);
    this.spawns = new SpawnSystem(this, this.run, this.player, this.bounds, this.marginalia, this.underdrawing, this.fx, this.sfx, this.puddles);
    this.fermata = new FermataSystem(this.run);
    this.combat = new CombatSystem(this, this.run, this.player, { enemies: this.spawns.enemies, projectiles: this.weapons.projectiles, enemyShots: this.spawns.enemyShots }, this.fx, this.pickups, this.sfx, this.damageNumbers, this.feed, this.spawns);
    this.boss = new BossSystem(this, this.run, this.player, this.spawns, this.weapons.projectiles, this.spawns.enemyShots, this.fx, this.sfx, this.music, this.damageNumbers, this.feed, this.pickups, this.marginalia);
    this.bossApproach = new BossApproachSystem(this, this.run);
    this.vignette = new VignetteSystem(this, this.run);
    this.orbit = new OrbitSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e), () => this.boss.pressWallRect(), (x, y, d, c) => this.boss.hitWallFromOrbit(x, y, d, c));
    this.arc = new ArcSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));
    this.redact = new RedactSystem(this.player, this.spawns.enemies, this.spawns.enemyShots, this.fx, this.sfx, redactorPicked);
    this.registry.set('redact', this.redact);

    this.controls = new Controls(this);
    this.registry.set('controls', this.controls);
    this.redact.seedHeld(this.controls.redactDown()); // a Space/Y press made in the menu to start the run is not a Redact

    const cam = this.cameras.main;
    cam.setBackgroundColor(PALETTE.paperDark); // outside the arena
    cam.setBounds(this.bounds.x - 200, this.bounds.y - 200, this.bounds.width + 400, this.bounds.height + 400);
    // No roundPixels: zoom is fractional, so snapping the scroll to whole world units jitters it against the player.
    cam.startFollow(this.player, false, 0.15, 0.15);
    this.applyZoom(this.scale.width, this.scale.height);
    onResize(this, (w, h) => this.applyZoom(w, h));

    // The warm-start note is emitted from update(), not here: scene.launch is queued by Phaser, so the HUD's
    // create() (and its GAME_EVENTS.warmStart listener) runs only after this create() returns.
    this.scene.launch(SCENES.hud);
    this.bindSceneEvents();
    this.registerInvariants();
  }

  update(_time: number, delta: number): void {
    if (this.ending) return;
    if (this.warmStartName !== '') {
      // First tick after create(): the HUD listener now exists, so the note can't be lost to launch queuing.
      this.events.emit(GAME_EVENTS.warmStart, `WARM START — ${this.warmStartName}`);
      this.warmStartName = '';
    }
    const dt = Math.min(delta, 50) / 1000; // clamp so a stalled tab doesn't teleport everything
    const run = this.run;
    run.timeSec += dt;
    const wasCovered = run.rest.covered;
    run.rest.tick(dt); // 30 s of peace puts the player at rest (core/rest.ts)
    if (!wasCovered && run.rest.covered) this.fx.restRing(this.player.x, this.player.y); // the page exhales: free hit in hand
    this.music.update(run.timeSec);

    const cam = this.cameras.main;
    const playerScreen = { x: (this.player.x - cam.worldView.x) * cam.zoom, y: (this.player.y - cam.worldView.y) * cam.zoom };
    const input = this.controls.read(playerScreen);
    this.player.drive(input.move, run.stats.moveSpeed * this.puddles.playerSpeedMul(this.player.x, this.player.y));
    this.player.aimAngle = Math.atan2(input.aim.y, input.aim.x);

    this.weapons.update(dt, input.firing);
    this.arc.update(dt, input.firing);
    this.orbit.update(dt);
    // Fermata: after a level-up pick every enemy shape holds still for 0.6 s; player,
    // their weapons, shards and hazards keep moving (core/fermata.ts).
    const holding = this.fermata.update(dt, this.spawns.enemies, this.spawns.enemyShots, this.boss.boss);
    if (!holding) {
      this.spawns.update(dt);
      this.underdrawing.update(dt);
      this.boss.update(dt);
    }
    this.bossApproach.update(dt);
    this.marginalia.update(dt);
    this.puddles.update(dt);
    this.pickups.update(dt);
    this.redact.update(dt, input.redact);
    this.crop.update(dt);
    this.gutter.update(dt);
    if (run.stats.regenPerSec > 0) run.heal(run.stats.regenPerSec * dt);

    this.trailTimer -= dt;
    if (length(input.move) > 0.2 && this.trailTimer <= 0) {
      this.fx.trailAt(this.player.x - input.move.x * 14, this.player.y - input.move.y * 14);
      this.trailTimer = 0.08;
    }

    this.updateHookStats();
    if (run.isDead) this.endRun();
    else if (run.pendingLevelUps > 0) this.openLevelUp();
    // Ticks last, after this frame's heals (Balance regen, maxed-level-up heal), so the latch always
    // sees the frame's final HP fraction and the 'low-hp-vignette' invariant's hard boundaries
    // (≤25% ⇒ on, >30% ⇒ off) hold between frames.
    this.vignette.update(dt);
  }

  openPause(): void {
    if (this.ending || hook.overlay !== '' || !this.scene.isActive()) return;
    hook.overlay = SCENES.pause;
    this.scene.launch(SCENES.pause);
    this.scene.pause();
  }

  private openLevelUp(): void {
    const choices = rollUpgradeChoices(this.run.rng, UPGRADES, (id) => this.run.upgradeLevel(id), this.run.weapons, 3);
    if (choices.length === 0) {
      // Everything is maxed: convert the level-up into a heal.
      this.run.pendingLevelUps = 0;
      this.run.heal(25);
      return;
    }
    hook.overlay = SCENES.levelUp;
    this.scene.launch(SCENES.levelUp, { choices: choices.map((c) => c.id) });
    this.scene.pause();
    this.sfx.levelUp();
  }

  private endRun(): void {
    this.ending = true;
    hook.stats.deaths += 1;
    const score = this.run.score;
    if (score > this.storedBest) saveBestScore(score);
    this.physics.pause();
    this.fx.death(this.player.x, this.player.y, PALETTE.blue, PALETTE.yellow, 40);
    this.sfx.enemyDeath(40);
    this.fx.shake(16, 400);
    this.player.setVisible(false);
    const summary: RunSummary = { timeSec: this.run.timeSec, level: this.run.level, kills: this.run.kills, bestStreak: this.run.bestStreak, score, best: Math.max(score, this.storedBest), seed: this.run.seed };
    this.time.delayedCall(700, () => {
      this.scene.stop(SCENES.hud);
      if (isWarmStartEarned(this.run.timeSec)) saveWarmStart(true);
      this.scene.start(SCENES.gameOver, summary);
    });
  }

  private applyZoom(width: number, height: number): void {
    this.cameras.main.setZoom(Phaser.Math.Clamp(Math.min(width, height) / VIEW_SHORT_SIDE, 0.45, 2.5));
  }

  /** A thick ink frame with primary-colored blocks along it, like a Mondrian border. */
  private drawArenaWalls(): void {
    const g = this.add.graphics().setDepth(DEPTH.arena);
    const b = this.bounds;
    g.lineStyle(16, PALETTE.ink, 1);
    g.strokeRect(b.x - 8, b.y - 8, b.width + 16, b.height + 16);
    const colors = [PALETTE.red, PALETTE.yellow, PALETTE.blue];
    const block = 40;
    let i = 0;
    for (let t = 0; t <= b.width; t += 400, i++) {
      const color = colors[i % colors.length]!;
      g.fillStyle(color, 1);
      g.lineStyle(4, PALETTE.ink, 1);
      for (const [x, y] of [
        [b.x + t, b.y],
        [b.x + t, b.bottom],
        [b.x, b.y + t],
        [b.right, b.y + t],
      ] as const) {
        g.fillRect(x - block / 2, y - block / 2, block, block);
        g.strokeRect(x - block / 2, y - block / 2, block, block);
      }
    }
  }

  /** Scene event emitters outlive restarts, so every listener added here is removed on shutdown. */
  private bindSceneEvents(): void {
    const onResume = (): void => {
      hook.overlay = '';
      this.controls.reset();
      this.redact.reset(); // a stale touch from before the pause must not fire the Redact
    };
    const onPauseRequest = (): void => this.openPause();
    const onRedactRequest = (): void => this.redact.request();
    const onHidden = (): void => this.openPause();
    const onMute = (): void => {
      this.sfx.toggleMute();
    };
    // Physics writes body positions back to sprites in POST_UPDATE (after update()), so anything pinned
    // to the player is placed here, or it trails the player by a frame and wobbles.
    const onPostUpdate = (_time: number, delta: number): void => {
      this.player.syncBarrel();
      this.orbit.pinToPlayer();
      this.marginalia.pin();
      this.boss.boss.syncCore();
      this.fx.updateShake(Math.min(delta, 50));
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    this.events.on(GAME_EVENTS.pauseRequest, onPauseRequest);
    this.events.on(GAME_EVENTS.redactRequest, onRedactRequest);
    this.input.keyboard?.on('keydown-ESC', onPauseRequest);
    this.input.keyboard?.on('keydown-P', onPauseRequest);
    this.input.keyboard?.on('keydown-M', onMute);
    // Auto-pause when the tab/app is backgrounded (important on mobile). Not in smoke mode.
    if (!flags.smoke) this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
      this.events.off(Phaser.Scenes.Events.RESUME, onResume);
      this.events.off(GAME_EVENTS.pauseRequest, onPauseRequest);
      this.events.off(GAME_EVENTS.redactRequest, onRedactRequest);
      this.input.keyboard?.off('keydown-ESC', onPauseRequest);
      this.input.keyboard?.off('keydown-P', onPauseRequest);
      this.input.keyboard?.off('keydown-M', onMute);
      this.sfx.dispose();
      this.music.dispose();
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      hook.clearInvariants();
      this.registry.remove('sfx');
      this.registry.remove('player');
      this.registry.remove('controls');
      this.registry.remove('redact');
    });
  }

  private updateHookStats(): void {
    const s = hook.stats;
    s.timeSec = this.run.timeSec;
    s.level = this.run.level;
    s.hp = this.run.hp;
    s.maxHp = this.run.stats.maxHp;
    s.score = this.run.score;
    s.enemiesAlive = this.spawns.activeCount;
    s.inkwell = this.run.inkwell;
    s.cropDamageTaken = this.crop.totalDamage;
    s.streakFireBonus = streakFireBonus(this.run.streak);
  }

  /** Checks the smoke test runs every few seconds. Add one for every new system; shutdown clears them all. */
  private registerInvariants(): void {
    const arena = Phaser.Geom.Rectangle.Clone(this.bounds);
    Phaser.Geom.Rectangle.Inflate(arena, 64, 64);
    hook.addInvariant('player-position', () =>
      Number.isFinite(this.player.x) && Number.isFinite(this.player.y) ? null : `player at (${this.player.x}, ${this.player.y})`,
    );
    hook.addInvariant('player-in-arena', () => (arena.contains(this.player.x, this.player.y) ? null : `player outside arena at (${this.player.x}, ${this.player.y})`));
    hook.addInvariant('player-hitbox', () => {
      const b = this.player.body as Phaser.Physics.Arcade.Body;
      return b.halfWidth === PLAYER_RADIUS && b.halfHeight === PLAYER_RADIUS ? null : `player body ${b.halfWidth}x${b.halfHeight}`;
    });
    hook.addInvariant('hp-range', () => (this.run.hp >= 0 && this.run.hp <= this.run.stats.maxHp + 1e-6 ? null : `hp ${this.run.hp} / ${this.run.stats.maxHp}`));
    hook.addInvariant('stats-finite', () => {
      const bad = Object.entries(this.run.stats).filter(([, v]) => !Number.isFinite(v));
      return bad.length > 0 ? `non-finite stats: ${bad.map(([k]) => k).join(', ')}` : null;
    });
    hook.addInvariant('enemy-count', () => (this.spawns.activeCount <= this.spawns.maxEnemies ? null : `${this.spawns.activeCount} enemies alive`));
    hook.addInvariant('enemy-shot-count', () => (this.spawns.activeShotCount <= this.spawns.maxEnemyShots ? null : `${this.spawns.activeShotCount} enemy shots alive`));
    hook.addInvariant('fermata-hold', () => {
      if (this.ending || !this.scene.isActive() || !this.run.fermata.active) return null;
      for (const obj of this.spawns.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        const b = e.body as Phaser.Physics.Arcade.Body;
        if (b.velocity.x !== 0 || b.velocity.y !== 0) return `frozen enemy ${e.def.id} moving at (${b.velocity.x}, ${b.velocity.y})`;
      }
      for (const obj of this.spawns.enemyShots.getChildren()) {
        const p = obj as EnemyBullet;
        if (!p.active) continue;
        const b = p.body as Phaser.Physics.Arcade.Body;
        if (b.velocity.x !== 0 || b.velocity.y !== 0) return `frozen enemy bullet moving at (${b.velocity.x}, ${b.velocity.y})`;
      }
      const boss = this.boss.boss;
      if (boss.active) {
        const b = boss.body as Phaser.Physics.Arcade.Body;
        if (b.velocity.x !== 0 || b.velocity.y !== 0) return `frozen boss moving at (${b.velocity.x}, ${b.velocity.y})`;
      }
      return null;
    });
    hook.addInvariant('fermata-ledger', () =>
      this.fermata.savedCount <= this.spawns.maxEnemies + this.spawns.maxEnemyShots + 1 ? null : `${this.fermata.savedCount} saved fermata velocities`,
    );
    hook.addInvariant('elite-markers', () => {
      for (const obj of this.spawns.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        if (e.elite !== e.ring.visible || e.elite !== e.badge.visible) return `elite marker mismatch on ${e.def.id}`;
      }
      return null;
    });
    hook.addInvariant('slam-ring', () => {
      for (const obj of this.spawns.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        if (e.slamRing.visible && e.def.behavior !== 'slam') return `slam ring visible on non-slam enemy ${e.def.id}`;
      }
      return null;
    });
    hook.addInvariant('projectile-count', () => (this.weapons.activeCount <= 400 ? null : `${this.weapons.activeCount} projectiles alive`));
    hook.addInvariant('bouncing-points', () => {
      const half = ARENA_SIZE / 2 + 16;
      for (const obj of this.weapons.projectiles.getChildren()) {
        const p = obj as Projectile;
        if (!p.active || !p.bouncing) continue;
        if (Math.abs(p.x) > half || Math.abs(p.y) > half) return `bouncing point outside the arena at (${p.x}, ${p.y})`;
      }
      return null;
    });
    hook.addInvariant('damage-numbers-pool', () => (this.damageNumbers.activeCount <= 60 ? null : `${this.damageNumbers.activeCount} damage numbers active`));
    hook.addInvariant('platemark-pool', () => (this.fx.platemarkCount <= 12 ? null : `${this.fx.platemarkCount} platemarks on screen`));
    hook.addInvariant('bounce-marks-pool', () => (this.fx.bounceMarkCount <= 16 ? null : `${this.fx.bounceMarkCount} bounce marks on screen`));
    hook.addInvariant('quicken-specks', () => (this.fx.quickenSpeckCount <= 9 ? null : `${this.fx.quickenSpeckCount} quicken specks on screen`));
    hook.addInvariant('puddle-pool', () => (this.puddles.activeCount <= this.puddles.maxPuddles ? null : `${this.puddles.activeCount} puddles on screen`));
    hook.addInvariant('slam-dust-pool', () => (this.fx.dustCount <= 6 ? null : `${this.fx.dustCount} slam dust puffs on screen`));
    hook.addInvariant('orbit-circles', () => {
      for (const c of this.orbit.circles) if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return `orbit circle at (${c.x}, ${c.y})`;
      return null;
    });
    hook.addInvariant('arc-lines', () => (this.arc.lines.length <= 4 ? null : `${this.arc.lines.length} arc lines alive`));
    hook.addInvariant('marginalia-labels', () => (this.marginalia.activeCount <= 16 ? null : `${this.marginalia.activeCount} marginalia labels active`));
    hook.addInvariant('underdrawing-count', () => (this.underdrawing.activeCount <= 240 ? null : `${this.underdrawing.activeCount} underdrawing sketches active`));
    hook.addInvariant('boss-state', () => {
      const b = this.boss.boss;
      // The palette's body is only active while a swatch falls, so compare against bodyActive, not bossAlive.
      if (b.active !== this.boss.bodyActive) return `boss body active ${b.active} but bodyActive ${this.boss.bodyActive} (bossAlive ${this.run.bossAlive})`;
      if (!b.active) return null;
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return `boss at (${b.x}, ${b.y})`;
      if (this.boss.arm.visible && (!Number.isFinite(this.boss.arm.x) || !Number.isFinite(this.boss.arm.y))) return `boss arm at (${this.boss.arm.x}, ${this.boss.arm.y})`;
      if (this.run.bossHp < -1e-6 || this.run.bossHp > this.run.bossMaxHp + 1e-6) return `boss hp ${this.run.bossHp} / ${this.run.bossMaxHp}`;
      return null;
    });
    hook.addInvariant('palette-swatch', () => {
      const c = this.boss.cascade;
      if (c.resolvedCount > SWATCH_CASCADE.count) return `${c.resolvedCount} swatches resolved`;
      if (c.phase === 'falling') {
        const half = ARENA_SIZE / 2;
        if (!Number.isFinite(c.activeX) || !Number.isFinite(c.activeY) || c.activeY < -half - 1 || c.activeY > half + 1)
          return `swatch at (${c.activeX}, ${c.activeY})`;
      }
      return null;
    });
    hook.addInvariant('press-wall', () => {
      const leadY = this.run.pressLeadY;
      const alive = this.run.bossAlive && this.run.bossId === 'press';
      if (alive !== Number.isFinite(leadY)) return `pressLeadY ${leadY} but bossAlive ${this.run.bossAlive} / bossId "${this.run.bossId}"`;
      if (Number.isFinite(leadY)) {
        const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
        if (leadY < -half - 1 || leadY > half + 1) return `pressLeadY ${leadY} outside safe rect [${-half}, ${half}]`;
      }
      return null;
    });
    hook.addInvariant('type-blocks', () => (this.boss.blocks.countActive(true) <= 4 ? null : `${this.boss.blocks.countActive(true)} type blocks active`));
    // Finiteness only: nextBeatTime is legitimately stale while the scene is paused.
    hook.addInvariant('music-scheduler', () =>
      Number.isFinite(this.music.nextBeatTime) && this.music.nextBeatTime >= 0 ? null : `music nextBeatTime ${this.music.nextBeatTime}`,
    );
    hook.addInvariant('music-swell', () => {
      const g = this.music.masterGain;
      return g >= MUSIC_VOLUME - 1e-6 && g <= MUSIC_VOLUME * 1.6 + 1e-6 ? null : `music swell gain ${g}`;
    });
    hook.addInvariant('inkwell', () => (this.run.inkwell >= -1e-9 && this.run.inkwell <= 1 + 1e-9 ? null : `inkwell ${this.run.inkwell}`));
    hook.addInvariant('rest', () => (this.run.rest.covered === (this.run.rest.since >= REST.windowSec) ? null : `rest covered ${this.run.rest.covered} at ${this.run.rest.since} s of peace`));
    hook.addInvariant('streak', () => (this.run.streak >= 0 && this.run.bestStreak >= this.run.streak ? null : `streak ${this.run.streak} / best ${this.run.bestStreak}`));
    hook.addInvariant('score', () => (Number.isFinite(this.run.score) && this.run.score >= 0 ? null : `score ${this.run.score}`));
    hook.addInvariant('score-feed', () => (this.feed.activeCount <= 32 ? null : `${this.feed.activeCount} score feed texts active`));
    hook.addInvariant('gilt-pop-pool', () => (this.giltPop.activeCount <= 16 ? null : `${this.giltPop.activeCount} gilt pops active`));
    hook.addInvariant('crop-damage', () => Number.isFinite(this.crop.totalDamage) && this.crop.totalDamage >= 0 ? null : `crop damage ${this.crop.totalDamage}`);
    hook.addInvariant('gutter-damage', () => Number.isFinite(this.gutter.totalDamage) && this.gutter.totalDamage >= 0 ? null : `gutter damage ${this.gutter.totalDamage}`);
    hook.addInvariant('gutter-band', () => (!this.gutter.bandActive || Number.isFinite(this.gutter.bandX) ? null : `gutter band at (${this.gutter.bandX})`));
    hook.addInvariant('upgrade-history', () => {
      const levels = Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0);
      return levels === this.run.upgradeHistory.length ? null : `upgrade levels ${levels} but history ${this.run.upgradeHistory.length}`;
    });
    hook.addInvariant('build-rings', () => {
      const total = Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0);
      const expected = Math.min(3, Math.floor(total / 4));
      return this.player.buildDepth === expected ? null : `build rings ${this.player.buildDepth} but ${expected} at ${total} total levels`;
    });
    hook.addInvariant('upgrade-levels', () => {
      for (const [id, level] of Object.entries(this.run.upgradeLevels)) {
        const def = UPGRADE_BY_ID.get(id);
        if (!def) return `unknown upgrade ${id}`;
        if (level < 1 || level > def.maxLevel) return `${id} at level ${level}, max ${def.maxLevel}`;
      }
      return null;
    });
    hook.addInvariant('streak-fire-bonus', () => {
      const expected = this.run.streak >= STREAK_FIRE_BONUS_STREAK ? STREAK_FIRE_BONUS : 1;
      return hook.stats.streakFireBonus === expected ? null : `streakFireBonus ${hook.stats.streakFireBonus} at streak ${this.run.streak}`;
    });
    hook.addInvariant('camera-shake', () => {
      const cam = this.cameras.main;
      if (!Number.isFinite(cam.scrollX) || !Number.isFinite(cam.scrollY)) return `camera scroll (${cam.scrollX}, ${cam.scrollY})`;
      return this.fx.shakeMs > 500 ? `shake stuck at ${this.fx.shakeMs} ms` : null;
    });
    hook.addInvariant('boss-approach-pulse', () => {
      const p = this.bossApproach;
      if (p.pulseVisible !== this.run.bossApproach) return `pulse visible ${p.pulseVisible} but bossApproach ${this.run.bossApproach}`;
      if (!Number.isFinite(p.pulseAlpha) || p.pulseAlpha < -1e-6 || p.pulseAlpha > 0.6 + 1e-6) return `pulse alpha ${p.pulseAlpha}`;
      return null;
    });
    hook.addInvariant('low-hp-vignette', () => {
      const f = this.run.hp / this.run.stats.maxHp;
      if (f <= VIGNETTE.onAt && !this.run.vignette.on) return `vignette off at hp fraction ${f}`;
      if (f > VIGNETTE.offAt && this.run.vignette.on) return `vignette on at hp fraction ${f}`;
      if (!Number.isFinite(this.vignette.fade) || this.vignette.fade < -1e-6 || this.vignette.fade > 1 + 1e-6) return `vignette fade ${this.vignette.fade}`;
      return null;
    });
    hook.addInvariant('wound-threshold', () =>
      this.run.stats.woundThreshold >= 0 && this.run.stats.woundThreshold <= 0.75 + 1e-6 ? null : `woundThreshold ${this.run.stats.woundThreshold}`,
    );
    hook.addInvariant('redact-cooldown', () => {
      const cd = this.redact.cdLeft;
      return Number.isFinite(cd) && cd >= 0 && cd <= REDACT_COOLDOWN_SEC ? null : `redact cooldown ${cd}`;
    });
    hook.addInvariant('redact-slow', () => {
      for (const obj of this.spawns.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active) continue;
        if (e.slowLeft < -1e-9 || e.slowLeft > REDACT_SLOW_SEC + 1e-9) return `redact slow ${e.slowLeft} on ${e.def.id}`;
      }
      return null;
    });
  }
}
