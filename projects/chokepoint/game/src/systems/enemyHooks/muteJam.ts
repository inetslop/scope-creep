import { CELL } from '../../config';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach Rally's range ring shows. */
const MUTE_REACH = 2;

/**
 * The Mute's silence: while a Mute is alive, every tower whose center is inside its two-cell
 * circle holds still. Sets `jammed` on each tower (entities/Tower.ts); TowerSystem skips jammed
 * towers, so no shot, gust, root, burn or tick leaves them, and the Push windup (its ring reads
 * the tower's own cooldown) freezes and resumes with it.
 */
export const muteJam: MakeEnemyHook = ({ enemies, towers }) => ({
  update() {
    const mutes = enemies.all.filter((e) => e.active && e.def.id === 'mute');
    const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
    for (const t of towers()) t.setJammed(mutes.some((m) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2));
  },
});
