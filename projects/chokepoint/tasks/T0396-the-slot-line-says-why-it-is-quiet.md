---
id: T0396
title: The slot line says why it is quiet
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T01:03:06Z
claimed_at: 2026-11-02T01:21:55Z
designer: yoga
---

## Goal
The tower panel's next-slot line — the price of the tower's next free slot — is a dead button to a first-time player while the gold is short: it dims and wears the price in red, so the gap is seen, not the silence. The pattern E15's move line (T0394) wears for its fee.

## Details
- While the run's gold is below the next slot's price, the line dims (the muted weight the panel already uses for its quiet lines) and its price wears red — the reroll button's own short-gold look (T0276: the price in red, the control quiet). Tapping it in that state does exactly what it does now; nothing new.
- At or above the price the line is exactly as it is today: no change to its numbers, its position or its fit.
- One file's work (the panel's line), no new element, no key, no sound.

## Acceptance criteria
- [ ] A tower whose next slot the gold cannot buy shows the line dimmed with the price in red; the moment the gold crosses the price the line is full weight with the price in its usual ink
- [ ] Tapping the short line is unchanged (the existing deny); nothing new plays
- [ ] The panel's layout is unchanged at 412x915 and 1280x720 — only the line's weight and the price's color move
- [ ] `npm run check` and the desktop + mobile smoke pass
