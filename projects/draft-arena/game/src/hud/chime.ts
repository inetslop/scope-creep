import type { MakeHudPart } from '../../engine/api.ts';
import './chime.css';
import { playChime } from '../audio/sfx.ts';

/** Your level-up: a short bright chime, at the moment the yellow ring spreads. */
export const chime: MakeHudPart = () => {
  let last: number | undefined;
  return {
    update(view) {
      const me = view.me;
      if (!me) { last = undefined; return; }
      if (last === undefined) { last = me.level; return; }
      if (me.level > last) { last = me.level; playChime(); }
      else if (me.level < last) last = me.level; // prestige or fresh respawn: no chime
    },
  };
};
