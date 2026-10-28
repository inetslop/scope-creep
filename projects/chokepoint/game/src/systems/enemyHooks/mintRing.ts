import { PALETTE } from '../../content/palette';
import { towerColor } from '../../core/augments';
import { inMintReach } from '../../core/mint';
import { auraRing } from '../fx/auraRing';
import type { MakeEnemyHook } from './hook';

/**
 * The quiet ring at a Mint tower's base, at the same beat as the +1 gold's pop: one ring each
 * time its aura pays a kill (core/mint.ts), even when the tower pays several +1 at once (T0055).
 */
export const mintRing: MakeEnemyHook = ({ fx, towers }) => ({
  onKill({ enemy, source }) {
    const at = { x: enemy.x, y: enemy.y };
    for (const t of towers()) {
      if (t.spec.firstId !== 'mint' || t.spec.goldPerKill <= 0) continue;
      if (!(t === source || inMintReach(t.cell, at, t.spec.goldRadius))) continue;
      const color = towerColor(t.augments);
      auraRing(fx, t.x, t.y, color ? PALETTE[color] : PALETTE.faint);
    }
  },
});
