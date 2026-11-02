---
id: T0432
title: "The deep scorch: the cell at 24+ kills burns deeper"
size: M
priority: 2
status: todo
depends_on: [T0414]
attempts: 0
created: 2026-11-02T16:14:55Z
epic: E19
---

## Goal
The run's hottest cell earns the run's strongest cell buff: a scorch cell that has seen enough kills burns deeper, and a tower built there deals more — the fight's hot spot becomes the placement that pays most.

## Details
- Builds on the scorch cell (T0414): a build cell where 24+ enemies died this run (up from 12) burns deeper — a thin second ring around the chip's own ring (the scorch chip's own muted ink, ~40% alpha), on the same cell for the rest of the run. A 12-23 kill cell keeps the plain chip.
- A tower built on a deep scorch cell deals +10% damage instead of +5%, for its whole life on the cell (the scorch's own build-time rule; a move (E15) onto a deep cell takes the +10% live, the marked cell's own rule, T0387).
- Wherever T0414 reads the scorch's buff (its own read of the +5%), the deep cell reads 10 — the live value on the existing read, nothing new on screen.
- The run's first deep scorch says what it means once: the moment a cell first crosses 24 kills, a muted chip at the cell reads "deep scorch · +10% damage" (T0414's first-scorch teach's own look, spot and ~1.5 s timing), once per run.
- The deep state is derived from the per-cell kill count T0414 saves — nothing new in the run save format.
- What the player sees differently and why it makes placing more interesting (the board bar): the second ring separates the run's hottest cell from its warm ones, so the placement that pays +10% instead of +5% is readable at a glance — the mark doubles the stakes of a placement, it is not a hint.

## Acceptance criteria
- [ ] A cell at 24+ kills this run wears the chip's thin second ring for the rest of the run; a 12-23 kill cell keeps the plain chip.
- [ ] A tower built on a 24+ kill cell deals +10% damage (a 12-23 cell +5%); the buff's existing read shows 10 on a deep cell.
- [ ] The run's first cell to cross 24 kills shows the one-time muted chip; no second one, and none on a resumed run after it was shown.
- [ ] A resumed run derives the deep state from the saved kill count; the save format gains nothing beyond T0414's.
- [ ] A run in which no cell reaches 24 kills is byte-identical to T0414's state (no ring, no chip, no +10%).

## Design (architect, inet-racing)

T0432 — The deep scorch (size M)

### Files
- EDIT `src/core/scorch.ts` — T0414's file; add the deep tier (constants + two-tier factor function).
- EDIT `src/systems/fx/scorchMark.ts` — T0414's chip/ring painter; add a thin second (deep) ring.
- EDIT `src/systems/enemyHooks/scorch.ts` — T0414's hook; add the crossing-24 branch.
- CREATE `src/systems/fx/scorchDeepTell.ts` — the one-time teach chip (copy of `src/systems/fx/scorchTell.ts`).
- EDIT `src/core/run.ts` — one field next to the other teach flags (the `farGateTold` block, ~line 54).
- EDIT `src/core/saveRun.ts` — one SavedRun field next to T0414's scorch fields + its `loadSavedRun` validation.
- EDIT `src/systems/RunSave.ts` — one line in the persist flag block (lines 53–61) and the restore flag block (lines 84–92).
- EDIT the factor set-sites T0414 created: wherever `cellMul` (or T0414's scorch field) is assigned from the scorch — expected at `TowerSystem.build` (line 68), `Tower.moveTo` (line 304), `RunSave.restore` (line 98) — switch the 1.05 value to the new two-tier function.
- EDIT the TowerPanel scorch line T0414 added (it lives next to `markedLine`, `src/ui/hud/TowerPanel.ts:239`) so the percent is derived from the live factor, never hard-coded 5.
- EDIT `src/debug/runChecks.ts` — extend the `towers.markedCell` invariant (lines 146–150) for the two-tier scorch; it currently hard-codes the 12-kill rule.
- EDIT `tests/core/scorch.test.ts` — T0414's tests; add the deep tier, fix any assertion expecting 1.05 at ≥24.
- READ-ONLY for reference: `src/systems/fx/farGateTell.ts` (chip template), `src/core/markedCell.ts` (precedent).

### Interfaces
In `core/scorch.ts` (no Phaser):
- `export const DEEP_KILLS = 24;` and `export const DEEP_SCORCH_MUL = 1.10;` next to T0414's `SCORCH_KILLS = 12` / `SCORCH_MUL = 1.05`.
- The factor function T0414 created becomes two-tier, same name and signature (count → number): `count >= DEEP_KILLS ? DEEP_SCORCH_MUL : count >= SCORCH_KILLS ? SCORCH_MUL : 1`.
- `export function hasDeepCell(counts: <T0414's per-cell count type>): boolean` — any cell `>= DEEP_KILLS` (mirror of T0414's existing "any scorch" helper if it has one).
- `scorchMark`: add a `deep: boolean` parameter (or `deepRing()` export) that strokes one extra ring just outside the mark's own ring — same color the mark's ring already uses, alpha 0.4, thin (2 px via `fillRing` from `ui/ring.ts`, never a thick stroke).
- `scorchDeepTell(fx: FxSystem, x: number, y: number): void` — identical to `scorchTell` but label `'deep scorch · +10% damage'`; early return on `fx.full`.
- `RunState.deepScorchTold = false; // the run's one deep-scorch chip showed (T0432)`; saved in SavedRun exactly like T0414's `scorchTold` is (field + `=== true` validation + persist + restore).

### Steps
1. Read T0414's four files and grep for its count type, factor function name, and every `SCORCH_MUL` use. If T0414 landed differently than assumed (field names, no counts helper), adapt names but keep this contract.
2. Add the two-tier function + constants + `hasDeepCell` in `core/scorch.ts`.
3. In `enemyHooks/scorch.ts`: in the kill count branch, when `before < DEEP_KILLS && after >= DEEP_KILLS` (crossing the cell's own count): redraw that cell's mark with the deep ring, and if `!run.deepScorchTold` set it true and call `scorchDeepTell` at the cell centre (spot/timing from `scorchTell`). Also, in the run-start scan T0414 uses to re-draw existing marks, pass `deep: count >= DEEP_KILLS`.
4. Update the set-sites and the panel line to read the two-tier function (a move onto a 24+ cell takes 1.10 live, exactly like the marked cell's own rule at `Tower.moveTo:304`).
5. Add `deepScorchTold` to run.ts, saveRun.ts (field + validation), RunSave.ts persist/restore.
6. Extend the `towers.markedCell` invariant: expected factor is now two-tier for the scorch part.
7. Extend `tests/core/scorch.test.ts`; run `npm run check` and `npm run smoke`.

### Pitfalls
- The deep chip fires on the *crossing* kill (`before < 24 && after >= 24`), not `>= 24` — a resumed run re-scanning 24+ cells must not re-chip; the saved flag is the guard, set **before** the chip is drawn.
- The deep ring is *around* the existing ring (radius + small offset, e.g. `+5`), not a replacement; plain 12–23 cells keep exactly T0414's look (byte-identical state for sub-24 runs).
- Never re-introduce a hard-coded `1.05`/`5`: panel percent, invariant, and DPS all derive from the factor function.
- One line per shared file, placed next to T0414's lines, never at list ends (CLAUDE.md rule).
- If T0414's factor is folded into `cellMul`, the crossing-24 moment should also refresh `cellMul` for any tower currently standing on that cell (iterate `this.towers` in the hook) so live damage matches the read.
- `fillRing` for rings; `PALETTE`/`cssColor` for colors; no `Math.random()`; `dt`-based durations via `fx.track`.

### Tests
- `tests/core/scorch.test.ts`: factor at counts 0, 11, 12, 23, 24, 30 → 1, 1, 1.05, 1.05, 1.10, 1.10; `hasDeepCell` true only at ≥24 (single cell, multiple cells, empty).
- `npm run smoke` passes (desktop + phone).
