---
id: T0416
title: "The slow stretch: the road that makes the walkers linger"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-11-02T10:20:00Z
claimed_at: 2026-11-02T11:32:44Z
finished_at: 2026-11-02T13:32:47Z
design_attempts: 2
---

## Goal
Some boards hand the player a free defensive spot: about one board in four grows a slow stretch — a 3-cell straight run of road where every walker crosses at 70% speed — so the run's best cover can move from the guaranteed choke cell to the stretch itself.

## Details
- **The board.** From the seed, up to ~1 in 4 boards (exclusive with the fork) mark one straight stretch of the road as the slow stretch: 3 consecutive collinear road cells, never touching the entrance gate, the exit gate or the far gate's own cell; one stretch per board. A board whose road has no straight run of 3 cells simply has no stretch. The stretch is part of the board's seed — the same seed always gives the same stretch (or none), so ghost runs and resumes redraw it with no new save field.
- **The look.** The stretch's road is tinted pale ice — Frost's own ice, the slow's family: a flat tint of the road's white, no outline, no gradient, no patch border. It reads at a glance the way the Hauler's coin reads as gold.
- **The rule.** While an enemy's center is over the stretch its walk speed is ×0.7 of whatever speed it would otherwise have at that moment — multiplicative with everything that already touches speed (Frost's slow, Haste's speed-up, The thin road, the Swift level, the Sprinter's ramp) — and it comes and goes with position, no lingering after the enemy leaves. The Dasher's dash burst is its own clocked movement and is unaffected; the Flyer flies over the road and is unaffected.
- **The facts.** The board facts (off the pause) name the stretch on boards that have one, and the boards reference lists it under "some boards", both the cove's own way; boards without one are unchanged in both.
- **Why placing gets more interesting.** The cells flanking the stretch hold every walker 30% longer: on a slow-stretch board the stretch's cover outranks the guaranteed choke cell as the run's best double-cover spot, and a Haste tower aimed at the stretch (enemies +30%) nearly cancels the slow there (0.7 × 1.3 = 0.91) — board and build can push against each other.
- No new HUD element, key or permanent board mark beyond the tinted road itself; the pause screen's controls are untouched.

## Acceptance criteria
- [ ] Seed boards until one grows a slow stretch: exactly one straight 3-cell stretch is tinted pale ice, never at the entrance, exit or the far gate's cell, never on a fork board; ~1 in 4 boards carry it, and a board with no straight 3-cell run carries none.
- [ ] A walker over the stretch moves at 70% of its current speed and returns to full speed the moment it leaves; a Frost-slowed walker over it is 70% of its slowed speed; a Dasher's dash burst and a flying Flyer are unaffected.
- [ ] The board facts name the stretch on a board that has one (and not on one that doesn't); the boards reference lists it under "some boards".
- [ ] A board without the stretch is byte-identical to before this task in generation, drawing and facts; `npm run check` and the desktop + mobile smoke pass.

## Architect could not design it (cachyos-x8664)

no "STATUS: READY" line after 2 attempt(s). Last output:

```

```
