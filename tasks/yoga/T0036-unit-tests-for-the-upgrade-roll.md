---
id: T0036
title: Unit tests for the upgrade roll
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T21:54:06Z
claimed_at: 2026-10-26T22:07:44Z
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

## Design (architect, desktop)

### Files
- create `tests/core/upgrades.test.ts` - unit tests for `rollUpgradeChoices` (style of `tests/core/critChance.test.ts`; vitest auto-includes `tests/**/*.test.ts`, no config change)
### Interfaces
No new types. Test the existing `src/core/upgrades.ts:14`:
```ts
export function rollUpgradeChoices(rng: Rng, pool: readonly UpgradeDef[], levelOf: (id: string) => number, ownedWeapons: readonly string[], count = 3): UpgradeDef[]
```
### Steps
1. Create `tests/core/upgrades.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest';
import { UPGRADES, UPGRADE_BY_ID } from '../../src/content/upgrades';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { rollUpgradeChoices } from '../../src/core/upgrades';

describe('rollUpgradeChoices', () => {
  it('returns exactly 3 distinct upgrades when 3+ are available', () => {
    const run = new RunState(1);
    for (let seed = 1; seed < 50; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((c) => c.id)).size).toBe(3);
    }
  });

  it('never offers an upgrade at max level', () => {
    const run = new RunState(1);
    const maxed = ['contrast', 'vector', 'plate'];
    for (const id of maxed) {
      const def = UPGRADE_BY_ID.get(id)!;
      for (let i = 0; i < def.maxLevel; i++) run.applyUpgrade(def);
    }
    for (let seed = 1; seed < 200; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      for (const id of maxed) expect(choices.map((c) => c.id)).not.toContain(id);
    }
  });
});
```
2. Run `npm run check`, then `npm run smoke`.
### Pitfalls
- The roll is weighted-random: a single roll could pass even with a broken max-level filter, so loop many seeds with `new Rng(seed)` (never `Math.random()` — project rule).
- Use `run.upgradeLevel(id)` as `levelOf` and `run.weapons` as owned weapons, exactly like `GameScene.ts:145`.
- Do NOT edit `src/core/upgrades.ts` or `src/content/upgrades/index.ts` (T0034/T0035 touch them; this task is tests-only).
- Tests must stay robust to T0034/T0035 adding upgrades: they only assert "3 distinct" and "maxed ids absent", never the pool size.
### Tests
- `tests/core/upgrades.test.ts` as above: (1) fresh run, 50 seeds → exactly 3 distinct ids; (2) max out `contrast`/`vector`/`plate` via `run.applyUpgrade`, 200 seeds → length 3 and none of the maxed ids present.
