---
id: T0360
title: "The far gate's send: one ring when its walkers come in"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T12:52:50Z
claimed_at: 2026-11-01T12:53:26Z
designer: yoga
---

## Goal
The far gate comes alive where its walkers come in: on a board with a far gate, the moment a non-boss wave starts, one quiet ring pulses at the far gate — the ring language of the boss's arrival (T0312).

## Details
- A new small system file `src/systems/fx/farGateSend.ts` (closest example: `src/systems/PushWindup.ts` — one thin ring drawn on the board): it draws one thin muted-ink ring that grows out from the far gate and fades over ~0.6 s.
- It fires once per wave, at the wave's start — the same point the "Wave N" banner (T0067) is raised — and only when the wave's plan sends walkers through the far gate: a non-boss wave on a far-gate board. A boss wave sends none through it, and a board without a far gate has no gate to pulse.
- Display only: no sound, no text, no HUD element, and no change to spawns, timing, damage or gold.
- The ring is visible at 412x915 and 1280x720.

## Acceptance criteria
- [ ] On a far-gate board, the moment each non-boss wave starts, one muted ring pulses once at the far gate (~0.6 s) and nowhere else on the board.
- [ ] Boss waves and boards without a far gate show no ring.
- [ ] No sound, no text, no new HUD element; the wave's spawns, timing and gold are unchanged.
