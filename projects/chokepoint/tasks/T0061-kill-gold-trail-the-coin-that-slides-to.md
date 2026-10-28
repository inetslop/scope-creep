---
id: T0061
title: "Kill gold trail: the coin that slides to the tally"
size: S
priority: 3
status: designing
depends_on: [T0039]
attempts: 0
created: 2026-10-28T13:29:40Z
claimed_at: 2026-10-28T19:50:53Z
epic: E1
designer: yoga
---

## Goal
The money is seen moving where it was earned: each kill's gold flies to the HUD's gold tally as one small coin, so the gold number reads as the place the kill's gold goes.

## Details
- When a kill pays its normal kill gold (including T0054's doubled amount while last stand is on), one small coin — the same coin icon as the HUD tally (T0013), ~10 px — leaves the kill spot (the same anchor as the gold pop) and flies to the gold number in the stats card over ~200 ms on a short arc, ease-out, fading in its last ~30 ms.
- One coin per kill, whatever the amount: it is a symbol of the gold, not a count of it. The kill's gold pop is unchanged — the trail is in addition to the pop, never a replacement.
- The Mint "+1" pops (T0039) never get coins; they stay pops.
- Cap: at most 8 coins in flight at once; when the cap is reached, a kill shows only its pop. Coins are destroyed on arrival (and by a 500 ms safety timeout) and die with the scene, like the Fx pops.
- The gold number's pop on growth (T0017) is unchanged — it still pops when the tally rises; a coin landing is not a separate pop trigger.
- Closest existing: the gold pop's rise and fade (the kill-gold pop) and the coin icon on the tally (T0013) — the same coin, in flight.

## Acceptance criteria
- [ ] Every kill with normal gold shows one small coin flying from the kill spot to the stats card's gold number over ~200 ms, in addition to the unchanged gold pop.
- [ ] While last stand is on (T0054) the coin still flies — one per kill, same size — and Mint "+1" pops (T0039) never get coins.
- [ ] With 8 coins already in flight, extra kills show only their pop; every coin is destroyed on arrival or timeout (no leaked objects).
- [ ] Gold totals, the tally's pop, sounds and all other HUD are unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0055: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. Use an enemy hook (`onKill`, with the gold the kill paid) to start the coin, and an effect file in `systems/fx/` for the slide (a tween needs no per-frame code); no `EnemySystem` or `GameScene` edit.
