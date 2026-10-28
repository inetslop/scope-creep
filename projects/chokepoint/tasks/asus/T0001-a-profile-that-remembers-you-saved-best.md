---
id: T0001
title: "A profile that remembers you: saved best wave, run stats, coins"
assignee: asus
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
Runs end with numbers worth keeping: the device remembers your best wave, how many runs you have played, and a new currency (coins) earned from every run. This is the foundation every later E1 slice displays.

## Details
- A profile object persisted on the device (localStorage or equivalent; survives closing the browser): `bestWave`, `runsPlayed`, `coins`, `lastRun` (wave + coins earned, or none yet). Starts empty: 0 / 0 / 0 / none.
- During a run, the run ledger tracks: waves held, enemies stopped, gold earned, and clean waves (a wave that ends without any leak).
- At game over, update the profile: `bestWave` = max(old, waves held); `runsPlayed` +1; coins earned = waves held + floor(enemies stopped / 10) + clean waves; add to `coins`; set `lastRun`.
- The game-over card gains four lines under the existing score line, in this order:
  - "Waves held 12"
  - "Stopped 148"
  - "Clean 5"
  - "+24 coins" — in yellow (gold), the only colored line
  Lines show even when the value is 0. The score line stays exactly as it is today.
- The menu's best-run line becomes "Best: wave N" (the profile's best wave). The score is no longer shown on the menu.
- Layout: the new lines fit the existing game-over card at 412x915 and 1280x720 (shrink line spacing, not the card).

## Acceptance criteria
- [ ] Play a run, quit, play another: the menu shows the higher best wave and the runs count incremented.
- [ ] A run of 12 waves with 148 stopped and 5 clean waves shows "+31 coins" on the game-over card (12 + 14 + 5).
- [ ] Close and reopen the browser: the menu still shows the best wave and runs played (nothing reset).
- [ ] The four new game-over lines are fully visible inside the white card at 412x915 and 1280x720.
- [ ] A run that stops 0 enemies and holds 0 waves adds 0 coins and still updates runs played.
