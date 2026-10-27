---
id: T0049
title: Unit tests for the level-up XP curve
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T00:03:46Z
claimed_at: 2026-10-27T00:05:03Z
designer: desktop
---

## Goal
Lock the level-up XP curve with unit tests so the run's pacing — how often the player levels up — cannot silently break when progression code changes.

## Details
- Create `tests/core/progression.test.ts`, modeled on the structure of `tests/core/rng.test.ts` (plain describe/it, no Phaser imports).
- Test the real exported helpers from `src/core/progression.ts` — use their actual names, signatures, and types (the architect pins the exact expected numbers to what the module really returns).
- Cover:
  - The XP required for the next level is strictly increasing from level 1 through at least level 20.
  - A fresh progression state starts at level 1 with 0 XP.
  - Adding exactly the required XP levels up exactly once; adding one less XP does not level up.
  - The curve stays finite at high levels: at level 100 the required XP is a finite number (no NaN or Infinity).
- Do not change any source file — this task adds tests only.

## Acceptance criteria
- [ ] `tests/core/progression.test.ts` exists and passes
- [ ] The strictly-increasing property is asserted for at least 20 levels
- [ ] The exact-XP boundary is asserted (exact = levels up once, one less = no level up)
- [ ] `npm run check` and `npm run smoke` pass
