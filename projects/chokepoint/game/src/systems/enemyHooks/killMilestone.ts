import type { Tower } from '../../entities/Tower';
import { PALETTE } from '../../content/palette';
import { towerColor } from '../../core/augments';
import { milestoneRing } from '../fx/milestoneRing';
import type { MakeEnemyHook } from './hook';

const MILESTONES = [10, 25, 50];

/**
 * A tower's own milestone: when its session kill count first crosses 10, 25 or 50 (the number the
 * panel's "kills N" line reads) it blooms one small ring in its own color at its base
 * (systems/fx/milestoneRing.ts). The tracker lives in this closure, so it resets with every new
 * run, exactly like the kills line. A tower with no kills never gets here, so pure supports bloom nothing.
 */
export const killMilestone: MakeEnemyHook = ({ fx }) => {
  const seen = new Map<Tower, number>(); // last checked kill count per tower
  return {
    onKill({ source }) {
      if (!source) return;
      const n = source.kills + 1; // EnemySystem counts this kill into source right after the hooks run
      const prev = seen.get(source) ?? 0;
      seen.set(source, n);
      for (const m of MILESTONES) {
        if (prev < m && m <= n) {
          const color = towerColor(source.augments);
          milestoneRing(fx, source.x, source.y, color ? PALETTE[color] : PALETTE.faint);
        }
      }
    },
  };
};
