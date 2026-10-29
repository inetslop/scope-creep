---
id: T0208
title: "The tech tree: the board branch — One more bend"
size: L
priority: 2
status: todo
depends_on: [T0103]
attempts: 0
created: 2026-10-29T13:49:24Z
epic: E2
---

## Goal
E2's fourth branch on the tech screen: a node that changes the board of every new run — the tree stops buying numbers and starts shaping the world the run happens in. The first node makes the road wind further.

## Details
- A new row on the tech screen under “The pool” (T0153): the muted small label “The board” (T0103's row-label style) with one node card, registered the same way T0103/T0110/T0153 register their rows (one more `rows` entry; T0153's vertical drag-scroll and down-arrow cue already cover the overflow).
- The node: “One more bend” — 30 coins — card text: “new runs' roads wind one turn further.”
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border). No gate state: the effect is in the game the moment it is bought.
- Buying: 30 coins, T0103's balance pop and two-note chime, the owned state, saved to the profile's purchased list (T0103's persistence, parsed defensively; a buy is permanent and survives a reload). The node id is a plain board effect — it unlocks no augment, so T0153's `unlocks` stays `null` for it and `buyNode`-style storage is used (the architect keeps it consistent with the other branches' pure buy functions in `core/tech.ts`).
- The effect (new runs only): a new run generates its road with **one more bend than today** — the path's bend count (a bend = three consecutive path cells whose direction changes, T0140's definition) is the generator's usual count for that seed, plus one. Everything else — board size, rocks, entrance, exit — generates as today. The bend-adjacent cells (the worth-more cells, pillar 1) come with it: a windier road means more corners to build on, and the T0140 notches show where. Ghost runs (T0078) and resumed runs keep their exact board — the node shapes new runs, not saved ones.
- The effect is read where a new run already reads the profile's purchased list (T0103's start-bonuses wiring — the same place that loads `purchased` for `startBonuses`, see T0152's design step 10): a board-growth parameter flows from the purchased list to the path generator (the bend count is the generator's knob; the architect names the exact parameter in the design). With the node not owned the parameter's default keeps every generated board byte-identical to today.
- Layout: the four rows stack (Run start, The draft, The pool, The board) with T0103's row spacing; at 412×915 and 1280×720 every node on every row is visible and buyable — the existing scroll (T0153) covers the overflow. The menu layout (Play/Tech/Ghost/Resume) is untouched.

## Acceptance criteria
- [ ] The tech screen shows a fourth row, “The board” (T0103's label style), with one node card: “One more bend,” 30 coins.
- [ ] Buying it pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload; with fewer than 30 coins it dims with a red price and a tap does nothing.
- [ ] A unit test (at least 5 seeds, same seed bought vs. not bought): the owned run's path has exactly one more bend than the unowned one, and both are valid boards (size, entrance, exit, walkable path).
- [ ] In play, a new run with the node owned has a windier road (one more turn; the T0140 bend notches mark it); a ghost run of a saved board and a resumed run are byte-identical to before.
- [ ] With the node not owned, every generated board is byte-identical to today on every seed.
- [ ] At 412×915 and 1280×720 every node on all four rows is visible and buyable; the scroll cue behaves as today.

## Design (architect, desktop)

### Files
- create `src/content/tech/board.ts` - the "The board" branch data (one node: "One more bend", 30 coins)
- edit `src/core/tech.ts` - add `boardBends()` (purchased → extra bends) and `buyBoardNode()` next to `startBonuses`/`buyPoolNode`
- edit `src/core/map.ts` - `generateMap` gains `extraBends` knob (entrance jog) + new `mapExtraBends()`
- edit `src/core/saveRun.ts` - `SavedRun` gains `bends` so a resumed run regenerates the exact board
- edit `src/systems/RunSave.ts` - persist writes `bends: mapExtraBends(this.game.board.map)`
- edit `src/scenes/GameScene.ts` - compute the bends for the new run and pass to `generateMap`
- edit `src/scenes/TechScene.ts` - the "The board" row: one more `rows` entry, `ROW_LABELS` label, `branch` field, buy dispatch
- edit `src/debug/runChecks.ts` - one `board.path` invariant (road contiguous, no self-crossing)
- edit `tests/core/map.test.ts`, `tests/core/tech.test.ts`, `tests/core/saveRun.test.ts` - unit tests

### Interfaces
```ts
// src/content/tech/board.ts
export interface BoardNode { id: string; name: string; line: string; price: number; /** extra bends a new run's road gets */ bends: number; }
export const BOARD_NODES: readonly BoardNode[]; // one entry: { id: 'one-more-bend', name: 'One more bend', line: "new runs' roads wind one turn further", price: 30, bends: 1 }

// src/core/tech.ts
export function boardBends(owned: readonly string[]): number; // like startBonuses: sum node.bends over owned, dedup, unknown ids 0
export function buyBoardNode(store: KeyValueStore | undefined, id: string): boolean; // exact copy of buyPoolNode's body with BOARD_NODES

// src/core/map.ts
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0): GameMap;
export function mapExtraBends(map: GameMap): number; // 1 when path[1] is not one step along the entrance axis from path[0], else 0

// src/core/saveRun.ts — SavedRun gains, after `rows`:
bends: number; // 0 in older saves; loadSavedRun: reject if p.bends is defined and not 0/1, return `bends: p.bends === 1 ? 1 : 0`

// src/scenes/TechScene.ts — RowNode gains: branch: 'tech' | 'pool' | 'board';
```
Jog inside `generateMap`, right after `const path: Cell[] = [toCell(along, across)];`:
```ts
  if (extraBends >= 1) {
    // The entrance jog: one cell sideways on the entrance row before the first run, so the
    // road's second cell is a turn (one more bend). No rng draw, so the rest keeps this
    // seed's usual draws. Needs width >= 5 (the boards are 8).
    across += 1;
    path.push(toCell(along, across));
  }
```

### Steps
1. Create `board.ts` (model on `content/tech/pool.ts`).
2. `core/tech.ts`: import `BOARD_NODES`; add `boardBends` after `startBonuses`; add `buyBoardNode` after `buyPoolNode` (same body, `BOARD_NODES`, same "no prerequisites" doc).
3. `core/map.ts`: add the parameter + jog (code above) + `mapExtraBends` after `generateMap`.
4. `core/saveRun.ts`: field + the one validation line after the `rows` check (`if (p.bends !== undefined && p.bends !== 0 && p.bends !== 1) return undefined;`) + `bends: p.bends === 1 ? 1 : 0` in the returned object.
5. `systems/RunSave.ts`: import `mapExtraBends`; in `persist`, after `rows:`, add `bends: mapExtraBends(this.game.board.map),`.
6. `scenes/GameScene.ts`: import `boardBends` (line 8, next to `startBonuses`); after the `if (!saved) { ... }` block add `const bends = saved ? saved.bends : ghostSeed === undefined ? boardBends(loadProfile(window.localStorage).purchased) : 0;` with a comment (resumed runs keep their saved board; ghost runs replay the best board as generated); pass `bends` as `generateMap`'s 5th argument.
7. `scenes/TechScene.ts`: add `branch: 'tech' | 'pool' | 'board'` to `RowNode`; add `branch: 'tech'` / `branch: 'pool'` to the two existing `rows` mappings and append `BOARD_NODES.map((n) => ({ id: n.id, name: n.name, line: n.line, price: n.price, requires: null, unlocks: null, branch: 'board' }))` as the third entry (after "The pool"); `ROW_LABELS = ['Run start', 'The pool', 'The board']`; in `buy()` replace the ternary with `node.branch === 'tech' ? buyNode(store, node.id) : node.branch === 'pool' ? buyPoolNode(store, node.id) : buyBoardNode(store, node.id)`; update the file-header "Two branches so far" comment to three.
8. `runChecks.ts`: after the `'ghost.taken'` line add `['board.path', (g) => { const p = g.board.map.path; const seen = new Set<string>(); for (let i = 0; i < p.length; i++) { const c = p[i]!; const key = \`${c.col},${c.row}\`; if (seen.has(key)) return \`the road crosses itself at (${c.col}, ${c.row})\`; seen.add(key); if (i > 0 && Math.abs(c.col - p[i - 1]!.col) + Math.abs(c.row - p[i - 1]!.row) !== 1) return \`the road jumps at (${c.col}, ${c.row})\`; } return null; }],`.
9. Tests (below). 10. `npm run check`, then `npm run smoke`.

### Pitfalls
- **Buy dispatch**: without the `branch` field the board node (unlocks null) routes to `buyNode` (TECH_NODES) and every purchase silently fails — use the exact dispatch above.
- **No rng draw in the jog** (deterministic `+1`): any draw shifts every later draw and changes the whole board, breaking "same seed, one more bend". Also don't move the jog — the turn count must stay identical (true for the 8-wide boards; the +1-bend guarantee needs width ≥ 5).
- **Ghost/resume must not read the current purchased list**: ghost passes `0`, resume passes `saved.bends`. Reading `boardBends(purchased)` there would jog pre-node saves/boards on resume-after-purchase (towers could land on rocks/path).
- **Older saved runs lack `bends`**: default it to 0, never reject the save.
- `ROW_LABELS` aligns to `rows` by index — append at the end. Panel math is automatic: at 412×915 the three rows fit (no scroll); at 1280×720 it scrolls via T0153's existing drag + arrow — add no scroll code. The new bend sits at `path[1]` (i=1), already covered by the T0140 notch loop — do not touch `art/board.ts`. T0110's "The draft" row (when it lands) goes above "The pool"; this row stays last.
- Ghost runs of a best board recorded *after* buying the node replay it without its jog (the profile only stores the seed) — accepted per spec ("the node shapes new runs, not saved ones"); don't widen scope.

### Tests
- `tests/core/map.test.ts`: local `countBends(path)` (direction changes at `path[i]`, i in 1..len-2); for seeds [1,2,3,4,5,42] and both [14,8]/[8,14]: `countBends(windy.path) === countBends(plain.path) + 1` and the windy board is valid (size, entrance/exit edge, side-adjacent steps, no revisits, `kinds` 'path'), plus `mapExtraBends(plain) === 0` / `mapExtraBends(windy) === 1`.
- `tests/core/tech.test.ts`: mirror the pool tests — `BOARD_NODES` shape `[['one-more-bend', 30, 1]]`; `buyBoardNode` refuses unknown/29 coins/already-owned (coins never below zero), deducts 30 and appends the id; `boardBends(['one-more-bend','one-more-bend','haste']) === 1`, `boardBends([]) === 0`; `startBonuses(['one-more-bend'])` unchanged.
- `tests/core/saveRun.test.ts`: add `bends: 0,` after `rows` in `sample`; `broken({ bends: 2 })`, `broken({ bends: -1 })`; a save written without the key loads with `bends: 0`.
