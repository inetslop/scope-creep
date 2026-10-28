---
id: T0042
title: "Resume a run: a run closed mid-way is kept and offered on the menu"
size: M
priority: 2
status: design
depends_on: [T0015]
attempts: 0
created: 2026-10-28T11:24:34Z
epic: E1
---

## Goal
A run closed mid-way (tab closed, phone locked) is no longer lost: the profile keeps it, and the menu offers a Resume button beside Play, so a 10-25 minute run survives the browser being closed.

## Details
- The run is saved only at phase boundaries, at exactly two moments, each overwriting the profile's saved run: (1) when the build phase starts — after the pre-wave-1 draft pick, and after every wave clears including its wave bonus — and (2) when the wave phase starts — when the build countdown ends.
- The save holds: the board seed (the board regenerates from it), every tower (grid cell plus each slot's augment and tier), gold, lives, the wave number, the phase (build or wave), the hand (picked cards not yet placed, with tiers), and the run's tally so far (waves held, stopped, clean waves, coins).
- Menu: while a saved run exists, a "Resume · Wave N" button sits directly above the Play button, in the same white rounded button style (N = the saved run's wave number). Tapping it regenerates the board from the saved seed, rebuilds every tower with its slots and tier pips, restores gold, lives, the hand and the tally, and enters the saved phase: build starts the countdown at full length, wave starts that wave fresh from its first spawn.
- Closing a tab mid-wave loses only the partial wave: resume restarts that wave from its first spawn with the gold the run had when the wave started, so the half-fought wave is simply replayed.
- Starting a new run while a saved run exists abandons it for nothing: Play clears the save and starts fresh.
- A finished run clears the save: after game over and the claim, the menu shows only Play.
- No new key, no new HUD element. The pause screen is unchanged — Resume is a menu button, labeled where it is used, like Play.

## Acceptance criteria
- [ ] Start a run, place one tower, close the tab during the build phase; reopen: the menu shows a "Resume · Wave 1" button above Play.
- [ ] Tap Resume: the board is the same road and rocks (same seed), the tower stands in the same cell with the same augments and tier pips, gold, lives and the HUD coin tally are as saved, and the build countdown runs from its full length.
- [ ] Close the tab mid-wave; tap Resume: the wave restarts from its first spawn with the start-of-wave gold, and board, towers, lives and tally are restored.
- [ ] With a saved run, tap Play: a fresh board starts and the Resume button is gone.
- [ ] Finish a run (game over, claim, menu): no Resume button, and the finished run appears in the profile and the Recent line as today.
- [ ] A device with no saved run shows exactly the menu it shows today (Play only).
