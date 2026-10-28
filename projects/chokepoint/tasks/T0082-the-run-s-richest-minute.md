---
id: T0082
title: "The run's richest minute"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
---

## Goal
The quiet wave inside the last stand is the run's richest minute (kill gold ×4 — the product of quiet ×2 and last stand ×2, already built in T0071/T0054): the gold tally says so while it lasts.

## Details
- While the current wave is a quiet wave (T0071) **and** the run is in the last stand (T0054: exactly 1 life), the stats card's gold number wears one small muted-yellow tag to its right: "×4" — the milestone color (T0034), the stats card's small text size (~12 px).
- The tag appears the moment the quiet wave starts in the state and is gone the moment the wave ends or the last stand turns off (the clean streak's payback, T0045, raising lives above 1).
- Display only: no gold value, multiplier, gold pop, coin trail (T0061) or sound changes — the ×4 product already happens in the kill flow; this only names it where the money lands. No input.
- Closest example: the coin tally's own pop (T0017) for the tag's placement and scale language, and the milestone color's first use (T0034's yellow combo counter).

## Acceptance criteria
- [ ] At exactly 1 life, when a quiet wave (4, 8, 12, …) starts, a muted-yellow "×4" appears next to the gold number for the rest of the wave.
- [ ] A quiet wave with more than 1 life shows no tag; a non-quiet wave at 1 life shows no tag.
- [ ] The tag is gone the instant the wave ends; gold values, the gold pops and the coin trail are byte-identical to before.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with the tag shown and hidden.
