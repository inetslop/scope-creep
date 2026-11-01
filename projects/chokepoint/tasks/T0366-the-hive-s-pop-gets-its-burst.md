---
id: T0366
title: "The Hive's pop gets its burst"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T16:18:26Z
---

## Goal
The Hive's "growing the group" lands at the moment it happens: when a telegraphed Dot materializes on the road, a small burst marks the pop, separate from the pre-pop warning ring.

## Details
- The Hive (the wave-40 boss) pops one small Dot every 6 s (up to 5), each pop telegraphed in advance by a thin purple ring at its base.
- The moment a telegraphed Dot actually spawns, play one small 4-chip burst in the Hive's own purple (the boss's body color) at the pop spot, over ~0.3 s, fading out. The ring warns before the pop; the burst is the Dot arriving — a two-beat moment (warning, then event) at the same spot.
- Display only: no sound, no text, no chip, no HUD. It rides the existing enemy-hook pattern — a new hook file, registered once alongside the others.
- It changes nothing about the Hive's numbers, the popped Dot's numbers, the wave plan, the boss's hp, or the pop's timing.

## Acceptance criteria
- [ ] When the Hive pops a Dot, a small purple 4-chip burst plays at the pop spot at the moment the Dot appears; the pre-pop telegraph ring is unchanged and still plays first.
- [ ] The burst is purple (the Hive's own body color), ~0.3 s, and display-only (no sound, no text, no HUD element).
- [ ] It plays once per pop (up to 5 per Hive), never on the Hive's own spawn or death, and never for any other enemy or boss.
- [ ] The Hive's pop cadence (6 s), the popped Dot's stats, the wave plan and the boss's hp are all unchanged.
- [ ] A new enemy-hook file is added and registered; no other enemy's behavior or look changes.
