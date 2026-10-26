---
id: T0014
title: Kill-streak tally in the HUD
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T18:39:20Z
claimed_at: 2026-10-26T19:20:24Z
designer: desktop
---

## Goal
A kill-streak tally in the HUD: consecutive kills without taking damage. Aggressive, clean play becomes visibly rewarded, and the run's rhythm is something to chase.

## Details
- Streak = the number of enemies the player has killed in a row without taking damage. Every kill counts, from any source (projectiles, Orbit contact). Any damage taken (enemy contact or enemy shots) resets the streak to 0.
- HUD: when the streak is 2 or more, show a small ink-colored text "×N" in the top-right of the HUD (N = current streak), in the same font style as the other HUD numbers, placed so it does not overlap the HP bar. Hidden when the streak is below 2.
- When the streak reaches exactly 8 — and every multiple of 8 after (16, 24…) — the tally flashes red for 0.8 s and the word "RHYTHM" appears next to it in red for 0.8 s.
- When the streak resets because the player was hit, the tally fades out over 0.3 s instead of disappearing instantly.
- The GameOver screen shows the best streak reached this run as a small line next to the existing stats, e.g. "BEST STREAK ×12".

## Acceptance criteria
- [ ] Killing 2 enemies without taking damage shows a small ink "×2" in the top-right of the HUD, growing with each kill
- [ ] Taking any damage makes the tally fade out; the next kill starts the streak over (hidden until ×2)
- [ ] At exactly 8 consecutive kills the tally and the word "RHYTHM" flash red for ~0.8 s, and again at 16 and 24
- [ ] The GameOver screen shows the best streak reached this run
- [ ] `npm run check` and `npm run smoke` pass
