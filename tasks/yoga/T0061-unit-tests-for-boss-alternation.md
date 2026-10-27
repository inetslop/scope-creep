---
id: T0061
title: Unit tests for boss alternation
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
---

## Goal
Lock down the boss rotation added in T0044 so The Frame and The Grid can never silently stop alternating.

## Details
- One new `describe` block appended to the existing `tests/core/boss.test.ts` (no source files change), testing the pure boss-alternation helper in `src/content/bosses/index.ts` added in T0044 (the function that picks which boss spawns for the Nth boss of the run — the architect pins the exact name and signature; call it through that pure function and assert on the returned boss id).
- First boss: boss #1 (The Frame's 5:00 spawn) returns The Frame (boss id `'frame'`), never The Grid.
- Strict alternation: boss #2 returns `'grid'`, #3 `'frame'`, #4 `'grid'`, #5 `'frame'`.
- Determinism: the same boss number always returns the same boss — the same sequence for every call, no RNG involved.
- Assert only the returned boss ids — not HP, timers, or scene behavior (those live in the boss system and are covered elsewhere).

## Acceptance criteria
- [ ] New tests exist in `tests/core/boss.test.ts`, are green, and `npm run check` passes along with all existing tests.
- [ ] The tests assert first-boss-is-frame, strict alternation through at least boss #5, and determinism.
- [ ] No source files are modified (the diff touches only `tests/core/boss.test.ts`).
- [ ] `npm run smoke` passes.
