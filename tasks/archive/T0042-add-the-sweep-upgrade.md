---
id: T0042
title: Add the Sweep upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0041]
attempts: 1
created: 2026-10-26T23:09:26Z
claimed_at: 2026-10-26T23:46:38Z
finished_at: 2026-10-26T23:52:24Z
---

## Goal
A shard-sweeping mobility build card: "Sweep" raises move speed and shard pickup radius together, so you can dash across the page and vacuum up every shard in your path.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'sweep'`, `name: 'Sweep'`, `description: '+10% move speed, +10% pickup radius'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.green`.
- `mods`: two mods — copy the move-speed mod from the `momentum` entry (same stat, same op) with value `1.10`, and copy the pickup-radius mod from the `gravity` entry (same stat, same op) with value `1.10`.
- At 3 levels: ×1.33 move speed and ×1.33 pickup radius (1.10³ ≈ 1.33).
- Add one small unit test to `tests/core/upgrades.test.ts` in the same style as the existing `presto` test: assert the exact two mods, apply the upgrade 3 times via `RunState.applyUpgrade`, and assert it is offered 3 times then stops.
- Do not change any other entry.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Sweep up to 3 times; each level multiplies move speed and pickup radius by 1.10
- [ ] It stacks with Momentum (move speed) and Gravity/Gather (pickup radius) normally
- [ ] The new unit test in `tests/core/upgrades.test.ts` passes
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one `UpgradeDef` entry to the end of the `UPGRADES` array (after the `presto` entry, before the closing `];` at line 279). No other line changes.
- edit `tests/core/upgrades.test.ts` — append one `it(...)` block inside the existing `describe('rollUpgradeChoices', ...)` block, after the `presto` test (after line 45). No new imports needed — all imports already exist.

### Interfaces
None. Data only; `UpgradeDef` (`src/content/types.ts:137`) unchanged.

### Steps
1. In `src/content/upgrades/index.ts`, append exactly this entry as the last element of `UPGRADES` (copy the `fugue` entry's two-mod shape; move-speed mod from `momentum` line 42, pickup mod from `gravity` line 63, both with value `1.10`):

```ts
  {
    id: 'sweep',
    name: 'Sweep',
    description: '+10% move speed, +10% pickup radius',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
      { stat: 'pickupRadius', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.green,
  },
```

2. In `tests/core/upgrades.test.ts`, append exactly this test (a copy of the `presto` test at lines 31–45 with `sweep` substituted):

```ts
  it('sweep offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('sweep')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
      { stat: 'pickupRadius', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('sweep')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```

3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- T0041 (Pulse) appends to the same array and test file — do this task after T0041 lands and re-read both files first; never assume `presto` is still the last entry.
- `toEqual` is order-sensitive: `moveSpeed` first, `pickupRadius` second, exactly as written.
- Do not touch `UPGRADE_BY_ID` (line 281) — it is derived from `UPGRADES` automatically.
- Do not modify any existing entry or reformat the file.
- No pooling, listeners, art, or input changes: pure content data, so no mobile/cleanup concerns. Stacking with Momentum/Gravity/Gather is automatic via `computeStats` (all `mul` mods multiply).

### Tests
- `tests/core/upgrades.test.ts`: the `sweep offers 3 levels, then stops` test above (already specified in Step 2). `tests/content.test.ts` validates the new entry automatically — no edit needed there.

## Result (attempt 1, yoga)

Added the "Sweep" upgrade to `UPGRADES` in `src/content/upgrades/index.ts` — a max-3-level, weight-4, green card that multiplies move speed and shard pickup radius by 1.10 each level (×1.33 at 3), so it stacks naturally with Momentum, Gravity and Gather. Added the matching unit test in `tests/core/upgrades.test.ts` asserting the exact two mods and 3-level availability. `npm run check` (131 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 5.8 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
