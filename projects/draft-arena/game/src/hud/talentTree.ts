import { paintIcon, type HudTalent, type HudTree, type HudView, type MakeHudPart } from '../../engine/api.ts';
import { PALETTE } from '../content/palette.ts';
import './talentTree.css';

const icon = (look: Parameters<typeof paintIcon>[1], px: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = c.height = px * 2;
  c.style.width = c.style.height = `${px}px`;
  paintIcon(c, look, PALETTE.ink);
  return c;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/**
 * The talents: a button that pulses while points are banked (T on a keyboard), and a panel with
 * one tab per tree. A tree is drawn from what its talents need: each talent sits under the first
 * talent it needs, joined by a line; what it still needs is written on it. Tap or click a glowing
 * talent to take a rank. Desktop: a column at the right; phone: above the button.
 */
export const talentTree: MakeHudPart = (root) => {
  const button = el('button', 'hud-card hud-talents-button');
  const panel = el('div', 'hud-card hud-tree');
  root.append(panel, button);
  let open = false;
  let tab: string | undefined;
  let shown: string | undefined;
  let view: HudView | undefined;

  const toggle = (on = !open): void => {
    open = on;
    shown = undefined;
  };
  button.addEventListener('click', () => toggle());
  // Captured before the engine's keys, so Esc closes the panel instead of leaving the match.
  window.addEventListener(
    'keydown',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || !view?.me) return;
      if (e.code === 'KeyT' && !e.repeat) toggle();
      else if (e.code === 'Escape' && open) {
        toggle(false);
        e.stopPropagation();
      }
    },
    true,
  );

  const renderButton = (points: number, touch: boolean): void => {
    button.replaceChildren(open ? 'Close talents' : 'Talents');
    if (points > 0) button.append(el('b', '', `+${points}`));
    if (!touch && !open) button.append(el('kbd', '', 'T'));
    button.classList.toggle('glow', points > 0 && !open);
    if (points > 0 && !open) button.dataset.card = 'talents';
    else delete button.dataset.card;
  };

  const renderTree = (tree: HudTree, points: number): HTMLElement => {
    const wrap = el('div', 'hud-tree-rows');
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.setAttribute('aria-hidden', 'true');
    wrap.append(lines);
    // A talent goes under the first talent of its tree that it needs; ones that need none start at the left.
    const byId = new Map(tree.talents.map((t) => [t.def.id, t]));
    const parentOf = (t: HudTalent): string | undefined => (t.def.needs ?? []).map(([id]) => id).find((id) => byId.has(id));
    const children = new Map<string, HudTalent[]>();
    const roots: HudTalent[] = [];
    for (const t of tree.talents) {
      const p = parentOf(t);
      if (p) children.set(p, [...(children.get(p) ?? []), t]);
      else roots.push(t);
    }
    const order: [HudTalent, number][] = [];
    const visit = (t: HudTalent, depth: number): void => {
      order.push([t, depth]);
      for (const c of children.get(t.def.id) ?? []) visit(c, depth + 1);
    };
    roots.forEach((r) => visit(r, 0));

    const bubbles = new Map<string, HTMLElement>();
    for (const [t, depth] of order) {
      const row = el('button', `hud-talent ${t.state}`);
      row.style.setProperty('--indent', `${depth * 24}px`);
      row.style.setProperty('--c', tree.def.look.color);
      if (t.state === 'can') row.dataset.card = t.def.id;
      const bubble = el('span', 'hud-talent-bubble');
      bubble.append(icon(t.upgrade.look, 20));
      bubbles.set(t.def.id, bubble);
      const text = el('span', 'hud-talent-text');
      const name = el('span', 'hud-talent-name', t.upgrade.name);
      const pips = el('span', 'hud-pips');
      for (let i = 0; i < t.def.max; i++) pips.append(el('i', i < t.rank ? 'on' : ''));
      name.append(pips);
      text.append(name, el('span', 'hud-talent-desc', t.upgrade.description));
      if (t.missing.length) text.append(el('span', 'hud-talent-needs', `Needs ${t.missing.join(' and ')}`));
      row.append(bubble, text);
      row.disabled = t.state !== 'can' || points <= 0;
      row.addEventListener('click', () => view?.pick(t.def.id));
      wrap.append(row);
    }
    // Lines from each talent's parent, drawn once the rows have their places.
    requestAnimationFrame(() => {
      const box = wrap.getBoundingClientRect();
      lines.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      for (const [t] of order) {
        const pid = parentOf(t);
        const a = pid && bubbles.get(pid);
        const b = bubbles.get(t.def.id);
        if (!a || !b) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const x1 = ra.left - box.left + ra.width / 2;
        const y1 = ra.bottom - box.top;
        const x2 = rb.left - box.left;
        const y2 = rb.top - box.top + rb.height / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} L ${x1} ${y2 - 6} Q ${x1} ${y2} ${x1 + 6} ${y2} L ${x2} ${y2}`);
        const need = t.def.needs?.find(([id]) => id === pid)?.[1] ?? 1;
        if ((byId.get(pid)?.rank ?? 0) >= need) path.setAttribute('class', 'on');
        lines.append(path);
      }
    });
    return wrap;
  };

  return {
    update(v) {
      view = v;
      const me = v.me;
      const alive = !!me?.alive;
      const points = me?.pendingPicks ?? 0;
      const trees = me?.trees ?? [];
      tab ??= [...trees].sort((a, b) => b.spent - a.spent)[0]?.def.id;
      const current = trees.find((t) => t.def.id === tab) ?? trees[0];
      const key = `${alive}:${open}:${tab}:${points}:${v.touch}:${trees.map((t) => t.talents.map((x) => `${x.rank}${x.state[0]}`).join('')).join('|')}`;
      if (key === shown) return;
      shown = key;
      button.hidden = !alive;
      panel.hidden = !alive || !open || !current;
      if (!alive) return;
      renderButton(points, v.touch);
      if (!open || !current) return;

      const head = el('div', 'hud-tree-head');
      head.append('Talents', el('span', 'hud-tree-points', points ? `${points} to spend` : 'none to spend'));
      const close = el('button', 'hud-tree-close', '✕');
      close.setAttribute('aria-label', 'Close talents');
      close.addEventListener('click', () => toggle(false));
      head.append(close);

      const tabs = el('div', 'hud-tree-tabs');
      for (const t of trees) {
        const chip = el('button', `hud-tree-tab${t === current ? ' on' : ''}`);
        chip.append(icon(t.def.look, 14), t.def.name, el('small', '', String(t.spent)));
        if (points > 0 && t.talents.some((x) => x.state === 'can') && t.spent > 0) chip.append(el('span', 'hud-tree-dot'));
        chip.addEventListener('click', () => {
          tab = t.def.id;
        });
        tabs.append(chip);
      }

      const title = el('div', 'hud-tree-title');
      title.append(el('b', '', current.def.name), el('span', '', ` · ${current.spent} points`), el('div', 'hud-tree-about', current.def.description));
      panel.replaceChildren(head, tabs, title, renderTree(current, points));
    },
  };
};
