---
id: T0036
title: Unit tests for the upgrade roll
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-26T21:54:06Z
---

## Goal
Lock down the level-up roll so a maxed upgrade can never be re-offered and a roll always yields three distinct choices — the core of the roguelite loop, currently untested.

## Details
- Create a new test file `tests/core/upgrades.test.ts`, in the style of `tests/core/critChance.test.ts` (a small pure-function test, no Phaser).
- Test the pure `rollUpgradeChoices` function in `src/core/upgrades.ts`.
- Assert that when at least three upgrades are available (none at max level), a roll returns exactly three distinct upgrades.
- Assert that an upgrade that has reached its `maxLevel` is never included in the returned choices.
- No game code changes — the function already exists and behaves this way; this task only locks the behavior down.

## Acceptance criteria
- [ ] `tests/core/upgrades.test.ts` exists and passes
- [ ] The tests assert a roll returns 3 distinct upgrades when 3+ are available
- [ ] The tests assert a maxed upgrade is never offered
- [ ] `npm run check` and `npm run smoke` pass
