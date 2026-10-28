import type { AddedForm, AugmentDef, FirstForm, Tier } from '../content/types';
import type { Rng } from './rng';

/** Tiers, least to most special. */
export const TIER_ORDER: readonly Tier[] = ['common', 'rare', 'epic'];

/** The odds the draft shows, in percent (they add up to 100). */
export const TIER_ODDS: Record<Tier, number> = { common: 70, rare: 25, epic: 5 };

/** The draft rolls each card's tier: `next()*100` against the odds. */
export function rollTier(rng: Rng): Tier {
  const roll = rng.next() * 100;
  if (roll < TIER_ODDS.epic) return 'epic';
  if (roll < TIER_ODDS.epic + TIER_ODDS.rare) return 'rare';
  return 'common';
}

/** Where the tier sits in TIER_ORDER; the gem row shows tierIndex + 1 gems. */
export function tierIndex(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

/**
 * The first form of this copy of the augment at `tier` (Common: the base form). A new object,
 * never the def's: damage scaled, rate divided by the cooldown, range scaled, the slow % replaced.
 */
export function tierFirst(def: AugmentDef, tier: Tier): FirstForm {
  const f = def.first;
  if (tier === 'common') return { ...f, slow: f.slow ? { ...f.slow } : undefined };
  const t = def.tiers[tier];
  return {
    ...f,
    damage: f.damage * (t.damageMul ?? 1),
    rate: f.rate / (t.cooldownMul ?? 1),
    range: f.range * (t.rangeMul ?? 1),
    slow: f.slow ? { ...f.slow, pct: t.slowPct ?? f.slow.pct } : undefined,
  };
}

/**
 * The added form of this copy of the augment at `tier` (Common: the base form). A new object:
 * the added multipliers and splash are replaced, the slow % replaced.
 */
export function tierAdded(def: AugmentDef, tier: Tier): AddedForm {
  const a = def.added;
  if (tier === 'common') return { ...a, slow: a.slow ? { ...a.slow } : undefined };
  const t = def.tiers[tier];
  return {
    ...a,
    rateMul: t.addedRateMul ?? a.rateMul,
    rangeMul: t.addedRangeMul ?? a.rangeMul,
    splash: t.splash ?? a.splash,
    slow: a.slow ? { ...a.slow, pct: t.slowPct ?? a.slow.pct } : undefined,
  };
}

/** The card's added line at `tier` (Common: the base line). */
export function tierAddedLine(def: AugmentDef, tier: Tier): string {
  return tier === 'common' ? def.asAdded : def.tiers[tier].asAdded;
}
