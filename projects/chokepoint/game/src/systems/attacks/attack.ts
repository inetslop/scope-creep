import type { Sfx } from '../../audio/Sfx';
import type { Enemy } from '../../entities/Enemy';
import type { Tower } from '../../entities/Tower';
import type { HitPayload } from '../EnemySystem';
import type { FxSystem } from '../FxSystem';

/** What an attack can use: the enemies, and the ways to hit them. Distances in board units. */
export interface AttackContext {
  tower: Tower;
  enemies: readonly Enemy[];
  /** The tower's range in board units. */
  range: number;
  /** Damage, splash, slow and color of one hit, from the tower's spec. */
  payload: HitPayload;
  /** Fires a bolt from shot `n`'s barrel tip at `target`. */
  fireBolt(n: number, target: Enemy, payload: HitPayload): void;
  /** Blasts `count` pellets from the muzzle in a cone at `target`, flying straight until `maxDist` board units out. */
  firePellets(target: Enemy, count: number, payload: HitPayload, maxDist: number): void;
  /** Hits one enemy right away (damage and slow, handling the kill). */
  strike(target: Enemy, payload: HitPayload): void;
  fx: FxSystem;
  sfx: Sfx | undefined;
}

/**
 * One kind of tower attack (TowerSpec.kind). Returns false when there was nothing to attack, so
 * the tower stays ready. One file per kind in this folder, registered in ./index.ts.
 */
export type Attack = (ctx: AttackContext) => boolean;
