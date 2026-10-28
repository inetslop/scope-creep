import type { Bright } from './palette';

/** Flat shapes the art code can draw (see art/shapes.ts). */
export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'hexagon';

export interface Look {
  shape: Shape;
  color: Bright;
  /** Radius as a fraction of a cell (0.5 fills the cell). */
  size: number;
}

/** How an enemy moves along the path. Add a name here and a case in Enemy.update() for a new one. */
export type EnemyBehavior = 'walk';

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

/** How a tower attacks: set by the first augment put into it (see core/augments.ts). */
export type AttackKind =
  /** Projectiles that fly to one enemy each. */
  | 'shot'
  /** Hits every enemy in range at once. */
  | 'pulse';

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
  /** Hits slow enemies by `pct` (0-1) for `sec` seconds. */
  slow?: { pct: number; sec: number };
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
  slow?: { pct: number; sec: number };
  damageMul?: number;
  rateMul?: number;
  rangeMul?: number;
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
}
