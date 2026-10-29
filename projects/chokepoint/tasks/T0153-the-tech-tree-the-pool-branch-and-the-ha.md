---
id: T0153
title: "The tech tree: the pool branch and the Haste node"
size: M
priority: 2
status: todo
depends_on: [T0103]
attempts: 0
created: 2026-10-29T12:14:31Z
epic: E2
---

## Goal
E2's third branch on the tech screen: a node that unlocks a new augment into the game's content — the tree stops changing numbers and starts growing the draft pool. The first node is Haste (T0152's gated Epic).

## Details
- A new row on the tech screen under “The draft” (T0110): the muted small label “The pool” (T0103's row-label style) with a single node card, registered the same way T0103/T0110 register their rows.
- The node: “Haste” — 25 coins — card text: “unlocks the Haste augment in the draft.”
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border) plus one new state: while the game has no Haste augment in its content (T0152 not landed), the node shows the locked/dim look with the muted line “not in the game yet” in place of the price, and a tap does nothing (no chime, no balance change). Once Haste is in the content, the node becomes buyable (affordable/unaffordable by the coin balance).
- Buying: 25 coins, T0103's balance pop and two-note chime at 0.1, the owned state (yellow border), saved to the profile's purchased list (T0103's persistence, parsed defensively; a buy is permanent and survives a reload).
- Effect: buying it adds Haste to the draft pool permanently — realized by Haste's own gate (T0152) reading the purchased list, so this task owns only the node, its states and its purchase; the pool flip is T0152's. Either task can land first: the node first, it sits “not in the game yet”; Haste first, it never rolls until the node is bought.
- Layout: the three rows stack (Run start, The draft, The pool) with T0103's row spacing; at 412×915 and 1280×720 every node on every row is visible and buyable — if the stacked rows overflow a screen, the card scrolls vertically (a simple drag) with a small muted down-arrow at the card's bottom edge as the cue. The menu layout (Play/Tech/Ghost/Resume) is untouched.

## Acceptance criteria
- [ ] The tech screen shows a third row, “The pool” (T0103's label style), with one node card: “Haste,” 25 coins.
- [ ] While the game has no Haste augment: the node shows the locked/dim look with the muted line “not in the game yet” (no price) and is unbuyable — a tap does nothing, no chime, no balance change.
- [ ] Once Haste is in the content: the node shows the normal affordable/unaffordable states; buying it pays 25 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload.
- [ ] After buying (with Haste in), the next draft roll can offer Haste (the Epic card); with the node not owned, no draft offers it — node owned iff Haste is rollable.
- [ ] At 412×915 and 1280×720 every node on all three rows is visible and buyable; if a screen's rows overflow, the card scrolls vertically with the muted down-arrow cue.

## Design (architect, desktop)

### Files
- create `src/content/tech/pool.ts` — the "The pool" branch data: `PoolNode` + `POOL_NODES` (Haste, 25). No imports.
- edit `src/core/tech.ts` — one import of `POOL_NODES` (next to the profile import) + `buyPoolNode()`.
- edit `src/scenes/TechScene.ts` — multi-row layout driven by a `rows` list (Run start + new "The pool" row), the "not in the game yet" state, vertical drag-scroll with a muted down arrow.
- edit `tests/core/tech.test.ts` — `buyPoolNode` tests.

### Interfaces
```ts
// src/content/tech/pool.ts
export interface PoolNode { id: string; name: string; line: string; price: number; unlocks: string }
export const POOL_NODES: readonly PoolNode[] = [
  { id: 'haste', name: 'Haste', line: 'unlocks the Haste augment in the draft', price: 25, unlocks: 'haste' },
];
// src/core/tech.ts — body mirrors buyNode(): loadProfile, POOL_NODES.find(id), refuse unknown/owned/
// unaffordable, coins -= price, purchased.push(id), save in try/catch. No `requires` (independent node).
export function buyPoolNode(store: KeyValueStore | undefined, id: string): boolean;
// TechScene
interface RowNode { id: string; name: string; line: string; price: number; requires: string | null; unlocks: string | null }
private rows: RowNode[][] = [
  TECH_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: n.requires, unlocks: null })),
  POOL_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: n.unlocks })),
];
```
A new branch = one more `rows` entry, placed where it belongs (T0110's "The draft" row goes between these two when it lands). The node id `'haste'` equals the augment id: T0152's gate reads this id from `profile.purchased` — do not rename it.

### Steps
1. `pool.ts` exactly as above.
2. `buyPoolNode` in `core/tech.ts` as above.
3. `TechScene.rebuild()`: build the card button/name/effect/price/coin/border per node exactly as today, then stack rows top-down (values are the `+ N` in the existing `-this.panelH/2 + N` style, measured from the panel top): title 52, balance 96, first label 132 (narrow) / 140 (wide); per row: card-row centers at label+73+i·112 (grid rows = 1 wide, ceil(n/2) narrow); next label = last card center + 50 + 31; card x: wide centered at pitch 172 (n=1→0, n=2→±86, n=4→±258,±86), narrow two columns ±86 with an odd final card alone at 0; menu button at last row bottom + 52 (`makeButton(this, 0, menuY - panelH/2, 'Menu', exit, {width:240,height:52,radius:26})`); `panelH = menuY + 54` (the single-row case lands within 3 px of today's 470/372). Row labels: `'Run start'` and `'The pool'`, both `textStyle(14, PALETTE.muted)`.
4. `refresh()`: per card, in order — owned (yellow border, muted `'owned'`, coin hidden, alpha 1) → run-start locked, `requires` not owned (muted `'needs the previous'`, alpha 0.5) → **new state** `node.unlocks !== null && !AUGMENTS.some((a) => a.id === node.unlocks)`: muted `'not in the game yet'` centered like the locked line, coin hidden, alpha 0.5 → for sale (price ink or red by coins, coin row, alpha 1/0.6). `setEnabled(afford && unlocked && inContent && !owned)`.
5. `buy(node: RowNode)`: first line `if (node.unlocks !== null && !AUGMENTS.some((a) => a.id === node.unlocks)) return;` then `node.unlocks === null ? buyNode(...) : buyPoolNode(...)`; on success keep the existing balance pop + `techBuy()` + `refresh()`.
6. Scroll: make `shade` a class field; new fields `arrow` (scene-level `Graphics`, depth 3, `fillStyle(PALETTE.muted, 1)`, `fillTriangle(-9, -5, 9, -5, 0, 5)`, hidden, drawn once in `create()`), `dragOffset`, `dragging`, `minBoxY`, `maxBoxY`, `scrollable`. In `layout()`: `s = Math.min(1, (width - 24) / this.panelW)` (width only); `half = panelH*s/2`; `minBoxY = 12 + half`; `maxBoxY = height - 12 - half`; `scrollable = maxBoxY > minBoxY`; scrollable → `box.x = width/2`, `box.y = Clamp(box.y, minBoxY, maxBoxY)`, else `box.setPosition(width/2, height/2)`; arrow at `(width/2, height - 18)`, visible when `scrollable && box.y < maxBoxY - 0.5`. In `rebuild()`: `panel.setInteractive(); panel.on('pointerdown', (p) => { if (!this.scrollable) return; if (this.input.hitTestPointer(p).some((o) => o !== panel && o !== shade)) return; this.dragOffset = pointerCss(p).y - this.box!.y; this.dragging = true; })` and reset `dragging = false`. In `create()`: named handlers `this.onDrag` (while `dragging`: `box.y = Clamp(pointerCss(p).y - dragOffset, minBoxY, maxBoxY)`, refresh arrow visibility) and `this.onDragEnd` (`dragging = false`); `this.input.on('pointermove', this.onDrag); this.input.on('pointerup', this.onDragEnd);` and `this.events.once('shutdown', ...)` removing both.

### Pitfalls
- The drag must not swallow a card press: `hitTestPointer` always includes the shade and every card under the finger — start the drag only when nothing but panel+shade is under the pointer, or scrolling from a card also buys it.
- The arrow is a child of the scene, not the box: when the panel overflows the screen its bottom edge is off-screen, so a cue attached to the panel would never be seen.
- The drag listeners live on `this.input`, not on destroyed objects — remove them on shutdown; reset `dragging`/`scrollable` in `rebuild()` (a kind flip rebuilds) and let `layout()` re-clamp.
- Don't add the pool node to `TECH_NODES`: `startBonuses` and the existing tests treat it as the run-start chain; the pool has its own `POOL_NODES` + `buyPoolNode`.
- Everything must work with T0110 and T0152 both absent: the pool row is simply the second row and the node sits "not in the game yet" (disabled — no chime, no balance change).

### Tests
- In `tests/core/tech.test.ts`: `POOL_NODES` maps to `[['haste', 25, 'haste']]`; `buyPoolNode` refuses unknown/already-owned/unaffordable (24 coins → false, coins unchanged); a buy deducts 25 and saves `'haste'` alongside `'gold-1'`; `startBonuses(['haste'])` is `{ gold: 0, life: 0 }`. No `INVARIANTS` line: the tech screen is a menu overlay, and `runChecks` only runs in GameScene.
