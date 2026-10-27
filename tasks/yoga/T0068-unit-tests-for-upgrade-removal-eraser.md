---
id: T0068
title: Unit tests for upgrade removal (Eraser)
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T03:21:30Z
---

## Goal
Lock down the Eraser's upgrade-removal rule from T0047 with a small unit test: contact removes the most recently picked upgrade *level* — the newest, not the first-picked and not the whole upgrade. Same pattern as the streak and stat-stacking tests.

## Details
- Add one new test file `tests/core/run.test.ts`, next to the existing `tests/core/streak.test.ts` (copy its structure: same vitest style, same `RunState` construction with a fixed seed such as `new RunState(1)`, no new dependencies). No source files change.
- The module under test is `RunState` in `src/core/run.ts`, specifically `removeLastUpgrade()` (the Eraser contact rule from T0047).
- The rules to lock:
  - a fresh run with no upgrades picked: `removeLastUpgrade()` is a no-op — no throw, stats stay at base;
  - pick `rhythm` once, then `weight` twice; one call to `removeLastUpgrade()` removes the most recent level: `rhythm` stays at level 1 and `weight` drops from 2 to 1 (assert levels with `run.upgradeLevel(id)` as `tests/core/upgrades.test.ts` does);
  - a second call drops `weight` to 0 — the damage multiplier is back at its base value while the fire-rate multiplier keeps the `rhythm` value (compare multipliers the way `tests/core/stats.test.ts` reads them);
  - a third call drops `rhythm` to 0 — all stats back at base;
  - a fourth call on the now-empty run is still a no-op (no throw, stats unchanged).

## Acceptance criteria
- [ ] The new `tests/core/run.test.ts` asserts all five cases above: empty no-op, newest-level-first removal (rhythm survives the first removal), weight fully removed after two removals with damage back at base, all base after three, and no-op on the empty run.
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new test).
- [ ] No game source file is modified.
