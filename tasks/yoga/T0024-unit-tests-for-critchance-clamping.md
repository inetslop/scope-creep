---
id: T0024
title: Unit tests for critChance clamping
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:18:38Z
---

## Goal
Lock the `critChance` stat's clamping down with tests, so stacking crit upgrades (Contrast today, any future crit source) can never push the crit roll above 50% or below 0.

## Details
- Create one new file in the existing test directory (`tests/core/`), written in the same style as the existing `tests/core/rng.test.ts` (same framework, same import style). Test the `critChance` stat in `src/core/stats.ts` through its real API.
- Tests to add:
  1. A fresh run's `critChance` stat reads 0.
  2. The stat never reads above 0.5: drive it above 0.5 through whatever API the stat exposes (a direct set, or stacked crit mods) and assert the read is exactly 0.5.
  3. The stat never reads below 0: drive it below 0 the same way and assert the read is 0.
- No game source files change; this task adds only the new test file.

## Acceptance criteria
- [ ] The new test file exists and all of its tests pass
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new tests)
- [ ] No files under `src/` were modified
