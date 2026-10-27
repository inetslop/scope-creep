---
id: T0071
title: Unit tests for the Understudy decoy
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T03:53:41Z
claimed_at: 2026-10-27T03:56:53Z
designer: yoga
---

## Goal
Lock the Understudy active's timing rules (T0015) in unit tests so its duration and cooldown cannot drift when later actives reuse the system.

## Details
- Follow the pattern of the existing pure tests (e.g. `tests/core/streak.test.ts`, `tests/core/boss.test.ts`): deterministic, no Phaser scene required.
- Lock the T0015 rules:
  - The decoy is active for exactly 3 s (still taunting just before 3 s, gone just after).
  - The next drop is allowed only after an 8 s cooldown from the previous drop: a drop attempt during the cooldown is rejected; at 8 s it is allowed.
  - A fresh run (no decoy ever dropped) can drop immediately.
- If the timing currently lives in the scene instead of a pure helper, extract the timing into one small pure module under `src/core/` (mirror how `crop.ts` and `boss.ts` expose their schedules) and unit-test that. Keep the extraction minimal: one function or one tiny pure class; do not touch gameplay behavior.

## Acceptance criteria
- [ ] A new test file (e.g. `tests/core/understudy.test.ts`) passes `npm run check` and runs in the standard test suite.
- [ ] The tests assert the 3 s active duration, the 8 s cooldown, rejection of a drop during cooldown, and that a fresh run can drop immediately.
- [ ] No gameplay values change: decoy duration, cooldown, taunt behavior and inputs behave identically to before.
