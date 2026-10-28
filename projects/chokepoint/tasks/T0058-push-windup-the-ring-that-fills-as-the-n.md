---
id: T0058
title: "Push windup: the ring that fills as the next gust charges"
size: S
priority: 3
status: design
depends_on: [T0027]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E4
---

## Goal
A Push tower's next shove is readable before it lands: a thin ring at the tower's base fills as the gust charges, so the player sees when the next push is coming.

## Details
- Push (T0027) gusts on a fixed cadence (2.4/2.0/1.8 s by tier). While the next gust is charging, a thin ring (~2 px) in Push's own color draws around the tower's base: it sweeps from 0° to 360° over the full charge interval, starting at the top (12 o'clock) and going clockwise, so a half-full ring means about half a gust of time left.
- The moment the gust fires, the ring completes and fades over ~100 ms, and the sweep restarts for the next charge.
- The ring sits at the tower's base (the plinth edge), inside the tower's own footprint — it does not draw the 2.5-cell gust radius, and nothing else about the tower changes.
- Closest existing look: the leak warning's pulsing red copy of the exit (T0014) — a quiet ring at the edge of a thing, in its own color. The gust's numbers, radius, cadence and sounds are untouched.

## Acceptance criteria
- [ ] Every Push tower shows a thin ring at its base that sweeps 0°→360° once per charge interval (2.4/2.0/1.8 s by tier) and, on each gust, completes, fades over ~100 ms and restarts.
- [ ] The ring is Push's own color, ~2 px, inside the tower's footprint — it does not show the 2.5-cell radius.
- [ ] No other tower shows the ring; the gust's numbers, radius, cadence and all sounds are unchanged.
- [ ] Works at 412x915 and 1280x720.
