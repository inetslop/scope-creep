import type { Bright } from './palette';

/** Flat shapes the art code can draw (see art/shapes.ts). */
export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon' | 'pillar' | 'chevron' | 'ring' | 'wings' | 'maw' | 'almond' | 'spiral';

export interface Look {
  shape: Shape;
  color: Bright;
  /** Radius as a fraction of a cell (0.5 fills the cell). */
  size: number;
}

/** How an enemy moves along the path. Add a name here and a case in Enemy.advance() for a new one. */
export type EnemyBehavior = 'walk' | 'dash' | 'fly' | 'blink';

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
  /** The blink cycle (the Blinker): walk plainly for `walkSec`, stop for `teleSec` (its telegraph: the eye slides forward and one ring blooms at the destination), then reposition `cells` forward in one step — committed: a root, a slow, a gust or a silence during the telegraph does not cancel it, and the road between the jump is never walked (entities/Enemy.ts). */
  blinkCycle?: { walkSec: number; teleSec: number; cells: number };
  /** Ignores all control: Frost slow, Anchor root, Push gusts and pushes, both forms. */
  ignoresControl?: boolean;
  /** It flies: its whole path is one straight line from the island's edge (the seed picks the point) to the exit (core/flyRoute.ts), never the road. A Push gust and an Anchor root do not reach it; a Frost slow and the Haste aura do. */
  flies?: boolean;
  /** When it dies, it splits into two of this enemy: one 0.25 cells ahead of the kill, one behind (core/split.ts). */
  splitsInto?: string;
  /** The mid-life split (the Orb): when its hp first drops to `hpFrac` of its max after a hit and it survives, it vanishes with no kill and leaves two of `into` at its road spot, 0.25 cells either side (core/split.ts), each with half its hp after the triggering hit (core/midSplit.ts). */
  splitsAt?: { hpFrac: number; into: string };
  /** The periodic pop (the Hive): every `everySec` after its own spawn it pops one `into` at its spot, up to `max`, each telegraphed `telegraphSec` early; the popping stops the moment it dies (core/hivePops.ts, systems/enemyHooks/hivePops.ts). */
  pops?: { everySec: number; max: number; telegraphSec: number; into: string };
  /** The mend clock (the Mender): every `everySec` after its own spawn, up to `count`, it and each living escort of `escortId` within `radius` cells restore `frac` of their own max hp, telegraphed `telegraphSec` early by one thin ring closing in; never a revive, an escort past the radius missed (core/mendClock.ts, systems/enemyHooks/mendPack.ts). */
  mends?: { everySec: number; count: number; radius: number; frac: number; telegraphSec: number; escortId: string };
  /** Multiplies damage from a directed shot that strikes its front (flying against its travel); the rear and flightless hits go whole (core/plate.ts). */
  plate?: number;
  /** Its shield is carried by enemies of this id: until one is killed, every damage it takes lands at half, after every other modifier (core/shield.ts). */
  shieldCarrier?: string;
  /**
   * The timed out-of-reach beat (the Colossus): when its hp first drops to `hpFrac` of its max,
   * a white flash of `telegraphSec` and then it is untargetable for `phaseSec`, repeating every
   * `periodSec` (core/outOfReach.ts). Untargetable, not immune: the aim picks skip it; area, line
   * and held damage and all control still reach it.
   */
  outOfReach?: { hpFrac: number; telegraphSec: number; phaseSec: number; periodSec: number };
  /**
   * The drink (the Leech): every `everySec` after its own spawn, up to `maxDrinks`, it flashes
   * white for `telegraphSec` and then drinks `drinkPct` of its own max hp from the nearest living
   * escort of `escort` over `drinkSec` — a drink is damage, and one that kills its target is a
   * normal death; when the drinks are done, or the last escort is gone, its maw closes for good
   * (core/drink.ts, systems/enemyHooks/leechDrink.ts).
   */
  drinks?: { everySec: number; telegraphSec: number; drinkSec: number; maxDrinks: number; drinkPct: number; escort: string };
  /**
   * The feed (the Gorge): while it lives, every leak of any other enemy flashes it white and
   * restores `frac` of its own max hp (a heal, never a revive), up to `max` times, with a thin
   * ring in its own color contracting from `ringCells` cells; a one-time teach on the first feed
   * (systems/enemyHooks/gorgeFeeds.ts, systems/fx/gorgeTell.ts). Event-driven: nothing happens
   * unless a leak happens.
   */
  feeds?: { max: number; frac: number; ringCells: number };
  /**
   * The bank (the boss Flyer): when its hp first drops to `hpFrac` of its max, its remaining route
   * becomes two straight segments — from its position to the edge bank point the board read at that
   * moment (the candidate its standing towers cover least, the seeded point as fallback and
   * tie-break, core/bankChoice.ts), then to the exit — previewed as its flight line for `previewSec`
   * (core/flyRoute.ts, systems/enemyHooks/flyLine.ts). It banks on its hp clock even while rooted.
   */
  bank?: { hpFrac: number; previewSec: number };
  /** Gold for killing it. */
  gold: number;
  /** Lives lost when it reaches the exit. */
  livesCost: number;
  /** Wave budget points it costs (see core/waves.ts). */
  threat: number;
  /** First wave it can appear in. */
  fromWave: number;
  /** Never in a wave's normal mix: it exists only where a plan reserves it — the Colossus as the boss wave's shape, the Splinter as a Splitter's split (core/waves.ts skips it). */
  spawnOnly?: boolean;
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
  /** Replaces this copy's burn rate in both forms (Ember). */
  burnDps?: number;
  /** Replaces this copy's beam rate in its first form (Beam). */
  beamDps?: number;
  /** Replaces this copy's added damage boost, as a fraction (Beam). */
  addedDamagePct?: number;
  addedRateMul?: number;
  addedRangeMul?: number;
  /** Replaces this copy's added extra shots per attack (Bolt). */
  addedShots?: number;
  /** Replaces this copy's added crit chance, as a fraction 0-1 (Spray). */
  addedCrit?: number;
  /** Replaces this copy's added per-hit push-back cells (Push). */
  addedPush?: number;
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
  /** A close-range blast of straight pellets in a cone centred on the aim line (Spray). */
  | 'spray'
  /** Hits every enemy in range at once. */
  | 'pulse'
  /** Support: nearby towers attack faster; the beacon never fires itself. */
  | 'rally'
  /** Marks the enemy furthest along: a marked enemy takes more damage from everything. */
  | 'mark'
  /** Sets ablaze the enemy furthest along: the burn keeps dealing its rate after the shot (Ember). */
  | 'burn'
  /** A continuous line of damage on the enemy furthest along: never fires a shot (Beam). */
  | 'beam';

/** Damage over time: `dps` damage per second for `sec` seconds (Ember). */
export interface Burn {
  dps: number;
  sec: number;
}

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
  /** For a 'spray': how many pellets its blast fires in a cone (0: none). */
  spray?: number;
  /** Hits slow enemies by `pct` (0-1) for `sec` seconds. */
  slow?: { pct: number; sec: number };
  /** Roots (fully stops) enemies for `sec` seconds (Anchor). */
  root?: { sec: number };
  /** For a 'pulse': the gust pushes everything in range this many cells back along the road (Push). */
  push?: number;
  /** For a 'mark' attack: the fraction of extra damage a marked enemy takes from everything. */
  mark?: number;
  /** For a 'burn' attack: the burn it sets ablaze, `dps` per second for `sec` seconds (Ember). */
  burn?: Burn;
  /** For a 'beam' attack: the continuous line's damage per second (Beam). */
  beam?: { dps: number };
  /** Kills within this many cells of the tower (its range ring) drop +1 gold per mint copy in it (Mint). */
  goldRadius?: number;
  /** The tower's power comes from the run's state, not from striking enemies: it deals nothing itself (Feast). */
  runPower?: boolean;
  /** Every leak pays this much gold while the tower stands (Toll). */
  goldPerLeak?: number;
  /** The haste aura's percent on the enemy side while inside (Haste first). */
  haste?: { pct: number };
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
  /** The crit chance the tower's damage gains, as a fraction 0-1: a rolled hit deals double (Spray). */
  crit?: number;
  slow?: { pct: number; sec: number };
  /** Hits root (fully stop) enemies for `sec` seconds (Anchor). */
  root?: { sec: number };
  /** Hits apply the mark: enemies hit take this fraction of extra damage from everything. */
  mark?: number;
  /** Hits set ablaze: the burn they apply, `dps` per second for `sec` seconds (Ember). */
  burn?: Burn;
  /** Hits push enemies back this many cells along the road (Push). */
  push?: number;
  damageMul?: number;
  /** Adds a flat damage boost to the tower's own beam: damage dealt per second grows by this fraction (Beam). */
  damagePct?: number;
  rateMul?: number;
  rangeMul?: number;
  /** Joins the tower's own rally (flat, never stacks; applied by systems/RallySystem.ts). */
  rally?: { pct: number };
  /** This tower's own kills drop this much extra gold (Mint). */
  goldPerKill?: number;
  /** Each copy beyond the first lengthens the kill chain's window by this many seconds (Feast). */
  chainWindowSec?: number;
  /** Every leak pays this much more gold while the tower stands (Toll). */
  goldPerLeak?: number;
  /** Added to the haste aura's percent per extra Haste copy, both sides (Haste). */
  haste?: { pct: number };
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
  /** This augment never appears as cards of a tier below this one (undefined: any tier). */
  minTier?: Tier;
  /** The tech node id that must be in the profile's purchased list before it rolls (core/augments.ts). */
  tech?: string;
  /** May be offered in the opening draft despite dealing no damage as a tower's first. */
  opening?: boolean;
  /** The Rare and Epic values of a copy (Common is `first`/`added` themselves; see core/tiers.ts). */
  tiers: { rare: TierValues; epic: TierValues };
}

/**
 * A level augment: a pre-run switch that makes future runs harder (content/levels/). It is never
 * in the draft, hand, a tower or the codex, and never in the 16-augment pool: the player chooses
 * which ones are on on the menu, before the run, out of as many as they have earned level slots.
 */
export interface LevelAugmentDef {
  id: string;
  name: string;
  /** The card's plain line, e.g. 'enemies +25% health'. */
  line: string;
  /** Added to the run multiplier; for Tough also the enemy-health factor over the wave's own growth. */
  bonus: number;
  /** The spawn-speed factor while it is on (Swift: 1.15); absent when it doesn't touch speed. */
  speedMul?: number;
  /** The wave's enemy-count factor while it is on (Crowded: 1.2); absent when it doesn't touch counts. */
  countMul?: number;
}
