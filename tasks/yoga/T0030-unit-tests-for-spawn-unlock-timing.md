---
id: T0030
title: Unit tests for spawn unlock timing
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:55:07Z
---

## Goal
Lock down the promise that every enemy is absent just before its unlock time and present at/after it, for the whole roster.

## Details
- New test file `game/tests/content/spawn.test.ts` (or next to `tests/content.test.ts` if the architect prefers the flat layout). No changes to game behavior.
- For every enemy in `ENEMIES`, assert that the spawn logic excludes it at `unlockAtSec - 1` seconds and includes it at `unlockAtSec` seconds (and at a time well past it, e.g. 600 s).
- Test the pure function the spawn system uses to decide which enemies are available at a given time. If that logic is currently inline in the spawn system, the design may extract a small pure helper (a few lines, e.g. `availableEnemies(elapsedSec)`) and have the spawn system call it — behavior unchanged.
- If the extraction would touch more than a few lines, fall back to asserting on the data instead: every `unlockAtSec` is a positive finite number, and the set of enemies with `unlockAtSec <= t` is non-decreasing as `t` grows from 0 to 600 s in 5 s steps.

## Acceptance criteria
- [ ] The new test file covers every entry in `ENEMIES`, including enemies added by other tasks
- [ ] Each enemy is asserted absent at `unlockAtSec - 1` s and present at `unlockAtSec` s (or the data fallback above is used)
- [ ] If a helper is extracted, in-play unlock times are unchanged
- [ ] `npm run check` (including the new test) and `npm run smoke` pass
