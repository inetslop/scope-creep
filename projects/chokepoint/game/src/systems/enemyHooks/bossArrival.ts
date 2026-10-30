import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';
import { gatePulse } from '../fx/gatePulse';

/**
 * The boss's arrival: the moment the boss's token first appears on the board, one deep horn rises
 * and a wide ring of muted ink blooms from the entrance gate. Once per boss wave; a non-boss wave
 * is byte-identical (no horn, no ring). The name tag says *what* and the boss card says *how
 * much*; this says the peak is beginning.
 */
export const bossArrival: MakeEnemyHook = ({ scene, board, run, fx, sfx, enemies }) => {
  let announcedWave = -1;
  return {
    update() {
      const waves = scene.registry.get('waves') as WaveSystem | undefined;
      const plan = waves?.currentPlan;
      if (!plan || !plan.tags.includes('boss')) return;       // never on a non-boss wave
      if (announcedWave === run.wave) return;                // already sounded this wave
      const bossId = plan.spawns[0]?.enemy;                  // the boss wave's single spawn
      if (!bossId) return;
      if (!enemies.all.some((e) => e.active && e.def.id === bossId)) return; // the boss's first frame on the board
      announcedWave = run.wave;
      // The entrance gate: the midpoint of the two path points around the road's start (art/board.ts).
      const pts = board.path.points;
      sfx?.bossHorn();
      gatePulse(fx, (pts[0]!.x + pts[1]!.x) / 2, (pts[0]!.y + pts[1]!.y) / 2);
    },
  };
};
