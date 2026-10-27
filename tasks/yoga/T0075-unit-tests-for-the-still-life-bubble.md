---
id: T0075
title: Unit tests for the Still Life bubble
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T04:43:07Z
claimed_at: 2026-10-27T04:51:17Z
designer: yoga
---

## Goal
Lock the Still Life active's (T0050) timing rules with a unit test: 5 s duration, 12 s cooldown. Same pattern as the Understudy decoy tests (T0071) and the Eraser-removal tests (T0068).

## Details
- Add one new test file `tests/core/stillLife.test.ts`, next to the existing Understudy decoy test (T0071, the test for `src/core/understudy.ts` in `tests/core/`) — copy its structure: same vitest style, same construction of the pure module, no new dependencies. No source files change.
- The module under test is the pure Still Life timing in `src/core/stillLife.ts` (the slow bubble added in T0050).
- The rules to lock:
  - a fresh run can start the bubble immediately — no cooldown at the start of a run;
  - once started, the bubble lasts exactly 5 s: active just before 5 s (e.g. at 4.9 s), gone just after (e.g. at 5.1 s);
  - a start request during the 12 s cooldown is rejected (e.g. one 6 s into the cooldown), and one after the cooldown has fully elapsed (at/after 12 s) succeeds;
  - a start while the bubble is already active does nothing — the cooldown is longer than the duration, so this is the same rejection path; assert it rather than special-casing it.

## Acceptance criteria
- [ ] The new `tests/core/stillLife.test.ts` asserts all four cases above: fresh run can start immediately, bubble active just before 5 s and gone just after, restart rejected during the 12 s cooldown and succeeding once it is over, and a start during the active window is a no-op.
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new test).
- [ ] No game source file is modified.
