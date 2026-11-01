---
id: T0349
title: "The Block's double leak says what it costs"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T09:12:53Z
claimed_at: 2026-11-01T09:31:03Z
designer: yoga
---

## Goal
A first-time player who loses two lives to a Block learns why at the moment it happens — the way the Hauler's extra gold is taught (T0307) — instead of only in the enemies reference.

## Details
- The Block is the only regular enemy whose leak costs 2 lives. The run's first leak pops "leaks cost a life" (T0107); a Block's leak then quietly contradicts what the run was just told.
- On the first Block leak of a run, one muted chip at the exit gate, in the first-leak chip's own look (T0107's chip: a small rounded card chip, bold 12 px muted ink), says "the Block takes 2 lives" and holds for ~1.5 s.
- Once per run, and never again after a resume (T0307's rule, mirrored exactly). If the Block is the run's very first leak, its chip starts 1.2 s after the first-leak chip's, at the same spot (T0307's ordering).
- No sound: the leak's own thud, jolt and echo are unchanged. A non-Block leak shows nothing new; the Hauler's teach chip (T0307) is untouched.
- A new enemy-hook file in the T0307 pattern (its hook is the closest example), registered in the enemy-hooks index; the chip rides the existing leak-chip painter. No HUD, no new readout — the lives number already shows the −2.
- The Block itself is unchanged (hp, speed, gold, its 2-life leak cost, its look): this task touches nothing on the enemy, only what the exit says once.

## Acceptance criteria
- [ ] In a fresh run, the first Block leak pops "the Block takes 2 lives" at the exit gate for ~1.5 s; a second Block leak the same run pops nothing.
- [ ] A resumed run never shows the chip, whether or not it saw it before closing.
- [ ] When the Block is the run's very first leak, its chip starts 1.2 s after "leaks cost a life"; otherwise it pops on its own at the leak.
- [ ] Non-Block leaks, the Hauler's teach chip and every sound behave exactly as before.
