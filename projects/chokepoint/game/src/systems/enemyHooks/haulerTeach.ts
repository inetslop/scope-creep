import { START } from '../../config';
import { haulerTold } from '../fx/haulerTold';
import type { MakeEnemyHook } from './hook';

/** The first-leak chip's life (fx/leakCost.ts): 200 ms in, 1 s hold, 300 ms out. */
const FIRST_LEAK_CHIP_MS = 1500;
/** The teach waits this long after that chip is gone, so the lines read one after the other. */
const AFTER_FIRST_MS = 1200;

export const haulerTeach: MakeEnemyHook = ({ run, fx, board }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler' || run.haulerTold) return;
    run.haulerTold = true; // set before any chip: the leak paid, a resumed run never re-teaches
    const pts = board.path.points; // same exit anchor as LeakCost and ExitWarning
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    // onLeak runs before run.leak(): at or above the start, no leak has happened yet, so the
    // first-leak chip (systems/LeakCost) fires on this same leak. `>=`: a clean streak pays +1.
    const delay = run.lives >= START.lives ? FIRST_LEAK_CHIP_MS + AFTER_FIRST_MS : 0;
    if (delay > 0) fx.scene.time.delayedCall(delay, () => haulerTold(fx, x, y));
    else haulerTold(fx, x, y);
  },
});
