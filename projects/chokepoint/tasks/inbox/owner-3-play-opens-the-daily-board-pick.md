---
title: Play opens the daily board pick (level augments leave the menu)
size: L
priority: 1
epic: E9
---

## Goal
The owner's call: level augments are no longer a picker that sits on the main menu. Pressing Play (or Iron) opens a new step: pick a level, then one of **three boards**, each shown as a small preview with the level augments it carries. The three boards and their augments come from the **UTC date**, so every player gets the same choices on the same day, which makes the day's leaderboard a fair race.

## Details
- **The menu:** the level card (`scenes/menu/LevelCard.ts`) is removed from the menu. Play and Iron open the pick step instead of starting the run (Enter/Space on the menu opens it too). Resume and Ghost start their run directly, as today, with no pick step.
- **The pick step** (a new screen-space overlay scene, white cards on the ground color):
  - **Level row** on top: "Level 0", "Level 1", ... up to the profile's level slots, preselected on the highest. The player may play any level from 0 to their slots. With 0 slots there is no row, only the muted teaser "reach wave 30 to unlock level 1".
  - **Three board cards:** side by side on desktop, stacked on a phone (412×915). Each card has a small preview of the board exactly as the run will generate it (island, road, rocks, gates, with the player's own board tech: bends, length, chokes), the level augments it carries at the chosen level (name and line), and the run multiplier ("×1.45"; at level 0 no augments and no multiplier).
  - **The next goal** (moved here from the menu card): "wave 30 at level n unlocks level n+1", only while the slots are below the set size.
  - A tap or click on a card (or keys 1, 2, 3) starts the run on that board with those augments. A Back button (Esc) returns to the menu. Key hints are shown on the cards and the button.
  - Iron carries through: Iron, then the pick, then the run in Iron.
- **The daily choices** (a pure core module with unit tests, e.g. `core/daily.ts`):
  - From the UTC date (`YYYY-MM-DD` of the current time in UTC, never local time) derive three board seeds.
  - For each board, a seeded order of all level augments (a shuffle of `LEVEL_AUGMENTS` by that board's seed). At level L the board carries the first L of its order. So every player at the same level sees the same three choices, and a higher level only adds augments to the same boards.
  - The board's seed is the run's seed (`new RunState(seed, ...)`), so the board, and everything else the run seeds, follows from it. The board's orientation follows the device as today (a phone plays the portrait board of that seed); that is accepted.
  - The choices change at 00:00 UTC; the step reads the date when it opens.
- **The run:** its `level` is the picked board's augments (no longer `capLevelChoice(profile.levelSlots, profile.levelOn)`). The run save keeps `level` as today, so a resumed run keeps its augments and multiplier. The profile's saved `levelOn` is no longer read or written for new runs.
- **The slot ladder is unchanged** (`levelSlotsAfter` in `core/levels.ts`): wave 30 with every unlocked slot filled (level = slots) earns the next slot; a run below the top level earns nothing new.
- **?smoke:** the menu's automatic Play goes through the pick step, which picks the first card on its own.

## Acceptance criteria
- [ ] The menu has no level card; Play and Iron open the pick step; Resume and Ghost don't.
- [ ] Unit tests: one UTC date always gives the same three seeds and augment orders; the next date gives different ones; level L takes the first L of each order; two instants on either side of 00:00 UTC fall on different days whatever the local time zone.
- [ ] Each card's preview is the board the run then plays (same seed, same tech).
- [ ] The level row goes from 0 to the slots, defaults to the highest, and changing it updates the cards' augments and multipliers.
- [ ] Works with mouse, keys (1/2/3, Esc) and touch, at 1280×720 and 412×915.
