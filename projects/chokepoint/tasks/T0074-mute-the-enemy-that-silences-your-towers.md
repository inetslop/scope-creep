---
id: T0074
title: "Mute: the enemy that silences your towers"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T21:24:45Z
claimed_at: 2026-10-28T21:36:30Z
designer: inet-racing
---

## Goal
A new enemy with a behavior no enemy has: it fights back. While a Mute is alive, every tower within 2 cells of it holds still and never attacks.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **New:** it disables towers — the first enemy that fights back, and the one that makes cluster placement a real decision against Rally and Mint.
- **Look:** a hollow round shape — a chunky ring with a flat hole in the middle, the only enemy with a hole in it — in a deeper purple than the Dasher's if the content folder has one, otherwise the Dasher's purple; about Block's size; the usual darker side face and soft shadow. (The hexagon is the Hauler's now (T0057) and every warm color is used by a landed enemy, so the hole — a new silhouette — carries the meaning; the family color repeats.)
- **Move:** walks at Block's speed, plain — no dash, no ramp, no telegraph. The hole is the tell.
- **The silence (the new behavior):** while a Mute is alive, every tower whose center is inside the Mute's 2-cell circle (the same reach Rally's range ring shows) is jammed: the tower performs no actions — no shot, no gust, no root pulse, no own burn tick, no beam (a beam drops and re-locks later). Two passive rules keep working while jammed: a jammed Rally tower still speeds its neighbours, and a kill within 2 cells of a jammed Mint tower still pays its +1. A Push tower's windup ring (T0058) freezes where it is while jammed and resumes from where it stopped when the Mute dies — the charge waits, it does not reset.
- **The jam is readable:** a jammed tower dims to 50% and shows one small muted-gray dot above its barrel (the tier pips are unchanged); the dim and the dot clear the instant the Mute dies. No card, no sound — the dimming happens as the Mute walks in, so a first-time player sees cause and effect on the board.
- **Waves:** from wave 11, one Mute on waves 11, 14, 17, 20, … — exactly one per such wave, reserved in the wave plan the way the Hauler is (T0057), outside the budget picks. (When E5's wave-20 boss lands, the boss takes that slot.)
- **Economy:** a leak costs 1 life like any enemy; a kill pays the normal kill gold for its hp — no special economy, the point is its silence.
- **Landing pattern:** its own content file and its own enemy hook, registered next to its kin, the way the Hauler landed (T0057); its icon, wave preview, sounds and HUD are picked up automatically.

## Acceptance criteria
- [ ] From wave 11, waves 11, 14, 17, 20, … each carry exactly one Mute, shown in the wave preview as the hollow-ring token; the other enemies' mix and the wave's budget are unchanged.
- [ ] While a Mute is alive, every tower inside its 2-cell circle holds still — no shot, gust, root, beam or own burn tick — the tower is dimmed to 50% with one small muted-gray dot above its barrel; the dim and dot clear the instant the Mute dies.
- [ ] A jammed Rally tower still speeds its neighbours, and a kill within 2 cells of a jammed Mint tower still pays +1; a Push tower's windup ring freezes while jammed and resumes from where it stopped.
- [ ] The Mute walks at Block's speed, costs 1 life on a leak, and its kill pays the normal kill gold.
- [ ] The art is a chunky hollow ring in deep purple with the usual darker side face and soft shadow; it lands in its own content and hook files (the Hauler's pattern).
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.
