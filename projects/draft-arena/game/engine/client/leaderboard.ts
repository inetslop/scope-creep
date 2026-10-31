/**
 * The leaderboard on the start screen: Today (each name's best life of the last 24 hours) and All
 * time, read from the game server's /leaderboard (server/leaderboard.ts). A sticker card beside the
 * start card on a desktop, at the top on a phone. Without a server that has a leaderboard (in this
 * tab, or a server without one) it stays hidden.
 */
interface Entry {
  rank: number;
  name: string;
  score: number;
}
interface Board {
  total: number;
  entries: Entry[];
  me: Entry | null;
}

type Tab = 'today' | 'forever';
const TABS: readonly [Tab, string][] = [
  ['today', 'Today'],
  ['forever', 'All time'],
];

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

export class LeaderboardCard {
  private readonly card: HTMLElement;
  private readonly list: HTMLOListElement;
  private readonly note: HTMLElement;
  private readonly tabs = new Map<Tab, HTMLButtonElement>();
  private tab: Tab = 'today';
  private name = '';
  private asked = 0;

  private readonly base: string;

  constructor(root: HTMLElement, base: string) {
    this.base = base;
    this.card = el('section', 'menu-board');
    this.card.hidden = true;
    const head = el('div', 'menu-board-head');
    head.append(el('h2', '', 'Leaderboard'));
    const tabs = el('div', 'menu-board-tabs');
    for (const [id, label] of TABS) {
      const b = el('button', 'menu-board-tab', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.tab = id;
        void this.refresh();
      });
      this.tabs.set(id, b);
      tabs.append(b);
    }
    head.append(tabs);
    this.list = el('ol', 'menu-board-list');
    this.note = el('p', 'menu-board-note');
    this.card.append(head, this.list, this.note);
    root.append(this.card);
  }

  /** Shows the current tab for `name` (highlighted when it is on the board). */
  show(name: string): void {
    this.name = name.trim();
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    const ask = ++this.asked;
    for (const [id, b] of this.tabs) b.classList.toggle('on', id === this.tab);
    let board: Board;
    try {
      const res = await fetch(`${this.base}/leaderboard?b=${this.tab}&me=${encodeURIComponent(this.name)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      board = (await res.json()) as Board;
    } catch {
      // No leaderboard here (a match in this tab, or a server without one): no card.
      if (ask === this.asked) this.card.hidden = true;
      return;
    }
    if (ask !== this.asked) return;
    this.card.hidden = false;
    const rows: HTMLElement[] = board.entries.map((e) => this.row(e));
    const mine = board.me;
    if (mine && !board.entries.some((e) => e.name === mine.name)) rows.push(el('li', 'menu-board-gap', '⋯'), this.row(mine));
    this.list.replaceChildren(...rows);
    this.note.textContent = board.entries.length === 0 ? (this.tab === 'today' ? 'No one yet today: be the first.' : 'No one yet: be the first.') : `${board.total} ${board.total === 1 ? 'player' : 'players'}`;
  }

  private row(e: Entry): HTMLElement {
    const li = el('li', e.name === this.name && this.name ? 'me' : '');
    li.append(el('span', 'menu-board-rank', String(e.rank)), el('span', 'menu-board-name', e.name), el('span', 'menu-board-score', e.score.toLocaleString('en-US')));
    return li;
  }
}
