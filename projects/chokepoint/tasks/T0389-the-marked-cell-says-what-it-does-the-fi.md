---
id: T0389
title: "The marked cell says what it does: the first build's one-time chip"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T23:40:10Z
---

## Goal
The moment a tower is first built on the marked cell, the cell says what it does: a first-time player learns the buff where the gold is spent, not on a second glance at the panel.

## Details
- The chip pops just above the marked cell the moment the run's first tower is built on it, and fades after ~1.5 s — the first-leak chip's own look (T0107: a small white rounded chip, bold muted-ink text), like the far gate's (T0384).
- The text names the cell's live buff: "marked · +25% damage" — the same value the panel line (T0387) reads, 25 plain and 50 while The rich cell is owned, so the chip is right before and after T0386 lands.
- The trigger is the marked cell receiving a tower for the first time in the run (a build today; E15's move, once it lands, inherits the same once-per-run check, so a move onto the cell tells it there too).
- Once per run: the flag is set before the effect and rides the run save like the other *Told fields (T0384), so a resumed run past the moment never replays it.
- No new sound, button, card line or permanent board mark: the cell's own mark, the board facts, the panel line and the wave preview are untouched.

## Acceptance criteria
- [ ] The first build on the marked cell pops a small white chip above the cell reading "marked · +25% damage" ("+50%" while The rich cell is owned), fading after ~1.5 s.
- [ ] A second build on the marked cell, and every build after, shows no chip.
- [ ] A resumed run past the moment never replays the chip.
- [ ] Everything else is byte-identical: no new sound, no new HUD element, no permanent mark on the board.

## Design (architect, yoga)

### Files
- create `src/systems/fx/markedCellTell.ts` - the one-time chip effect (model on `src/systems/fx/farGateTell.ts`)
- edit `src/core/run.ts` - add the `markedCellTold` field next to `farGateTold`
- edit `src/core/saveRun.ts` - add the field to `SavedRun`, its `loadSavedRun` type-guard and load line
- edit `src/systems/RunSave.ts` - persist + restore the field
- edit `src/systems/TowerSystem.ts` - the build trigger + import
- edit `tests/core/saveRun.test.ts` - add the field to `sample()` and a round-trip test

### Interfaces
```ts
// core/run.ts  (next to: farGateTold = false;)
markedCellTold = false; // the run's one marked-cell first-build chip showed (T0389)

// core/saveRun.ts  (next to: farGateTold: boolean; and its guard + load lines)
markedCellTold: boolean; // the run's one marked-cell first-build chip showed; older saves predate the field
if (p.markedCellTold !== undefined && typeof p.markedCellTold !== 'boolean') return undefined;
markedCellTold: p.markedCellTold === true,

// systems/RunSave.ts  (persist, after `farGateTold: run.farGateTold,`; restore, after `run.farGateTold = ...`)
markedCellTold: run.markedCellTold,
run.markedCellTold = saved.markedCellTold;

// fx/markedCellTell.ts
export function markedCellTell(fx: FxSystem, x: number, y: number, pct: number): void
```

### Steps
1. `src/systems/fx/markedCellTell.ts`: copy `farGateTell.ts` verbatim, change the label to `` `marked · +${pct}% damage` `` and the signature to `(fx, x, y, pct: number)`. Keep `if (fx.full) return;`, the card/label/`g` two-rect build, the `y - CELL - 26` container, `setDepth(DEPTH.fx).setScale(0)`, the 200ms `Back.easeOut` scale-in, and `fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' })`.
2. `core/run.ts`: add `markedCellTold = false; // ... (T0389)` on the line after `farGateTold`.
3. `core/saveRun.ts`: `SavedRun` field, its `loadSavedRun` guard (`!== undefined`/boolean), and its load line (`p.markedCellTold === true`), each next to the `farGateTold` line.
4. `systems/RunSave.ts`: `markedCellTold: run.markedCellTold,` in `persist`; `run.markedCellTold = saved.markedCellTold;` in `restore` — each after the `farGateTold` line.
5. `systems/TowerSystem.ts`: import `markedCellTell`; in `build`, right after `this.towers.push(tower);` add:
```ts
    if (this.board.onMarked(cell) && !this.run.markedCellTold) {
      this.run.markedCellTold = true; // set before the chip: a resumed run past it never replays
      markedCellTell(this.fx, c.x, c.y, Math.round((tower.cellMul - 1) * 100));
    }
```
6. `tests/core/saveRun.test.ts`: add `markedCellTold: false,` to `sample()` after `farGateTold: false,`; add a test copying the far-gate one with `markedCellTold` (`round-trips a marked-cell-told save, and a save written without the key loads as untold`).

### Pitfalls
- Read `tower.cellMul`, never hardcode `25`: before T0386 it is `MARKED_DMG_MUL` (1.25 → 25), after it is the rich-cell value (1.5 → 50); the chip is right before and after T0386 with no dependency.
- This is a build-phase event, so the trigger lives in `TowerSystem.build`, not an enemy hook. E15's move (still designing) adds this same check to its move path and shares the `markedCellTold` flag — not built here.
- Set the flag before the effect and ride it in the save (all four *Told spots) so a resumed run never replays; restored towers bypass `build`, so restore never re-fires it.
- The test `toEqual(sample())` breaks unless `sample()` gains the field. The chip is `fx.track`ed (auto-destroyed), guarded by `fx.full`, no sound/HUD/permanent mark; the board facts already show no number, so it is a teach, not a duplicate readout.

### Tests
- `tests/core/saveRun.test.ts`: round-trip a `markedCellTold: true` save and confirm a save written without the key loads as untold (copy the far-gate test).
