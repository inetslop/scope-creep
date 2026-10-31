import type { MakeHudPart } from '../../engine/api.ts';
import './coinChip.css';

/** Top left, under the connection card: the coin balance, live while it ticks in. */
export const coinChip: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-coin-chip';
  el.hidden = true;
  const dot = document.createElement('span');
  dot.className = 'hud-coin-dot';
  const num = document.createElement('span');
  el.append(dot, num);
  root.append(el);
  let shown: number | undefined;
  return {
    update(view) {
      const c = view.me?.coins;
      if (c === undefined) { el.hidden = true; shown = undefined; return; }
      el.hidden = false;
      if (c === shown) return;
      shown = c;
      num.textContent = String(c);
    },
  };
};
