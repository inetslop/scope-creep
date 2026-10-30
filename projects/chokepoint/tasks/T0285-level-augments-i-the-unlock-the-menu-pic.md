---
id: T0285
title: "Level augments I: the unlock, the menu picker and Tough"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T12:31:05Z
epic: E9
---

## Goal
A player who has seen wave 30 can make future runs harder on purpose and is promised a bigger payout for it: the menu grows a level picker, and this slice lands its unlock, its slot cap and its first augment, Tough.

## Details
- A level augment is a pre-run switch, not a pool augment: it never appears in the draft, the hand, on a tower or in the codex, and it does not count toward the 16-augment pool. It is a run rule, like Iron's mode, chosen before the run starts.
- **The unlock:** the first time a finished run — normal or Iron — reaches wave 30, the profile gains one level slot (a new count on the saved profile, written with the run's result, and it never decreases). A run counts once its wave number reaches 30 — wave 30 has started; a run that dies during wave 30 counts. A run that ends below wave 30 leaves the count at 0.
- **The menu card:** the start screen grows one small white card under the Iron card (the even-column fit-sum, T0222; it must fit without scrolling at 412x915 and 1280x720 in both states):
  - With 0 slots, the card is one muted line: "Level — reach wave 30 to unlock". Nothing else.
  - With slots, a bold "Level" header and one chunky row per level augment — this slice only **Tough** — in the pause Sound row's pattern (T0035): the name "Tough", its plain line "enemies +25% health", and an On/Off state; the whole row is one tap target.
  - The picker is capped at the slot count (a pure rule, unit-tested): with N slots at most N augments are on. With one slot and one augment in the set the cap cannot bite in play, but a row that is off while the slots are full must dim and its state word must read "full" (the buy-slot button's quiet language).
- **The choice is kept:** the chosen set is saved in the profile and preselected for the next run; the run's save records it, so a run closed and resumed keeps its choices.
- **Tough (pure rule, unit-tested):** while on, every enemy in the run has 25% more health than the same seed and wave would otherwise give (on top of the wave's own per-wave growth), from wave 1 to the last. Mix, spawn order, speed, gold and the wave's plan are unchanged — Tough is health only. A run with Tough off is byte-identical to today.
- **The multiplier, shown:** the chosen augments' bonuses add up into one run multiplier, shown on the card before starting — "×1.25" with Tough on, a muted "×1.0" with none on. In this slice it is shown and saved but not yet applied to score or coins (the payout is the next slice). The menu's multiplier is the pre-run choice; the pause's "worth +N coins" (T0087) is the live run — different screens, nothing shown twice.
- No level numbers, no board re-growth, no level-clear moment anywhere: this is pre-run difficulty, not the removed E3 levels.

## Acceptance criteria
- [ ] A profile with 0 slots shows the Level card as the single muted line "Level — reach wave 30 to unlock"; no rows, no multiplier.
- [ ] A run (normal or Iron) whose wave number reaches 30 writes 1 to the profile's slot count, once; the count never decreases; a run ending on wave 29 leaves it at 0.
- [ ] With 1 slot the card shows the Tough row; a tap flips On/Off; the choice is preselected on the menu for the next run and survives a run closed and resumed.
- [ ] A run started with Tough on: every enemy's health is 25% above the same seed and wave with it off (pure function, unit-tested); with it off the run is byte-identical to today.
- [ ] The card shows "×1.25" with Tough on and a muted "×1.0" with none on, before the run starts; the run's score and coins are not yet scaled by it.
- [ ] The start screen still fits without scrolling at 412x915 and 1280x720, with the card in both its states.
