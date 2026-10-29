---
id: T0225
title: "The tech tree: card text that never overlaps, rows sized from their cards"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T17:00:35Z
claimed_at: 2026-10-29T18:07:36Z
finished_at: 2026-10-29T18:27:27Z
---

## Goal
Seen at 1280x720: on the Momentum card the description ("unlocks the Momentum augment in the draft", three lines) rises into the card's name, so the two overlap. Any description that wraps to three lines does the same. Lay each tech card out top-down so its text can never overlap, and size the rows from the cards instead of from fixed numbers.

## Details
- **Why it broke:** in `src/scenes/TechScene.ts` each card's text is hand-placed. The name sits at y -32 and the description is *centered* at y -4, so a longer description grows up into the name as well as down. The cards are a fixed 160x100. The row positions are fixed numbers too (the 73, 112, 50 and 31 in `rebuild()`), so nothing gets taller when a card's text does.
- **Each card as a column, from the top:** the name; below it, with a small gap, the description (top-aligned, so it only grows downward); the price line (or "owned", "needs the previous", "not in the game yet") pinned to the bottom. The same padding at the top and the bottom.
- **The cards in a row are the same height:** the height of the row's tallest content. Each row's y comes from the row above it (its label, then its cards, then a gap), and the panel's height comes from the rows plus the Menu button, with the same padding at the top and the bottom.
- **A name or description never wider than the card minus its padding:** the description wraps; a name that would be too wide shrinks to fit (never below 13 px).
- **The balance row:** the coin icon sits right beside the number (a small fixed gap), as a centered pair.
- **Keep:** the wide (one line of cards per row) and narrow (two columns) layouts, the scroll and down-arrow when the panel is taller than the screen, the owned border (it follows the card's new height), the greyed locked cards, the red price when unaffordable, the buy pop and chime.

## Acceptance criteria
- [ ] At 1280x720 and 412x915, no card's name, description and price line overlap, for every node (Momentum included).
- [ ] The cards in a row share one height, and no text crosses a card's edges.
- [ ] The rows and the Menu button stay evenly spaced, and the panel's top and bottom padding match.
- [ ] The owned border fits the card exactly.
- [ ] Scrolling still works when the panel is taller than the screen.

## Design (architect, desktop)

### Files
- edit `src/scenes/TechScene.ts` - replace the fixed card/row geometry in `rebuild()` with a top-down, self-sizing layout; add card-metric constants; change the `TechCard` border in `refresh()` to follow the new height. No other file changes.

### Interfaces
Change the `TechCard` interface (add the card's height, used by the border):
```ts
interface TechCard {
  node: RowNode;
  button: Button;
  price: Phaser.GameObjects.Text;
  coin: Phaser.GameObjects.Image;
  border: Phaser.GameObjects.Graphics;
  h: number; // this card's (its row's) height
}
```
Add these module-level constants next to `ROW_LABELS`:
```ts
const CARD_W = 160;
const WRAP_W = 132;      // card width minus its side padding
const PAD_TOP = 12;      // card top/bottom padding
const GAP_ND = 7;        // name -> description
const GAP_DP = 12;       // description -> price line
const PRICE_H = 18;      // price line height
const MARGIN = 40;       // panel top padding (-> title center) AND bottom padding (menu bottom -> panel edge): equal
const BALANCE_GAP = 44;  // title center -> balance center
const HEADER_TO_LABEL = 26;
const LABEL_TO_CARDS = 18; // label center -> first card top
const GRID_GAP = 12;      // between grid rows inside one row (narrow)
const ROW_GAP = 30;       // last card bottom -> next row label
const MENU_GAP = 30;      // last row bottom -> menu top
const MENU_H = 52;
```

### Steps
1. Keep `ROW_LABELS`, all imports, `RowNode`, `create()`, `layout()`, `centerBalance()`, `buy()`, `onDrag`, `onDragEnd` exactly as they are. Only rewrite `rebuild()`'s geometry + card build and the border line in `refresh()`.
2. Rewrite `rebuild()` as three passes. Replace everything from `const wide = ...` down to (but not including) `this.refresh()` with:
```ts
const wide = this.kind === 'wide';
const maxRow = Math.max(...this.rows.map((r) => r.length));
this.panelW = wide ? Math.max(716, (maxRow - 1) * 172 + 200) : 356;

// Pass A: build each card's texts, size the name to fit, and let the row take its tallest card.
interface Measured { node: RowNode; name: Phaser.GameObjects.Text; desc: Phaser.GameObjects.Text; price: Phaser.GameObjects.Text; h: number }
const measured: Measured[][] = this.rows.map((row) => {
  let rowH = 0;
  const rowCards: Measured[] = row.map((node) => {
    const name = this.add.text(0, 0, node.name, textStyle(16, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    let size = 16;
    while (name.width > WRAP_W && size > 13) { size -= 1; name.setFontSize(size); }
    const desc = this.add.text(0, 0, node.line, textStyle(13, PALETTE.muted, { align: 'center', wordWrap: { width: WRAP_W }, lineSpacing: 2 })).setOrigin(0.5, 0);
    const price = this.add.text(0, 0, String(node.price), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const h = PAD_TOP + name.height + GAP_ND + desc.height + GAP_DP + PRICE_H + PAD_TOP;
    rowH = Math.max(rowH, h);
    return { node, name, desc, price, h: rowH };
  });
  return rowCards;
});

// Pass B: top-down vertical positions. The header, then each row (label, then its grid rows),
// then the menu; top and bottom padding are both MARGIN.
let top = MARGIN + BALANCE_GAP + HEADER_TO_LABEL;
const labelYs: number[] = [];
const cardTops: number[][] = [];
measured.forEach((rowCards, r) => {
  const labelC = top + 8;
  labelYs.push(labelC);
  const gridCount = wide ? 1 : Math.ceil(rowCards.length / 2);
  let y = labelC + LABEL_TO_CARDS;
  const tops: number[] = [];
  for (let g = 0; g < gridCount; g++) { tops.push(y); y += rowCards[0].h + (g < gridCount - 1 ? GRID_GAP : 0); }
  cardTops.push(tops);
  top = y + ROW_GAP; // y is the bottom of the row's last grid row
});
const menuTop = top - ROW_GAP + MENU_GAP;
const menuC = menuTop + MENU_H / 2;
this.panelH = menuTop + MENU_H + MARGIN;

// Pass C: build the panel, header, rows and menu at the computed positions.
const panel = makeCard(this, 0, 0, this.panelW, this.panelH, 28);
const title = this.add.text(0, -this.panelH / 2 + MARGIN, 'Tech', titleStyle(32)).setOrigin(0.5);
const number = this.add.text(0, -this.panelH / 2 + MARGIN + BALANCE_GAP, String(this.profile.coins), textStyle(28, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
const coin = artScale(this.add.image(0, -this.panelH / 2 + MARGIN + BALANCE_GAP, COIN_TEXTURE), 1.4);
this.balanceText = number;
this.balanceIcon = coin;
this.centerBalance();
const exit = (): void => { hook.overlay = ''; this.scene.start(SCENES.menu); };
const parts: Phaser.GameObjects.GameObject[] = [panel, title, coin, number];
this.rows.forEach((row, r) => {
  const label = this.add.text(0, -this.panelH / 2 + labelYs[r], ROW_LABELS[r], textStyle(14, PALETTE.muted)).setOrigin(0.5);
  const dot = this.add.circle(label.width / 2 + 9, -this.panelH / 2 + labelYs[r], 3, PALETTE.yellow).setVisible(false);
  this.rowDots.push(dot);
  parts.push(label, dot);
  row.forEach((node, i) => {
    const m = measured[r][i];
    const grid = wide ? 0 : Math.floor(i / 2);
    const lastOdd = row.length % 2 === 1 && i === row.length - 1;
    const x = wide ? (i - (row.length - 1) / 2) * 172 : i % 2 === 0 ? (lastOdd ? 0 : -86) : 86;
    const button = makeButton(this, 0, 0, '', () => this.buy(node), { width: CARD_W, height: m.h, radius: 16, fadeWhenDisabled: false });
    const priceY = m.h / 2 - PAD_TOP - PRICE_H / 2; // the price line, pinned to the card's bottom
    m.name.setPosition(0, -m.h / 2 + PAD_TOP);
    m.desc.setPosition(0, -m.h / 2 + PAD_TOP + m.name.height + GAP_ND);
    m.price.setPosition(0, priceY);
    const nodeCoin = artScale(this.add.image(0, priceY, COIN_TEXTURE), 12 / 28);
    button.content.add([m.name, m.desc, m.price, nodeCoin]);
    const border = this.add.graphics();
    button.container.add(border); // a sibling of the content, so it never lifts with the card
    button.container.setPosition(x, -this.panelH / 2 + cardTops[r][grid] + m.h / 2);
    this.cards.push({ node, button, price: m.price, coin: nodeCoin, border, h: m.h });
    parts.push(button.container);
  });
});
parts.push(makeButton(this, 0, -this.panelH / 2 + menuC, 'Menu', exit, { width: 240, height: MENU_H, radius: 26 }).container);
panel.setInteractive();
panel.on('pointerdown', (p: Phaser.Input.Pointer): void => {
  if (!this.scrollable) return;
  if (this.input.hitTestPointer(p).some((o) => o !== panel && o !== this.shade)) return;
  this.dragOffset = pointerCss(p).y - this.box!.y;
  this.dragging = true;
});
this.box = this.add.container(0, 0, parts).setDepth(2);
```
3. In `refresh()`, replace only the owned-state border line `c.border.strokeRoundedRect(-81, -51, 162, 102, 17);` with `c.border.strokeRoundedRect(-CARD_W / 2 + 1, -c.h / 2 + 1, CARD_W - 2, c.h - 2, 17);`. Do not touch the x / visibility / text / color logic there (the price line's y is now fixed in the build pass, so refresh must not set `price.y` or `coin.y`).

### Pitfalls
- Do not re-set `price.y`/`coin.y` in `refresh()` — the y is fixed per card in Pass C; refresh only changes x, text, color and visibility.
- Text objects created in Pass A are reparented into `button.content` in Pass C; their positions must be set *relative to the card center* (Pass C's `setPosition`), not scene coords.
- `name.setFontSize(size)` is the Phaser Text method — do not rebuild the name object in the loop.
- Keep `makeButton`'s `text: ''` (its own empty label stays in `content`; the card's real texts are the ones you add).
- Do not change horizontal x math, `panelW`, `create()`, `layout()`, scroll/drag handlers, the header balance (`centerBalance`), or the down-arrow/shade — they already work with a dynamic `panelH`.
- Panel will still exceed 720px tall at 1280×720 and 915px at 412×915, so scrolling (minBoxY/maxBoxY from `panelH`) stays active and must keep working — the scroll code reads `this.panelH`, which is now computed, not hardcoded.

### Tests
none

## Result (attempt 1, desktop)

Tech tree cards are now laid out as top-down columns (name, top-aligned description, price line pinned to the bottom) with equal padding, so text can never overlap — the Momentum card's three-line description no longer rises into its name. Rows take the height of their tallest card and the panel height is derived from the rows plus the Menu button, with equal top/bottom padding; the owned border and the strike-through price line follow each card's new height. Verified with typecheck/lint/tests, the browser smoke run, and a temporary in-smoke visit to the Tech scene at both 1280×720 and 412×915 with no runtime errors (temp code reverted; only src/scenes/TechScene.ts changed).

- Self-review: APPROVE
- Time: 19.9 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/scenes/TechScene.ts | 116 +++++++++++++++++------
 1 file changed, 87 insertions(+), 29 deletions(-)
```
