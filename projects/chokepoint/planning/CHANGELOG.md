# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.

- Baseline (by hand, 2026-10-28): generated boards (path, rocks, landscape and portrait) with zoom and drag; towers made of augments (Bolt, Splash, Frost, Rapid, Reach: the first decides the attack, the later ones change it) and gold that buys more slots per tower; an augment pick before wave 1 and after every wave; escalating waves of Dot, Dart and Block; lives, gold, score and best run; towers that show their augments; a live menu demo; HUD cards; pause, game over, procedural sounds. Art: bright minimal (light island, white road, chunky rounded tokens with soft shadows).
- T0001 A profile that remembers you: saved best wave, run stats, coins (asus, 2026-10-28): The device now remembers you: a new pure `core/profile.ts` (load/save of bestWave, runsPlayed, coins, lastRun in localStorage; `coinsForRun` = waves + floor(stopped/10) + clean; `recordRun`), a run ledger in `RunState` (
- T0013 The run's coins so far, live in the HUD (yoga, 2026-10-28): Added a live "+N coins" run-tally line to the StatsCard HUD: a 12 px coin icon plus 13 px muted-gray text below the existing lives/gold line, growing the card 196x48 → 196x72.
- T0007 The menu shows what you have: a profile card (narcissus, 2026-10-28): The menu now shows a white profile card between the title and the Play button, built in a new file `src/scenes/menu/ProfileCard.ts`: a yellow coin icon (`ui:coin` at 1.4 scale) with the total coins in large bold type, pl
