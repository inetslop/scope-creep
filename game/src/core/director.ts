import { ELITE } from '../config';
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

/** What the director decided for one tick: normal spawns plus at most one elite. */
export interface SpawnDecision {
  ids: string[];
  elites: string[];
}

/**
 * Decides WHAT to spawn and WHEN (pure logic). SpawnSystem decides WHERE.
 * Threat budget accumulates over time; each enemy costs its `threat`.
 * Separately, one elite (a bigger, tougher version of a random unlocked enemy)
 * is reported every `ELITE.intervalSec`.
 */
export class SpawnDirector {
  private budget = 0;
  private nextEliteAt = ELITE.intervalSec;
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

  /** Returns the enemy ids to spawn this tick, plus at most one elite. */
  update(dtSec: number, timeSec: number, aliveCount: number, rng: Rng): SpawnDecision {
    this.budget += this.budgetPerSec(timeSec) * dtSec;
    const ids: string[] = [];
    const elites: string[] = [];
    const pool = this.unlocked(timeSec);
    if (pool.length > 0) {
      let alive = aliveCount;
      while (ids.length < this.config.maxSpawnsPerTick && alive < this.config.maxAlive) {
        const affordable = pool.filter((e) => e.threat <= this.budget);
        const pick = rng.weighted(affordable, (e) => e.spawnWeight);
        if (!pick) break;
        this.budget -= pick.threat;
        ids.push(pick.id);
        alive += 1;
      }
      // Elites ignore the threat budget and maxAlive; at most one per tick, and the
      // timer only advances when one is actually reported.
      if (timeSec >= this.nextEliteAt) {
        const elite = rng.weighted(pool, (e) => e.spawnWeight);
        if (elite) {
          elites.push(elite.id);
          this.nextEliteAt += ELITE.intervalSec;
        }
      }
    }
    // Don't let budget pile up forever while capped; it would cause a huge burst later.
    this.budget = Math.min(this.budget, 40);
    return { ids, elites };
  }
}
