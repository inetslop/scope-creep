---
id: T0063
title: Unit tests for the crop schedule
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T02:46:28Z
---

## Goal
Lock down the pure crop schedule from T0045 so the late-run arena shrink can never silently start early, shrink too far, or run backwards.

## Details
- One new test file `tests/core/crop.test.ts` (no source files change), testing the pure shrink schedule in `src/core/crop.ts` added in T0045 — the function that returns the arena safe-area scale for a given run time (the architect pins the exact name and signature; call it with times in seconds).
- Before 12:00 there is no shrink: at 719 s the scale is exactly 1.0.
- At 12:00 (720 s) the shrink has just begun: 1.0.
- Midpoint 14:30 (870 s): 0.85.
- At 17:00 (1020 s) the floor is reached: 0.7.
- After 17:00 the scale stays clamped at 0.7 — at 1021 s and at 3600 s it is still exactly 0.7, never below.
- The schedule never increases between 12:00 and 17:00 (spot-check a few times, e.g. 720 ≥ 810 ≥ 900 ≥ 1020).
- Assert only the returned scale values — not burn damage, visuals, or scene behavior (those live in the crop system and are covered by the smoke test).

## Acceptance criteria
- [ ] New tests exist in `tests/core/crop.test.ts`, are green, and `npm run check` passes along with all existing tests.
- [ ] The tests assert no shrink before 12:00, 1.0 at 12:00, 0.85 at 14:30, 0.7 at 17:00, clamping after 17:00, and a non-increasing schedule through the window.
- [ ] No source files are modified (the diff touches only `tests/core/crop.test.ts`).
- [ ] `npm run smoke` passes.
