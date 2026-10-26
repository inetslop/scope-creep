---
id: T0041
title: Add the Pulse upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
---

## Goal
A crit-shred build card: "Pulse" stacks fire rate and crit chance together, giving the crit build (Contrast, Accent) the tempo it currently lacks.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'pulse'`, `name: 'Pulse'`, `description: '+10% fire rate, +5% crit chance'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red` (the crit theme, matching Contrast and Accent).
- `mods`: two mods — copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value `1.10`, and copy the crit mod from the `contrast` entry (same stat, same op) with value `0.05`.
- At 3 levels: ×1.33 fire rate (1.10³) and +15% crit chance.
- Add one small unit test to `tests/core/upgrades.test.ts` in the same style as the existing `presto` test: assert the exact two mods, apply the upgrade 3 times via `RunState.applyUpgrade`, and assert it is offered 3 times then stops.
- Do not change any other entry.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Pulse up to 3 times; each level multiplies fire rate by 1.10 and adds 0.05 crit chance
- [ ] It stacks with Rhythm (fire rate) and Contrast/Accent (crit chance) normally
- [ ] The new unit test in `tests/core/upgrades.test.ts` passes
- [ ] `npm run check` and `npm run smoke` pass
