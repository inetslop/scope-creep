import type { AddedForm, AugmentDef, FirstForm, Tier } from '../content/types';
import type { Rng } from './rng';

/** Tiers, least to most special. */
export const TIER_ORDER: readonly Tier[] = ['common', 'rare', 'epic'];

/** The odds the draft shows, in percent (they add up to 100). */
export const TIER_ODDS: Record<Tier, number> = { common: 70, rare: 25, epic: 5 };

/**
 * The odds of the draft before wave `wave`, in percent (they add up to 100). From wave 5 on,
 * epic grows +1 per wave up to 15 and rare +1 per wave up to 33; common is whatever is left.
 */
export function tierOdds(wave: number): Record<Tier, number> {
  const grow = Math.max(0, wave - 4);
  const rare = Math.min(33, TIER_ODDS.rare + grow);
  const epic = Math.min(15, TIER_ODDS.epic + grow);
  return { common: 100 - rare - epic, rare, epic };
}

/** The draft rolls each card's tier: `next()*100` against the odds of wave `wave`. */
export function rollTier(rng: Rng, wave: number): Tier {
  const odds = tierOdds(wave);
  const roll = rng.next() * 100;
  if (roll < odds.epic) return 'epic';
  if (roll < odds.epic + odds.rare) return 'rare';
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
  if (tier === 'common') return { ...f, slow: f.slow ? { ...f.slow } : undefined, root: f.root ? { ...f.root } : undefined, burn: f.burn ? { ...f.burn } : undefined, beam: f.beam ? { ...f.beam } : undefined };
  const t = def.tiers[tier];
  return {
    ...f,
    damage: f.damage * (t.damageMul ?? 1),
    rate: f.rate / (t.cooldownMul ?? 1),
    range: f.range * (t.rangeMul ?? 1),
    pierce: t.pierce ?? f.pierce,
    push: t.push ?? f.push,
    slow: f.slow ? { ...f.slow, pct: t.slowPct ?? f.slow.pct } : undefined,
    root: f.root ? { ...f.root, sec: t.rootSec ?? f.root.sec } : undefined,
    burn: f.burn ? { ...f.burn, dps: t.burnDps ?? f.burn.dps } : undefined,
    beam: f.beam ? { ...f.beam, dps: t.beamDps ?? f.beam.dps } : undefined,
  };
}

/**
 * The added form of this copy of the augment at `tier` (Common: the base form). A new object:
 * the added multipliers and splash are replaced, the slow % replaced.
 */
export function tierAdded(def: AugmentDef, tier: Tier): AddedForm {
  const a = def.added;
  if (tier === 'common') return { ...a, slow: a.slow ? { ...a.slow } : undefined, root: a.root ? { ...a.root } : undefined, burn: a.burn ? { ...a.burn } : undefined, beam: a.beam ? { ...a.beam } : undefined };
  const t = def.tiers[tier];
  return {
    ...a,
    rateMul: t.addedRateMul ?? a.rateMul,
    rangeMul: t.addedRangeMul ?? a.rangeMul,
    splash: t.splash ?? a.splash,
    slow: a.slow ? { ...a.slow, pct: t.slowPct ?? a.slow.pct } : undefined,
    root: a.root ? { ...a.root, sec: t.addedRootSec ?? t.rootSec ?? a.root.sec } : undefined,
    burn: a.burn ? { ...a.burn, dps: t.burnDps ?? a.burn.dps } : undefined,
    beam: a.beam ? { ...a.beam, dps: t.addedBeamDps ?? a.beam.dps } : undefined,
  };
}

/** The card's added line at `tier` (Common: the base line). */
export function tierAddedLine(def: AugmentDef, tier: Tier): string {
  return tier === 'common' ? def.asAdded : def.tiers[tier].asAdded;
}

/** The card's tower line at `tier` (Common: the base line). */
export function tierTowerLine(def: AugmentDef, tier: Tier): string {
  return tier === 'common' ? def.asTower : def.tiers[tier].asTower ?? def.asTower;
}
