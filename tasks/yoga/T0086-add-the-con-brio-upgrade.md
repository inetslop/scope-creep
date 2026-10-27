---
id: T0086
title: Add the Con Brio upgrade
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-27T07:13:18Z
---

## Goal
A new level-up card: **Con Brio** pairs +10% damage with +8% move speed — the fast-attack build that keeps both halves of the Dynamics trade-off instead of paying for one: hit harder while running harder.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Andante (T0079) and Gravure (T0080) entries). Open the file first and append after whichever entry is currently last — T0084 (Riff) is in progress on this same machine and will have appended an entry, so never assume which entry is last.
- `id: 'con-brio'` (kebab-case, passes the existing content validation), display name "Con Brio", description `'+10% damage, +8% move speed'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.red` (the same red as the aggressive cards `accent`, `allegro` and `impasto`).
- Two mods, copied from existing entries, damage first and move speed second:
  - a damage mod on the same `damageMul` stat and `mul` op that the `emphasis` entry uses, but with value ×1.10 — +10% damage per level,
  - a move-speed mod on the same `moveSpeed` stat and `mul` op that the `andante` entry uses, with value ×1.08 — +8% move speed per level.
- At max level: ≈×1.33 damage and ≈×1.26 move speed; stacks with the other cards that use those stats (Weight/Emphasis/Pressure/Fugue for damage, Momentum/Tempo/Allegro/Presto/Sweep/Legato for move speed).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, appended after the last test in the file, following the `andante` test pattern: assert the exact two mods (damage first, move speed second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Con Brio" appears as a red level-up card in the three-card choice, reading "+10% damage, +8% move speed".
- [ ] Picking it adds +10% damage and +8% move speed per level; at 3 levels ≈×1.33 damage and ≈×1.26 move speed (the player visibly runs faster and hits harder), stacking with Emphasis and Tempo builds.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.
