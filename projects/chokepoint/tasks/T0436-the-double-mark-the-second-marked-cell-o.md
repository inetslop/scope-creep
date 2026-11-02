---
id: T0436
title: "The double mark: the second marked cell on some boards"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T17:22:19Z
---

## Goal
About one board in four carries a second marked cell, so placement reads two guaranteed strong cells instead of one — the marked cell's own mark and buff, nothing new to learn.

## Details
- ~1-in-4 boards (the seed-hash decision, the twin's own frequency and determinism pattern) mark a second open build cell, a different cell from the first mark, derived from the board's own seed the way the marked cell is; the first mark is untouched — every board still has exactly one first mark.
- The second cell wears the marked cell's own ground mark and the same buff: a tower built on it deals 1.25× damage, 1.5× with The rich cell — the buff reads through the marked cell's own rule, so the tech node, the panel's "marked · +N% damage" line and the marked cell's one-time chip all work on both cells with no change.
- No exclusivity: the double mark does not change the road, so it coexists with the fork, the loop, the cove and the twin.
- The boards reference gains its row: "The double mark — some boards", with its own committed seed and mini board (the twin row's pattern, the next free committed seed).
- No new teach: the marked cell's one-time chip already says what the mark means; the second one is the same mark.

## Acceptance criteria
- [ ] ~1-in-4 boards (hash-rate test, the twin.test's pattern) carry exactly 2 marked cells on different cells, deterministic per seed; no-hash boards keep exactly the one first mark; every board has exactly one first mark.
- [ ] A tower built on the second cell deals the marked cell's own buff (1.25×, 1.5× with The rich cell), shows the panel's marked line, and the marked cell's one-time chip works on it.
- [ ] The boards reference shows the row with its committed-seed mini board; a runChecks invariant (two marks, different cells) passes; the cove/loop/twin/boardFacts tests are untouched (no exclusivity); `npm run check` and the desktop + mobile smoke pass.

## Design (architect, cachyos-x8664)

### Files
- edit `src/core/markedCell.ts` — add `boardHasDoubleMark(seed)` + `markedCells(map, seed): Cell[]`; keep `markedCell` + `MARKED_DMG_MUL` unchanged.
- edit `src/systems/Board.ts` — `marked: Cell` → `Cell[]`; `onMarked` = membership; `drawCells()` passes the list.
- edit `src/art/board.ts` — `drawBoard`/`paintBoard`/`paintBoardPreview` take `marked: Cell[]`; dot each in `PALETTE.yellow`.
- edit `src/scenes/GameScene.ts` (137), `PickScene.ts` (129), `BoardFactsScene.ts` (110) — `markedCell(...)` → `markedCells(...)`; import `markedCells`.
- edit `src/core/boardFacts.ts` — `BoardFactMark` union add `'dblmark'`; row after `markedcell`; `BOARD_FACT_SEEDS.dblmark = {seed: 10}`.
- edit `src/debug/runChecks.ts` — add `['board.doubleMark', ...]` after `['board.twin', ...]`.
- edit `tests/core/boardFacts.test.ts` (mark list + `facts` case) and `tests/core/markedCell.test.ts` (new tests).

### Interfaces
```ts
// src/core/markedCell.ts
export function boardHasDoubleMark(seed: number): boolean;        // FNV-1a `dblmark:${seed}`, %4===0, ~1 in 4
export function markedCells(map: GameMap, seed: number): Cell[];  // [first] or [first, second]
// markedCell(map,seed): Cell, MARKED_DMG_MUL unchanged.
// src/systems/Board.ts: readonly marked: Cell[]; onMarked(cell): boolean (membership).
// src/art/board.ts: drawBoard/paintBoard/paintBoardPreview(..., marked: Cell[]): string.
```

### Steps
1. `src/core/markedCell.ts`: add `boardHasDoubleMark` (copy `boardHasTwin` from `src/core/twin.ts`, salt `` `dblmark:${seed}` ``) and `markedCells`: `first = markedCell(map, seed)`; if `!boardHasDoubleMark(seed)` return `[first]`; else build the `opens` list (same loop as `markedCell`) and `i = new Rng(seed).int(0, opens.length-1)` (same draw), return `[first, opens[(i+1)%opens.length]!]`.
2. `src/systems/Board.ts`: `marked` → `Cell[]` (field 23, ctor 40); `onMarked` → `this.marked.some((c) => c.col===cell.col && c.row===cell.row)`; `drawCells` (56) passes `this.marked`.
3. `src/art/board.ts`: `marked: Cell` → `Cell[]` on `drawBoard` (15), `paintBoard` (154), `paintBoardPreview` (172); in `drawBoard` set `ctx.fillStyle = rgba(PALETTE.yellow,1)` before the loop, then `for (const m of marked)` do `ctx.beginPath(); ctx.arc((m.col+0.5)*CELL,(m.row+0.5)*CELL, CELL*0.16); ctx.fill()`.
4. `src/scenes/GameScene.ts` 137: `const marked = markedCells(map, seed);` (142 `new Board(this, map, marked, sfx)` unchanged in shape).
5. `PickScene.ts` 129 / `BoardFactsScene.ts` 110: pass `markedCells(...)`; swap each import to `markedCells`.
6. `src/core/boardFacts.ts`: union add `'dblmark'`; row `{mark:'dblmark', name:'The double mark', meaning:'a second marked cell, the same mark and the same buff', tag:{kind:'some'}}` after `markedcell`; `BOARD_FACT_SEEDS.dblmark = {seed: 10}`.
7. `src/debug/runChecks.ts`: after `['board.twin', ...]` add
```ts
['board.doubleMark', (g) => {
  const m = g.board.marked;
  if (m.length < 1 || m.length > 2) return `the board's ${m.length} marked cells`;
  for (const c of m) if (g.board.map.kinds[c.row]![c.col] !== 'open') return `a marked cell is not buildable at (${c.col}, ${c.row})`;
  for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) if (m[i]!.col === m[j]!.col && m[i]!.row === m[j]!.row) return `two marks share (${m[i]!.col}, ${m[i]!.row})`;
  return null;
}],
```
8. Update the two test files (see Tests).

### Pitfalls
- `boardFacts.test.ts` test 1 hardcodes the exact 11-mark list and test 3 has `default: throw` — both break unless the `dblmark` line + case are added. "The boardFacts test is untouched" means no-exclusivity preserved (the double mark coexists with fork/loop/cove/twin); the `npm run check must pass` clause overrides a literal no-edit reading. The cove/loop/twin test files themselves are untouched.
- Seed 10 (next free) must actually be a double-mark board so the mini board shows 2 dots; pin via `expect(boardHasDoubleMark(BOARD_FACT_SEEDS.dblmark!.seed)).toBe(true)` in the `facts` case. If the salt makes 10 not work, bump to the next unused free seed (12) that is — the test pins whatever is committed.
- `(i+1)%n` guarantees the 2nd cell ≠ the first and open (n≥2 always); a fresh `new Rng(seed)` (same draw as `markedCell`) is the determinism (a resumed run re-derives it) — never `run.rng`. `markedCell` stays the first mark, so every board keeps exactly one first mark.
- Reuse `MARKED_DMG_MUL` (no new 1.25 constant) so T0386 (rich cell → 1.5) flows through; `Tower.cellMul`, the panel line (`cellMul>1`), `towerDps` and T0389's chip key off `onMarked`/`cellMul`/`MARKED_DMG_MUL`, so they work on the 2nd cell with no change — do NOT touch `Tower.ts`, `TowerSystem.ts`, `RunSave.ts`, `TowerPanel.ts`, `towerDps.ts`.
- `Board.marked` → `Cell[]` is internal-only: its readers are `runChecks` (list) + the paint fns (loop); no Phaser import in `core/`.

### Tests
- `tests/core/markedCell.test.ts` (reuse `makeMap`, add `markedCells`/`boardHasDoubleMark`/`kindAt` to imports): `boardHasDoubleMark` deterministic + ~1 in 4 over 1..4000 (count `>=850 && <=1150`, twin.test pattern); a double-mark board has exactly 2 marks on different open cells and a no-hash board exactly 1, over 1..2000 (`seen` in `[400,800]`); `cells[0]` deep-equals `markedCell(map,seed)`; `markedCells` deterministic (same board → same cells).
- `tests/core/boardFacts.test.ts`: add `'dblmark'` to the mark-order list + a `facts` case asserting `boardHasDoubleMark(s.seed)` true, `markedCells(m, s.seed)` length 2, each open; add `markedCells`+`boardHasDoubleMark` to the import (keep `markedCell`).
