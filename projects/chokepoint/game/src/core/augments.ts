import { MAX_SLOTS, SLOT_COSTS } from '../config';
import { ANCHOR_EXTRA_ROOT_SEC, anchor } from '../content/augments/anchor';
import { getAugment } from '../content/augments';
import { bolt } from '../content/augments/bolt';
import { SPLASH_CAP } from '../content/augments/splash';
import type { Bright } from '../content/palette';
import type { AttackKind, AugmentCopy, AugmentDef, Burn } from '../content/types';
import type { Rng } from './rng';
import { rollTier, tierAdded, tierFirst } from './tiers';

/** What a tower does, worked out from its augments in order (see towerSpec). Distances in cells. */
export interface TowerSpec {
  /** False for an empty tower. */
  attacks: boolean;
  kind: AttackKind | 'none';
  /** The first augment: it gives the tower its attack and its color. */
  firstId: string | undefined;
  /** 0 for a support tower that only slows (Frost first). */
  damage: number;
  range: number;
  /** Attacks per second. */
  rate: number;
  /** Shot towers: targets per attack. */
  shots: number;
  /** Pulse towers: bolts fired at the enemies furthest along with every pulse. */
  bolts: number;
  /** Damage of those bolts (a pulse tower's own damage can be 0). */
  boltDamage: number;
  /** Hits burst, hitting every enemy within this many cells (pulses: already in `range`). */
  splash: number;
  /** How many more enemies a shot strikes after the first hit; 0 = none (a pulse fires that many bolts). */
  pierce: number;
  slow: { pct: number; sec: number } | undefined;
  /** The root (full stop) in seconds its hits apply; undefined when the tower has no Anchor. */
  root: { sec: number } | undefined;
  projectileSpeed: number;
  /** Extra damage a marked enemy takes from everything, as a fraction (0.25 per Mark in the tower). */
  markPct: number;
  /** Marks in the tower: one ring tick each. */
  markCount: number;
  /** The burn its hits set ablaze: the strongest Ember in the tower (the rate never stacks); undefined without one. */
  burn: Burn | undefined;
  /** Embers in the tower: a muzzle dot when one is the first, one barrel tick each added. */
  burnCount: number;
  /** The beam's damage per second when Beam is the first (0: no beam of the tower's own). */
  beamDps: number;
  /** One half-rate per second entry per Beam added after the first, in the order put in. */
  beamExtras: number[];
  /** Extra gold this tower's own kills drop: one per mint copy in the tower, any slot (core/mint.ts). */
  goldPerKill: number;
  /** Kills within this many cells of the tower (its range ring) pay: 0 unless the first augment's form has it. */
  goldRadius: number;
  /** The gust: cells back along the road every attack pushes everything in range (0: no gust, Push first). */
  gust: number;
  /** Cells back each hit pushes its enemy, per Push added after the first (0: none). */
  pushPerHit: number;
  /** Pushes in the tower: one outward tick each (the first is the gust, the rest add per-hit push). */
  pushCount: number;
  /** Splash copies in the tower: their hits strike at most this many enemies (splashHits). */
  splashCount: number;
  /** How many homing needles the shot splits into on its first hit (0: no split, Spray first). */
  spray: number;
  /** Sprays in the tower: one barrel tick each. */
  sprayCount: number;
}

const EMPTY: TowerSpec = {
  attacks: false,
  kind: 'none',
  firstId: undefined,
  damage: 0,
  range: 0,
  rate: 0,
  shots: 0,
  bolts: 0,
  boltDamage: 0,
  splash: 0,
  pierce: 0,
  slow: undefined,
  root: undefined,
  projectileSpeed: 0,
  markPct: 0,
  markCount: 0,
  burn: undefined,
  burnCount: 0,
  beamDps: 0,
  beamExtras: [],
  goldPerKill: 0,
  goldRadius: 0,
  gust: 0,
  pushPerHit: 0,
  pushCount: 0,
  splashCount: 0,
  spray: 0,
  sprayCount: 0,
};

/**
 * Combines a tower's augment copies, in the order they were put in:
 * 1. The first copy's `first` form (at its tier, core/tiers.ts) is the tower's attack:
 *    its kind, damage, range and rate.
 * 2. Every later copy (a second copy of the first one too) applies its `added` form (at its tier):
 *    multipliers multiply, extra shots and splash add up, the strongest slow wins.
 * A pulse tower given extra shots fires that many bolts (Bolt's damage) with each pulse; a pulse
 * given splash reaches that much further.
 */
export function towerSpec(augments: readonly AugmentCopy[]): TowerSpec {
  const first = augments[0];
  if (!first) return EMPTY;
  const f = tierFirst(getAugment(first.id), first.tier);
  const spec: TowerSpec = {
    attacks: true,
    kind: f.kind,
    firstId: first.id,
    damage: f.damage,
    range: f.range,
    rate: f.rate,
    shots: 1,
    bolts: 0,
    boltDamage: bolt.first.damage,
    splash: 0,
    pierce: f.pierce ?? 0,
    slow: f.slow ? { ...f.slow } : undefined,
    root: undefined,
    projectileSpeed: f.projectileSpeed ?? bolt.first.projectileSpeed ?? 10,
    markPct: 0,
    markCount: 0,
    burn: undefined,
    burnCount: 0,
    beamDps: 0,
    beamExtras: [],
    goldRadius: f.goldRadius ?? 0,
    goldPerKill: 0,
    gust: f.push ?? 0,
    pushPerHit: 0,
    pushCount: 0,
    splashCount: 0,
    spray: f.spray ?? 0,
    sprayCount: 0,
  };
  // Anchors in any slot: the first sets the root's duration, each extra one lengthens it.
  let rootSec = 0;
  const addRoot = (id: string, sec: number): void => {
    if (id !== anchor.id) return;
    rootSec += rootSec > 0 ? ANCHOR_EXTRA_ROOT_SEC : sec;
  };
  if (f.root) addRoot(first.id, f.root.sec);
  for (const a of augments.slice(1)) {
    const e = tierAdded(getAugment(a.id), a.tier);
    spec.damage *= e.damageMul ?? 1;
    spec.boltDamage *= e.damageMul ?? 1;
    spec.rate *= e.rateMul ?? 1;
    spec.range *= e.rangeMul ?? 1;
    spec.splash += e.splash ?? 0;
    spec.pierce += e.pierce ?? 0;
    if (spec.kind === 'shot') spec.shots += e.extraShots ?? 0;
    else if (spec.kind === 'pulse') spec.bolts += e.extraShots ?? 0;
    // A Spray only grows a split of its own: added to a non-spray tower it has no split to grow.
    if (spec.kind === 'spray') spec.spray += e.spray ?? 0;
    if (e.slow && (!spec.slow || e.slow.pct > spec.slow.pct)) spec.slow = { ...e.slow };
    if (e.root) addRoot(a.id, e.root.sec);
  }
  if (rootSec > 0) spec.root = { sec: rootSec };
  // Marks in any slot: a marked enemy takes this much more damage from everything.
  for (let i = 0; i < augments.length; i++) {
    const a = getAugment(augments[i]!.id);
    const pct = i === 0 ? a.first.mark ?? 0 : a.added.mark ?? 0;
    if (pct > 0) {
      spec.markPct += pct;
      spec.markCount += 1;
    }
  }
  // Embers in any slot: the tower's burn is the strongest one in it — re-ignition refreshes, it never adds up.
  for (let i = 0; i < augments.length; i++) {
    const c = augments[i]!;
    const b = i === 0 ? f.burn : tierAdded(getAugment(c.id), c.tier).burn;
    if (!b) continue;
    spec.burnCount += 1;
    if (!spec.burn || b.dps > spec.burn.dps) spec.burn = { ...b };
  }
  // Beams in any slot: the first is the tower's own line, each added one a half-rate line on a
  // nearer enemy. The rate is its own stat (like burnDps): never scaled by damage or rate.
  for (let i = 0; i < augments.length; i++) {
    const c = augments[i]!;
    const dps = i === 0 ? f.beam?.dps ?? 0 : tierAdded(getAugment(c.id), c.tier).beam?.dps ?? 0;
    if (dps <= 0) continue;
    if (i === 0) spec.beamDps = dps;
    else spec.beamExtras.push(dps);
  }
  // Pushes in any slot: the first is the tower's gust, each extra one adds per-hit push.
  for (let i = 0; i < augments.length; i++) {
    const a = getAugment(augments[i]!.id);
    if (a.id !== 'push') continue;
    spec.pushCount += 1;
    if (i > 0) spec.pushPerHit += a.added.push ?? 0;
  }
  // Splashes in any slot, at any tier: how many enemies its hits may strike.
  for (const a of augments) if (a.id === 'splash') spec.splashCount += 1;
  // Sprays in any slot, at any tier: one needle per split, one barrel tick each.
  for (const a of augments) if (a.id === 'spray') spec.sprayCount += 1;
  // Mints in any slot: this tower's kills drop this much extra gold (core/mint.ts).
  for (const a of augments) spec.goldPerKill += tierAdded(getAugment(a.id), a.tier).goldPerKill ?? 0;
  // A pulse already hits an area: splash makes it reach further, and pierce turns into bolts
  // that fire with each pulse and keep going.
  if (spec.kind === 'pulse') {
    spec.bolts += spec.pierce;
    spec.range += spec.splash;
    spec.splash = 0;
  }
  return spec;
}

/** How many enemies a Splash in the tower lets its hits strike: its copies times SPLASH_CAP. */
export function splashHits(copies: number): number {
  return copies * SPLASH_CAP;
}

/** One line for the tower panel: what the combination does. */
export function describeSpec(spec: TowerSpec): string {
  if (!spec.attacks) return 'Put an augment in to give it an attack.';
  const slow = spec.slow ? Math.round(spec.slow.pct * 100) : 0;
  const root = spec.root ? `, and roots them for ${spec.root.sec}s` : '';
  const marked = Math.round(spec.markPct * 100);
  let line: string;
  if (spec.gust > 0) {
    line = `Pushes everything back ${spec.gust.toFixed(1)} cells`;
    if (slow) line += `, slowing them by ${slow}%`;
    line += root;
    if (spec.bolts > 0) line += `, and shoots ${spec.bolts > 1 ? `${spec.bolts} enemies` : 'the enemy furthest along'}`;
    if (marked > 0) line += ', and its hits mark';
  } else if (spec.kind === 'shot') {
    const target = spec.shots > 1 ? `${spec.shots} enemies at a time` : 'the enemy furthest along';
    const style = spec.range >= 4 ? 'Snipes' : spec.rate >= 3 ? 'Fires fast needles at' : 'Shoots';
    line = `${style} ${target}${spec.splash > 0 ? `, and the shots burst to ${splashHits(spec.splashCount) - 1} more` : ''}${spec.pierce > 0 ? `, and each hits ${spec.pierce + 1} in a line` : ''}${marked > 0 ? ', and its hits mark' : ''}`;
    if (slow) line += `, slowing them by ${slow}%`;
    line += root;
  } else if (spec.kind === 'spray') {
    line = `Shoots the enemy furthest along, and its shot splits into ${spec.spray} needles${spec.pierce > 0 ? `, and each hits ${spec.pierce + 1} in a line` : ''}`;
    if (marked > 0) line += ', and its hits mark';
    if (slow) line += `, slowing them by ${slow}%`;
    line += root;
  } else if (spec.kind === 'mark') {
    line = `Marks the enemy furthest along: marked enemies take ${marked}% more damage`;
    if (slow) line += `, slowing them by ${slow}%`;
  } else if (spec.kind === 'burn') {
    line = spec.burn ? `Sets ablaze the furthest enemy: ${spec.burn.dps} per second for ${spec.burn.sec} s` : 'Does not attack';
    if (slow) line += `, slowing them by ${slow}%`;
  } else if (spec.kind === 'beam') {
    line = `Beams the furthest enemy: ${spec.beamDps} per second`;
    if (spec.beamExtras.length === 1) line += `, and a second beam at ${spec.beamExtras[0]} per second on the nearest enemy`;
    else if (spec.beamExtras.length > 1) line += `, and ${spec.beamExtras.length} beams at ${spec.beamExtras[spec.beamExtras.length - 1]} per second on the nearest enemies`;
  } else if (spec.kind === 'rally') {
    const r = getAugment('rally');
    const reach = spec.range % 1 === 0 ? spec.range : spec.range.toFixed(1);
    line = `Towers within ${reach} cells attack ${Math.round((r.added.rally?.pct ?? 0) * 100)}% faster`;
  } else if (spec.damage <= 0) {
    if (spec.root) {
      line = spec.slow ? `Slows everything around it by ${slow}%, and roots it for ${spec.root.sec}s` : `Roots everything around it for ${spec.root.sec}s`;
      if (spec.bolts > 0) line += `, and shoots ${spec.bolts > 1 ? `${spec.bolts} enemies` : 'the enemy furthest along'}`;
      if (marked > 0) line += ', and its hits mark';
    } else if (spec.slow) {
      line = `Slows everything around it by ${slow}%`;
      if (spec.bolts > 0) line += `, and shoots ${spec.bolts > 1 ? `${spec.bolts} enemies` : 'the enemy furthest along'}`;
      if (marked > 0) line += ', and its hits mark';
    } else line = spec.bolts > 0 ? `Shoots ${spec.bolts > 1 ? `${spec.bolts} enemies` : 'the enemy furthest along'}` : 'Does not attack';
  } else {
    line = spec.firstId === 'splash' ? `Blasts the ${splashHits(spec.splashCount)} furthest around it` : 'Blasts everything around it';
    if (slow) line += `, slowing them by ${slow}%`;
    line += root;
    if (spec.bolts > 0) line += `, and shoots ${spec.bolts > 1 ? `${spec.bolts} enemies` : 'the enemy furthest along'}`;
    if (marked > 0) line += ', and its hits mark';
  }
  // An Ember added to another first: its hits set ablaze too (an Ember first says it in its own line).
  // A beam has no hits of its own, so the hit trailers never say it.
  if (spec.kind !== 'burn' && spec.kind !== 'beam' && spec.burn) line += ', and its hits set ablaze';
  // The mints in the tower (core/mint.ts): its kills, and the kills within its radius, drop extra gold.
  if (spec.goldRadius > 0) line += `, kills within ${spec.goldRadius} cells drop +${spec.goldPerKill} gold`;
  else if (spec.goldPerKill > 0) line += `, kills drop +${spec.goldPerKill} gold`;
  if (spec.pushPerHit > 0 && spec.kind !== 'beam') line += `, and its hits push back ${spec.pushPerHit.toFixed(1)} cells`;
  return `${line}.`;
}

/** The color a tower shows: its first augment's, or none while empty. */
export function towerColor(augments: readonly AugmentCopy[]): Bright | undefined {
  const first = augments[0];
  return first ? getAugment(first.id).look.color : undefined;
}

/**
 * Gold to unlock slot number `index` (0-based) on one tower. Slot 0 is the tower itself; every
 * further slot on the same tower costs much more. undefined past MAX_SLOTS.
 */
export function slotCost(index: number): number | undefined {
  return index < MAX_SLOTS ? SLOT_COSTS[index] : undefined;
}

/** How many cards the draft offers at draft number `draftNumber` (1-based): four every fifth draft, three otherwise. */
export function draftCardCount(draftNumber: number): number {
  return draftNumber > 0 && draftNumber % 5 === 0 ? 4 : 3;
}

/**
 * The draft: `count` different augments. Each card rolls its tier first, then picks its augment
 * from the pool for that tier: an augment with a `tier` (Mark) is only in the pool for cards that
 * rolled that tier, so it can never exist as any other tier. The opening draft (`opening`) only
 * offers augments that deal damage as a tower's first, or that may open (`opening`), since the
 * first one has to hold wave 1 alone. Its first card is a Common Bolt, the game's default shot,
 * so the opening pick is never a dead end - except when the bolt is excluded (the opening reroll),
 * when the first card is rolled like the rest. `exclude` is the ids of the offer just before this
 * one: those augments are not offered again; if they leave fewer than 3 eligible the rule relaxes
 * for this offer only, so the roll never hard-fails.
 */
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening = false, exclude?: readonly string[]): AugmentCopy[] {
  const open = opening ? pool.filter((a) => a.first.damage > 0 || a.opening) : pool;
  // The augments of the offer just before this one are not offered again.
  const excluded = new Set(exclude ?? []);
  // If that leaves fewer than 3 eligible, the rule relaxes for this offer only, so the roll never hard-fails.
  const banned = open.filter((a) => !excluded.has(a.id)).length < 3 ? new Set<string>() : excluded;
  const taken = new Set<string>();
  const offers: AugmentCopy[] = [];
  if (opening && !banned.has(bolt.id)) {
    // The opening draft (not its reroll, which excluded the bolt) offers the game's default shot: a Common Bolt.
    offers.push({ id: bolt.id, tier: 'common' });
    taken.add(bolt.id);
  }
  for (let i = offers.length; i < count; i++) {
    const tier = rollTier(rng, wave);
    const candidates = open.filter((a) => !taken.has(a.id) && !banned.has(a.id) && (a.tier === undefined || a.tier === tier));
    const picked = rng.pick(candidates);
    taken.add(picked.id);
    offers.push({ id: picked.id, tier });
  }
  return offers;
}
