---
id: T0305
title: "The slot ladder: wave 30 with every slot filled unlocks one more"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T20:35:44Z
claimed_at: 2026-10-30T20:35:48Z
epic: E9
designer: desktop
---

## Goal
The slot ladder from E9's spec: a run that reaches wave 30 with every unlocked level slot filled earns one more slot, so the player's payout choice grows with each full clear, up to the size of the set.

## Details
- The rule, one pure function with unit tests: given (slots owned, the run's max wave, level augments on, set size), the run earns +1 slot when it reached wave 30 (max wave ≥ 30; dying mid-wave counts, same as T0285's first unlock) and had as many level augments on as it had slots (all filled). 0 slots + wave 30 earns the first slot, so T0285's first unlock and the ladder are the one rule. The slot count never goes down and is capped at the set size — the number of level augments in the set, read from the set's own list (5 when the first set is complete), not a constant.
- The check runs once per run, when the run ends and the profile is updated — the same moment T0285's first unlock is saved. A resumed run keeps its chosen augments (T0285's run save, untouched).
- The claim card's moment: when the run earned a slot (first or later), one bold line on the claim card — "Level slot · N of S" (N the new total, S the set size), in the card's existing column (T0224); the card grows the one line only when the run earned a slot — no such line today, no line when the run earned nothing.
- The picker's next-goal line: while the player's slots are below the set size, the menu's Level card (T0285) shows one muted line — "wave 30 with N on unlocks the next" (N the current slot count). The 0-slot teaser ("reach wave 30 to unlock") stays unchanged; at the cap there is no goal line.
- No new input, no new HUD element; wording stays one dry line (the game's tone).

## Acceptance criteria
- [ ] The pure rule is unit-tested: +1 only when max wave ≥ 30 and level augments on ≥ slots owned, capped at the set size — (0, 30, 0, 5) → 1; (2, 30, 2, 5) → 3; (2, 30, 1, 5) → 2; (5, 40, 5, 5) → 5; (2, 29, 2, 5) → 2.
- [ ] Ending a run at wave 30 or beyond with every unlocked slot filled raises the profile's slot count by 1, saved at the same moment T0285's first unlock is saved; the count never decreases across runs.
- [ ] The claim card shows the bold "Level slot · N of S" line exactly when this run earned a slot; a run that earned nothing shows no such line.
- [ ] The menu's Level card shows "wave 30 with N on unlocks the next" while slots are below the set size; the 0-slot teaser is unchanged; no goal line at the cap.
- [ ] The picker still caps the toggles at the slot count — a newly earned slot opens exactly one more toggle.
- [ ] The gate (typecheck, lint, unit tests, smoke on desktop and mobile) passes.
