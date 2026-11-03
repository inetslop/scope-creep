---
id: T0486
title: "The deep memory: a type that leaked in two waves in a row comes back doubled"
size: M
priority: 2
status: designing
depends_on: [T0473]
attempts: 0
created: 2026-11-03T10:07:19Z
claimed_at: 2026-11-03T10:30:02Z
epic: E27
designer: desktop
---

## Goal
E27's memory makes a leak cost the next wave; this makes a repeated leak cost more — a type that got through in each of the last two waves comes back doubled, so holding the road against one stubborn type starts to matter.

## Details
- The rule (extends T0473's memory, which stays as the base): when the next wave is planned, each regular type that leaked in the wave that just ended still comes back, +1 as today — but if it also leaked in the wave before that, it comes back ×2 instead of ×1 (two of its kind, both taking the next wave's own hp scale, both leaking as normal).
- Only the last wave's leakers ever come back: a type that leaked two waves ago but not in the last wave comes back ×0, today and after this.
- The cap is unchanged: at most 3 walkers come back in total. When the weighted total exceeds 3, the doubled types come first, then by most leaked in the last wave, then the higher threat, then first-leak order — T0473's tie-breaks, with the depth ahead of the count.
- What never comes back is unchanged: the boss, the split pieces (Shard, Splinter). A quiet or boss wave never takes additions: the drop is all-or-nothing, as today.
- Where it is seen: nowhere new. The next-wave preview already shows the plan's tokens and counts, so a doubled type simply shows a higher count in its own row — no chip, line, mark or sound (the one-time teach is T0487, and it reads whatever count the plan carries).
- A run in which no type leaked in two consecutive waves is byte-identical to the memory rule as it stands: same plans, same references where today's rule returns the plan untouched, same preview.
- The run save needs no new field: the per-type leak record T0473 keeps is per wave for the whole run, so the two waves the rule looks at are already there.

## Acceptance criteria
- [ ] After waves N−1 and N both leak a Hauler (and N also leaks a Dot), wave N+1's plan carries two extra Haulers and one extra Dot on top of the planned wave, and the preview's Hauler count is up by 2 over the plain plan.
- [ ] A type that leaked two waves ago but not in the last wave comes back ×0; a type that leaked only in the last wave comes back ×1, as today.
- [ ] The weighted cap: a wave whose leakers weigh 2 + 1 + 1 (one doubled type and two single types) sends back only 3 walkers — the doubled type's two plus the most-leaked single type.
- [ ] A quiet or boss wave never wears additions, as today; the boss, Shard and Splinter never come back.
- [ ] A run with no type in two consecutive waves is byte-identical to the memory rule as it stands (same plans, same preview, nothing new shown).
- [ ] Unit tests cover: ×2 for a type in both waves, ×1 for the last wave only, ×0 for the earlier wave only, the weighted cap of 3 and its depth-first order, the unchanged quiet/boss drops and spawnOnly exclusion.
