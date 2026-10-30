import { CELL } from '../../config';
import { PALETTE, lightOf } from '../../content/palette';
import { towerColor } from '../../core/augments';
import { NEEDLE_DAMAGE, needleCount, needleTargets } from '../../core/sprayNeedles';
import type { HitPayload } from '../EnemySystem';
import type { MakeEnemyHook } from './hook';

/**
 * A beam's kill splits into Spray needles (T0242): one homing needle per Spray in the tower,
 * out of the corpse at the nearest other enemy within two cells (core/sprayNeedles.ts). The
 * needle flies like a Bolt at the Spray pellet's speed and pays the killing beam tower; nothing
 * fires at nothing. Its own kills split on again, until the board runs out of enemies nearby.
 */
export const sprayNeedles: MakeEnemyHook = ({ enemies, projectiles }) => ({
  onKill({ enemy, source }) {
    if (!source) return;
    const count = needleCount(source.spec);
    if (count <= 0) return;
    const targets = needleTargets(enemy, count, enemies.all);
    if (targets.length === 0) return; // nothing ever fires at nothing
    const pool = projectiles();
    if (!pool) return;
    const payload: HitPayload = { damage: NEEDLE_DAMAGE, splash: 0, splashCap: 0, slow: undefined, root: undefined, pierce: 0, push: 0, mark: undefined, burn: undefined, color: lightOf(PALETTE[towerColor(source.augments) ?? 'faint']), source };
    for (const i of targets) pool.fireNeedle(enemy.x, enemy.y, enemies.all[i]!, payload, source.spec.projectileSpeed * CELL);
  },
});
