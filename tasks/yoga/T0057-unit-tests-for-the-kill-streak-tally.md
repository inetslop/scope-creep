---
id: T0057
title: Unit tests for the kill-streak tally
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T01:47:24Z
---

## Goal
Lock down the kill-streak rules added in T0014 so the streak tally can never silently regress.

## Details
- One new test file `tests/core/streak.test.ts`, modeled on `tests/core/critChance.test.ts` (fresh run state, driven through the `RunState` API; no source files change).
- Fresh run: streak 0 and bestStreak 0 before any kill.
- Growing: 8 consecutive kills via `RunState.registerKill()` give streak 8 and bestStreak 8.
- Reset: taking damage (the `takeDamage()` path that resets the streak, per T0014) drops streak to 0 and leaves bestStreak at 8.
- After the reset, a shorter run of 5 kills leaves streak 5 and bestStreak 8; a longer run of 9 kills updates bestStreak to 9.
- Assert only the streak/bestStreak state — not the HUD "RHYTHM" flash, which lives in the scene.

## Acceptance criteria
- [ ] `tests/core/streak.test.ts` exists, is green, and `npm run check` passes along with all existing tests.
- [ ] The test asserts the fresh, grow-to-8, reset-keeps-best, shorter-run and longer-run cases above.
- [ ] No source files are modified (the diff touches only the new test file).
- [ ] `npm run smoke` passes.

## Design (architect, yoga)

### Files
- create `tests/core/streak.test.ts` - locks T0014 kill-streak rules on `RunState`; no source files change
### Interfaces
None — test-only; it uses existing `RunState` API: `new RunState(seed: number)`, `run.registerKill(): void`, `run.takeDamage(amount: number): number`, fields `run.streak: number`, `run.bestStreak: number`.
### Steps
1. Create `tests/core/streak.test.ts` with EXACTLY this content (copy `tests/core/critChance.test.ts` only for the import lines, not the body):

```ts
import { describe, expect, it } from 'vitest';
import { RunState } from '../../src/core/run';

function kills(n: number, run: RunState): void {
  for (let i = 0; i < n; i++) run.registerKill();
}

describe('kill-streak tally', () => {
  it('a fresh run reads 0 for streak and bestStreak', () => {
    const run = new RunState(1);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(0);
  });

  it('eight consecutive kills grow streak and bestStreak to 8', () => {
    const run = new RunState(1);
    kills(8, run);
    expect(run.streak).toBe(8);
    expect(run.bestStreak).toBe(8);
  });

  it('taking damage resets streak but keeps bestStreak', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(8);
  });

  it('a shorter run after a reset leaves bestStreak at 8', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    kills(5, run);
    expect(run.streak).toBe(5);
    expect(run.bestStreak).toBe(8);
  });

  it('a longer run after a reset raises bestStreak to 9', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    kills(9, run);
    expect(run.streak).toBe(9);
    expect(run.bestStreak).toBe(9);
  });
});
```

2. Run `npm run check` — must be green. Do not touch any other file; diff must be this one new file only.
### Pitfalls
- `takeDamage()` returns early without resetting when `amount <= 0` or the player is dead — always pass `1` on a live run (`hp` starts at 100), or the reset never happens.
- Assert only `streak`/`bestStreak`; never reference the HUD "RHYTHM" flash (scene code) or `hp` values.
- Do not import anything from `src/scenes`, `src/systems`, or Phaser — keep it a pure `core` test like `critChance.test.ts`.
### Tests
- The file itself: fresh-0, grow-to-8, reset-keeps-best-8, shorter-run-5/8, longer-run-9/9.
