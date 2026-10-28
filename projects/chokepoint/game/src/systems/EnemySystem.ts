import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { Burn, EnemyDef } from '../content/types';
import { getEnemy } from '../content/enemies';
import type { RunState } from '../core/run';
import { mintGoldBonus } from '../core/mint';
import { burnTick } from '../core/burn';
import { splitDistances } from '../core/split';
import { hook } from '../debug/testHook';
import { Enemy } from '../entities/Enemy';
import type { Tower } from '../entities/Tower';
import { drawEnemyMarks } from './enemyMarks';
import type { Sfx } from '../audio/Sfx';
import type { Board } from './Board';
import type { FxSystem } from './FxSystem';

/** What one hit of a tower does (built by TowerSystem from the tower's spec). */
export interface HitPayload {
  damage: number;
  /** Board units around the hit enemy that are hit too (0: none). */
  splash: number;
  slow: { pct: number; sec: number } | undefined;
  /** The root (full stop) this hit applies, in seconds; undefined when it has no Anchor. */
  root: { sec: number } | undefined;
  /** How many more enemies a shot strikes after the first hit; 0 = none. */
  pierce: number;
  /** Board units the hit pushes its enemy back along the road (0: none). */
  push: number;
  /** The mark this hit applies to the enemies it hits; `x`, `y` are the tower's base (the flash spot). */
  mark: { pct: number; x: number; y: number } | undefined;
  /** The burn this hit sets ablaze, `dps` per second for `sec` seconds (Ember); undefined without one. */
  burn: Burn | undefined;
  /** The tower's color, for the shot and the burst. */
  color: number;
  /** The tower that made the hit: its mints (and the mints around the kill) decide the extra kill gold. */
  source: Tower;
}

/** Owns the enemy pool: spawning, walking, hits, kills, leaks, and the health bars. */
export class EnemySystem {
  private readonly scene: Phaser.Scene;
  private readonly board: Board;
  private readonly run: RunState;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx | undefined;
  /** The run's towers (set by GameScene): a kill pays each mint tower that reaches it extra gold. */
  towers: () => readonly Tower[] = () => [];
  private readonly pool: Enemy[] = [];
  private readonly bars: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, board: Board, run: RunState, fx: FxSystem, sfx: Sfx | undefined) {
    this.scene = scene;
    this.board = board;
    this.run = run;
    this.fx = fx;
    this.sfx = sfx;
    this.bars = scene.add.graphics().setDepth(DEPTH.bars);
  }

  /** Every pooled enemy (check `active`). Targeting reads this. */
  get all(): readonly Enemy[] {
    return this.pool;
  }

  get aliveCount(): number {
    let n = 0;
    for (const e of this.pool) if (e.active) n++;
    return n;
  }

  spawn(def: EnemyDef, hpMul: number, distance = 0): Enemy {
    let enemy = this.pool.find((e) => !e.active);
    if (!enemy) {
      enemy = new Enemy(this.scene);
      this.scene.add.existing(enemy);
      this.pool.push(enemy);
    }
    enemy.spawn(def, hpMul, this.board.path, distance);
    hook.stats.enemiesSpawned += 1;
    return enemy;
  }

  update(dt: number): void {
    for (const e of this.pool) {
      if (!e.active) continue;
      const leaked = e.advance(dt, this.board.path);
      // The burn keeps ticking after the last shot; an enemy that leaks this frame is done.
      if (!leaked) this.tickBurn(e, dt);
      if (leaked) this.leak(e);
    }
  }

  /** One frame of the burn: its damage over the seconds still ablaze, through the normal hit. */
  private tickBurn(e: Enemy, dt: number): void {
    const damage = burnTick(e.burn, dt);
    if (damage <= 0) return;
    if (e.hit(damage, false)) this.kill(e, e.burnSource);
  }

  /**
   * One hit of a tower's attack on `target`: its damage and slow, and with splash the same on
   * every other enemy within `payload.splash` board units of it (a burst ring shows where).
   */
  hit(target: Enemy, payload: HitPayload): void {
    if (!target.active) return;
    const victims = [target];
    if (payload.splash > 0) {
      const r2 = payload.splash * payload.splash;
      for (const e of this.pool) {
        if (e === target || !e.active) continue;
        const dx = e.x - target.x;
        const dy = e.y - target.y;
        if (dx * dx + dy * dy <= r2) victims.push(e);
      }
      this.fx.ring(target.x, target.y, payload.splash, payload.color);
    }
    for (const e of victims) this.strike(e, payload);
  }

  /** Damage and slow on one enemy, handling the kill. Returns true when it died. */
  strike(e: Enemy, payload: HitPayload): boolean {
    if (!e.active) return false;
    if (payload.slow) e.slow(payload.slow.pct, payload.slow.sec);
    if (payload.push > 0) e.pushBack(payload.push);
    if (payload.root) e.root(payload.root.sec);
    if (payload.mark && e.mark(payload.mark.pct)) this.fx.markFlash(payload.mark.x, payload.mark.y, CELL * 0.43);
    // The burn keeps ticking after the hit: refreshed on every hit, only the first ablaze whooshes.
    if (payload.burn) {
      // The tower whose rate is live gets the killing tick: a fresh ablaze is the igniter's, a
      // refresh only moves it over when that tower burns at least as hot.
      const overtook = e.burn.left <= 0 || payload.burn.dps >= e.burn.dps;
      const fresh = e.ignite(payload.burn.dps, payload.burn.sec);
      if (overtook) e.burnSource = payload.source;
      if (fresh) this.sfx?.ignite();
    }
    if (payload.damage <= 0 || !e.hit(payload.damage)) return false;
    this.kill(e, payload.source);
    return true;
  }

  /** The one kill: its gold (with the mints at the death spot), the chips, the chain, the sound. */
  private kill(e: Enemy, source: Tower | undefined): void {
    // Mint towers (core/mint.ts): the killer's own copies, plus every mint tower within its radius, pay extra.
    const cell = this.board.cellAt(e.x, e.y);
    const paid = this.run.addKill(e.def.gold + (cell && source ? mintGoldBonus(this.towers(), cell, source) : 0));
    const mint = paid - e.def.gold; // one per Mint bonus, each pays exactly +1 (T0021)
    const milestone = this.fx.killCount(e.x, e.y);
    this.run.noteCombo(this.fx.chain);
    this.fx.burst(e.x, e.y, PALETTE[e.def.look.color], milestone);
    this.fx.popText(e.x, e.y - 20, `+${paid}`);
    if (mint > 0) this.fx.mintPop(e.x, e.y - 20, mint);
    this.sfx?.kill();
    // A splitter dies into two splinters, 0.25 cells either side of the kill (core/split.ts).
    if (e.def.splitsInto) {
      const child = getEnemy(e.def.splitsInto);
      for (const d of splitDistances(e.distance, this.board.path.length)) this.spawn(child, e.hpMul, d);
    }
    hook.stats.enemiesKilled += 1;
    e.despawn();
  }

  private leak(e: Enemy): void {
    this.run.leak(e.def.livesCost);
    hook.stats.enemiesLeaked += 1;
    this.fx.ring(e.x, e.y, 30, PALETTE.red);
    this.fx.popText(e.x, e.y - 20, `-${e.def.livesCost}`, PALETTE.red);
    this.sfx?.leak();
    this.scene.cameras.main.shake(140, 0.005);
    e.despawn();
  }

  /** Health bars and frost rings (systems/enemyMarks.ts); RunFlow calls it last thing every frame. */
  drawBars(): void {
    drawEnemyMarks(this.bars, this.pool);
  }

  /** Invariant: no active enemy has a NaN position or hp. */
  brokenEnemy(): string | undefined {
    const bad = this.pool.find((e) => e.active && (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.hp)));
    return bad ? `${bad.def.id} at (${bad.x}, ${bad.y}) hp ${bad.hp}` : undefined;
  }

  /** Invariant: no active enemy carries a NaN or out-of-range root timer. */
  brokenRoot(): string | undefined {
    const bad = this.pool.find((e) => e.active && (!Number.isFinite(e.rootLeft) || e.rootLeft < 0 || e.rootLeft > 10));
    return bad ? `${bad.def.id} rooted for ${bad.rootLeft}s` : undefined;
  }

  /** Invariant: no active enemy carries a NaN or out-of-[0, 1] mark. */
  brokenMark(): string | undefined {
    const bad = this.pool.find((e) => e.active && (!Number.isFinite(e.markPct) || e.markPct < 0 || e.markPct > 1));
    return bad ? `${bad.def.id} marked by ${bad.markPct}` : undefined;
  }

  /** Invariant: no active enemy carries a NaN or negative burn. */
  brokenBurn(): string | undefined {
    const bad = this.pool.find((e) => e.active && (!Number.isFinite(e.burn.dps) || e.burn.dps < 0 || !Number.isFinite(e.burn.left) || e.burn.left < 0));
    return bad ? `${bad.def.id} burning at ${bad.burn.dps}/s for ${bad.burn.left}s` : undefined;
  }

  /** Invariant: no enemy has slid back before the road's start (the gust clamps at 0). */
  brokenPush(): string | undefined {
    const bad = this.pool.find((e) => e.active && e.distance < 0);
    return bad ? `${bad.def.id} at ${bad.distance.toFixed(1)} before the start` : undefined;
  }
}
