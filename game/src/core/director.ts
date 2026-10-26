import type { EnemyDef } from '../content/types';
import type { Rng } from './rng';

export interface DirectorConfig {
  /** Threat points gained per second at time 0. */
  baseBudgetPerSec: number;
  /** Extra threat points per second gained for each minute survived. */
  budgetGrowthPerMin: number;
  /** Never spawn when this many enemies are alive. */
  maxAlive: number;
  /** Cap on spawns in a single update, to avoid frame spikes. */
  maxSpawnsPerTick: number;
}

export const DEFAULT_DIRECTOR: DirectorConfig = {
  baseBudgetPerSec: 1.6,
  budgetGrowthPerMin: 2.2,
  maxAlive: 220,
  maxSpawnsPerTick: 6,
};

/**
 * Decides WHAT to spawn and WHEN (pure logic). SpawnSystem decides WHERE.
 * Threat budget accumulates over time; each enemy costs its `threat`.
 */
export class SpawnDirector {
  private budget = 0;
  private readonly config: DirectorConfig;
  private readonly enemies: readonly EnemyDef[];

  constructor(enemies: readonly EnemyDef[], config: DirectorConfig = DEFAULT_DIRECTOR) {
    this.enemies = enemies;
    this.config = config;
  }

  budgetPerSec(timeSec: number): number {
    return this.config.baseBudgetPerSec + (this.config.budgetGrowthPerMin * timeSec) / 60;
  }

  unlocked(timeSec: number): EnemyDef[] {
    return this.enemies.filter((e) => e.unlockAtSec <= timeSec && e.spawnWeight > 0);
  }

  /** Returns enemy ids to spawn this tick. */
  update(dtSec: number, timeSec: number, aliveCount: number, rng: Rng): string[] {
    this.budget += this.budgetPerSec(timeSec) * dtSec;
    const out: string[] = [];
    const pool = this.unlocked(timeSec);
    if (pool.length === 0) return out;
    let alive = aliveCount;
    while (out.length < this.config.maxSpawnsPerTick && alive < this.config.maxAlive) {
      const affordable = pool.filter((e) => e.threat <= this.budget);
      const pick = rng.weighted(affordable, (e) => e.spawnWeight);
      if (!pick) break;
      this.budget -= pick.threat;
      out.push(pick.id);
      alive += 1;
    }
    // Don't let budget pile up forever while capped; it would cause a huge burst later.
    this.budget = Math.min(this.budget, 40);
    return out;
  }
}
