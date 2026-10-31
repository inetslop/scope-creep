import type { MakeMenuPart, MenuView } from '../../engine/api.ts';
import './hats.css';

/** The Hats card on the start screen and its picker panel (None, Cone, Beanie). */
export const hats: MakeMenuPart = (root) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'hats-card';
  card.innerHTML = '<span class="hats-card-label">Hats</span><span class="hats-card-current">None</span><canvas class="hats-card-mini" width="44" height="44"></canvas>';
  root.append(card);
  const mini = card.querySelector<HTMLCanvasElement>('.hats-card-mini')!;
  const current = card.querySelector<HTMLElement>('.hats-card-current')!;

  const panel = document.createElement('div');
  panel.className = 'hats-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="hats-panel-head"><span>Hats</span><button class="hats-close" type="button" aria-label="Close">×</button></div>' +
    '<canvas class="hats-preview" width="140" height="140"></canvas>' +
    '<div class="hats-choices">' +
    '<button class="hats-choice" type="button" data-id=""><canvas width="56" height="56"></canvas><span>None</span></button>' +
    '<button class="hats-choice" type="button" data-id="cone"><canvas width="56" height="56"></canvas><span>Cone</span></button>' +
    '<button class="hats-choice" type="button" data-id="beanie"><canvas width="56" height="56"></canvas><span>Beanie</span></button>' +
    '</div>';
  root.append(panel);
  const preview = panel.querySelector<HTMLCanvasElement>('.hats-preview')!;
  const choiceEls = Array.from(panel.querySelectorAll<HTMLButtonElement>('.hats-choice'));

  let view: MenuView | undefined;
  let shown = '';

  const draw = (v: MenuView): void => {
    v.preview(preview);
    v.preview(mini);
    for (const c of choiceEls) v.preview(c.querySelector<HTMLCanvasElement>('canvas')!, { head: c.dataset.id || undefined });
  };

  card.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  panel.querySelector('.hats-close')!.addEventListener('click', () => {
    panel.hidden = true;
  });
  for (const c of choiceEls) {
    c.addEventListener('click', () => {
      const id = c.dataset.id || undefined;
      if (view) view.wear('head', id && id === view.profile.wearing.head ? undefined : id);
    });
  }

  return {
    update(v) {
      view = v;
      const worn = v.profile.wearing.head ?? '';
      current.textContent = worn === 'cone' ? 'Cone' : worn === 'beanie' ? 'Beanie' : 'None';
      mini.hidden = !worn;
      for (const c of choiceEls) c.classList.toggle('worn', c.dataset.id !== '' && c.dataset.id === worn);
      const key = `${worn}:${v.profile.color ?? -1}`;
      if (key === shown) return;
      shown = key;
      draw(v);
    },
  };
};
