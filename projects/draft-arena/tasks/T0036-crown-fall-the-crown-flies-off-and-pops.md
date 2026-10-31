---
id: T0036
title: "Crown fall: the crown flies off and pops where the leader is knocked out"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T06:50:30Z
claimed_at: 2026-10-31T07:06:12Z
epic: E4
designer: yoga
---

## Goal
Knocking out the leader becomes a moment the whole field sees: the crown flies off the fallen player's head and pops into confetti, and a ring marks where the crown — and its gem — landed.

## Details
- New effect file `src/content/effects/crown-fall.ts`, registered in `src/content/effects/index.ts`. Closest example: `src/content/effects/prestige-ring.ts` (T0023).
- What plays, at the spot where the crowned player is knocked out, on top of the normal knockout burst: a small yellow 3-point crown about 24 units wide (the same crown the leader wears) lifts off the body, spins slowly and rises about 60 units over 0.9 s, then pops into 20 yellow confetti stars; and a yellow ring with an ink rim spreads out to a radius of 120 over 0.8 s at the spot.
- Trigger: the crown director (`src/content/directors/crown.ts`) already tracks who wears the crown and runs `onKill`; when the player just knocked out wore it, play `crown-fall` at their spot. T0014's leader's gem can drop at the same spot at the same time — both are visible.
- Readable in a crowd: a yellow crown lifting off a body is unmissable in a fight, and the ring marks where the prize landed. It is smaller than the prestige ring (120 vs 220) and carries its own shape (the crown is the star), so it never reads as a level-up or a prestige.
- Works with 6 and with 60: one crown per match, so at most one crown fall per knockout, in a quiet match or a full one.

## Acceptance criteria
- [ ] Knocking out the crowned player plays the crown fall: the yellow crown lifts, spins up about 60 units, pops into 20 yellow stars, and a yellow ring (radius 120, 0.8 s) spreads at the spot — on top of the normal knockout burst.
- [ ] Knocking out a player who does not wear the crown plays only the normal knockout burst: no crown, no extra ring.
- [ ] The crown itself moves to the new top scorer exactly as before (strict overtake, unchanged).
