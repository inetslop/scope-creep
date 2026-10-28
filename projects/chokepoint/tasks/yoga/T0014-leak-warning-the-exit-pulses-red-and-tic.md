---
id: T0014
title: "Leak warning: the exit pulses red and ticks before a leak"
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-28T02:08:37Z
---

## Goal
Leaks are never a surprise: in the last 3 seconds before an enemy reaches the exit, the exit pulses red with a quiet tick, so the player has time to react.

## Details
- When the enemy closest to the exit is within 3 seconds of reaching it (remaining path distance at its current speed, slows included), the exit token at the end of the road pulses red: scale 1.0 → 1.15 → 1.0 over 0.4 s, repeated (a red tint over the exit's existing look).
- Each pulse plays a quiet tick — a low sine blip at volume 0.1, quieter than the existing hit blip (closest example: the blip methods in audio/Sfx — add one new method next to them). One tick per pulse, never stacked, even with several enemies in range.
- The warning stops at once when the enemy leaks (the existing leak juice plays) or dies; it continues if another enemy is already within 3 seconds.
- It behaves like the other in-run animations: frozen while paused.
- No new inputs, no pause-screen change.

## Acceptance criteria
- [ ] An enemy approaching the exit triggers the red pulse + tick in its last ~3 seconds; the pulse and tick stop on the leak or on the kill.
- [ ] The tick is quieter than the hit blip and plays once per pulse, with no doubling when several enemies are in range.
- [ ] The pulse reads clearly at 412x915 (the exit stays visible, the road is not covered) and never triggers for an enemy more than 3 seconds away.
- [ ] Pausing the game freezes the pulse and the tick; resuming restarts it.
