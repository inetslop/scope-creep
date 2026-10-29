---
id: T0166
title: "Remove the enemy count at the exit"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-29T12:15:39Z
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
