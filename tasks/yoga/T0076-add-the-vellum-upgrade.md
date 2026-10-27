---
id: T0076
title: Add the Vellum upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T04:43:07Z
claimed_at: 2026-10-27T04:47:44Z
designer: yoga
---

## Goal
A "tank collector" level-up card — armor plus shard XP on one card — for players who want to wade into the swarm and still come out rich: the defensive axis meets the shard economy.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tenuto (T0073) and Legato (T0072) entries). Open the file first and append after whichever entry is currently last — T0074 (Sotto Voce) is in progress on this same machine and may have appended an entry, so never assume which entry is last.
- `id: 'vellum'`, display name "Vellum", description `'+1 armor, +15% shard XP'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the defensive/economy cards `plate`, `pedal` and `gather`).
- Two mods, copied from existing entries:
  - the +1 armor mod from the `plate` entry (same stat and op, value 1) — +1 armor per level,
  - the +15% shard XP mod from the `gather` entry (the same `xpMul` ×1.15 that `glissando` uses) — +15% shard XP per level.
- At max level: +3 armor and ≈×1.52 shard XP; stacks with the other cards that use those stats (Mass/Plate/Pedal/Tenuto for armor, Composition/Gather/Glissando/Sotto Voce for shard XP).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tenuto` test pattern: assert the exact two mods (armor first, shard XP second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Vellum" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +15% shard XP".
- [ ] Picking it adds +1 armor and +15% shard XP per level; at 3 levels, +3 armor and ≈×1.52 shard XP (the player shrugs off more hits and shards grant noticeably more XP).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
