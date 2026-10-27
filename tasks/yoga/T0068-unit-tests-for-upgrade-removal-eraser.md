---
id: T0068
title: Unit tests for upgrade removal (Eraser)
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T03:21:30Z
claimed_at: 2026-10-27T04:40:23Z
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

## Design (architect, yoga)

### Files
- create `tests/core/run.test.ts` — unit test for `RunState.removeLastUpgrade()` (Eraser removal rule, T0047). No source file changes.
### Interfaces
none — no new or changed types; the test only uses existing members: `new RunState(1)`, `run.applyUpgrade(def)`, `run.removeLastUpgrade(): UpgradeDef | null`, `run.upgradeLevel(id: string): number`, `run.stats.damageMul`, `run.stats.fireRateMul`.
### Steps
1. Create `tests/core/run.test.ts` with exactly this content (vitest style copied from `tests/core/streak.test.ts`, `byId` helper from `tests/core/stats.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';

describe('upgrade removal (the Eraser)', () => {
  const byId = (id: string) => UPGRADE_BY_ID.get(id)!;
  const pick3 = (run: RunState) => {
    run.applyUpgrade(byId('rhythm'));
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('weight'));
  };

  it('is a no-op on a fresh run with no upgrades', () => {
    const run = new RunState(1);
    expect(run.removeLastUpgrade()).toBeNull();
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });

  it('drops the newest level first: weight 2 -> 1, rhythm stays at 1', () => {
    const run = new RunState(1);
    pick3(run);
    expect(run.removeLastUpgrade()?.id).toBe('weight');
    expect(run.upgradeLevel('rhythm')).toBe(1);
    expect(run.upgradeLevel('weight')).toBe(1);
  });

  it('drops weight to 0: damage back at base, fire rate keeps rhythm', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()?.id).toBe('weight');
    expect(run.upgradeLevel('weight')).toBe(0);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1.2);
  });

  it('drops rhythm to 0: all stats back at base', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()?.id).toBe('rhythm');
    expect(run.upgradeLevel('rhythm')).toBe(0);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });

  it('is a no-op again on the now-empty run', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()).toBeNull();
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });
});
```

2. Run `npm run check` (typecheck + lint + full suite); it must pass.
### Pitfalls
- Do not edit anything under `src/` — if a test fails, the test file is wrong, not `run.ts`.
- Keep exact `toBe(1)` / `toBe(1.2)`, not `toBeCloseTo`: after removals only single `mul` mods remain (or none), so the doubles are exact, matching `stats.test.ts` style.
- Each `it` builds its own `new RunState(1)` and re-runs `pick3`; never share one run across tests, and keep the fixed seed `1`.
- `tests/core/erase.test.ts` overlaps thematically — leave it untouched; the task file is only the new `run.test.ts`. Don't add extra imports, deps, or `it` blocks.
### Tests
- `tests/core/run.test.ts`: the five cases above (empty no-op; newest level first with rhythm surviving; weight fully removed, damage at base, fire rate 1.2; all base; no-op on the now-empty run).
