import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The sky's quiet note: while at least one regular Flyer is in the air, one soft held 660 Hz tone
 * (Sfx's skyNoteStart/skyNoteStop, 0.03 pre-master, the beam hum's quiet class) — it fades in over
 * 200 ms when the first regular Flyer spawns and out when the last one dies or leaks. One shared
 * tone for every Flyer at once: it refcounts to "at least one", it never stacks. The boss Flyer
 * (T0317) is excluded: it keeps its own arrival horn and death notes. Reconciled every frame like
 * the beam hum: start and stop are idempotent, so the hook keeps no state.
 */
export const skyNote: MakeEnemyHook = ({ run, enemies, sfx }) => ({
  update() {
    const bossFlyer = bossId(run.wave) === 'flyer';
    let any = false;
    for (const e of enemies.all) {
      if (!bossFlyer && e.active && e.def.id === 'flyer') { any = true; break; }
    }
    if (any) sfx?.skyNoteStart();
    else sfx?.skyNoteStop();
  },
});
