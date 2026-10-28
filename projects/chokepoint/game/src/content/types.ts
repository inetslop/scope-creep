import type { Bright } from './palette';

/** Flat shapes the art code can draw (see art/shapes.ts). */
export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'pillar' | 'chevron';

export interface Look {
  shape: Shape;
  color: Bright;
  /** Radius as a fraction of a cell (0.5 fills the cell). */
  size: number;
}

/** How an enemy moves along the path. Add a name here and a case in Enemy.update() for a new one. */
export type EnemyBehavior = 'walk' | 'dash';

export interface EnemyDef {
  /** kebab-case, unique. */
  id: string;
  name: string;
  description: string;
  behavior: EnemyBehavior;
  /** Hit points at wave 1 (waves scale it, see core/waves.ts). */
  hp: number;
  /** Cells per second. */
  speed: number;
  /** Gets faster when hit: `perHit` cells/s added per hit taken, never past `max`. */
  speedRamp?: { perHit: number; max: number };
  /** The dash cycle (Dasher): crawl for `crawlSec`, stop for `pauseSec` (its white telegraph is the first half), then surge `dashCells` cells in `dashSec`. */
  dashCycle?: { crawlSec: number; pauseSec: number; dashCells: number; dashSec: number };
  /** Gold for killing it. */
  gold: number;
  /** Lives lost when it reaches the exit. */
  livesCost: number;
  /** Wave budget points it costs (see core/waves.ts). */
  threat: number;
  /** First wave it can appear in. */
  fromWave: number;
  look: Look;
}

/** How special an augment is. Common is the numbers the augment has; Rare and Epic change them (see core/tiers.ts). */
export type Tier = 'common' | 'rare' | 'epic';

/**
 * What a tier changes about its copy of an augment. Unset fields keep the Common value.
 * The multipliers scale the FIRST form (`damageMul`, `cooldownMul` (divides the rate), `rangeMul`)
 * and replace the ADDED form's (`addedRateMul`, `addedRangeMul`); `slowPct` replaces this copy's
 * slow % in both forms, `pierce` its pierce, `splash` its added splash cells, `rootSec` its root
 * seconds and `addedRootSec` its added root seconds, and `asAdded` is the card's added line.
 */
export interface TierValues {
  damageMul?: number;
  cooldownMul?: number;
  rangeMul?: number;
  slowPct?: number;
  splash?: number;
  /** Replaces this copy's root duration in both forms, unless `addedRootSec` says otherwise (Anchor). */
  rootSec?: number;
  /** Replaces this copy's added root duration (Anchor). */
  addedRootSec?: number;
  pierce?: number;
  /** Replaces this copy's gust distance in its first form (Push). */
  push?: number;
  addedRateMul?: number;
  addedRangeMul?: number;
  asAdded: string;
  /** The card's tower line at this tier (Common: `asTower` itself). */
  asTower?: string;
}

/** One copy of an augment: which augment it is and what tier it rolled. A draft card and a hand card are copies. */
export interface AugmentCopy {
  id: string;
  tier: Tier;
}

/** How a tower attacks: set by the first augment put into it (see core/augments.ts). */
export type AttackKind =
  /** Projectiles that fly to one enemy each. */
  | 'shot'
  /** Hits every enemy in range at once. */
  | 'pulse'
  /** Support: nearby towers attack faster; the beacon never fires itself. */
  | 'rally'
  /** Marks the enemy furthest along: a marked enemy takes more damage from everything. */
  | 'mark';

/** A tower's attack when this augment is the first one in it. */
export interface FirstForm {
  kind: AttackKind;
  /** 0 for a support attack that only slows (Frost). */
  damage: number;
  /** Range in cells, from the tower's center. */
  range: number;
  /** Attacks per second. */
  rate: number;
  /** For 'shot': projectile speed in cells per second. */
  projectileSpeed?: number;
  /** For a 'shot': how many more enemies the shot strikes after the first hit (0: none). */
  pierce?: number;
  /** Hits slow enemies by `pct` (0-1) for `sec` seconds. */
  slow?: { pct: number; sec: number };
  /** Roots (fully stops) enemies for `sec` seconds (Anchor). */
  root?: { sec: number };
  /** For a 'pulse': the gust pushes everything in range this many cells back along the road (Push). */
  push?: number;
  /** For a 'mark' attack: the fraction of extra damage a marked enemy takes from everything. */
  mark?: number;
  /** For a predictive 'shot': the base lead cap, in cells ahead of the enemy (Lead). */
  lead?: number;
  /** Kills within this many cells of the tower (Chebyshev) drop +1 gold per mint copy in it (Mint). */
  goldRadius?: number;
}

/**
 * What this augment changes when added to a tower that already has one. Works on either kind of
 * attack. Multipliers multiply, everything else adds up; the strongest slow wins.
 */
export interface AddedForm {
  /** One more shot per attack (a pulse tower fires that many bolts with each pulse). */
  extraShots?: number;
  /** Hits burst, hitting every enemy within this many cells (a pulse reaches this much further). */
  splash?: number;
  /** Shot strikes this many more enemies behind the one it hit; a pulse fires that many bolts per pulse. */
  pierce?: number;
  slow?: { pct: number; sec: number };
  /** Hits root (fully stop) enemies for `sec` seconds (Anchor). */
  root?: { sec: number };
  /** Hits apply the mark: enemies hit take this fraction of extra damage from everything. */
  mark?: number;
  /** Hits push enemies back this many cells along the road (Push). */
  push?: number;
  damageMul?: number;
  rateMul?: number;
  rangeMul?: number;
  /** Joins the tower's own rally (flat, never stacks; applied by systems/RallySystem.ts). */
  rally?: { pct: number };
  /** Raises the tower's lead cap by this many cells, per copy after the first (Lead). */
  lead?: number;
  /** This tower's own kills drop this much extra gold (Mint). */
  goldPerKill?: number;
}

/**
 * An augment: towers have no types, they are what their augments make them. The first augment put
 * into a tower decides how it attacks (`first`); every one added after it changes that attack
 * (`added`), each by a set amount. The card shows both: `asTower` next to the tower glyph,
 * `asAdded` next to the plus.
 */
export interface AugmentDef {
  /** kebab-case, unique. */
  id: string;
  name: string;
  /** Both forms in one plain line, for the inventory. */
  description: string;
  /** The card's line next to the tower glyph: what it does as a tower's first augment. */
  asTower: string;
  /** The card's line next to the plus glyph: what it changes when added, with its values. */
  asAdded: string;
  /** Icon shape and color (a tower shows its first augment's color). */
  look: Look;
  first: FirstForm;
  added: AddedForm;
  /** This augment only ever appears as cards of this tier (undefined: any tier). */
  tier?: Tier;
  /** May be offered in the opening draft despite dealing no damage as a tower's first. */
  opening?: boolean;
  /** The Rare and Epic values of a copy (Common is `first`/`added` themselves; see core/tiers.ts). */
  tiers: { rare: TierValues; epic: TierValues };
}
