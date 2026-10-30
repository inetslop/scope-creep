import type Phaser from 'phaser';
import type { Sfx } from '../../audio/Sfx';
import type { RunState } from '../../core/run';
import type { Enemy } from '../../entities/Enemy';
import type { Tower } from '../../entities/Tower';
import type { Board } from '../Board';
import type { EnemySystem } from '../EnemySystem';
import type { FxSystem } from '../FxSystem';
import type { ProjectileSystem } from '../ProjectileSystem';

/** What an enemy hook can use: the run's systems, as EnemySystem has them. */
export interface EnemyHookContext {
  readonly scene: Phaser.Scene;
  readonly board: Board;
  readonly run: RunState;
  readonly fx: FxSystem;
  readonly sfx: Sfx | undefined;
  /** The enemies: the pool (`all`), `spawn()`, `hit()` and `strike()`. */
  readonly enemies: EnemySystem;
  /** The run's towers right now. */
  towers(): readonly Tower[];
  /** The projectile pool (set after it exists, like `towers`): a beam's kill needles fly through it (T0242). */
  projectiles(): ProjectileSystem | undefined;
}

/** A kill, after it paid its gold (the enemy's own plus the Mint bonus) and showed its pop. */
export interface KillEvent {
  readonly enemy: Enemy;
  /** The tower whose hit (or burn) killed it; undefined if no tower did. */
  readonly source: Tower | undefined;
  /** The gold the kill paid. */
  readonly paid: number;
}

/**
 * Something that reacts to the enemies: a kill, a leak, or every frame of a wave. Every part is
 * optional. The enemy is still on the board (active, at its spot) when onKill and onLeak run;
 * it is returned to the pool right after.
 */
export interface EnemyHook {
  onKill?(kill: KillEvent): void;
  /** An enemy reached the exit, just before it costs its lives. */
  onLeak?(enemy: Enemy): void;
  /** Once per frame during a wave, after the enemies moved. */
  update?(dt: number): void;
}

/**
 * Makes one hook for one run: EnemySystem calls it once when the run starts, so state the hook
 * keeps in its closure (counters, timers) starts fresh every run.
 */
export type MakeEnemyHook = (ctx: EnemyHookContext) => EnemyHook;
