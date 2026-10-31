import type { MakeHudPart } from '../../engine/api.ts';
import './connection.css';

/** Top left: online or offline (a match in this tab), how many players, and what the connection is doing. */
export const connection: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-connection';
  root.append(el);
  // Undefined until the first update, so the first one always applies.
  let shown: string | undefined;
  return {
    update(view) {
      const where = view.mode === 'online' ? 'Online' : 'Offline';
      const text = view.status || `${where} · ${view.playerCount} players`;
      if (text === shown) return;
      shown = text;
      el.textContent = text;
    },
  };
};
