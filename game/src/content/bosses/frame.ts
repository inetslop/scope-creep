import { PALETTE } from '../palette';

/**
 * Boss definitions. A boss is a unique entity (not an EnemyDef, not in the
 * enemy group), driven by src/systems/BossSystem.ts. Every boss number lives
 * in its data file here.
 */
export interface BossDef {
  id: string;
  name: string;
  hp: number;
  /** World units per second while drifting toward the player. */
  speed: number;
  /** Contact damage on the player while drifting. */
  contactDamage: number;
  /** Contact damage on the player while dashing. */
  dashContactDamage: number;
  /** Outer size of the frame, world units. */
  frameSize: number;
  /** Thickness of the frame's stroke, world units. */
  frameThickness: number;
  /** Size of the red core square, world units. */
  coreSize: number;
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
  /** Total XP dropped on death. */
  deathXp: number;
  /** Pickups the death XP is split into. */
  deathPickups: number;
  /** Enemy id used for the ring attack. */
  ringEnemyId: string;
  look: {
    /** Frame stroke color. */
    frame: number;
    /** Core fill color. */
    core: number;
  };
}

/** The first boss: a giant picture frame that drifts in, charges, and scatters ink. */
export const FRAME: BossDef = {
  id: 'frame',
  name: 'THE FRAME',
  hp: 1200,
  speed: 40,
  contactDamage: 20,
  dashContactDamage: 25,
  frameSize: 160,
  frameThickness: 10,
  coreSize: 40,
  dashSpeed: 400,
  dashDurationSec: 0.8,
  attackCycleSec: 4,
  telegraphSec: 0.6,
  ringCount: 10,
  ringRadius: 120,
  burstCount: 12,
  deathXp: 30,
  deathPickups: 10,
  ringEnemyId: 'frame-wedge',
  look: { frame: PALETTE.ink, core: PALETTE.red },
};
