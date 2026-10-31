import type { MakeHudPart } from '../../engine/api.ts';
import './prestige.css';

const PAY = 25; // same as the prestige-coins director
const SHOW = 2000; // ms

/** Top centre under the xp bar: the coins your last prestige paid, and the point it banked. Shows for 2 s, then hides. */
export const prestige: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-prestige';
  el.hidden = true;
  root.append(el);
  const coins = document.createElement('div'); // line 1: what the last prestige paid
  const points = document.createElement('div'); // line 2, always there: the banked point
  points.textContent = '+1 talent point';
  el.append(coins, points);
  let last: number | undefined; // your prestiges this life, as last seen
  let anim: Animation | null = null;
  return {
    update(view) {
      const me = view.me;
      if (!me) {
        if (last !== undefined) {
          last = undefined;
          anim?.cancel();
          anim = null;
          el.hidden = true;
        }
        return;
      }
      if (last !== undefined && me.prestige > last) { // a knockout drops it to 0: not a show
        const n = me.prestige;
        coins.textContent = n === 1 ? `Prestige! +${PAY} coins` : `Prestige ${n}! +${PAY * n} coins`;
        el.hidden = false;
        anim?.cancel(); // a prestige within 2 s restarts the timer
        anim = el.animate(
          [
            { opacity: 1, visibility: 'visible' },
            { opacity: 1, visibility: 'visible', offset: 0.75 },
            { opacity: 0, visibility: 'hidden' },
          ],
          { duration: SHOW, fill: 'forwards' },
        );
        anim.onfinish = () => {
          el.hidden = true;
          anim = null;
        };
      }
      last = me.prestige;
    },
  };
};
