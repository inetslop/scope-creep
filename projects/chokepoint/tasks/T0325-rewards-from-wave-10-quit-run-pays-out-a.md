---
id: T0325
title: Rewards from wave 10; Quit run pays out and ends it; Main menu keeps it
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T00:10:01Z
epic: E9
designer: inet-racing
---

## Goal
The owner's call: a run must reach **wave 10** to pay any rewards. Quitting a run is now a real end: you get the run's rewards (from wave 10) and the run is over, no resume. To step out without ending the run, the pause card gets a new **Main menu** button that keeps it for Resume.

## Details
- **The wave-10 rule:** a run that reached wave 10 (wave 10 started; a run dying during it counts, the same reading as the wave-30 unlock) pays its coins as today. A run that ends before that pays 0 coins, in every mode (normal, Iron, ghost, any level). One constant (e.g. `REWARD_WAVE = 10` next to `LEVEL_UNLOCK_WAVE`), applied in `recordRun` (`core/profile.ts`), with unit tests.
- **What still counts before wave 10:** everything that isn't a reward: runs played, the recent runs, the best wave and the ghost board, the leaderboard post.
- **The end card before wave 10** (`scenes/GameOverScene.ts`): the coins line reads "Rewards from wave 10" (muted) instead of "+N coins", and "Claim rewards" becomes "Menu" (it goes straight to the menu). From wave 10 on it is as today.
- **The pause card** (`scenes/PauseScene.ts`):
  - "worth +N coins" reads "rewards from wave 10" before wave 10.
  - **Quit run** ends the run: a first tap turns the button into "End the run?" (a second tap within 3 s confirms; it turns back after), because the run can't be resumed after it. Confirmed, the saved run is cleared and the run ends as if it were lost: the end card opens, titled "Run ended" (ink, not the red "Overrun"), with the same numbers, the claim (from wave 10) and the leaderboard post.
  - **Main menu** (new, under Resume): goes to the menu without ending the run, which is what Quit did before. The run stays saved, and the menu's Resume button continues it (from the last build or wave start, as today).
- One way to end a run on purpose, in one place (a `RunFlow` method next to `endRun`), so the wave-30 card (a later task) can call it too.

## Acceptance criteria
- [ ] Unit tests: a run that reached wave 9 records 0 coins; wave 10 records its coins as before; runs played, the best wave and the recent runs still update before wave 10.
- [ ] The end card before wave 10 shows "Rewards from wave 10" and a "Menu" button.
- [ ] Quit run needs a second tap; confirmed, it opens the end card titled "Run ended", and the menu then has no Resume.
- [ ] Main menu returns to the menu, and Resume there continues the run.
- [ ] Works with mouse, keys and touch at 1280×720 and 412×915.
