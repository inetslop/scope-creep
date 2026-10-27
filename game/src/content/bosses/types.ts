/**
 * Boss definitions. A boss is a unique entity (not an EnemyDef, not in the
 * enemy group), driven by src/systems/BossSystem.ts. The base shape is here;
 * each boss's numbers live in its own file (frame.ts, grid.ts, palette.ts, press.ts).
 */
export interface BossDef {
  id: string;
  name: string;
  /** Behavior switch read by BossSystem and Boss.spawn. */
  behavior: 'frame' | 'grid' | 'palette' | 'press';
  hp: number;
  /** World units per second while drifting toward the player. */
  speed: number;
  /** Contact damage on the player while drifting. */
  contactDamage: number;
  /** Radius of the boss body's hit circle, world units. */
  bodyRadius: number;
  /** Size of the core at the boss's center, world units. */
  coreSize: number;
  /** Total XP dropped on death. */
  deathXp: number;
  /** Pickups the death XP is split into. */
  deathPickups: number;
  look: {
    /** Body fill color. */
    body: number;
    /** Core fill color. */
    core: number;
  };
}

/** The Frame: a giant picture frame that drifts in, charges, and scatters ink. */
export interface FrameBossDef extends BossDef {
  behavior: 'frame';
  /** Contact damage on the player while dashing. */
  dashContactDamage: number;
  /** Outer size of the frame, world units. */
  frameSize: number;
  /** Thickness of the frame's stroke, world units. */
  frameThickness: number;
  /** Dash speed, world units per second. */
  dashSpeed: number;
  /** Dash duration, seconds. */
  dashDurationSec: number;
  /** Seconds between attacks. */
  attackCycleSec: number;
  /** Telegraph window before each attack, seconds. */
  telegraphSec: number;
  /** Wedges in the ring attack. */
  ringCount: number;
  /** Radius of the ring around the boss, world units. */
  ringRadius: number;
  /** Darts in the burst attack. */
  burstCount: number;
  /** Enemy id used for the ring attack. */
  ringEnemyId: string;
}

/** The Grid: a rotating ink compass that sweeps two opposite arms. */
export interface GridBossDef extends BossDef {
  behavior: 'grid';
  /** Body rotation while drifting, radians per second. */
  spinRadPerSec: number;
  /** Length of one arm from the center, world units. */
  armLength: number;
  /** Width of an arm, world units. */
  armThickness: number;
  /** Contact damage on the player while touching an arm. */
  armDamage: number;
}

/** The Palette: a thin ink rail with five color swatches that fall one at a time. */
export interface PaletteBossDef extends BossDef {
  behavior: 'palette';
  /** HP of one falling swatch, before the respawn multiplier. */
  swatchHp: number;
  /** Width of a swatch tile, world units. */
  swatchWidth: number;
  /** Height of a swatch tile, world units. */
  swatchHeight: number;
  /** Swatch fill colors, PALETTE values, in dock order (red first, blue last). */
  swatchColors: readonly number[];
  /** Shards dropped where a swatch shatters. */
  shardCount: number;
}

/** The Press: an ink wall that advances down the page, printing rows of type blocks to shoot. */
export interface PressBossDef extends BossDef {
  behavior: 'press';
  /** Thickness of the ink band (the boss body), world units. */
  bandThickness: number;
  /** HP of one type block, flat (no respawn multiplier). */
  blockHp: number;
  /** Width of a type block, world units. */
  blockSize: number;
  /** Contact damage when the player touches a type block. */
  blockContactDamage: number;
}
