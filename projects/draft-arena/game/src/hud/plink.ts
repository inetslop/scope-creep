import type { MakeHudPart } from '../../engine/api.ts';
import './plink.css';
import { plink as plinkSound } from '../audio/sfx.ts';

/**
 * The gem plink: a short high blip and a little green star the moment you collect a gem —
 * a monster gem, an event gem or the jackpot (an octave down, twice as long). Yours only:
 * you never hear or see another player's. The coin clink stays the coin part's; the star
 * pops on you, where the gem lands.
 */
export const plink: MakeHudPart = (root) => {
  const makeStar = (): void => {
    const s = document.createElement('div');
    s.className = 'plink-star';
    s.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 L61.2 34.6 L92.8 36.1 L68.1 55.9 L76.5 86.4 L50 69 L23.6 86.4 L31.9 55.9 L7.2 36.1 L38.8 34.6 Z" fill="#51cf66" stroke="#3b3355" stroke-width="8" stroke-linejoin="round"/></svg>';
    s.addEventListener('animationend', () => s.remove());
    root.append(s);
  };
  let lastXp: number | undefined;
  let lastLevel: number | undefined;
  return {
    update(view) {
      const me = view.me;
      if (!me) { lastXp = lastLevel = undefined; return; } // menu/connecting: forget
      if (lastXp === undefined) { lastXp = me.xp; lastLevel = me.level; return; } // first frame: no tick
      const d = me.xp - lastXp;
      const levelChanged = me.level !== lastLevel;
      lastXp = me.xp;
      lastLevel = me.level;
      if (levelChanged) return; // level up or a prestige: the chime has the tick
      if (d > 0) {
        plinkSound(d === 25); // the jackpot's xp is 25: an octave down, twice as long
        makeStar();
      }
    },
  };
};
