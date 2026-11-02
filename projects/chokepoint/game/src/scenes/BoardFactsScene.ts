import Phaser from 'phaser';
import { BOARD_MARGIN, paintBoardPreview } from '../art/board';
import { CELL } from '../config';
import { boardFactMap, boardFactTag, BOARD_FACT_SEEDS, BOARD_FACTS, type BoardFactRow } from '../core/boardFacts';
import { markedCell } from '../core/markedCell';
import { pathLineFor } from '../core/path';
import { PALETTE } from '../content/palette';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { makeCard } from '../ui/card';
import { EDGE } from '../ui/hud/hud';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { getSfx, onResize, SCENES } from './keys';

/**
 * The boards reference: the board's modifiers, off the pause in the family of the waves,
 * enemies and coins references. One row per modifier — its board (grown from the row's own
 * committed seed), its name and meaning, and its tag ("always", "some boards", or the tech
 * tree's own node name, "owned" while the profile owns it). The rows and the tag read come from core/boardFacts (the tree's own data); this scene owns
 * no state: a later modifier lands by adding one row and one mark, not a change to the pause card
 * or the sibling references. One white rounded card that scales to fit; the pause sits dimmed behind.
 */
export class BoardFactsScene extends Phaser.Scene {
  private panelW = 340;
  private panelH = 0;
  private box!: Phaser.GameObjects.Container;
  private shade!: Phaser.GameObjects.Rectangle;
  private back!: Button;
  private closed = false;

  constructor() {
    super(SCENES.boardFacts);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.boardFacts;
    this.closed = false;
    // The pause stays behind: the shade dims it, and a tap on the dimmed area does nothing.
    this.shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      hook.overlay = SCENES.pause;
      this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
    };
    // The back button: a round ink card with a white arrow, top right (the bosses reference's).
    this.back = makeButton(this, 0, 0, '', doBack, { width: 48, height: 48, radius: 24, fill: PALETTE.ink });
    const arrow = this.add.graphics();
    arrow.fillStyle(PALETTE.card, 1);
    arrow.fillTriangle(3, -7, 3, 7, -8, 0);
    this.back.content.add(arrow);
    this.build();
    const layout = (width: number, height: number): void => {
      this.shade.setSize(width, height);
      this.shade.input?.hitArea.setTo(0, 0, width, height);
      // The whole card scales to fit, like the references: no scroll, no clip.
      this.box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / this.panelW, (height - 24) / this.panelH));
      this.back.container.setPosition(width - EDGE - 24, 40);
    };
    const size = viewSize(this);
    layout(size.width, size.height);
    onResize(this, layout);
    // A smoke tap on the pause can land on the new button; back out so the run is not stranded here.
    if (flags.smoke) this.time.delayedCall(1000, doBack);
    this.events.once('shutdown', () => {
      for (const r of BOARD_FACTS) this.textures.remove('boards:fact:' + r.mark);
    });
  }

  private build(): void {
    const PAD = 16, BOARD_W = 58, BOARD_H = 96, GAP = 10, HEADER = 64, BOTTOM = 20, ROW_GAP = 10;
    const innerW = this.panelW - PAD * 2;
    const textW = innerW - BOARD_W - GAP;
    const purchased = loadProfile(window.localStorage).purchased;
    // The tag the card shows: the pure read ("always", "some boards", the node's own name or
    // "owned"), with the tech kind's own word in front of the node's name ("tech · One more bend").
    const tagText = (r: BoardFactRow): string => {
      const t = r.tag;
      const base = boardFactTag(r, purchased);
      return t.kind === 'tech' ? (base === 'owned' ? 'owned' : `tech · ${base}`) : base;
    };
    // Lay each row's texts out at (0,0) with their final wrap width to measure them; the row
    // grows to its board's height (a seed-less later row stays text-only at its own height).
    const rows = BOARD_FACTS.map((row) => {
      const s = BOARD_FACT_SEEDS[row.mark];
      const name = this.add.text(0, 0, row.name, titleStyle(14)).setOrigin(0, 0.5);
      const tag = this.add.text(0, 0, tagText(row), textStyle(11, PALETTE.muted)).setOrigin(1, 0.5);
      const meaning = this.add.text(0, 0, row.meaning, textStyle(12, PALETTE.muted, { wordWrap: { width: textW } }));
      const textH = name.height + 3 + meaning.height;
      return { row, s, name, tag, meaning, h: s ? Math.max(BOARD_H, textH) : textH };
    });
    this.panelH = HEADER + rows.reduce((n, r) => n + r.h + ROW_GAP, 0) - ROW_GAP + BOTTOM;
    const left = -this.panelW / 2 + PAD;
    const textX = left + BOARD_W + GAP;
    const parts: Phaser.GameObjects.GameObject[] = [makeCard(this, 0, 0, this.panelW, this.panelH, 28)];
    parts.push(this.add.text(0, -this.panelH / 2 + 42, 'Boards', titleStyle(28)).setOrigin(0.5));
    let rowTop = -this.panelH / 2 + HEADER;
    for (const row of rows) {
      // The row's board, grown from the row's own committed seed: its island, road, gates, rocks
      // and marked cell in the board's own look, nothing else painted on it.
      const s = row.s;
      const map = s ? boardFactMap(row.row.mark) : undefined;
      if (map && s) {
        const key = 'boards:fact:' + row.row.mark;
        paintBoardPreview(this, key, map, pathLineFor(map, CELL), markedCell(map, s.seed));
        const img = this.add.image(left + BOARD_W / 2, rowTop + row.h / 2, key);
        img.setScale(Math.min(BOARD_W / (map.cols * CELL + BOARD_MARGIN * 2), BOARD_H / (map.rows * CELL + BOARD_MARGIN * 2)));
        parts.push(img);
      }
      row.name.setPosition(textX, rowTop + row.name.height / 2);
      row.tag.setPosition(left + innerW, rowTop + row.name.height / 2);
      row.meaning.setPosition(textX, rowTop + row.name.height + 3);
      parts.push(row.name, row.tag, row.meaning);
      rowTop += row.h + ROW_GAP;
    }
    this.box = this.add.container(0, 0, parts);
  }
}
