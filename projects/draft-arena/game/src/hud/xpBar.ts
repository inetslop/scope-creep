import type { MakeHudPart } from '../../engine/api.ts';
import './xpBar.css';

/** Top centre: your level and how far it is to the next. */
export const xpBar: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-xp';
  el.innerHTML = '<span class="hud-xp-level"></span><div class="hud-xp-track"><div class="hud-xp-fill"></div></div>';
  root.append(el);
  const level = el.querySelector<HTMLElement>('.hud-xp-level')!;
  const fill = el.querySelector<HTMLElement>('.hud-xp-fill')!;
  // Undefined until the first update, so the first one always applies.
  let shown: string | undefined;
  return {
    update(view) {
      const me = view.me;
      const key = me ? `${me.level}:${me.xp}:${me.xpNext}` : '';
      if (key === shown) return;
      shown = key;
      el.hidden = !me;
      if (!me) return;
      level.textContent = `Level ${me.level}`;
      fill.style.width = `${Math.min(100, (me.xp / Math.max(1, me.xpNext)) * 100)}%`;
    },
  };
};
