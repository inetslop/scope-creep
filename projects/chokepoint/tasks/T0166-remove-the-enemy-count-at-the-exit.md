---
id: T0166
title: Remove the enemy count at the exit
assignee: narcissus
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T12:15:39Z
claimed_at: 2026-10-29T16:41:11Z
---

## Goal
The small chip above the exit gate (T0106) counts the enemies still alive or to come this wave, but the wave card at the bottom right already shows exactly that ("Wave N · enemies left"). The same number twice is clutter: remove the chip.

## Details
- Remove everything T0106 added, and nothing else:
  - `src/systems/ExitCount.ts` (delete the file);
  - its wiring in `src/scenes/GameScene.ts`: the import, the `exitCount` field, its construction, its `update()` call and its `hide()` / `show()` around the pause screen;
  - its invariant line (`exitCount.valid`) in `src/debug/runChecks.ts`.
- Keep the exit's leak warning (`ExitWarning`, the red pulse when an enemy is about to leak) and the bottom-right wave card exactly as they are.

## Acceptance criteria
- [ ] No count chip above the exit gate, during a wave or between waves, at 412x915 and 1280x720.
- [ ] The bottom-right wave card still counts the enemies left, and the exit still pulses red before a leak.
- [ ] No `ExitCount` or `exitCount` is left in `src/` or `tests/`.

## Design (architect, desktop)

### Files
- delete `src/systems/ExitCount.ts` - the chip system added by T0106
- edit `src/scenes/GameScene.ts` - remove its six wiring lines
- edit `src/debug/runChecks.ts` - remove its invariant line

### Interfaces
None — pure removal, no signatures change.

### Steps
1. In `src/scenes/GameScene.ts`, delete exactly these six lines (verified line numbers):
   - line 18: `import { ExitCount } from '../systems/ExitCount';`
   - line 60: `exitCount!: ExitCount;`
   - line 109: `this.exitCount = new ExitCount(this, this.board, this.flow);`
   - line 156: `this.exitCount.hide();` (inside `openPause()`)
   - line 163: `this.exitCount.show();` (inside `closePause()`)
   - line 173: `this.exitCount.update();` (inside `update()`)
   After deleting lines 156/163, `openPause()` and `closePause()` keep their other statements (`this.scene.launch(SCENES.pause); this.scene.pause();` and `this.scene.resume();`) exactly as they are.
2. In `src/debug/runChecks.ts`, delete line 32: `['exitCount.valid', (g) => g.exitCount.broken()],`
3. Delete the file `src/systems/ExitCount.ts`.
4. Run `npm run check`.

### Pitfalls
- The `exitWarn` lines sit directly next to the `exitCount` ones (imports lines 18/19, fields 59/60, update calls 172/173, invariants 31/32) — delete only the `exitCount`/`ExitCount` lines; `exitWarn`/`ExitWarning` (import line 19, field line 59, `this.exitWarn.update(simDt)` line 172, invariant line 31) must remain.
- Do not touch `ui/hud/` (the wave card) or `src/systems/ExitWarning.ts`.
- No pooling, timers or listeners are involved: `ExitCount`'s objects die with the scene, nothing to clean up.

### Tests
none (UI removal).
