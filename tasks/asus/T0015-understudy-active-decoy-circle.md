---
id: T0015
title: Understudy active — decoy circle
assignee: asus
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T19:20:22Z
---

## Goal
A new active ability that gives the player an escape verb: drop a decoy that draws all enemy fire for 3 seconds, so you can reposition, kite, or bait a Sentry's shot.

## Details
- New active ability "Understudy". Trigger: Space on desktop; a dedicated round touch button on mobile (large target, placed so it does not conflict with either stick).
- On trigger, a decoy appears at the player's position: a blue circle the same size as the player, with a thin dashed ink ring around it so it reads as "not you". It is stationary, takes no damage, blocks nothing, and is not an enemy: weapons, shards and damage numbers ignore it.
- The decoy lasts 3 seconds, then pops: a small burst of ink fragments plus a soft low "pop" SFX.
- While the decoy is alive, every normal enemy that targets the player instead targets the decoy's position: all chasers chase it, and shooters (Sentry) aim their shots at it. Enemy bullets already in flight are unaffected. When the decoy pops, enemies return to the player immediately.
- The Frame boss is unaffected: its drift and attack patterns keep targeting the player.
- Cooldown: 8 seconds from the moment the decoy is dropped. Triggers during cooldown do nothing.
- HUD: a small round icon in the bottom-left of the screen — solid blue when ready; while cooling, an ink arc sweeps clockwise from the top and fills as the cooldown recovers. On mobile the touch button shows the same state (dimmed while cooling).
- SFX: two new sounds in the existing synthesized style — a soft high "pop" on drop, a lower "pop" on expire.
- Add `understudyDrops: number` to the stats in `debug/testHook.ts`.
- Unit test in `tests/core/` for the cooldown: ready at the start, not ready for 8 s after a drop, ready again after.

## Acceptance criteria
- [ ] Pressing Space (desktop) or tapping the button (mobile) drops a blue decoy circle at the player's position that lasts 3 s and then pops with a fragment burst
- [ ] While the decoy is alive, enemies chase and shoot the decoy instead of the player; when it pops, they turn back to the player
- [ ] The Frame boss ignores the decoy
- [ ] The ability is on an 8 s cooldown; the HUD icon (and the mobile button) show the cooldown filling and are solid when ready
- [ ] Two new SFX play on drop and on expire
- [ ] Unit test for the cooldown in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass
