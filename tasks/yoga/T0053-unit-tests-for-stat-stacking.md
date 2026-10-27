---
id: T0053
title: Unit tests for stat stacking
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T00:32:39Z
claimed_at: 2026-10-27T02:03:53Z
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

## Design (architect, yoga)

### Files
- create `tests/core/stats.test.ts` — locks the stat-stacking pipeline (`RunState.applyUpgrade` + `computeStats`); zero source changes.
### Interfaces
None — test-only file, no new types.
### Steps
1. Create `tests/core/stats.test.ts` with exactly this content (same import shape as `tests/core/critChance.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';

describe('stat stacking', () => {
  const byId = (id: string) => UPGRADE_BY_ID.get(id)!;

  it('a fresh run reads the base values before any upgrade', () => {
    const run = new RunState(1);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
    expect(run.stats.moveSpeed).toBe(230);
  });

  it('weight x3 stacks as 1.25 * 1.25 * 1.25', () => {
    const run = new RunState(1);
    const def = byId('weight');
    for (let i = 0; i < 3; i++) run.applyUpgrade(def);
    expect(run.stats.damageMul).toBe(1.953125);
  });

  it('weight + emphasis stack as 1.25 * 1.15', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('emphasis'));
    expect(run.stats.damageMul).toBe(1.4375);
  });

  it('rhythm + allegro stack as 1.2 * 1.15', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('rhythm'));
    run.applyUpgrade(byId('allegro'));
    expect(run.stats.fireRateMul).toBe(1.38);
  });

  it('damage-only upgrades leave fire rate and move speed at base', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('emphasis'));
    expect(run.stats.fireRateMul).toBe(1);
    expect(run.stats.moveSpeed).toBe(230);
  });
});
```

2. Run `npm run check`, then `npm run smoke`; both must be green. The diff must touch only `tests/core/stats.test.ts`.
### Pitfalls
- `moveSpeed` is world units/sec with base **230**, not a 1.0 multiplier — assert `toBe(230)`, never `toBe(1)`.
- Keep exact `toBe` doubles, never `toBeCloseTo`; the pinned values are IEEE-754 results (1.953125 exact; `1.25*1.15` tie-rounds to 1.4375; `1.2*1.15` rounds to double(1.38)). If an assertion ever fails, do not "clean up" the number — report it.
- `applyUpgrade` does not check `maxLevel`, so three `weight` applies is legal; no `upgradeLevels` setup needed.
- Do not edit `src/content/upgrades/index.ts` — T0051/T0052 will add upgrades there; this test only reads the four ids above via `UPGRADE_BY_ID`, so their work cannot break it (and no file overlap).
### Tests
- `tests/core/stats.test.ts` (the entire task).
