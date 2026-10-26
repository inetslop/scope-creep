---
id: T0024
title: Unit tests for critChance clamping
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:18:38Z
claimed_at: 2026-10-26T20:45:46Z
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

## Design (architect, desktop)

### Files
- create `tests/core/critChance.test.ts` - unit tests locking the `critChance` clamp (0..0.5) in `src/core/stats.ts`, same style as `tests/core/rng.test.ts` (vitest, relative imports). No `src/` changes.

### Interfaces
No new types or functions. Uses existing, verified APIs:
- `computeStats(mods: readonly StatMod[], base?: Readonly<PlayerStats>): PlayerStats` (`src/core/stats.ts:74`) — clamps via `STAT_LIMITS.critChance = { min: 0, max: 0.5 }`.
- `new RunState(seed: number)` + `run.stats.critChance` + `run.applyUpgrade(def)` (`src/core/run.ts`) — `applyUpgrade` does NOT enforce `maxLevel`, so stacking `contrast` past 3 levels is legal and drives the stat to 1.0 pre-clamp.
- `UPGRADE_BY_ID: Map<string, UpgradeDef>` from `src/content/upgrades/index.ts` (id `'contrast'` adds `+0.1` critChance).

### Steps
1. Create `tests/core/critChance.test.ts` with exactly this content:

```ts
import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';
import { BASE_STATS, computeStats } from '../../src/core/stats';

describe('critChance clamping', () => {
  it('a fresh run reads 0', () => {
    expect(BASE_STATS.critChance).toBe(0);
    expect(new RunState(1).stats.critChance).toBe(0);
  });

  it('never reads above 0.5', () => {
    expect(computeStats([{ stat: 'critChance', op: 'add', value: 99 }]).critChance).toBe(0.5);
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('contrast')!;
    for (let i = 0; i < 10; i++) run.applyUpgrade(def);
    expect(run.stats.critChance).toBe(0.5);
  });

  it('never reads below 0', () => {
    expect(computeStats([{ stat: 'critChance', op: 'add', value: -99 }]).critChance).toBe(0);
    const s = computeStats([
      { stat: 'critChance', op: 'add', value: 0.2 },
      { stat: 'critChance', op: 'add', value: -1 },
    ]);
    expect(s.critChance).toBe(0);
  });
});
```

2. Run `npm run check`. All three tests pass; typecheck/lint clean. Done.

### Pitfalls
- Use `toBe` (exact), not `toBeCloseTo`: `Math.min`/`Math.max` clamping yields exactly `0.5`/`0`, so exact assertions are safe and stronger.
- Don't also assert the unclamped 0.3-after-3-contrasts value — that already exists in `tests/core/core.test.ts:59-65`; keep only the three tests above.
- Import only what the file uses (eslint `no-unused-vars` is an error); the snippet's imports are all used.
- Do not touch anything under `src/` (acceptance criterion).

### Tests
- `tests/core/critChance.test.ts` (the file itself): fresh-run 0, clamp at 0.5 via direct mod and stacked `contrast` upgrades, clamp at 0 via negative mod.
