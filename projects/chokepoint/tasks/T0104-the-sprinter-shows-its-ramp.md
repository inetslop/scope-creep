---
id: T0104
title: The sprinter shows its ramp
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:24:33Z
epic: E4
designer: yoga
---

## Goal
The second slice of the enemy-telegraph idea (T0099 was the Mark's): a ramped Sprinter wears its speed on itself, so the orange chevron that gets faster the more it is hit is readable at a glance.

## Details
- While a Sprinter's current speed is above its base speed (T0006: +10% of Dart's base speed per damaging hit, capped at 190% after 10 hits; the ramp never decays, so "ramped" = it has taken at least one damaging hit), one small rounded tick rides above the token — the mark tick's chip language (T0099: a 16x9 rounded chip, no text) in the Sprinter's own orange (the Dart/Sprinter orange).
- The tick appears the moment the ramp engages (the first damaging hit, with the hit flash) and clears the instant the enemy dies.
- A Sprinter at base speed (never hit) is byte-identical to today; no other enemy is affected.
- Display only: the ramp's numbers, cap, hit flash and sounds are unchanged; no rule change, no input, no new sound.
- A new enemy-hook file on T0099's pattern (the mark tick), so it lands in its own files beside the shared-augment queue.

## Acceptance criteria
- [ ] A Sprinter that has taken at least one damaging hit shows the small orange tick above it for the rest of its life; a Sprinter that has taken no hits shows none.
- [ ] The tick clears the instant the Sprinter dies; no other enemy ever shows it.
- [ ] The ramp itself is unchanged: still +10% of Dart's base speed per damaging hit, capped at 190% after 10 hits.
