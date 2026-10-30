---
id: T0295
title: "Lean and Short fuse: the gold and clock level augments"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T17:33:38Z
claimed_at: 2026-10-30T18:02:22Z
epic: E9
designer: desktop
---

## Goal
The level picker (T0285) completes its first set: one augment that thins the gold, one that shortens the clock — the last two of E9's "harder in one plain way" rules.

## Details
- Two new level augments, each its own content file beside `src/content/levels/tough.ts` in the same shape (name, plain line, its number, its multiplier bonus):
  - **Lean** — card line "kills pay 25% less gold". The base kill bounty is 75% of normal, floored down, minimum 1 gold (a 1-gold kill still pays 1; 2 → 1, 4 → 3, 8 → 6). The quiet ×2 and the last stand's ×2 then apply to the Lean'd number exactly as they do today, and the gold pop shows the final number. The wave clear bonus, the combo milestone gold, Mint's +1, Toll's leak gold, the Hauler's −5 leak cost and the early-send bank are untouched. Bonus: +25%.
  - **Short fuse** — card line "the build countdown runs 30% shorter". The build countdown is 70% of its normal length, rounded to the nearest second (derived from the same constant the normal build phase uses, so it stays honest if the base moves); the last-three-seconds tick and the big button's banked gold (2 per whole second left) run on the shortened clock as usual. Bonus: +30%.
- Same wiring as Tough and as T0294's two: the picker gains a row for each (capped at the slot count, saved in the profile, preselected for the next run), the run save carries the selection, and the menu's multiplier readout recomputes as 1 + the sum of the selected augments' bonuses: ×1.25 Lean alone, ×1.30 Short fuse alone, ×1.55 both, ×1.80 all four with Tough. The picker card grows to fit the whole set (the menu's fit-sum pattern), at 412x915 and 1280x720.
- The rules are pure, with unit tests beside T0285's `tests/core/levels.test.ts`: the bounty table (1 → 1, 2 → 1, 4 → 3, 8 → 6, the 1-gold floor), the quiet ×2 and the last stand ×2 applied to the Lean'd number, the countdown length, and the bonus summing.

## Acceptance criteria
- [ ] The menu picker lists Lean and Short fuse, each with its number, toggled on and off up to the slot count; the multiplier line reads ×1.25 / ×1.30 / ×1.55 for Lean / Short fuse / both, and ×1.80 with all four.
- [ ] In a Lean run, the kill gold pop shows the 75% number (the test's table), and a quiet wave's ×2 and the last stand's ×2 multiply that number, not the un-Lean'd one.
- [ ] In a Lean run, the wave clear bonus, the combo milestone gold, Mint's +1, Toll's leak gold and the early-send bank are unchanged.
- [ ] In a Short fuse run, the build countdown is 70% of its normal length (asserted on the length in a test), the last-three-seconds tick and the big button's banked gold follow the shortened clock.
- [ ] A resumed run keeps its selection; with both off, the gold and the countdown are byte-identical to today.
