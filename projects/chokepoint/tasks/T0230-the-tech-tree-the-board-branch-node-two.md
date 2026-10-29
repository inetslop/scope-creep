---
id: T0230
title: "The tech tree: the board branch, node two — The long way"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: [T0208]
attempts: 1
created: 2026-10-29T21:12:14Z
claimed_at: 2026-10-29T21:43:44Z
epic: E2
---

## Goal
E2's last task: the board branch's second node. “One more bend” made new runs windier; “The long way” makes them longer — the branch reads as a choice of island shape, and when it lands the tech tree is done.

## Details
- The tech screen's “The board” row (T0208) gains a second node card after “One more bend”: “The long way” — 30 coins, card text “new runs' roads are 25% longer.” The price display follows T0214's branch discount automatically: with one board node already owned it reads 25 with the 30 struck through; no new price logic.
- States and buying: T0103's four states and T0208's buy flow (affordable bright, unaffordable dimmed with a red price, owned with the yellow border, T0103's pop + chime, the profile's purchased list, survives a reload). No gate: the effect is live the moment it is bought, like “One more bend.”
- The effect (new runs only): a new run's road is 25% longer than today's road for the same seed — the walkable length from entrance to exit, in path cells. The generator's length target is ×1.25 (the architect names the exact parameter in the design, the way T0208 named its); the bend target is unchanged and board size, rocks, entrance, exit generate as today (T0208's words) — the longer road takes its place from the island's open cells. The realized length follows the grid and may land a little above or below 25% per seed.
- In play: more road to cover and more time per enemy — waves, enemy speeds and the build rules are otherwise unchanged.
- Ghost runs (T0078) and resumed runs keep their exact board: the effect flows into the save the way T0208's `bends` field does (written when the run persists, read back on resume, older saves default to off, ghost runs pass off).
- Both board nodes owned: the entrance jog and the longer road compose into one valid board.
- The board branch's done mark (T0215) shows when both nodes are owned — verify it, don't add one.
- Layout: the row now holds two node cards in T0103's node-card look (T0225's column layout keeps their text clear); the existing scroll (T0153) covers the overflow; at 412×915 and 1280×720 every node on every row is visible and buyable.
- Closest examples: “One more bend” (T0208) — the node entry, the buy function, the save field, the generator knob and the tests all follow it; the struck-through price follows T0214's display on the other branches.

## Acceptance criteria
- [ ] The tech screen's “The board” row shows two node cards: “One more bend” (30) and “The long way” (30 — shown as 25 with the 30 struck through once one board node is owned, T0214).
- [ ] Buying “The long way” pays its price with T0103's pop + chime, shows the owned (yellow border) state and survives a reload; with fewer coins it dims with a red price and a tap does nothing.
- [ ] A unit test (at least 5 seeds × both board orientations, owned vs. not owned): every owned road is strictly longer than its unowned twin, the mean length ratio (owned ÷ unowned) over the seeds is between 1.2 and 1.4, and both roads are valid boards (size, entrance/exit on the edge, contiguous walkable path, no self-crossing).
- [ ] With the node not owned, every generated board is byte-identical to today on every seed, with or without “One more bend” owned.
- [ ] A resumed run with the node owned regenerates its exact longer board (save round-trip; a save without the field loads as off); a ghost run of a saved board replays it unchanged.
- [ ] With both board nodes owned, every test seed produces a valid board (the entrance jog and the longer road compose).
- [ ] At 412×915 and 1280×720 every node on every row is visible and buyable; with both board nodes owned the branch's done mark (T0215) shows.

## Design (architect, desktop)

### Files
- edit `src/content/tech/board.ts` - `lengthMul` field on `BoardNode`; new node `long-way`
- edit `src/core/tech.ts` - `boardLengthMul()` next to `boardBends()`
- edit `src/core/map.ts` - `lengthMul` parameter; long road takes runs of 1–2 cells
- edit `src/core/saveRun.ts` - `lengthMul` save field, validation, default
- edit `src/systems/RunSave.ts` - write `lengthMul` into the save
- edit `src/scenes/GameScene.ts` - compute `lengthMul` (saved / owned / ghost), pass to `generateMap`, new field `mapLengthMul`
- edit `tests/core/map.test.ts` - long-road tests + pinned unowned boards
- edit `tests/core/saveRun.test.ts` - `lengthMul` round-trip / missing-field tests
- edit `tests/core/tech.test.ts` - two-node board row, `boardLengthMul`, discounted buy

### Interfaces
```ts
// content/tech/board.ts, added to BoardNode:  lengthMul: number;   // 1 = unchanged, 1.25 = 25% longer
// core/tech.ts:
export function boardLengthMul(owned: readonly string[]): number; // biggest owned node's lengthMul (1 or 1.25)
// core/map.ts:
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0, lengthMul = 1): GameMap;
// core/saveRun.ts, added to SavedRun:  lengthMul: number;  // 1.25 or 1
// scenes/GameScene.ts:  mapLengthMul = 1;
```
### Steps
1. Before touching `src`: in a temp test, print the current unowned boards for `[14,8]` and `[8,14]`, seeds `[1,2,3]`, bends `[0,1]`: `JSON.stringify` of `map.path` and of the rock cell coordinates from `map.kinds`. Paste the 12 results into a pinned record `PLAIN_BOARDS` in `tests/core/map.test.ts`; delete the temp test.
2. `map.ts`: new parameter `lengthMul = 1`; replace `const run = rng.int(2, 3);` with `// The long road (lengthMul > 1) takes runs of 1-2 cells, so it turns more often and is ~25% longer.\n    const run = lengthMul > 1 ? rng.int(1, 2) : rng.int(2, 3);`; add one doc-comment line: "With `lengthMul` above 1 the runs are 1–2 cells, so the road turns more often and comes out about 25% longer (the realized length follows the grid)." Nothing else moves.
3. `board.ts`: add `lengthMul: 1` to the `one-more-bend` entry; add after it: `{ id: 'long-way', name: 'The long way', line: "new runs' roads are 25% longer", price: 30, bends: 0, lengthMul: 1.25 },` and update the file's two doc comments to "two nodes".
4. `tech.ts`: `boardLengthMul` directly after `boardBends` — same shape (seen-set, `BOARD_NODES.find`), starting `let mul = 1;` and `if (node.lengthMul > mul) mul = node.lengthMul;`.
5. `saveRun.ts`: field after `bends` with comment "The board's road length at generation: 1.25 when "The long way" was owned, 1 in older saves."; validation after the bends check: `if (p.lengthMul !== undefined && p.lengthMul !== 1 && p.lengthMul !== 1.25) return undefined;`; in the returned object after the bends line: `lengthMul: p.lengthMul === 1.25 ? 1.25 : 1,`.
6. `RunSave.ts` persist: after the `bends:` line: `lengthMul: this.game.mapLengthMul,`.
7. `GameScene.ts`: import `boardLengthMul` (line 8, between `boardBends` and `startBonuses`); field `/** The road length multiplier this board was generated with (the save round-trips it; the board shape can't tell a long road from a plain one). */ mapLengthMul = 1;` after `techLife`; after the `bends` line: `const lengthMul = saved ? saved.lengthMul : ghostSeed === undefined ? boardLengthMul(loadProfile(window.localStorage).purchased) : 1;`; pass `lengthMul` as the 6th argument of `generateMap`; `this.mapLengthMul = lengthMul;` right after the map line; extend the comment above to mention the longer road (a ghost run passes 0 bends, length 1).
8. Do NOT edit `TechScene.ts`: the row, the four card states, the struck-through discounted price (`branchPrice`), pop + chime, profile persistence and the branch done mark are all generic over `BOARD_NODES`; a two-card row already lays out (narrow: two columns, wide: centered), and row heights are unchanged so the existing scroll is untouched.
9. Edit the three test files (below); run `npm run check`.
### Pitfalls
- Byte-identity: with `lengthMul === 1` the rng draws must be exactly today's — only the `run` draw becomes the ternary; no reordering or extra branches anywhere in `generateMap`.
- The long flag cannot be detected from the board's geometry (a plain road can be as long as a long one): the save reads `game.mapLengthMul`, unlike `bends` which is geometric. Don't invent a `mapLongRoad()` detector.
- 1.25 is exactly representable in binary float: `=== 1.25` and the JSON round-trip are safe.
- The entrance jog can put the road at across = 7; turn logic already only targets lanes 1..6 — leave it.
- T0217 also edits `core/map.ts`, `core/saveRun.ts`, `systems/RunSave.ts`, `scenes/GameScene.ts`: keep edits to exactly the lines above (the runner serializes same-file tasks).
- If a pinned seed pair fails the strict-inequality (rare), swap that seed for the next; keep ≥5 seeds per orientation.
### Tests
- `tests/core/map.test.ts`: (a) seeds `[1,2,3,4,5,42]` × `[14,8],[8,14]` × bends `[0,1]`: `long.path.length` strictly greater than `plain.path.length`, and the existing `expectValidBoard` on both (covers the both-nodes-owned composition); (b) mean of long÷plain over 5 seeds × both orientations × both bend states is between 1.2 and 1.4; (c) each `PLAIN_BOARDS` entry deep-equals the freshly generated `path` and rock cells (unowned stays byte-identical); (d) generating twice from (seed 42, bends 1, lengthMul 1.25) is `toEqual` — a resumed run's board regenerates exactly.
- `tests/core/saveRun.test.ts`: `sample()` gains `lengthMul: 1`; `broken({ lengthMul: 0 })`, `2`, `1.5`; a save with the key deleted loads as 1; `sample({ lengthMul: 1.25, bends: 1 })` round-trips.
- `tests/core/tech.test.ts`: replace the "board row is one node" test with the two-node table `[['one-more-bend',30,1,1],['long-way',30,0,1.25]]`; `boardLengthMul([])` = 1, `(['one-more-bend'])` = 1, `(['long-way'])` = 1.25, duplicates and unknown ids ignored; buying `long-way` with 25 coins while `one-more-bend` is owned succeeds (coins 0, both ids saved), 24 coins is refused.
- No invariant: no new system is added; the existing `board.path` check covers road validity.
