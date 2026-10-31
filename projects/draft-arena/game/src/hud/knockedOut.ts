import type { MakeHudPart } from '../../engine/api.ts';
import './knockedOut.css';

/** Centre, while you are down: when you come back. */
export const knockedOut: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-down';
  el.innerHTML = '<b>Knocked out</b><span class="hud-muted"></span>';
  root.append(el);
  const when = el.querySelector<HTMLElement>('span')!;
  // Undefined until the first update, so the first one always applies.
  let shown: string | undefined;
  return {
    update(view) {
      const down = view.me && !view.me.alive;
      const text = down ? `Back in ${view.me!.respawnIn.toFixed(1)} s, from level 1` : '';
      if (text === shown) return;
      shown = text;
      el.hidden = !down;
      when.textContent = text;
    },
  };
};
