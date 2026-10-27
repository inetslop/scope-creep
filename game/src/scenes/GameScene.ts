import Phaser from 'phaser';
import { MUSIC_VOLUME, Music } from '../audio/Music';
import { Sfx } from '../audio/Sfx';
import { TEX } from '../art/textures';
import { ARENA_SIZE, DEPTH, VIEW_SHORT_SIDE } from '../config';
import { PALETTE } from '../content/palette';
import { UPGRADES } from '../content/upgrades';
import { loadBestScore, saveBestScore } from '../core/bestScore';
import { RunState } from '../core/run';
import { STREAK_FIRE_BONUS, STREAK_FIRE_BONUS_STREAK, streakFireBonus } from '../core/stats';
import { rollUpgradeChoices } from '../core/upgrades';
import { length } from '../core/vec';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Controls } from '../input/Controls';
import { ArcSystem } from '../systems/ArcSystem';
import { BossApproachSystem } from '../systems/BossApproachSystem';
import { BossSystem } from '../systems/BossSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CropSystem } from '../systems/CropSystem';
import { GutterSystem } from '../systems/GutterSystem';
import { DamageNumbers } from '../systems/DamageNumbers';
import { Marginalia } from '../systems/Marginalia';
import { FxSystem } from '../systems/FxSystem';
import { OrbitSystem } from '../systems/OrbitSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
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
  private damageNumbers!: DamageNumbers;
  private marginalia!: Marginalia;
  private sfx!: Sfx;
  private music!: Music;
  private weapons!: WeaponSystem;
  private combat!: CombatSystem;
  private crop!: CropSystem;
  private gutter!: GutterSystem;
  private boss!: BossSystem;
  private bossApproach!: BossApproachSystem;
  private orbit!: OrbitSystem;
  private arc!: ArcSystem;
  private spawns!: SpawnSystem;
  private pickups!: PickupSystem;
  private bounds!: Phaser.Geom.Rectangle;
  private trailTimer = 0;
  private ending = false;
  /** All-time best score loaded at run start; written back in endRun(). */
  private storedBest = 0;

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
    this.storedBest = loadBestScore();

    const half = ARENA_SIZE / 2;
    this.bounds = new Phaser.Geom.Rectangle(-half, -half, ARENA_SIZE, ARENA_SIZE);
    this.physics.world.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    this.add.tileSprite(this.bounds.x, this.bounds.y, ARENA_SIZE, ARENA_SIZE, TEX.floor).setOrigin(0).setDepth(DEPTH.floor);
    this.drawArenaWalls();

    this.player = new Player(this, 0, 0);
    this.fx = new FxSystem(this);
    this.damageNumbers = new DamageNumbers(this);
    this.crop = new CropSystem(this, this.run, this.player, this.damageNumbers);
    this.marginalia = new Marginalia(this, this.bounds);
    this.gutter = new GutterSystem(this, this.run, this.player, this.marginalia, this.damageNumbers);
    this.sfx = new Sfx(this);
    this.registry.set('sfx', this.sfx);
    this.music = new Music(this, this.sfx);
    this.pickups = new PickupSystem(this, this.run, this.player, this.fx, this.sfx);
    this.weapons = new WeaponSystem(this, this.run, this.player, this.fx, this.sfx);
    this.spawns = new SpawnSystem(this, this.run, this.player, this.bounds, this.marginalia, this.fx, this.sfx);
    this.combat = new CombatSystem(this, this.run, this.player, { enemies: this.spawns.enemies, projectiles: this.weapons.projectiles, enemyShots: this.spawns.enemyShots }, this.fx, this.pickups, this.sfx, this.damageNumbers, this.spawns);
    this.boss = new BossSystem(this, this.run, this.player, this.spawns, this.weapons.projectiles, this.fx, this.sfx, this.music, this.damageNumbers, this.pickups);
    this.bossApproach = new BossApproachSystem(this, this.run);
    this.orbit = new OrbitSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));
    this.arc = new ArcSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));

    this.controls = new Controls(this);
    this.registry.set('controls', this.controls);

    const cam = this.cameras.main;
    cam.setBackgroundColor(PALETTE.paperDark); // outside the arena
    cam.setBounds(this.bounds.x - 200, this.bounds.y - 200, this.bounds.width + 400, this.bounds.height + 400);
    // No roundPixels: zoom is fractional, so snapping the scroll to whole world units jitters it against the player.
    cam.startFollow(this.player, false, 0.15, 0.15);
    this.applyZoom(this.scale.width, this.scale.height);
    onResize(this, (w, h) => this.applyZoom(w, h));

    this.scene.launch(SCENES.hud);
    this.bindSceneEvents();
    this.registerInvariants();
  }

  update(_time: number, delta: number): void {
    if (this.ending) return;
    const dt = Math.min(delta, 50) / 1000; // clamp so a stalled tab doesn't teleport everything
    const run = this.run;
    run.timeSec += dt;
    this.music.update(run.timeSec);

    const cam = this.cameras.main;
    const playerScreen = { x: (this.player.x - cam.worldView.x) * cam.zoom, y: (this.player.y - cam.worldView.y) * cam.zoom };
    const input = this.controls.read(playerScreen);
    this.player.drive(input.move, run.stats.moveSpeed);
    this.player.aimAngle = Math.atan2(input.aim.y, input.aim.x);

    this.weapons.update(dt, input.firing);
    this.arc.update(dt, input.firing);
    this.orbit.update(dt);
    this.spawns.update(dt);
    this.boss.update(dt);
    this.bossApproach.update(dt);
    this.marginalia.update(dt);
    this.pickups.update(dt);
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
    };
    const onPauseRequest = (): void => this.openPause();
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
    this.input.keyboard?.on('keydown-ESC', onPauseRequest);
    this.input.keyboard?.on('keydown-P', onPauseRequest);
    this.input.keyboard?.on('keydown-M', onMute);
    // Auto-pause when the tab/app is backgrounded (important on mobile). Not in smoke mode.
    if (!flags.smoke) this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
      this.events.off(Phaser.Scenes.Events.RESUME, onResume);
      this.events.off(GAME_EVENTS.pauseRequest, onPauseRequest);
      this.input.keyboard?.off('keydown-ESC', onPauseRequest);
      this.input.keyboard?.off('keydown-P', onPauseRequest);
      this.input.keyboard?.off('keydown-M', onMute);
      this.sfx.dispose();
      this.music.dispose();
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      for (const name of INVARIANTS) hook.removeInvariant(name);
      this.registry.remove('sfx');
      this.registry.remove('controls');
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
    s.cropDamageTaken = this.crop.totalDamage;
    s.streakFireBonus = streakFireBonus(this.run.streak);
  }

  /** Checks the smoke test runs every few seconds. Add one for every new system. */
  private registerInvariants(): void {
    const arena = Phaser.Geom.Rectangle.Clone(this.bounds);
    Phaser.Geom.Rectangle.Inflate(arena, 64, 64);
    hook.addInvariant('player-position', () =>
      Number.isFinite(this.player.x) && Number.isFinite(this.player.y) ? null : `player at (${this.player.x}, ${this.player.y})`,
    );
    hook.addInvariant('player-in-arena', () => (arena.contains(this.player.x, this.player.y) ? null : `player outside arena at (${this.player.x}, ${this.player.y})`));
    hook.addInvariant('hp-range', () => (this.run.hp >= 0 && this.run.hp <= this.run.stats.maxHp + 1e-6 ? null : `hp ${this.run.hp} / ${this.run.stats.maxHp}`));
    hook.addInvariant('stats-finite', () => {
      const bad = Object.entries(this.run.stats).filter(([, v]) => !Number.isFinite(v));
      return bad.length > 0 ? `non-finite stats: ${bad.map(([k]) => k).join(', ')}` : null;
    });
    hook.addInvariant('enemy-count', () => (this.spawns.activeCount <= this.spawns.maxEnemies ? null : `${this.spawns.activeCount} enemies alive`));
    hook.addInvariant('enemy-shot-count', () => (this.spawns.activeShotCount <= this.spawns.maxEnemyShots ? null : `${this.spawns.activeShotCount} enemy shots alive`));
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
    hook.addInvariant('damage-numbers-pool', () => (this.damageNumbers.activeCount <= 60 ? null : `${this.damageNumbers.activeCount} damage numbers active`));
    hook.addInvariant('platemark-pool', () => (this.fx.platemarkCount <= 12 ? null : `${this.fx.platemarkCount} platemarks on screen`));
    hook.addInvariant('orbit-circles', () => {
      for (const c of this.orbit.circles) if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return `orbit circle at (${c.x}, ${c.y})`;
      return null;
    });
    hook.addInvariant('arc-lines', () => (this.arc.lines.length <= 4 ? null : `${this.arc.lines.length} arc lines alive`));
    hook.addInvariant('marginalia-labels', () => (this.marginalia.activeCount <= 16 ? null : `${this.marginalia.activeCount} marginalia labels active`));
    hook.addInvariant('boss-state', () => {
      const b = this.boss.boss;
      if (this.run.bossAlive !== b.active) return `bossAlive ${this.run.bossAlive} but boss.active ${b.active}`;
      if (!b.active) return null;
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return `boss at (${b.x}, ${b.y})`;
      if (this.boss.arm.visible && (!Number.isFinite(this.boss.arm.x) || !Number.isFinite(this.boss.arm.y))) return `boss arm at (${this.boss.arm.x}, ${this.boss.arm.y})`;
      if (this.run.bossHp < -1e-6 || this.run.bossHp > this.run.bossMaxHp + 1e-6) return `boss hp ${this.run.bossHp} / ${this.run.bossMaxHp}`;
      return null;
    });
    // Finiteness only: nextBeatTime is legitimately stale while the scene is paused.
    hook.addInvariant('music-scheduler', () =>
      Number.isFinite(this.music.nextBeatTime) && this.music.nextBeatTime >= 0 ? null : `music nextBeatTime ${this.music.nextBeatTime}`,
    );
    hook.addInvariant('music-swell', () => {
      const g = this.music.masterGain;
      return g >= MUSIC_VOLUME - 1e-6 && g <= MUSIC_VOLUME * 1.6 + 1e-6 ? null : `music swell gain ${g}`;
    });
    hook.addInvariant('streak', () => (this.run.streak >= 0 && this.run.bestStreak >= this.run.streak ? null : `streak ${this.run.streak} / best ${this.run.bestStreak}`));
    hook.addInvariant('score', () => (Number.isFinite(this.run.score) && this.run.score >= 0 ? null : `score ${this.run.score}`));
    hook.addInvariant('crop-damage', () => Number.isFinite(this.crop.totalDamage) && this.crop.totalDamage >= 0 ? null : `crop damage ${this.crop.totalDamage}`);
    hook.addInvariant('gutter-damage', () => Number.isFinite(this.gutter.totalDamage) && this.gutter.totalDamage >= 0 ? null : `gutter damage ${this.gutter.totalDamage}`);
    hook.addInvariant('gutter-band', () => (!this.gutter.bandActive || Number.isFinite(this.gutter.bandX) ? null : `gutter band at (${this.gutter.bandX})`));
    hook.addInvariant('upgrade-history', () => {
      const levels = Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0);
      return levels === this.run.upgradeHistory.length ? null : `upgrade levels ${levels} but history ${this.run.upgradeHistory.length}`;
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
  }
}

const INVARIANTS = ['player-position', 'player-in-arena', 'hp-range', 'stats-finite', 'enemy-count', 'enemy-shot-count', 'elite-markers', 'slam-ring', 'projectile-count', 'damage-numbers-pool', 'platemark-pool', 'orbit-circles', 'arc-lines', 'music-scheduler', 'music-swell', 'marginalia-labels', 'boss-state', 'streak', 'score', 'crop-damage', 'gutter-damage', 'gutter-band', 'upgrade-history', 'streak-fire-bonus', 'camera-shake', 'boss-approach-pulse'];
