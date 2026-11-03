import type { Tower } from '../../entities/Tower';
import type { MakeEnemyHook } from './hook';

const MILESTONES = [10, 25, 50];

/**
 * A tower's own milestone is heard where it stands: at the same crossing the ring pops on
 * (systems/enemyHooks/killMilestone.ts) it plays one quiet two-note rise — at most one per
 * crossing, three per tower per run. The tracker lives in this closure, so it resets with
 * every new run, exactly like the ring's.
 */
export const towerMilestoneNote: MakeEnemyHook = ({ sfx }) => {
  const seen = new Map<Tower, number>(); // last checked kill count per tower
  return {
    onKill({ source }) {
      if (!source) return;
      const n = source.kills + 1; // EnemySystem counts this kill into source right after the hooks run
      const prev = seen.get(source) ?? 0;
      seen.set(source, n);
      for (const m of MILESTONES) {
        if (prev < m && m <= n) sfx?.towerMilestone();
      }
    },
  };
};
