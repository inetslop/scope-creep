import type { UpgradeDef } from '../content/types';
import type { Rng } from './rng';
import { isUpgradeAvailable } from './upgrades';

export const WARM_START_TIME_SEC = 480; // 8:00; exactly this value arms the flag
export const WARM_START_KEY = 'scope-creep.warm-start';

/** True when this run's clock earned the next run a warm start. */
export function isWarmStartEarned(timeSec: number): boolean { return timeSec >= WARM_START_TIME_SEC; }

/** Stored flag; false when absent or storage is blocked. '1' armed, '0' unarmed. */
export function loadWarmStart(): boolean {
  try { return localStorage.getItem(WARM_START_KEY) === '1'; } catch { return false; }
}
export function saveWarmStart(armed: boolean): void {
  try { localStorage.setItem(WARM_START_KEY, armed ? '1' : '0'); } catch { /* storage blocked */ }
}

/** Uniformly random card a fresh run can still take (all 16, weapon cards included), drawn from the run's seeded rng. */
export function drawWarmStartPick(rng: Rng, pool: readonly UpgradeDef[], levelOf: (id: string) => number, ownedWeapons: readonly string[]): UpgradeDef {
  const available = pool.filter((d) => isUpgradeAvailable(d, levelOf, ownedWeapons));
  return rng.pick(available.length > 0 ? available : pool);
}
