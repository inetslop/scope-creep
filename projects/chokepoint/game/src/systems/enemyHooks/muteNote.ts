import { CELL } from '../../config';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach its ring shows (muteJam.ts). */
const MUTE_REACH = 2;

/**
 * The Mute's held note: while any live Mute holds a tower still within its two-cell circle, one soft
 * held C3 tone (Sfx's muteNoteStart/muteNoteStop, 0.05 pre-master, the beam hum's quiet class) — one
 * shared tone for every Mute at once: it refcounts to "at least one", it never stacks. Reconciled
 * every frame like the sky note: start and stop are idempotent, so the hook keeps no state.
 */
export const muteNote: MakeEnemyHook = ({ enemies, towers, sfx }) => ({
  update() {
    const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
    let holding = false;
    for (const e of enemies.all) {
      if (!e.active || e.def.id !== 'mute') continue;
      if (towers().some((t) => (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= r2)) { holding = true; break; }
    }
    if (holding) sfx?.muteNoteStart();
    else sfx?.muteNoteStop();
  },
});
