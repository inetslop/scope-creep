---
id: T0069
title: The pause line stars your record
size: S
priority: 3
status: design
depends_on: [T0030, T0035]
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E1
---

## Goal
A record attempt is seen where a run is paused: the moment the run's wave equals the saved best wave, the pause screen's run line wears the best-run star.

## Details
- The run-so-far line on the pause screen (T0030: wave, lives, gold, the run's coins) shows the small yellow star — the same star, size and color as the profile card's (T0016) and the Recent line's (T0037) — next to the wave number from the moment the current wave equals the saved best wave, and it stays for the rest of the run (at or past the record).
- The star appears live: a pause opened after the run passes the best wave shows it with no extra step. A run that starts at or above the saved best (a resumed run, T0042) shows the star from its first pause.
- No other change to the pause screen: the sound row (T0035) is its own task, the run line's numbers are T0030's, and the profile card's own star (T0016) is untouched.
- Chained behind T0035 on purpose: the pause card grows one element at a time, never two tasks editing it at once.

## Acceptance criteria
- [ ] With the saved best wave at 12: pausing at wave 11 shows the run line with no star; pausing at wave 12 or 13 shows the yellow star next to the wave number.
- [ ] The star is the same texture, size and yellow as the profile card's "Best wave" star.
- [ ] A run resumed at or above its saved best wave shows the star on its first pause.
- [ ] The rest of the pause screen (the key list, the sound row once T0035 is in, the run line's numbers) is unchanged.
