---
id: T0049
title: Unit tests for the level-up XP curve
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T00:03:46Z
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

## Design (architect, desktop)

### Files
- create `tests/core/progression.test.ts` - unit tests for the XP curve (`xpToNextLevel` in `src/core/progression.ts`) and the XP state in `RunState` (`src/core/run.ts`). Tests only; no source file is edited.

### Interfaces
None new. Uses existing exports, verified in the code:
- `xpToNextLevel(level: number): number` — `Math.round(5 + 4 * Math.pow(level, 1.45))` (src/core/progression.ts:2)
- `new RunState(seed: number)` with `level`, `xp`, `xpToNext`, `pendingLevelUps` fields and `addXp(amount: number): number` (src/core/run.ts:11-63). A fresh run has no stat mods, so `stats.xpMul` is 1 and `addXp` adds exactly `amount`.

Pinned values (computed from the real formula): `xpToNextLevel(1) = 9`, `xpToNextLevel(2) = 16`, `xpToNextLevel(100) = 3182`.

### Steps
1. Create `tests/core/progression.test.ts` with exactly this content (modeled on `tests/core/rng.test.ts`; do not edit that file — T0043 is on it):

```ts
import { describe, expect, it } from 'vitest';
import { xpToNextLevel } from '../../src/core/progression';
import { RunState } from '../../src/core/run';

describe('xpToNextLevel', () => {
  it('matches the pinned values for the first levels', () => {
    expect(xpToNextLevel(1)).toBe(9);
    expect(xpToNextLevel(2)).toBe(16);
  });

  it('is strictly increasing from level 1 through level 30', () => {
    for (let level = 2; level <= 30; level++) {
      expect(xpToNextLevel(level)).toBeGreaterThan(xpToNextLevel(level - 1));
    }
  });

  it('stays finite at high levels', () => {
    const xp = xpToNextLevel(100);
    expect(Number.isFinite(xp)).toBe(true);
    expect(xp).toBe(3182);
  });
});

describe('RunState XP', () => {
  it('a fresh run starts at level 1 with 0 XP', () => {
    const run = new RunState(1);
    expect(run.level).toBe(1);
    expect(run.xp).toBe(0);
    expect(run.xpToNext).toBe(xpToNextLevel(1));
  });

  it('adding exactly the required XP levels up exactly once', () => {
    const run = new RunState(1);
    const gained = run.addXp(xpToNextLevel(1));
    expect(gained).toBe(1);
    expect(run.level).toBe(2);
    expect(run.xp).toBe(0);
    expect(run.xpToNext).toBe(xpToNextLevel(2));
    expect(run.pendingLevelUps).toBe(1);
  });

  it('adding one less XP does not level up', () => {
    const run = new RunState(1);
    const gained = run.addXp(xpToNextLevel(1) - 1);
    expect(gained).toBe(0);
    expect(run.level).toBe(1);
    expect(run.xp).toBe(xpToNextLevel(1) - 1);
    expect(run.pendingLevelUps).toBe(0);
  });
});
```

2. Run `npm run check` — the new file is picked up automatically by `vitest.config.ts` (`include: ['tests/**/*.test.ts']`).
3. Run `npm run smoke`.

### Pitfalls
- `addXp` multiplies by `stats.xpMul`; only use a fresh `RunState` (no `applyUpgrade` calls) so xpMul is 1. Never apply an upgrade before the boundary tests.
- Do not edit `src/core/run.ts` or `src/core/progression.ts` — T0044/T0045/T0047 will touch `run.ts`; this task only reads it.
- The pinned numbers (9, 16, 3182) are the point of the task: if progression balance changes, these tests must fail loudly, not be "fixed" by updating the test.
- No Phaser imports, no DOM — vitest runs in the node environment; keep the file pure.

### Tests
- `tests/core/progression.test.ts` as above: pinned curve values, strict increase over levels 1–30 (≥20 required), finite at level 100, fresh state at level 1 / 0 XP, exact-XP boundary (exact = one level up, one less = none).
