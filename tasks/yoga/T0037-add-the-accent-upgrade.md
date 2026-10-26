---
id: T0037
title: Add the Accent upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:44:06Z
designer: desktop
---

## Goal
A crit-focused build. The "Accent" card raises both crit chance and damage, so stacking it with Contrast builds a real crit build — one of the few non-raw-DPS directions in the pool.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'accent'`, `name: 'Accent'`, `description: '+5% crit chance, +10% damage'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- `mods`: two mods — copy the crit-chance mod from the `contrast` entry (same stat, same op) with value `0.05`, and copy the damage mod from the `emphasis` entry (same stat, same op) with value `1.10`.
- At 3 levels: +15% crit chance and ×1.33 damage (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Accent up to 3 times; each level adds +5% crit chance and multiplies damage by 1.10
- [ ] It stacks with Contrast (crit chance) and Weight/Emphasis (damage) normally
- [ ] `npm run check` and `npm run smoke` pass
