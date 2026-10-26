/**
 * Player stats and the modifier system that upgrades use.
 *
 * Upgrades never mutate stats directly. They contribute StatMods; computeStats()
 * folds every mod over BASE_STATS: all `add` mods first, then all `mul` mods.
 * To add a new stat: add it to PlayerStats + BASE_STATS (+ STAT_LIMITS if it needs a clamp),
 * then read it where it matters (usually a system in src/systems).
 */
export interface PlayerStats {
  maxHp: number;
  /** HP regenerated per second. */
  regenPerSec: number;
  /** Flat damage removed from each hit taken (a hit always deals at least 1). */
  armor: number;
  /** World units per second. */
  moveSpeed: number;
  /** Radius within which shards fly to the player. */
  pickupRadius: number;
  /** Multiplies weapon damage. */
  damageMul: number;
  /** Multiplies weapon fire rate. */
  fireRateMul: number;
  /** Multiplies projectile speed. */
  projectileSpeedMul: number;
  /** Extra projectiles per volley, added to each weapon's base count. */
  extraProjectiles: number;
  /** Extra enemies each projectile passes through. */
  extraPierce: number;
  /** Multiplies XP gained from shards. */
  xpMul: number;
}

export type StatKey = keyof PlayerStats;

export interface StatMod {
  stat: StatKey;
  op: 'add' | 'mul';
  value: number;
}

export const BASE_STATS: Readonly<PlayerStats> = {
  maxHp: 100,
  regenPerSec: 0,
  armor: 0,
  moveSpeed: 230,
  pickupRadius: 90,
  damageMul: 1,
  fireRateMul: 1,
  projectileSpeedMul: 1,
  extraProjectiles: 0,
  extraPierce: 0,
  xpMul: 1,
};

/** Hard limits so stacking upgrades can never break the game. */
export const STAT_LIMITS: Partial<Record<StatKey, { min?: number; max?: number; integer?: boolean }>> = {
  maxHp: { min: 1 },
  regenPerSec: { min: 0, max: 50 },
  armor: { min: 0, max: 50 },
  moveSpeed: { min: 60, max: 600 },
  pickupRadius: { min: 20, max: 800 },
  damageMul: { min: 0.1 },
  fireRateMul: { min: 0.1, max: 8 },
  projectileSpeedMul: { min: 0.2, max: 4 },
  extraProjectiles: { min: 0, max: 12, integer: true },
  extraPierce: { min: 0, max: 20, integer: true },
  xpMul: { min: 0.1, max: 10 },
};

export function computeStats(mods: readonly StatMod[], base: Readonly<PlayerStats> = BASE_STATS): PlayerStats {
  const out: PlayerStats = { ...base };
  for (const mod of mods) if (mod.op === 'add') out[mod.stat] += mod.value;
  for (const mod of mods) if (mod.op === 'mul') out[mod.stat] *= mod.value;
  for (const key of Object.keys(out) as StatKey[]) {
    const limit = STAT_LIMITS[key];
    if (!limit) continue;
    let v = out[key];
    if (limit.integer) v = Math.floor(v);
    if (limit.min !== undefined) v = Math.max(limit.min, v);
    if (limit.max !== undefined) v = Math.min(limit.max, v);
    out[key] = v;
  }
  return out;
}
