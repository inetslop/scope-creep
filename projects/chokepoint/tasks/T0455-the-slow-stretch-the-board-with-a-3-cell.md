---
id: T0455
title: "The slow stretch: the board with a 3-cell slow run of road"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T00:11:22Z
---

## Goal
About 1 in 4 boards carries a slow stretch: a 3-cell run of road where every walker crosses at 70% of its speed. The board's face gives one stretch of road double value — towers covering it get ~40% more shots at every enemy that crosses it — and the tint says where it is before the first wave. A board modifier in the cove, twin and loop's family (non-epic).

## Details
- The roll and the growth: on the board's growth from the seed, a ~1-in-4 seeded roll (the cove's, twin's and loop's pattern), independent of every other modifier — the fork, the loop, the cove, the twin, the far gate, the switchback's corridor and the marked cell (and its double mark) all compose with it; the stretch is a property of road cells, not a shape, so it sits on whatever road the seed grows.
- The stretch: 3 consecutive cells of the road. The choice favors straight runs: if the road has a straight run of 3+ cells, take the middle 3 of its longest straight run (a run of exactly 3 takes it whole); on the rare board with no straight run of 3 cells, take 3 consecutive cells around one bend (the bend chosen at random). The stretch must have at least one build cell on each side of the road (a stretch you can cover); if the chosen cells fail that, the board grows without the stretch — a quality promise, not a road feature (T0452's phrasing).
- The effect: an enemy whose center is on a stretch cell walks at 70% of its current speed — after every other speed change, so the thin road node's 10%, Haste's +30% and a Sprinter's ramp all compose with it (the stretch multiplies whatever the enemy would walk). It applies the moment the enemy's center enters the first stretch cell and ends the moment it leaves the last. A Dasher's committed dash is not slowed (the surge is a fixed 3 cells, like a Blinker's blink is a fixed hop), and a Flyer's flight is not slowed (it does not walk the road). Gusts, roots and blinks move enemies as they always do — the stretch only multiplies the walk, and an enemy pushed or blinked back onto the stretch walks slow again.
- The look: the 3 cells wear a soft blue tint on the road's own white — the road's surface, not a mark painted over it: no chip, no notch, no border, no number on the cells. A board without the stretch is byte-identical (plain white road, no tinted cell anywhere).
- The readout: the board facts name it in the facts' own dry line on a slow-stretch board (the cove and twin's pattern — "slow stretch"), so a player who sees the tint knows the board did it; the boards reference lists it as a board modifier with its source (the seed's roll, ~1 in 4) in the reference's own row, its small live board showing the tint (T0430/T0424's row pattern). No new HUD element, key, button, teach chip or sound: the tint, the facts line and the reference row are the whole readout, the way the cove and the twin ship their readout.
- Why it makes placing more interesting: an enemy spends 1/0.7 of the time inside the stretch, so a tower whose range covers it takes ~40% more shots at every crossing enemy — the slow run is where a build pays back, and the tint says so at the start of the run. On a rush wave (1.5× walkers) the stretch is where the wave's pace is clawed back (1.5 × 0.7 ≈ 1.05 inside it).
- The run save: nothing new — the stretch is part of the board grown from the seed (as the cove, loop and twin are); a resumed run regrows the same stretched board from its seed.
- The work lives in a new core module beside `src/core/cove.ts` and `src/core/twin.ts` (the closest examples: the seeded roll, the cell choice, the facts line and the reference row all follow them); the walk factor hooks into the enemy's per-frame walk where the thin road node's slow already applies; the road's look tints the 3 cells where the road's white is painted.

## Acceptance criteria
- [ ] A seeded ~1-in-4 roll gives a board the slow stretch, independent of every other board modifier (forked, looped, coved, twin boards can carry it, and it composes with all of them).
- [ ] On a slow-stretch board exactly 3 consecutive road cells wear a soft blue tint on the road's white, with a build cell on each side; no chip, notch, border or number on the cells; a board without the stretch is byte-identical (plain white road).
- [ ] An enemy walking a stretch cell moves at 70% of its current speed, composing with the thin road, Haste and a Sprinter's ramp; it is back to full speed the moment its center leaves the last stretch cell.
- [ ] A Dasher's dash and a Flyer's flight are not slowed by the stretch; an enemy pushed, rooted or blinked onto the stretch walks slow while on it.
- [ ] The board facts name the stretch in the facts' dry line on a slow-stretch board; the boards reference lists it with its seed roll, its row's small live board showing the tint.
- [ ] A resumed run regrows the same stretched board from its seed, with no change to the run save.
- [ ] No new HUD element, key, button, teach or sound; the game plays menu to game over on a stretched board, on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/core/slowStretch.ts` - the roll, the cell choice, the cover promise, the walk factor, the board-unit box
- edit `src/core/map.ts` - `GameMap.slowStretch` field + one stretch line in `generateMap` (after the twin, the last modifier)
- edit `src/entities/Enemy.ts` - `stretchBox` field, reset in `spawn()`, the 70% factor in `advance()`'s shared `speed`
- edit `src/systems/EnemySystem.ts` - compute the box once in the constructor, set it on each spawn (2 lines)
- edit `src/art/board.ts` - the soft-blue tint stroke in `drawBoard`
- edit `src/core/boardFacts.ts` - the mark, the facts row, the committed seed, the new tag kind
- edit `src/ui/boardFactMarks.ts` - one `case` for the mark
- edit `src/debug/runChecks.ts` - one `board.slowStretch` invariant
- create `tests/core/slowStretch.test.ts`

### Interfaces
```ts
// core/slowStretch.ts (imports { roadStretches } from './cove', types from './map' only)
export interface SlowStretch { cells: Cell[]; } // 3 consecutive path cells, walking order
export const SLOW_STRETCH_FACTOR = 0.7;
export function boardHasSlowStretch(seed: number): boolean; // FNV-1a 31-bit of `slowstretch:${seed}` (same loop as cove.ts), % 4 === 0
function slowStretchHash(seed: number): number; // the h >>> 0 behind the roll and the bend pick
export function stretchCovered(map: GameMap, cells: readonly Cell[]): boolean;
export function placeSlowStretch(map: GameMap, seed: number): GameMap | undefined; // { ...map, slowStretch } or undefined (never moves a cell)
export interface StretchBox { minX: number; minY: number; maxX: number; maxY: number; }
export function stretchBox(stretch: SlowStretch, cellSize: number): StretchBox; // union of the 3 cells
```
`core/map.ts`: `slowStretch?: SlowStretch;` on `GameMap` after `twin`; in `generateMap`, after `const twinned = ...`:
```ts
const stretched = seed === undefined || bgen < 2 ? twinned : boardHasSlowStretch(seed) ? placeSlowStretch(twinned, seed) ?? twinned : twinned;
return { ...stretched, farGate: gate };
```
`stretchCovered`: straight case — `side(pc,pr) = open on a|b|c + (pc,pr)` for both perpendiculars `(-dr,dc)` and `(dr,-dc)` of the run's step, both must hit an `'open'` in-bounds cell. Bent case — the corner cell's two orthogonal neighbours that are not the run's two cells, both must be `'open'`.
`placeSlowStretch`: longest straight run of 3+ (`roadStretches(map.path)`; tie: smaller midpoint, the twin's rule), cells = middle 3 (`m = s.start + Math.floor((n - 1) / 2)`; a run of 3 takes it whole). No such run: bend indices where direction changes, pick `bends[slowStretchHash(seed) % bends.length]`, cells around it; no bends → `undefined`. Then `stretchCovered` or `undefined` (the quality promise).
`Enemy.ts`: field `stretchBox?: StretchBox;` (import `SLOW_STRETCH_FACTOR`, type `StretchBox`); `this.stretchBox = undefined;` in `spawn()`; in `advance()` replace the `const speed = ...` line with:
```ts
const box = this.stretchBox;
let stretchMul = 1;
if (box !== undefined && this.flyLine === undefined && !this.def.flies) {
  const p = this.path.pointAt(this.distance);
  if (p.x >= box.minX && p.x < box.maxX && p.y >= box.minY && p.y < box.maxY) stretchMul = SLOW_STRETCH_FACTOR;
}
const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct) * (1 + this.hastePct) * stretchMul;
```
`EnemySystem.ts`: `readonly stretchBox?: StretchBox;`; constructor after `this.routes`: `this.stretchBox = board.map.slowStretch ? stretchBox(board.map.slowStretch, CELL) : undefined;`; in `spawn()` after `enemy.spawn(...)`: `enemy.stretchBox = this.stretchBox;`.
`art/board.ts` `drawBoard`, after the road's `ctx.restore()` (before the gates) — `pts` is the PathLine's points, so path cell k is `pts[k+1]` (the line has one cell outside each edge):
```ts
const stretch = map.slowStretch;
if (stretch) {
  const i = map.path.findIndex((c) => c.col === stretch.cells[0]!.col && c.row === stretch.cells[0]!.row);
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const seg = [mid(pts[i]!, pts[i + 1]!), pts[i + 1]!, pts[i + 2]!, pts[i + 3]!, mid(pts[i + 3]!, pts[i + 4]!)];
  ctx.beginPath();
  seg.forEach((p, k) => (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  ctx.lineWidth = CELL * 0.58;
  ctx.strokeStyle = rgba(PALETTE.ice, 1);
  ctx.stroke();
}
```
`boardFacts.ts`: add `'slowstretch'` to `BoardFactMark` after `'twin'`; add `{ kind: 'seed'; odds: string }` to `BoardFactTag`; `boardFactTag` gains `if (tag.kind === 'seed') return \`seed · ${tag.odds}\`;` after the `'some'` branch; row after the twin row: `{ mark: 'slowstretch', name: 'The slow stretch', meaning: 'three road cells walked at 70% of speed', tag: { kind: 'seed', odds: '1 in 4' } },`; `BOARD_FACT_SEEDS` gains `slowstretch: { seed: N }` (N = the smallest seed not in {1,2,3,4,5,6,7,8,9,11,13,15} whose `generateMap(new Rng(n), 8, 14, 5, 0, 1, 2, 1, false, false, n).slowStretch` is defined — find it with a scratch script, the test pins it). `boardFactMarks.ts`: `case 'slowstretch': road(g, 0, -10, 0, 10); g.fillStyle(PALETTE.ice, 1); g.fillRoundedRect(-2.5, -6, 5, 12, 1.5); break;`. `runChecks.ts` after `board.twin`: `['board.slowStretch', ...]` — when set: exactly 3 cells, each `'path'`, consecutive (Manhattan 1), and `stretchCovered` holds.

### Steps
1. `src/core/slowStretch.ts` (full module, code above).
2. Wire `generateMap` + the `GameMap` field in `core/map.ts`.
3. The `Enemy` hook + the two `EnemySystem` lines.
4. The tint in `art/board.ts`.
5. `core/boardFacts.ts` + `ui/boardFactMarks.ts` (find seed N first).
6. The invariant in `debug/runChecks.ts`.
7. `tests/core/slowStretch.test.ts` (model `tests/core/twin.test.ts`), then `npm run check` and `npm run smoke`.

### Pitfalls
- The stretch is a seed hash, never an `rng.chance` — an rng draw would shift the far gate's and fork's rolls and break resumes.
- The tint uses `pts[k+1]` (PathLine adds a cell outside each edge); off-by-one shifts the tint a cell. Paint it with no shadow (after the road's `restore()`).
- Gate on `!this.def.flies && this.flyLine === undefined`: the Crosser (own line over the road) and the Flyer (straight crossing) must never slow. The Dasher's surge and the Blinker's step use their own formulas — the hook sits only on the shared `speed`, so they stay untouched.
- The box check is geometric, not a distance range: a fork's lane-B walker at the same distance is not on the stretch's cells and must not slow.
- Pooling: `stretchBox` is reset in `Enemy.spawn()`; `EnemySystem` is per-run, so resumes and new runs get a fresh box.
- No stretch → `stretched === twinned` and no extra stroke: the board stays byte-identical.
- `BoardFactsScene` is untouched: the 13th row grows the card ~106 px and the card's existing scale-to-fit handles 412x915 and 1280x720.

### Tests
- `tests/core/slowStretch.test.ts`: over 1000 seeds × (14x8, 8x14) — determinism (`toEqual` on a fresh grow), stretch frequency between 1/15 and 1/4, at least one stretched fork board and one loop board; non-roll seeds carry none; shape: 3 consecutive `'path'` cells, middle three of the longest run (exactly-3 run taken whole) or around one bend, `stretchCovered` true; `boardHasSlowStretch` ≈ 1/4 of 4000 seeds; hand-built maps (twin.test.ts style): a rock on one side → `undefined`, the longest-run and tie rules, a no-straight-3 map taking the hash-picked bend and returning `undefined` when its flanks are blocked; `stretchBox` values; `boardFactMap('slowstretch')?.slowStretch` is defined (pins seed N).
