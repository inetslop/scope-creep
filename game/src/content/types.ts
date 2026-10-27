/**
 * Data definitions for everything the game spawns or offers. Content files are
 * plain data: adding an enemy, weapon or upgrade should normally mean adding one
 * file and registering it in the folder's index.ts. tests/content.test.ts checks
 * every definition, so run `npm run test` after editing content.
 */
import type { StatMod } from '../core/stats';

/** Hex color as a number, e.g. 0xc9a227. Use colors from src/art/palette.ts where possible. */
export type Color = number;

/** How an enemy moves. Implemented in src/entities/Enemy.ts (steer()). */
export type EnemyBehavior =
  /** Walks straight at the player. */
  | 'chase'
  /** Chases, then periodically stops, winds up and dashes at the player. */
  | 'charger'
  /** Chases while weaving side to side. */
  | 'weaver'
  /** Holds 240-300 units from the player, strafes, fires ink points (speed 0 = holds its ground). */
  | 'shoot'
  /** Crawls at the player, then flattens and slams: a radial knockback wave that shoves everything nearby, dealing no damage. */
  | 'slam'
  /** Chases the player, but quickens as it weakens: speed steps up when HP crosses ≤75% / ≤50% / ≤25% of max (the Hare). Speed from core/hareSpeed.ts. */
  | 'quicken';

/** Flat geometric shapes, drawn by src/art/shapes.ts. Pointed shapes point to the right (angle 0). */
export type ShapeKind = 'circle' | 'triangle' | 'square' | 'rect' | 'diamond' | 'pentagon' | 'hexagon' | 'star';

/** Procedural look, drawn once into a texture by src/art/textures.ts (ink outline + paper-cut shadow added automatically). */
export interface EnemyLook {
  shape: ShapeKind;
  /** Body radius in world units (also the hitbox radius). */
  radius: number;
  /** Fill color of the shape. */
  body: Color;
  /** Color of the small dot in the middle (the "eye"). */
  accent: Color;
  /** Number of points for 'star' (default 5). */
  points?: number;
  /** Outline width in pixels; default scales with size. */
  outlineWidth?: number;
  /** Radians per second the sprite spins. If omitted, the enemy turns to face where it is moving. */
  spin?: number;
  /** Long bar, e.g. 120x16 or 160x12. Drawn as a sharp-cornered rectangle; hit-tested as a capsule along the long axis.
   *  When set: shape must be 'rect', radius must be length/2 + thickness/2, and length / thickness >= 3. */
  bar?: { length: number; thickness: number };
}

/** Tuning for a puddle-dropping enemy (the Wash): flat decals that wet the paper and slow the player. */
export interface PuddleDef {
  /** Seconds between puddles (2.0). */
  periodSec: number;
  /** World units (60 = 120 across). */
  radius: number;
  /** 2.0. */
  lifeSec: number;
  /** 0.5 fade at the end. */
  fadeSec: number;
  /** Max per single spawn (3); a new one removes the owner's oldest. */
  maxAlive: number;
  /** Player move-speed multiplier while its center is inside (0.8). */
  slowMul: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  /** First-encounter annotation (all caps); omit for the "IT'S NEW." fallback. */
  note?: string;
  hp: number;
  /** World units per second. */
  speed: number;
  /** Damage per contact hit on the player. */
  contactDamage: number;
  /** XP value of the shard it drops. */
  xp: number;
  /** Spawn cost for the director. Stronger enemies cost more. */
  threat: number;
  /** Relative spawn chance among unlocked enemies. 0 = never spawned by the director. */
  spawnWeight: number;
  /** Seconds into the run before the director can spawn it. */
  unlockAtSec: number;
  behavior: EnemyBehavior;
  /** 0 = full knockback, 1 = immovable. */
  knockbackResist: number;
  /** If set, dying also spawns this many enemies of this id at the death spot. They burst outward first. */
  splitsInto?: { id: string; count: number };
  /** Tuning for behavior 'shoot'; omit for the defaults (2.4 s period, speed 150, damage 8, 240–300 band). */
  shoot?: {
    /** Seconds between shots. */
    periodSec: number;
    /** Projectile speed, world units per second. */
    speed: number;
    /** Projectile damage. */
    damage: number;
    /** Near end of the hold band; the enemy backs off inside it. Default 240. */
    bandNear?: number;
    /** Far end of the hold band; the enemy approaches outside it. Default 300. */
    bandFar?: number;
  };
  /** If set, the enemy drops puddles that slow the player (the Wash). */
  puddle?: PuddleDef;
  look: EnemyLook;
}

export interface ProjectileLook {
  /** Length and thickness in world units. Equal values make a round point. */
  length: number;
  width: number;
  color: Color;
}

/** Tuning for an orbit weapon: circles that revolve around the player and hit what they touch. */
export interface OrbitSpec {
  /** Circles, evenly spaced (120° apart for 3). */
  count: number;
  /** Orbit radius, world units. */
  radius: number;
  /** Radians per second. */
  speed: number;
  /** Each circle's radius, world units. */
  circleRadius: number;
  /** Per-enemy immunity after an orbit hit. */
  hitCooldownSec: number;
}

/** Tuning for an arc weapon: a jagged bolt that snaps toward the aim and chains between nearby enemies. */
export interface ArcSpec {
  /** First-hit search distance from the muzzle, world units. */
  range: number;
  /** FULL cone angle around the aim for the first hit. */
  coneDeg: number;
  /** Chained jumps after the first hit (hits = maxJumps + 1). */
  maxJumps: number;
  /** Search radius around the enemy just hit, world units. */
  chainRadius: number;
  /** Ink line visible duration. */
  fadeMs: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  /** Volleys per second before player modifiers. */
  fireRate: number;
  /** Projectiles per volley before player modifiers. */
  count: number;
  /** Total spread angle of a volley in degrees. */
  spreadDeg: number;
  /** Random inaccuracy per projectile in degrees. */
  jitterDeg: number;
  damage: number;
  speed: number;
  /** Seconds before the projectile disappears. */
  lifetimeSec: number;
  /** Enemies a projectile passes through before disappearing. */
  pierce: number;
  knockback: number;
  look: ProjectileLook;
  /** Orbit weapon (handled by src/systems/OrbitSystem); projectile fields unused. */
  orbit?: OrbitSpec;
  /** Arc weapon (handled by src/systems/ArcSystem); projectile fields unused. */
  arc?: ArcSpec;
  /** Bounce weapon (handled by src/systems/WeaponSystem): mirrors off the arena walls, losing damage per bounce. */
  bounce?: {
    /** Bounces before the next wall contact destroys the projectile. */
    maxBounces: number;
    /** Multiplied into the damage on each bounce. */
    damageMul: number;
  };
}

export interface UpgradeDef {
  id: string;
  name: string;
  /** One short line shown on the level-up card. */
  description: string;
  /** Times it can be taken per run. */
  maxLevel: number;
  /** Relative chance to be offered. */
  weight: number;
  mods: StatMod[];
  /** Upgrade ids that must have been taken at least once first. */
  requires?: string[];
  /** Only offered if the player owns this weapon. */
  requiresWeapon?: string;
  /** Adds this weapon id to the player's loadout. */
  grantsWeapon?: string;
  /** Card accent color. */
  color: Color;
}
