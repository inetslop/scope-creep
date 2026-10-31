import type { MakeHudPart } from '../../engine/api.ts';
import './scoreboard.css';

const ROWS = 6;

/** Top right: the best scores in the match, and yours if you are not among them. */
export const scoreboard: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-scores';
  root.append(el);
  // Undefined until the first update, so the first one always applies.
  let shown: string | undefined;
  return {
    update(view) {
      const rows = view.scores.slice(0, window.innerWidth < 520 ? 3 : ROWS);
      const mine = view.scores.findIndex((s) => s.me);
      if (mine >= rows.length) rows.push(view.scores[mine]!);
      const key = rows.map((s) => `${s.name}:${s.score}:${s.me}`).join('|');
      if (key === shown) return;
      shown = key;
      el.replaceChildren(
        ...rows.map((s) => {
          const row = document.createElement('div');
          row.className = `hud-score-row${s.me ? ' me' : ''}`;
          const rank = view.scores.indexOf(s) + 1;
          row.innerHTML = `<span class="hud-muted">${rank}</span><span class="hud-score-dot"></span><span class="hud-score-name"></span><span>${s.score}</span>`;
          row.querySelector<HTMLElement>('.hud-score-dot')!.style.background = s.color;
          row.querySelector<HTMLElement>('.hud-score-name')!.textContent = s.name;
          return row;
        }),
      );
    },
  };
};
