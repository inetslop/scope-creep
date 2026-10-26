---
id: T0021
title: Unit tests for seeded RNG determinism
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:04:35Z
designer: desktop
---

## Goal
Lock the seeded RNG's determinism down with tests, so future features (daily seeds, reproducible runs, crit rolls) can rely on it.

## Details
- Create one new file: `tests/core/rng.test.ts`, written in the same style as the existing `tests/core/music.test.ts` (same framework, same import style). Test the RNG in `src/core/rng.ts` through its real API.
- Tests to add:
  1. Two RNG instances created with the same seed produce identical output for their first 10 draws.
  2. Two RNG instances created with different seeds produce different output within their first 10 draws.
  3. If the API exposes a float draw, one more test: its output stays within [0, 1).
- No game source files change; this task adds only the new test file.

## Acceptance criteria
- [ ] `tests/core/rng.test.ts` exists and all of its tests pass
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new tests)
- [ ] No files under `src/` were modified
