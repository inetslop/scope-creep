---
id: T0340
title: "The marked cell: the board's one cell that makes its tower stronger"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T05:06:52Z
epic: E13
---

## Goal
Every board gets one marked build cell: a tower built on it deals +25% more damage. The board preview shows where it is before the run, so every island has a power cell to weigh against placement — a build that held one island fails on the next for a new reason (E13).

## Details
- **The cell:** every generated board has exactly one marked cell, chosen from its free build cells by the board's seed (same seed, same cell; never a road cell or a rock). It may coincide with the guaranteed choke cell — the choke shows nothing, so nothing conflicts.
- **The effect:** a tower built on the marked cell deals +25% damage: its per-hit damage and its beam's per-second rate are ×1.25; range, attack rate, gold, burn ticks and control durations are unchanged. A support tower with no damage of its own (Rally, Frost, Anchor, Push, Mint, Toll, Haste) gets nothing on the cell. Selling the tower frees the cell; a new tower built on it gets the buff.
- **The look:** a small flat dot in the milestone yellow (the coin's yellow) in the center of the marked cell's face, about a third of the face wide, drawn wherever the board is drawn; it is hidden while a tower stands on the cell (the tower's look wins) and reappears the moment the cell is free again.
- **The pick screen:** each board card's preview shows the dot, and the card carries one muted row — "one cell · +25% damage" — in the level-row language; the row fits the card's text at 412x915 and 1280x720.
- **The tower panel:** no new row. The "≈ N/s" line for a tower on the cell reads ×1.25 the same tower's line off the cell — the pure dps formula gains the cell factor as one more term, with unit tests next to its existing ones.
- **No save field:** the marked cell is derived from the board seed; a resumed run re-derives the same cell and a tower on it is still buffed.
- **Why the screen has room (board bar):** the dot is the one visible expression of a cell that changes the rules — without it the +25% is invisible and the placement decision the cell is about cannot be made; it is not a hint, a teach or a decoration, and it replaces nothing (the guaranteed choke shows nothing).

## Acceptance criteria
- [ ] Every fresh board shows exactly one yellow dot on a build cell's face; generating the same seed twice shows it on the same cell; road cells and rocks never carry it.
- [ ] A Common Bolt (12 damage) built on the marked cell hits for 15 per shot; the same Bolt on any other cell hits for 12.
- [ ] A Beam tower (14 per second) on the marked cell deals 25% more per second than the same tower off the cell (14 → 17.5 per second, in the beam's own ticks).
- [ ] A support tower (Rally, Frost, Anchor, Push, Mint, Toll or Haste) on the marked cell behaves exactly as off it.
- [ ] While a tower stands on the marked cell the dot is hidden; selling that tower brings the dot back on the free cell.
- [ ] The pick screen's board cards show the dot in the preview and the muted row "one cell · +25% damage"; the card still fits its text at 412x915 and 1280x720.
- [ ] The tower panel's "≈ N/s" line for a tower on the cell is 1.25× the same tower's line off the cell, all else equal; the pure formula's unit tests cover the cell factor.
- [ ] Closing the tab mid-run and resuming leaves the marked cell on the same cell, with a tower on it still dealing +25%.

## Design (architect, desktop)

### Files
- create `src/core/markedCell.ts` - the marked cell: pure rule (seed → one open build cell) + the `MARKED_DMG_MUL` constant
- create `tests/core/markedCell.test.ts` - unit tests for the cell
- edit `src/art/board.ts` - `drawBoard` paints the yellow dot; `paintBoard`/`paintBoardPreview` take the marked cell
- edit `src/systems/Board.ts` - keep `marked` cell, expose `onMarked()`, pass it to `paintBoard`
- edit `src/scenes/GameScene.ts` - derive the cell from the run seed, hand it to `Board` (2 lines)
- edit `src/entities/Tower.ts` - new field `cellMul`
- edit `src/systems/TowerSystem.ts` - set `cellMul` in `build()`, multiply `payload.damage`
- edit `src/systems/attacks/pulse.ts` - the Bolt bolts a pulse fires use `spec.boltDamage`: multiply it too
- edit `src/systems/BeamSystem.ts` - fold the cell factor into the beams' single rate factor `m`
- edit `src/systems/RunSave.ts` - set `cellMul` on restored towers (the second tower-creation path)
- edit `src/core/towerDps.ts` - third parameter `cellMul` on the hit/beam terms only
- edit `src/ui/hud/TowerPanel.ts` - pass `tower.cellMul` to `towerDps` (1 line, no new row)
- edit `src/scenes/SummaryScene.ts` - pass `t.cellMul` to `towerDps` (1 line)
- edit `src/scenes/PickScene.ts` - preview shows the dot + the muted "one cell · +25% damage" row
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/core/towerDps.test.ts` - cell-factor cases next to the existing ones

### Interfaces
```ts
// src/core/markedCell.ts (new)
export const MARKED_DMG_MUL = 1.25;
/** One of the map's 'open' cells, chosen by the board's own seed (fresh Rng, never run.rng). */
export function markedCell(map: GameMap, seed: number): Cell;

// src/core/towerDps.ts (changed)
export function towerDps(spec: TowerSpec, rallyRateMul = 1, cellMul = 1): number;
// cellMul multiplies the beam, shot/pulse and spray terms; NOT the burn term and NOT supports.

// src/entities/Tower.ts (new field, after hasteRatePct)
cellMul = 1; // 1.25 when the tower stands on the board's marked cell

// src/systems/Board.ts
constructor(scene: Phaser.Scene, map: GameMap, marked: Cell);
readonly marked: Cell;
onMarked(cell: Cell): boolean; // col and row equal to this.marked

// src/art/board.ts (changed)
export function paintBoard(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine, marked: Cell): string;
export function paintBoardPreview(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine, marked: Cell, px = 1): string;
```

### Steps
1. `src/core/markedCell.ts`: loop rows/cols, collect `kinds[row][col] === 'open'` cells, return `opens[new Rng(seed).int(0, opens.length - 1)]!`. Doc: same seed same cell; resumed runs re-derive; may coincide with a choke (the choke shows nothing).
2. `drawBoard` in `src/art/board.ts`: after the grid dots, before the rocks, paint the dot flat (no shadow, no side face): `ctx.fillStyle = rgba(PALETTE.yellow, 1); ctx.beginPath(); ctx.arc((marked.col + 0.5) * CELL, (marked.row + 0.5) * CELL, CELL * 0.17, 0, Math.PI * 2); ctx.fill();` (≈ a third of the face wide). Import `type Cell`. Thread `marked` through both paint functions. The tower plinth (0.8-cell square, centered on the cell, at `DEPTH.towers`) covers the 0.34-cell dot, so "hidden while a tower stands / back when free" works with the baked texture — do not add any toggling object.
3. `src/systems/Board.ts`: new ctor param `marked: Cell` stored as `readonly marked`; `onMarked()`; `drawCells()` passes `this.marked` to `paintBoard`.
4. `src/scenes/GameScene.ts`: after `const map = generateMap(...)` (line ~122): `const marked = markedCell(map, seed);` (the `seed` from line 92) and `this.board = new Board(this, map, marked);`.
5. `src/entities/Tower.ts`: add `cellMul = 1;` with the doc line above.
6. `src/systems/TowerSystem.ts`: in `build()`, after `new Tower(...)`: `tower.cellMul = this.board.onMarked(cell) ? MARKED_DMG_MUL : 1;`. In `attack()`'s payload: `damage: spec.damage * t.cellMul,`. Import `MARKED_DMG_MUL`.
7. `src/systems/attacks/pulse.ts` line 23: `const boltPayload = { ...payload, damage: spec.boltDamage * tower.cellMul };`.
8. `src/systems/BeamSystem.ts` line 88: `const m = t.spec.beamRapidMul * t.rallyRateMul * t.cellMul;` (one factor feeds the main line, pierce, scorch and rays — do not touch the other four call sites).
9. `src/systems/RunSave.ts` in `restore()`, after `new Tower(...)`: the same `tower.cellMul = game.board.onMarked(cell) ? MARKED_DMG_MUL : 1;` line (restore bypasses `TowerSystem.build`).
10. `src/core/towerDps.ts`: add `cellMul = 1` param; multiply it into the beam term (`(1 + spec.beamRays) * spec.beamDps * m * cellMul`), the shot/pulse term and the spray term; leave the burn term `spec.burn.dps * spec.damageMul` alone; extend the doc comment one sentence.
11. `src/ui/hud/TowerPanel.ts` line 121: `towerDps(tower.spec, tower.rallyRateMul, tower.cellMul)`; `src/scenes/SummaryScene.ts` line 99: `towerDps(t.spec, t.rallyRateMul, t.cellMul)`.
12. `src/scenes/PickScene.ts`: import `markedCell`; in `cards.map` call `paintBoardPreview(this, key, map, pathLineFor(map, CELL), markedCell(map, seed))`. After the `mul` block create `const cellLine = this.add.text(0, 0, 'one cell · +25% damage', textStyle(12, PALETTE.muted, { wordWrap: { width: colW }, lineSpacing: 2 })).setOrigin(0, 0);` then `y += 7 + cellLine.height;`, add `cellLine` to `CardParts` and return it. In the placement loop, right after the `if (c.mul)` block: `c.cellLine.setPosition(colX, colTop + ey + (c.mul ? c.mul.height : 0) + 7); kids.push(c.cellLine);` — measurement and placement both flow from the measured `y`/`ey`, so the card grows to fit at 412x915 and 1280x720 (the box shrink-to-fit in `layoutView` absorbs the rest).
13. `src/debug/runChecks.ts`: after the `towers.crit` entry add `['towers.markedCell', (g) => { for (const t of g.towers.towers) { const want = g.board.onMarked(t.cell) ? MARKED_DMG_MUL : 1; if (t.cellMul !== want) return `a tower at (${t.cell.col}, ${t.cell.row}) has marked-cell factor ${t.cellMul}, expected ${want}`; } return null; }],` and import `MARKED_DMG_MUL`.
14. `npm run check`, then `npm run smoke`.

### Pitfalls
- Two tower-creation paths: missing the `RunSave.restore` assignment silently un-buffs resumed towers (acceptance criterion).
- Never draw from `run.rng` for the cell — a fresh `new Rng(seed)` (like `boardCode`) keeps every other seeded draw of the run byte-identical to today.
- Keep the dot exactly at the cell center: the plinth only covers it because both are centered; an offset dot peeks out from under the tower.
- Do not put the factor in `towerSpec`/`TowerSpec` (pure augment data) and do not apply it to the burn term, gold, rate or range — the burn must keep ticking exactly as set.
- `pulse.ts`'s bolt payload overrides `payload.damage` with `spec.boltDamage`; forgetting it leaves Bolt-on-pulse shots un-buffed on the cell.
- The PickScene row is measured text: never give it a hand-picked y offset, or it overlaps at narrow widths.

### Tests
- `tests/core/markedCell.test.ts`: for 14x8 and 8x14, 200 seeds — the cell is `kindAt === 'open'` (never road/rock); same seed regenerated gives the same cell (resume); `MARKED_DMG_MUL` is 1.25 and `12 * MARKED_DMG_MUL === 15`; 50 distinct boards mark more than one distinct cell.
- `tests/core/towerDps.test.ts`: `towerDps(spec('bolt'), 1, 1.25)` ≈ 24; `towerDps(spec('beam'), 1, 1.25)` ≈ 17.5; `towerDps(spec('bolt', 'ember'), 1, 1.25)` ≈ 19.2 * 1.25 + 3 (burn unchanged); `towerDps(spec('frost'), 1, 1.25)` === 0 (support gets nothing).
