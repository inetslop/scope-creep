---
id: T0042
title: Add the Sweep upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
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
