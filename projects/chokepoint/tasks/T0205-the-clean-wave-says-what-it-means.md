---
id: T0205
title: The clean wave says what it means, where the player looks
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T12:25:57Z
claimed_at: 2026-10-29T12:55:53Z
designer: desktop
---

## Goal
When a wave ends with no leak, a small green "Clean" pill pops next to the exit gate, at the board's edge, with "1/3", "2/3" or "+1" under it. It sits away from where the player is looking (the "Wave N cleared +gold" text pops at the board's centre), and nothing says what it means. Show the clean result next to the wave-cleared text, in words a new player understands.

## Details
- **What "clean" means today** (unchanged): nothing leaked this wave. Each clean wave adds +1 coin to the run's reward (`coinsForRun` in `core/profile.ts`). Clean waves in a row count up to 3, and the third gives +1 life, once per run (`RunState.clearWave()` / `streakTag()` in `core/run.ts`).
- **Where:** directly under the "Wave N cleared +gold" text at the board's centre (`RunFlow.clearWave()`), as part of that same moment, not at the exit gate. The pop at the exit goes.
- **What it says, in plain words** (one or two short lines, in the game's green, at a size that reads on a phone):
  - a clean wave before the streak pays: "Clean: nothing got through · +1 coin", then "2 of 3 in a row for +1 life" (with the run's count);
  - the wave that pays the streak: "Clean: nothing got through · +1 coin", then "3 in a row: +1 life";
  - after the streak has paid this run: only "Clean: nothing got through · +1 coin".
- A wave with a leak shows no clean line (as today).
- Timing as today: it appears with the wave-cleared text and is readable for the beat before the draft opens (the existing 1-second pause before the draft on a clean wave stays).
- The look stays the game's own: no outline or glow. If it keeps a pill shape, the pill holds the words; it never shows a bare "1/3".

## Acceptance criteria
- [ ] After a clean wave, the clean line appears under "Wave N cleared +gold" at the board's centre, and nothing pops at the exit gate.
- [ ] It says in words that nothing got through and that it is worth +1 coin; before the streak pays it also says how many in a row, out of 3, for +1 life; the paying wave says "+1 life".
- [ ] After a leak there is no clean line; after the streak has paid, only the coin part shows.
- [ ] It reads at 412x915 and 1280x720 and doesn't overlap the wave-cleared text.
