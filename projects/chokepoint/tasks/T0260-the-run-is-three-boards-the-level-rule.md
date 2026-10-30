---
id: T0260
title: "The run is three boards: the level rule"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T05:49:22Z
claimed_at: 2026-10-30T05:49:24Z
epic: E3
designer: desktop
---

## Goal
A run gets a shape: three levels of ten waves each, a new longer board at each clear, and a win at the end — E3's foundation, the journey the vision's short runs need.

## Details
- A run is three levels; a level is ten waves; the waves number continuously 1-30, so every existing wave rule keeps working untouched (the quiet every 4th, the tight every 8th, the boss every 10th — E5's wave-10 and wave-20 bosses end levels 1 and 2: each level's tougher final wave).
- Level 1's board is generated exactly as today (the run's seed, the run's base length target with owned tech applied). Clearing wave 10 or 20 with lives left clears the level: the shared top-center card (the WaveBanner/topBanner pattern) slides in — "Level 1 clear" over a muted "the road re-grows" — for ~1 s, then the board re-grows: a new island from the run's seed and the level number (a new road, new rocks; the generator's own rules, including the choke (T0217), apply), with a longer road — level N's length target is the run's base target × 1.25^(N−1) (level 2 ×1.25, level 3 ×1.5625 of the base; the bend target is unchanged). A level's board is a pure function of (seed, level), so a ghost run replays the saved run's exact boards and a resumed run resumes on its exact current board, as today's save does.
- The new board starts empty: the previous level's towers are gone. The gold carries over in full, and the lives carry over. The draft then opens on the new board exactly as after any wave (its fit row (T0243) sees no towers and stays hidden, like the pre-wave-1 draft), then the build phase, then the next wave.
- Clearing wave 30 with lives left ends the run as a win: the game-over card's headline reads "Made it" with a muted "level 3 · wave 30" line and the usual score, coins, recipe and best-combo lines; the win counts as wave 30 for the best wave, the leaderboard and the recent runs, with no change to those.
- A run that dies says how far it got: the game-over card shows its level and final wave on one muted line ("level 2 · wave 14", the score-breakdown line's style (T0083)); if the card already shows the final wave, the level joins that line instead of repeating it.
- Unchanged: the coin formula, wave bonuses, kill gold, the clean/held ledger, last stand, the streak, the menu demo (it runs one wave, not a run), the pause screen — no new input or button anywhere in this task (the wave card's level line is T0262).
- The board bar, stated: the player sees a new island at each level clear — a new road shape, a new choke, more road to cover — so each level re-opens the placement puzzle with the banked gold; that is what makes placing at level 2 more interesting than at level 1.
- The level rule lives in one new pure module (a core/level.ts, the core/waves.ts pattern) with unit tests: the level of a wave, the clear condition, the win condition, the length multiplier per level.

## Acceptance criteria
- [ ] Waves 1-10 of a fresh run play byte-identically to today (same board, same wave rules, same draft/build/wave flow); nothing visible changes before a level clears.
- [ ] Clearing wave 10 with lives left shows the "Level 1 clear" top card, then a new board with a visibly longer road (×1.25), new rocks and its own choke, no towers, gold and lives intact; the draft opens on it and the run continues at wave 11.
- [ ] Level 2's road is visibly longer than level 1's within the same 14x8 / 8x14 frame, and level 3's is ×1.5625 of the base.
- [ ] Clearing wave 20 does the same for level 3.
- [ ] Clearing wave 30 ends the run with the "Made it" game-over card and its muted "level 3 · wave 30" line, the usual lines beneath, and wave 30 accepted by the best wave, the leaderboard and the recent runs.
- [ ] A run that dies at, say, wave 14 shows "level 2 · wave 14" on its game-over card.
- [ ] A resumed run mid-level 2 or 3 continues on its exact current board and wave, and no level clear re-triggers on resume.
- [ ] The smoke test passes on desktop and mobile; every card that shows fits at 412x915 and 1280x720.
