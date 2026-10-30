import { getLevelAugment } from '../content/levels';

/** The wave a run reaches to earn the first level slot: the wave has started (a run dying during it counts). */
export const LEVEL_UNLOCK_WAVE = 30;

/** The slots after a finished run: one earned the first time a run reaches the unlock wave, never more, never fewer. */
export function levelSlotsAfter(old: number, wavesReached: number): number {
  return wavesReached >= LEVEL_UNLOCK_WAVE ? Math.max(old, 1) : old;
}

/** The capped choice: known ids only, the first `slots` of them in order. */
export function capLevelChoice(slots: number, ids: readonly string[]): string[] {
  return ids.filter((id) => getLevelAugment(id) !== undefined).slice(0, Math.max(0, slots));
}

/** The run multiplier: 1 plus the chosen augments' bonuses (unknown ids ignored). */
export function levelMultiplier(ids: readonly string[]): number {
  let mul = 1;
  for (const id of ids) {
    const def = getLevelAugment(id);
    if (def) mul += def.bonus;
  }
  return mul;
}

/** The spawn-speed factor of the chosen augments: the product of their speedMuls, 1 when none of them touch speed. */
export function levelSpeedMul(ids: readonly string[]): number {
  let mul = 1;
  for (const id of ids) {
    const def = getLevelAugment(id);
    if (def?.speedMul !== undefined) mul *= def.speedMul;
  }
  return mul;
}

/** The wave's enemy-count factor of the chosen augments: the product of their countMuls, 1 when none of them touch counts. */
export function levelCountMul(ids: readonly string[]): number {
  let mul = 1;
  for (const id of ids) {
    const def = getLevelAugment(id);
    if (def?.countMul !== undefined) mul *= def.countMul;
  }
  return mul;
}

/** The multiplier as shown on the menu card: '×1.25' with Lean on, '×1.00' with none. */
export function levelMultiplierLabel(ids: readonly string[]): string {
  return `×${levelMultiplier(ids).toFixed(2)}`;
}

/** Lean's kill bounty: 75% of the enemy's own gold, floored down, minimum 1 gold (a 1-gold kill still pays 1). */
export function leanBounty(base: number, levels: readonly string[]): number {
  return levels.includes('lean') ? Math.max(1, Math.floor(base * 0.75)) : base;
}

/** The build countdown with the run's level augments: Short fuse runs 70% of `normal`, rounded to the nearest second. */
export function levelBuildSeconds(normal: number, levels: readonly string[]): number {
  return levels.includes('short-fuse') ? Math.round(normal * 0.7) : normal;
}

/** A stored run multiplier as the payout and the boards show it: '×1.25' at 1.25, '×1.5' at 1.5. */
export function levelMultiplierTag(mul: number): string {
  return `×${mul.toFixed(2).replace(/0$/, '')}`;
}
