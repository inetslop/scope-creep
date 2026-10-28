---
id: T0050
title: Average wave on the profile card
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T12:34:55Z
epic: E1
---

## Goal
The profile card shows where the player usually lands, not just where they got lucky: the runs line gains an average.

## Details
- The menu profile card (T0007) shows a muted "runs N" line, N the total runs played.
- That line becomes "runs N · avg M", where M is the floor of the mean of the waves of the last up-to-4 finished runs (the recent list from T0018).
- With zero runs the line stays "runs 0" (no avg part); with fewer than four runs, M averages the runs that exist.
- The line keeps its current size and color, the card keeps its size and position, and the line never wraps.
- Example: recent waves 4, 9, 6, 12 and 17 runs played → "runs 17 · avg 8".

## Acceptance criteria
- [ ] With at least one finished run saved, the profile card's runs line reads "runs N · avg M", M the floor of the mean of the saved recent runs' waves.
- [ ] On a fresh device with no runs the line reads exactly "runs 0".
- [ ] The card keeps its size and position and the line stays on one line at 412x915 and 1280x720.
