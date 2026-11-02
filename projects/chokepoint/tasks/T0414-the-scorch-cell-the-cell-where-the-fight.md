---
id: T0414
title: "The scorch cell: the cell where the fight was pays a tower"
size: M
priority: 2
status: todo
depends_on: [T0389]
attempts: 0
created: 2026-11-02T09:13:56Z
epic: E19
---

## Goal
The island remembers the fight: a build cell that has seen 12 kills this run keeps a small dark chip on the ground for the rest of the run, and a tower built on it deals 5% more damage — the player places the next tower with the run's own history in hand.

## Details
- **The count.** Every kill this run — any enemy; a split child and the wave boss's death each count as one kill — adds 1 to the build cell whose center is closest to the kill point; a kill with no build cell within 1.5 cells counts for nothing. A leak is not a kill.
- **The mark.** The moment a cell's count reaches 12 it is *scorched* for the rest of the run. One small flat chip fades in at the cell center over ~300 ms: a muted-ink rounded square, ~0.25 cell wide, ~40% alpha, under the tower layer (a tower on the cell stays fully visible). The chip is a functional mark — it says the cell pays, the marked cell's own kind of sign — not a hint or decoration, and it appears only where 12 kills happened (in practice the choke spots: a few cells per run at most). It persists for the rest of the run, through build phases, pauses and resumes.
- **The buff.** A tower built on a scorched cell deals 5% more damage: the cell's multiplier gains ×1.05, the marked cell's own way, multiplicative with the marked cell's 1.25/1.5 (a marked + scorched cell is 1.31× plain, 1.575× with The rich cell). The multiplier is read when the tower is built — and when a tower moves onto the cell (the move's own re-read); a tower already standing when the cell scorches is not retro-buffed. The panel's existing cell line keeps reading the tower's live multiplier, so a marked + scorched tower reads the product.
- **The teach.** The run's first scorch — the first cell to reach 12 — pops one muted chip above the cell, "12 kills here · +5% damage", the marked-cell chip's own look (T0389), holding ~1.5 s and fading. Once per run; a resumed run never shows it again.
- **The save.** The per-cell counts (and the scorched flags, and the teach's already-shown) ride the run's save like the other run state, so a resume keeps the chips, the counts and the one-time teach.
- No new HUD element and no permanent text on the board: the chip is the mark, the teach chip is one-time, and the only readout is the panel line a tower on the cell already wears.

## Acceptance criteria
- [ ] Kill 12 enemies whose kill points are closest to one build cell and that cell's chip fades in over ~300 ms and stays for the rest of the run (build phase, pause, and after a tab-close resume).
- [ ] The run's first scorch shows the one-time "12 kills here · +5% damage" chip above the cell for ~1.5 s; later scorches never show it, and a resumed run never does.
- [ ] A tower built on a scorched cell deals 5% more damage (the panel's cell line reads the live multiplier; on a marked + scorched cell, the product of both); a tower already standing when the cell scorches is unchanged until it is moved.
- [ ] A kill with no build cell within 1.5 cells and a leak change no count.
- [ ] A run before any cell reaches 12 kills draws the board byte-identically to before this task.

## Design (architect, inet-racing)

### Files
- create `src/core/scorch.ts` — T0414 pure logic: constants, `ScorchCell`, `nearestScorchCell`, `scorchKill`, `isScorched`, `scorchDamageMul`
- create `src/systems/enemyHooks/scorch.ts` — the kill-counting hook
- create `src/systems/fx/scorchMark.ts` — the persistent scorched-cell chip
- create `src/systems/fx/scorchTell.ts` — the run's one teach chip
- create `tests/core/scorch.test.ts` — unit tests
- edit `src/systems/enemyHooks/index.ts` — import line next to `split`/`midSplit` + `scorch,` in `ENEMY_HOOKS` next to `split,`
- edit `src/core/run.ts` — two `RunState` fields next to `farGateTold`
- edit `src/core/saveRun.ts` — `SavedRun` fields + validation + older-save defaults
- edit `src/systems/RunSave.ts` — persist/restore the fields; restore redraws chips; line 98 → `scorchDamageMul`
- edit `src/entities/Tower.ts` — `moveTo(cell, board, run)`; line 274 → `scorchDamageMul`; `cellMul` field comment
- edit `src/systems/Building.ts` — line 253 pass `this.run`; line 238 comment
- edit `src/systems/TowerSystem.ts` — build line 68 → `scorchDamageMul` (replace the `MARKED_DMG_MUL` import)
- edit `src/debug/runChecks.ts` — replace the `towers.markedCell` line with a loosened check, add a `scorch.counts` line next to it, swap the import
- edit `src/ui/hud/TowerPanel.ts` — the cell line's word (function + 2 call sites)

### Interfaces
- `core/scorch.ts`: `export const SCORCH_KILLS = 12; SCORCH_DMG_MUL = 1.05; SCORCH_RADIUS = 1.5;` · `interface ScorchCell { col: number; row: number; kills: number }` · `nearestScorchCell(map: GameMap, x: number, y: number): Cell | undefined` — nearest `'open'` cell center within `SCORCH_RADIUS` cells (squared distance, strict `<`, ties → first in row-major scan); `undefined` beyond the radius · `scorchKill(cells: ScorchCell[], col, row): boolean` — adds 1 (clamped at 12), true only on the 12th kill · `isScorched(cells, col, row): boolean` · `scorchDamageMul(onMarked: boolean, cells: readonly ScorchCell[], col, row): number` — `(onMarked ? MARKED_DMG_MUL : 1) * (isScorched ? SCORCH_DMG_MUL : 1)`
- `RunState`: `scorch: ScorchCell[] = [];` and `scorchTold = false; // the run's one scorch teach showed (T0414): a resumed run never re-teaches` — next to `farGateTold`
- `fx/scorchMark.ts`: `scorchMark(fx: FxSystem, x: number, y: number, fadeIn: boolean): void` · `fx/scorchTell.ts`: `scorchTell(fx: FxSystem, x: number, y: number): void`
- `Tower.moveTo(cell: Cell, board: Board, run: RunState): void` (new third parameter)

### Steps
1. `core/scorch.ts` (pure; `CELL` from `../config`, `MARKED_DMG_MUL` from `./markedCell`, `kindAt` from `./map`).
2. `core/run.ts`: the two fields.
3. `core/saveRun.ts`: add `scorch: { col: number; row: number; kills: number }[]` and `scorchTold: boolean` to `SavedRun`; validate `scorchTold` like `farGateTold`, and `scorch` modeled on the existing `towers` array validation (after the cols/rows checks: col in 0..cols-1, row in 0..rows-1, kills in 1..`SCORCH_KILLS`, imported from `./scorch`); defaults `scorch: p.scorch ?? []`, `scorchTold: p.scorchTold === true`.
4. `fx/scorchMark.ts`: Graphics at the cell center, `DEPTH.preview` (above board 0, under towers 10), `fillRoundedRect(-w/2, -w/2, w, w, 5)` with `w = CELL * 0.25`, `fillStyle(PALETTE.ink, 0.4)`; `fadeIn` → start `setAlpha(0)` and a plain 300 ms `Quad.easeOut` tween to 0.4. NOT `fx.track`ed (must survive to scene shutdown; the scene destroys it), no `fx.full` check (functional mark, a few per run).
5. `fx/scorchTell.ts`: copy the chip build and timings from `systems/fx/markedCellTell.ts` (T0389; if it is not yet in the tree use `farGateTell.ts`) — same cardDeep-side + card-body + 12px bold muted label, pop/hold/fade — with label `${SCORCH_KILLS} kills here · +${Math.round((SCORCH_DMG_MUL - 1) * 100)}% damage` (no hard-coded 12/5), positioned above the cell, `fx.full` early return, `fx.track`ed.
6. `enemyHooks/scorch.ts`: `export const scorch: MakeEnemyHook = ({ board, run, fx }) => ({ onKill({ enemy }) { const cell = nearestScorchCell(board.map, enemy.x, enemy.y); if (!cell) return; if (!scorchKill(run.scorch, cell.col, cell.row)) return; const c = board.centerOf(cell); scorchMark(fx, c.x, c.y, true); if (!run.scorchTold) { run.scorchTold = true; scorchTell(fx, c.x, c.y); } } });` — no `onLeak`; split children and the boss each count because every death funnels through `onKill`. Register it in `index.ts`.
7. The three `cellMul` sites read `scorchDamageMul(...)`: `TowerSystem.build` (line 68, `this.run`), `Tower.moveTo` (line 274, new `run` param; call site `Building.ts:253`), `RunSave.restore` (line 98).
8. `RunSave.ts`: `persist` adds `scorch: run.scorch.map((c) => ({ col: c.col, row: c.row, kills: c.kills }))` and `scorchTold: run.scorchTold` next to the `farGateTold` line; `restore` writes both fields before the tower loop, and after the loop calls `scorchMark(game.fx, game.board.centerOf(c).x, game.board.centerOf(c).y, false)` for every entry with `kills >= SCORCH_KILLS`.
9. `debug/runChecks.ts`: replace the `towers.markedCell` line with `['towers.cellMul', ...]` checking `t.cellMul >= 1 - 1e-9 && t.cellMul <= scorchDamageMul(g.board.onMarked(t.cell), g.run.scorch, t.cell.col, t.cell.row) + 1e-9` (snapshot may be stale-low, never above); add next to it `['scorch.counts', (g) => { for (const c of g.run.scorch) if (g.board.map.kinds[c.row]?.[c.col] !== 'open' || c.kills < 1 || c.kills > SCORCH_KILLS) return `scorch ${c.kills} at (${c.col}, ${c.row})`; return null; }]`; swap the `MARKED_DMG_MUL` import for `SCORCH_KILLS, scorchDamageMul` from `../core/scorch`.
10. `TowerPanel.ts`: `markedLine(tower)` → `cellLine(game: GameScene, tower: Tower)` returning `` `${game.board.onMarked(tower.cell) ? 'marked' : 'scorched'} · +${Math.round((tower.cellMul - 1) * 100)}% damage` ``; update call sites at lines 74 and 167 and the two comments (line 106, 165). Keep the field name `markedText` and the `cellMul > 1` show condition — the line already reads the live product.
11. `tests/core/scorch.test.ts`, then `npm run check` and `npm run smoke`.

### Pitfalls
- No retro-buff: `cellMul` is a snapshot set only at build/move/restore — never recompute it in any update/tick; a tower standing when its cell scorches keeps its old multiplier (hence the invariant is `<=`, not `===`).
- The chip must NOT be `fx.track`ed (tracked objects are destroyed when their tween ends); it lives as a scene child until shutdown. Fade via a plain tween.
- Keep `MARKED_DMG_MUL` as the marked factor in `scorchDamageMul` — never write 1.25; T0386 may change the constant to 1.5 and the spec's 1.575× is that product.
- Save validation for `scorch` needs `cols`/`rows` bounds — place it after their checks, modeled on the `towers` validation; older saves (no field) must load with `[]`/`false`.
- Kill point is `enemy.x`/`enemy.y` in board units (the enemy is still at its spot in `onKill`); a leak is not a kill (no `onLeak`).
- Zero edits to `GameScene.ts` and to `art/board.ts`: hooks self-register via `ENEMY_HOOKS`, and a pre-scorch run must draw the board byte-identically (chips are drawn only when a cell scorches).
- Other tasks touch `core/run.ts`, `core/saveRun.ts`, `systems/RunSave.ts`, `systems/TowerSystem.ts`, `debug/runChecks.ts` (T0386/T0389/T0399) — add your lines next to `farGateTold`/the marked-cell invariant, never reflow neighbors.

### Tests
- `tests/core/scorch.test.ts`: `nearestScorchCell` picks the nearest `'open'` cell, skips `'path'`/`'rock'`, returns `undefined` beyond 1.5 cells (hand-built `GameMap` literals); `scorchKill` false ×11, true on the 12th, false after (clamped), per-cell independent; `isScorched`; `scorchDamageMul` = 1 / 1.05 / `MARKED_DMG_MUL` / `MARKED_DMG_MUL * 1.05`; save round-trip with a fake store (reuse `tests/core/saveRun.test.ts`'s store/`RunState` setup) incl. an older save without the fields → `[]`/`false`.
- Gates: `npm run check`, `npm run smoke`; the new invariant must pass in the smoke run.
