---
id: T0053
title: Unit tests for stat stacking
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:32:39Z
---

## Goal
Lock down how the stat pipeline combines multiple upgrades that touch the same stat, so future cards can't silently change the math of existing builds.

## Details
- One new test file `tests/core/stats.test.ts`, modeled on `tests/core/critChance.test.ts` (fresh run state, upgrades applied via `RunState.applyUpgrade`; no source files change).
- Damage: apply `weight` 3 times → the damage multiplier is exactly 1.25 × 1.25 × 1.25; apply `weight` once + `emphasis` once → 1.25 × 1.15. Assert the exact values of the combination rule the pipeline currently uses (the Design section pins the exact expected numbers read from the code).
- Fire rate: apply `rhythm` once + `allegro` once → 1.20 × 1.15, asserted exactly.
- Untouched stats: after applying only damage upgrades, the fire-rate and move-speed multipliers remain at their base value (1.0).
- Fresh state: a brand-new run reads damage 1.0, fire rate 1.0 and move speed 1.0 before any upgrade is applied.

## Acceptance criteria
- [ ] `tests/core/stats.test.ts` exists, is green, and `npm run check` passes along with all existing tests.
- [ ] The test asserts exact final stat values for the weight×3, weight+emphasis, rhythm+allegro, fresh-state and untouched-stat cases.
- [ ] No source files are modified (the diff touches only the new test file).
- [ ] `npm run smoke` passes.
