---
id: T0070
title: Boss warning — the page trembles before a boss lands
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T03:53:41Z
---

## Goal
Five seconds before any boss spawn (The Frame or The Grid, including scaled HP respawns), the player gets a warning: the arena boundary pulses red, "SOMETHING HEAVY APPROACHES" flashes in the HUD, and one soft low thud plays — so the boss sting (T0058) and the nameplate (T0064) land on top of a build-up instead of out of nowhere.

## Details
- The warning window is exactly the 5 seconds before a scheduled boss spawn: from spawnTime − 5 s to spawnTime.
- Visual: a red ink line (2 u thick) drawn along the current safe-area boundary (it must follow the crop marks from T0045, not the old full-arena edge). Its opacity pulses 0 → 0.6 → 0 over 1 s, repeating until the boss spawns. No other new persistent art.
- HUD: "SOMETHING HEAVY APPROACHES" in red small caps, top-center of the page just below where the boss nameplate (T0064) is printed; fades out over 2 s. Reuse the existing HUD flash pattern ("ERASED", "RHYTHM").
- Audio: one soft low thud (~60 Hz, ~200 ms decay) at the start of the window, throttled to at most one per warning. The spawn itself keeps the existing T0058 boss sting; do not change the sting.
- If the run is paused, the countdown and the pulse pause with the game and resume without a jump.
- The warning must fire for The Frame and The Grid, for their first spawns and for every later respawn.

## Acceptance criteria
- [ ] In a run, exactly 5 s before The Frame's 5:00 spawn the boundary starts pulsing red, the HUD flash appears, and the low thud plays.
- [ ] The pulse has stopped and the flash is gone by the moment the boss sting plays at spawn.
- [ ] The same warning plays before The Grid's 10:00 spawn and before a boss respawn; the red line follows the cropped boundary when the crop is active (after 12:00).
- [ ] No warning appears when no boss spawn is scheduled within the next 5 s.
- [ ] Pausing the game pauses the pulse; resuming continues it with no jump or double thud.
