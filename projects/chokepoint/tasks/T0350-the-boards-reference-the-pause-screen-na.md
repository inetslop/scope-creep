---
id: T0350
title: "The boards reference: the pause screen names the board's modifiers"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T09:12:53Z
epic: E13
---

## Goal
E13 makes the road itself vary — a second gate, a marked cell, a fork to come. A player needs the vocabulary for what a board can be and where each thing comes from, on the pause screen, in the family of the waves, enemies and coins references (T0264, T0252, T0329).

## Details
- A new pause-off reference scene — a sibling of the Coins reference's scene, not the pick screen's Boards scene: a white rounded card titled "Boards," opened from the pause card the way the other references open, and listed where they are listed. Laid out for 412x915 and 1280x720 like its siblings.
- One row per board modifier, left to right: a small muted-ink mark (~24 px), the modifier's name in bold 14 px ink, and one muted 12 px dry line under it. The rows, exactly:
  - **The choke** — "one build cell that reaches the road twice" — tag: always
  - **One more bend** — "the road winds one bend more" — tag: tech · One more bend
  - **The long way** — "the road is longer" — tag: tech · The long way
  - **Two chokes** — "two cells that reach the road twice" — tag: tech · Two chokes
  - **The switchback** — "the road folds back into double cover" — tag: tech · The switchback
  - **The far gate** — "a second gate; a third of each non-boss wave comes through it" — tag: some boards
  - **The marked cell** — "one build cell that makes its tower stronger" — tag: some boards
- The tag is one muted 11 px line (or inline, the references' own tag style) at the row's end. The tech rows read the node's name from the tech's own data (the names are always the tree's, never retyped here) and show "owned" while the profile owns the node; the other rows show their tag as written.
- The marks are short flat fragments of the board's own language (muted ink on the white card; no outline, no glow, no theme): the choke — two road strokes that come within one cell of each other; One more bend — a road with one extra bend; The long way — the same bends, a longer road; Two chokes — two close pairs of strokes; The switchback — two parallel road strokes with build cells between; The far gate — a road with a second gate arrow partway along; The marked cell — a build cell with a small dot on it.
- The rows (mark key, name, meaning, tag kind) live in one small new pure module the scene reads, so a later modifier (the fork) lands by adding one entry there and one mark — no change to the pause card or the sibling references. The tech-tag read (node name, owned state from the tech's own data) is pure and unit-tested.
- Nothing shown twice: the tags point (a node's name, a kind); they never re-state a tech card's price or a pick card's per-board line, and the board itself stays unmarked.

## Acceptance criteria
- [ ] The pause screen offers "Boards" beside the other references; the card opens with the seven rows above, each with mark, name, meaning and tag, and fits its text at 412x915 and 1280x720.
- [ ] Each tech row's tag names the tech tree's own node (read from its data); while the profile owns that node the tag reads "owned".
- [ ] The choke row's tag reads "always"; the far gate and marked cell rows' tags read "some boards".
- [ ] The other pause screens (Summary, waves, enemies, coins references) and the tech tree are unchanged; adding a modifier means one entry in the module plus one mark.

## Design (architect, desktop)

### Files
- create `src/core/boardFacts.ts` — pure rows + `boardFactTag()` (the seven modifiers, tech-tag resolution from `BOARD_NODES`)
- create `src/ui/boardFactMarks.ts` — `paintBoardFactMark(g, mark)`: seven flat muted-ink fragments on a `Graphics`, 24 px box
- create `src/scenes/BoardFactsScene.ts` — the "Boards" reference scene, clone of `BossesScene`'s skeleton
- edit `src/scenes/keys.ts` — add `boardFacts: 'BoardFacts',` after `coins: 'Coins',` (the key `'Boards'` is already the leaderboards' BoardsScene — do not reuse it)
- edit `src/main.ts` — `import { BoardFactsScene } from './scenes/BoardFactsScene';` before the BoardsScene import (alphabetical); add `BoardFactsScene` in the scene array right after `CoinsScene`
- edit `src/scenes/PauseScene.ts` — one CONTROLS line + the Boards button (details in Steps)
- create `tests/core/boardFacts.test.ts` — unit tests for the pure module

### Interfaces
```ts
// src/core/boardFacts.ts
import { BOARD_NODES } from '../content/tech/board';

export type BoardFactMark = 'choke' | 'bend' | 'longway' | 'twochokes' | 'switchback' | 'fargate' | 'markedcell';
export type BoardFactTag = { kind: 'always' } | { kind: 'some' } | { kind: 'tech'; node: string };
export interface BoardFactRow { mark: BoardFactMark; name: string; meaning: string; tag: BoardFactTag; }

export const BOARD_FACTS: readonly BoardFactRow[] = [
  { mark: 'choke', name: 'The choke', meaning: 'one build cell that reaches the road twice', tag: { kind: 'always' } },
  { mark: 'bend', name: 'One more bend', meaning: 'the road winds one bend more', tag: { kind: 'tech', node: 'one-more-bend' } },
  { mark: 'longway', name: 'The long way', meaning: 'the road is longer', tag: { kind: 'tech', node: 'long-way' } },
  { mark: 'twochokes', name: 'Two chokes', meaning: 'two cells that reach the road twice', tag: { kind: 'tech', node: 'two-chokes' } },
  { mark: 'switchback', name: 'The switchback', meaning: 'the road folds back into double cover', tag: { kind: 'tech', node: 'switchback' } },
  { mark: 'fargate', name: 'The far gate', meaning: 'a second gate; a third of each non-boss wave comes through it', tag: { kind: 'some' } },
  { mark: 'markedcell', name: 'The marked cell', meaning: 'one build cell that makes its tower stronger', tag: { kind: 'some' } },
];

/** "always", "some boards", the tree's own node name, or "owned" while the profile owns it. */
export function boardFactTag(row: BoardFactRow, purchased: readonly string[]): string {
  if (row.tag.kind === 'always') return 'always';
  if (row.tag.kind === 'some') return 'some boards';
  if (purchased.includes(row.tag.node)) return 'owned';
  return BOARD_NODES.find((n) => n.id === row.tag.node)?.name ?? '';
}
```
```ts
// src/ui/boardFactMarks.ts — all shapes PALETTE.muted, axis-aligned "road" = fillRoundedRect 3 px thick, radius 1.5
export function paintBoardFactMark(g: Phaser.GameObjects.Graphics, mark: BoardFactMark): void
```
Scene `build()` (in `BoardFactsScene`, `panelW = 340`): `PAD 16, MARK 24, GAP 10, HEADER 64, BOTTOM 20, ROW_GAP 10`; `innerW = panelW − 2·PAD`, `textW = innerW − MARK − GAP`, `left = −panelW/2 + PAD`, `textX = left + MARK + GAP`. Per row: mark Graphics at `(left + MARK/2, rowTop + h/2)`; name `titleStyle(14)` origin (0, 0.5) at `(textX, rowTop + name.height/2)`; tag `textStyle(11, PALETTE.muted, )` origin (1, 0.5) at `(left + innerW, same y)`; meaning `textStyle(12, PALETTE.muted, { wordWrap: { width: textW } })` at `(textX, rowTop + name.height + 3)`; `h = name.height + 3 + meaning.height`; `panelH = HEADER + Σ(h + ROW_GAP) − ROW_GAP + BOTTOM`; title `'Boards'` `titleStyle(28)` at `(0, −panelH/2 + 42)`, exactly like `BossesScene.build()`. `create()` = `BossesScene.create()` with `SCENES.boardFacts` everywhere, title button label none, `getSfx(this)?.blip()` in `doBack`, and `if (flags.smoke) this.time.delayedCall(1000, doBack)`.

### Steps
1. Write `src/core/boardFacts.ts` exactly as above.
2. Write `src/ui/boardFactMarks.ts`: a local `road(g, x1, y1, x2, y2)` (rounded 3 px bar) and a `switch (mark)` with one case per mark, coords in a 24 px box centered on (0,0): `choke` — `road(-4,-9,-4,9)`, `road(4,-9,4,9)`; `bend` — `road(-9,8,-9,-2)`, `road(-9,-2,2,-2)`, `road(2,-2,2,8)` (an S, two corners); `longway` — `road(-10,7,-10,-7)`, `road(-10,-7,10,-7)` (one corner, longer); `twochokes` — `road(-9,±)`, `road(-3,±)`, `road(3,±)`, `road(9,±)` all y −8..8 (two close pairs); `switchback` — `road(-10,-5,10,-5)`, `road(-10,5,10,5)` plus `fillRoundedRect(-2.5,-2.5,5,5,1.5)` between; `fargate` — `road(-10,0,10,0)`, gate tick `road(-10,-4,-10,4)`, arrow `fillTriangle(2,-4,2,4,7,0)`; `markedcell` — `fillRoundedRect(-5,-5,10,10,3)` with a `fillCircle(0,0,2)` in `PALETTE.card` on top.
3. Write `src/scenes/BoardFactsScene.ts` from `BossesScene.ts` (same file skeleton: fields, constructor, `create()` shade/back/layout/smoke, `build()` per the spec above; `purchased` from `loadProfile(window.localStorage).purchased`).
4. Edit `src/scenes/keys.ts` (+1 line) and `src/main.ts` (import + array entry, positions above).
5. Edit `src/scenes/PauseScene.ts`: in `CONTROLS` add `'Boards — the gates, chokes and folds a board can have'` after `'Coins — how a run pays'`; after the coins block add `showBoards` (`this.scene.launch(SCENES.boardFacts)` + `this.scene.pause()`, same comment as the siblings) and `const boardsButton = makeButton(this, 0, 0, 'Boards', showBoards, { width: 240, height: 52, radius: 26 });`; in the `h +=` sum line add one more `+ GAP_S + 52` before `PAD`; after `coinsButton.container.setY(cy(52));` add `y += GAP_S; boardsButton.container.setY(cy(52));`; append `boardsButton.container` after `coinsButton.container` in `boxKids`.
6. Write `tests/core/boardFacts.test.ts` (below), run `npm run check`.

### Pitfalls
- The key `'Boards'` and class `BoardsScene` already exist (leaderboards, over the menu) — the new scene is `BoardFactsScene` / `'BoardFacts'`; the card title text is still `'Boards'`.
- The pause `h` sum is hand-written (`56 + 9 × 52`): missing the extra `+ GAP_S + 52` puts the new button under the card's bottom edge.
- Tech names come only from `BOARD_NODES` — never retype them; "Nothing shown twice": no prices, no per-board lines, board stays unmarked, tech tree untouched.
- Card scales to fit (`Math.min(1, (width−24)/panelW, (height−24)/panelH)`), no scroll; fullest state (far-gate meaning wraps to 2 lines, longest tag `'The switchback'` beside name `'The marked cell'`) fits 340 px wide.
- Marks are flat `PALETTE.muted` fills (plus the one `PALETTE.card` dot) — no strokes-with-outline look, no glow, no texture painter.
- Later modifier = one entry in `BOARD_FACTS` + one case in `paintBoardFactMark`; no pause/sibling edits.

### Tests
- `tests/core/boardFacts.test.ts`: rows in order with their mark keys; tech tags point at real `BOARD_NODES` ids `['one-more-bend','long-way','two-chokes','switchback']`; `boardFactTag` → `'always'` (choke), `'some boards'` (far gate, marked cell), tree's own name when unowned (`'One more bend'`), `'owned'` when `purchased` contains the id.
