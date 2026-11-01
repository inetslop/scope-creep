import Phaser from 'phaser';
import { deepOf, PALETTE, type Bright } from '../content/palette';
import { loadBoardName } from '../core/boardName';
import { hook } from '../debug/testHook';
import { fetchBoard, isBoardError, type Board, type BoardEntry, type BoardError, type BoardName } from '../net/boards';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { onKey, onResize, SCENES } from './keys';
import { NAME_PICKED, type NameSceneData } from './NameScene';

const PANEL_W = 360;
const PAD = 24;
const ROWS = 10;
const ROW_H = 26;
const HEADER_H = 24;
/** Level headers the ranked part makes room for: a top ten rarely spans more levels. */
const MAX_HEADERS = 3;
/** The ranked part: ten rows under their level headers. */
const TOP_H = ROWS * ROW_H + MAX_HEADERS * HEADER_H;
/** The list's height: the ranked part, a gap, and the player's own row (with its header) when it is below the ten. */
const LIST_H = TOP_H + 8 + HEADER_H + ROW_H;

/** The level headers' colors, from level 1 up; level 0 ("No level") is muted. */
const LEVEL_BRIGHTS: readonly Bright[] = ['teal', 'blue', 'purple', 'pink', 'orange'];
const levelBright = (level: number): Bright => LEVEL_BRIGHTS[(level - 1) % LEVEL_BRIGHTS.length]!;

const SUBTITLE: Record<BoardName, string> = {
  today: 'The best run of every name since 00:00 UTC.',
  forever: 'The best run of every name, ever.',
};

/**
 * The leaderboards, over the dimmed start screen: Today (each name's best run since 00:00 UTC)
 * and Forever. Each lists the top ten under level headers (the server ranks by level, then
 * score, so a level-2 run sits above a bigger level-0 score), with the player's own place under
 * them when it is lower. The player's name is changed here too (NameScene).
 */
export class BoardsScene extends Phaser.Scene {
  private tab: BoardName = 'today';
  private name = '';
  private boardCache = new Map<BoardName, Board | BoardError>();
  private listBox!: Phaser.GameObjects.Container;
  private subtitle!: Phaser.GameObjects.Text;
  private tabs!: Record<BoardName, Button>;
  private nameButton!: Button;

  constructor() {
    super(SCENES.boards);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.boards;
    this.boardCache = new Map();
    this.tab = 'today';
    this.name = loadBoardName(window.localStorage);
    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const exit = (): void => {
      hook.overlay = '';
      this.scene.start(SCENES.menu);
    };

    const title = this.add.text(0, 0, 'Boards', titleStyle(32)).setOrigin(0.5);
    const half = (PANEL_W - PAD * 2 - 12) / 2;
    const left = -(half + 12) / 2;
    const right = (half + 12) / 2;
    this.tabs = {
      today: makeButton(this, left, 0, 'Today', () => this.show('today'), { width: half, height: 44, radius: 22, fontSize: 18 }),
      forever: makeButton(this, right, 0, 'Forever', () => this.show('forever'), { width: half, height: 44, radius: 22, fontSize: 18 }),
    };
    this.subtitle = this.add.text(0, 0, '', textStyle(14, PALETTE.muted, { align: 'center', wordWrap: { width: PANEL_W - PAD * 2 } })).setOrigin(0.5);
    this.listBox = this.add.container(0, 0);
    this.nameButton = makeButton(this, left, 0, '', () => this.changeName(), { width: half, height: 48, radius: 24, fontSize: 18 });
    const menu = makeButton(this, right, 0, 'Menu', exit, { width: half, height: 48, radius: 24, fontSize: 18 });

    // One column: title, tabs, subtitle, list, then Name and Menu side by side.
    const rows: [Phaser.GameObjects.Components.Transform[], number, number][] = [
      [[title], title.height, 14],
      [[this.tabs.today.container, this.tabs.forever.container], 44, 10],
      [[this.subtitle], 20, 10],
      [[this.listBox], LIST_H, 16],
      [[this.nameButton.container, menu.container], 48, 0],
    ];
    const panelH = rows.reduce((h, [, rowH, after]) => h + rowH + after, 0) + PAD * 2;
    let y = -panelH / 2 + PAD;
    for (const [objs, rowH, after] of rows) {
      for (const o of objs) o.y = o === this.listBox ? y : y + rowH / 2;
      y += rowH + after;
    }
    const panel = makeCard(this, 0, 0, PANEL_W, panelH, 28);
    const box = this.add.container(0, 0, [panel, title, this.tabs.today.container, this.tabs.forever.container, this.subtitle, this.listBox, this.nameButton.container, menu.container]);

    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / PANEL_W, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Escape') exit();
    });
    const onName = (name: string | null): void => {
      if (!name || name === this.name) return;
      this.name = name;
      this.boardCache.clear(); // "me" is part of each answer
      this.show(this.tab);
    };
    this.game.events.on(NAME_PICKED, onName);
    this.events.once('shutdown', () => this.game.events.off(NAME_PICKED, onName));
    this.show('today');
  }

  private changeName(): void {
    const data: NameSceneData = { from: SCENES.boards };
    this.scene.launch(SCENES.name, data);
    this.scene.pause();
  }

  /** Switches to a tab: its board from the cache, or fetched (the list says "Loading" meanwhile). */
  private show(tab: BoardName): void {
    this.tab = tab;
    this.tabs.today.setSelected(tab === 'today');
    this.tabs.forever.setSelected(tab === 'forever');
    this.nameButton.label.setText(this.name ? `Name: ${this.name}` : 'Pick a name');
    this.subtitle.setText(SUBTITLE[tab]);
    const cached = this.boardCache.get(tab);
    if (cached) {
      this.renderList(cached);
      return;
    }
    this.renderMessage('Loading…');
    void fetchBoard(tab, this.name).then((board) => {
      if (!this.scene.isActive() && !this.scene.isPaused()) return; // closed meanwhile
      this.boardCache.set(tab, board);
      if (this.tab === tab) this.renderList(board);
    });
  }

  private renderMessage(text: string): void {
    this.listBox.removeAll(true);
    this.listBox.add(this.add.text(0, LIST_H / 2, text, textStyle(15, PALETTE.muted, { align: 'center', wordWrap: { width: PANEL_W - PAD * 2 } })).setOrigin(0.5));
  }

  private renderList(board: Board | BoardError): void {
    if (isBoardError(board)) {
      this.renderMessage(board === 'rate' ? 'Too many requests: try again in a moment.' : 'Can\'t reach the boards right now.');
      return;
    }
    if (board.entries.length === 0) {
      this.renderMessage(board.board === 'today' ? 'No runs since 00:00 UTC.\nBe the first.' : 'No runs yet.');
      return;
    }
    this.listBox.removeAll(true);
    // The ranked rows, a header wherever the level changes. A ten spanning more levels than
    // there are headers' room for shows the rows that fit.
    const shown = new Set<string>();
    let y = 0;
    let level: number | undefined;
    for (const e of board.entries) {
      const header = e.level !== level;
      if (y + (header ? HEADER_H : 0) + ROW_H > TOP_H) break;
      if (header) {
        this.addHeader(e.level, y + HEADER_H / 2);
        y += HEADER_H;
        level = e.level;
      }
      this.addRow(e, y + ROW_H / 2);
      shown.add(e.name);
      y += ROW_H;
    }
    if (board.me && !shown.has(board.me.name)) {
      let meY = TOP_H + 8;
      if (board.me.level !== level) {
        this.addHeader(board.me.level, meY + HEADER_H / 2);
        meY += HEADER_H;
      }
      this.addRow(board.me, meY + ROW_H / 2);
    } else this.listBox.add(this.add.text(0, LIST_H - 2, `${board.total} ${board.total === 1 ? 'name' : 'names'}`, textStyle(12, PALETTE.faint)).setOrigin(0.5, 1));
  }

  /** A level header: a dot in the level's color, "Level N" (or "No level") in its deep shade, and a hairline to the edge. */
  private addHeader(level: number, y: number): void {
    const left = -PANEL_W / 2 + PAD;
    const right = PANEL_W / 2 - PAD;
    const dot = this.add.circle(left + 4, y, 4.5, level > 0 ? PALETTE[levelBright(level)] : PALETTE.faint);
    const label = this.add.text(left + 14, y, level > 0 ? `Level ${level}` : 'No level', textStyle(13, level > 0 ? deepOf(levelBright(level)) : PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const lineX = left + 14 + label.width + 8;
    const line = this.add.rectangle(lineX, y, right - lineX, 1, PALETTE.cardDeep).setOrigin(0, 0.5);
    this.listBox.add([dot, label, line]);
  }

  /** One row: rank, name, score, waves; the player's own on a soft highlight. */
  private addRow(e: BoardEntry, y: number): void {
    const mine = e.name === this.name;
    const left = -PANEL_W / 2 + PAD;
    const right = PANEL_W / 2 - PAD;
    if (mine) {
      const hl = this.add.graphics();
      hl.fillStyle(PALETTE.yellow, 0.22);
      hl.fillRoundedRect(left - 8, y - ROW_H / 2 + 1, right - left + 16, ROW_H - 2, 8);
      this.listBox.add(hl);
    }
    const style = (size: number, bold: boolean, color: number = PALETTE.ink) => textStyle(size, color, { fontStyle: bold ? 'bold' : 'normal' });
    // The level is the header above the row; the score already carries the level's multiplier.
    this.listBox.add([
      this.add.text(left + 22, y, `${e.rank}`, style(14, false, PALETTE.muted)).setOrigin(1, 0.5),
      this.add.text(left + 36, y, e.name, style(16, true)).setOrigin(0, 0.5),
      this.add.text(right - 54, y, e.score.toLocaleString('en-US'), style(15, mine)).setOrigin(1, 0.5),
      this.add.text(right, y, `W${e.waves}`, style(13, false, PALETTE.muted)).setOrigin(1, 0.5),
    ]);
  }
}
