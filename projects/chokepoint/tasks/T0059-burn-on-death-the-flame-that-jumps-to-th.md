---
id: T0059
title: "Burn on death: the flame that jumps to the nearest"
size: S
priority: 3
status: design
depends_on: [T0028, T0039, T0027]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E4
---

## Goal
Ember's burn spreads one step: when a burning enemy dies, its flame jumps to the nearest enemy within 2 cells, so a burn can carry through a cluster — the first burn that moves between enemies.

## Details
- When an enemy with an active burn (T0028) dies — by any cause — and a living enemy is within 2 cells of the death spot (the same 2-cell measure Mint's and Rally's auras use), the burn jumps to the nearest one: the new host gets a fresh 3 s burn at the same damage-per-second rate the dying enemy's burn had.
- One jump only: the jumped burn is marked, and when that host later dies, its burn does not jump — a chain is at most one hop per burn, so a swarm can never ping-pong a burn forever.
- Re-ignition is unchanged (T0028: refresh duration, keep the higher rate); a jumped burn that re-ignites on its host keeps the usual rules.
- Visual: a quick 150 ms orange spark line from the death spot to the new host (the burn's own orange), then the host shows the burn exactly as today. No new sound.
- Closest existing: Ember's re-ignition (T0028) — same burn, same rate language; new is that the burn moves to a new enemy on death.

## Acceptance criteria
- [ ] A burning enemy that dies with another enemy within 2 cells leaves its burn on the nearest one: the new host burns for a fresh 3 s at the same damage/s, with a 150 ms orange spark from death spot to host.
- [ ] The jumped burn never jumps again: the new host's later death (even while burning) leaves no further jump.
- [ ] A burning enemy that dies with no enemy within 2 cells leaves no jump; an enemy that dies unburned is unchanged in every way.
- [ ] Burn numbers, re-ignition, gold, stats and sounds are otherwise unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0070: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design was written before kills moved into `EnemySystem.kill()` (a burning enemy usually dies from its burn tick, which never goes through `strike()`) and before the enemy hooks. Design it as an enemy hook (`systems/enemyHooks/`, `onKill`: the dying enemy is still active there, so leave it out of the candidates) and the spark as an effect file (`systems/fx/`), so it edits no shared file.
