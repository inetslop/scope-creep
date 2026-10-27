---
id: T0057
title: Unit tests for the kill-streak tally
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T01:47:24Z
---

## Goal
Lock down the kill-streak rules added in T0014 so the streak tally can never silently regress.

## Details
- One new test file `tests/core/streak.test.ts`, modeled on `tests/core/critChance.test.ts` (fresh run state, driven through the `RunState` API; no source files change).
- Fresh run: streak 0 and bestStreak 0 before any kill.
- Growing: 8 consecutive kills via `RunState.registerKill()` give streak 8 and bestStreak 8.
- Reset: taking damage (the `takeDamage()` path that resets the streak, per T0014) drops streak to 0 and leaves bestStreak at 8.
- After the reset, a shorter run of 5 kills leaves streak 5 and bestStreak 8; a longer run of 9 kills updates bestStreak to 9.
- Assert only the streak/bestStreak state — not the HUD "RHYTHM" flash, which lives in the scene.

## Acceptance criteria
- [ ] `tests/core/streak.test.ts` exists, is green, and `npm run check` passes along with all existing tests.
- [ ] The test asserts the fresh, grow-to-8, reset-keeps-best, shorter-run and longer-run cases above.
- [ ] No source files are modified (the diff touches only the new test file).
- [ ] `npm run smoke` passes.
