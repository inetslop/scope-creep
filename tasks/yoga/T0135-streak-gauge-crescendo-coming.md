---
id: T0135
title: Streak gauge — Crescendo coming
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
claimed_at: 2026-10-27T18:39:33Z
designer: yoga
---

## Goal
The Crescendo bonus (T0065) arrives at 8 kills without being hit, and right now the player has to count. A thin line under the streak tally fills as the streak grows, so the bonus coming is visible at a glance.

## Details
- A flat ink line, 2 u tall, drawn 4 u below the streak tally's number (T0014): width = min(streak, 8) / 8 × the width of the tally's number, left-aligned with it.
- Below 8 the line is ink; at 8 and above it is PALETTE.red — the same red the tally itself turns while Crescendo is active (T0065) — and stays full.
- At streak 0 the line is undrawn (width 0). When a hit resets the streak, the line returns to width 0 the same moment the tally shatters (T0101) — no extra shatter for the line.
- The line scales with the tally's existing layout at 412×915 and 1280×720. No sound, no key, no new element, no number change — the tally, its shatter and the RHYTHM flash are untouched.

## Acceptance criteria
- [ ] At streak 4 the line under the tally is half its full width in ink; at 7 it is just short of full; at 8 it is full and red; at 0 nothing is drawn.
- [ ] When a hit resets the streak the line is gone the same moment the tally shatters (T0101), and it regrows as the streak climbs again.
- [ ] The tally number, the RHYTHM flash and everything else on the HUD are untouched; no new sound, key or scene.
