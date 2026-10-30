---
id: T0286
title: "The boss's phase wind-up: the ring that counts the eight seconds"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T12:31:05Z
epic: E5
---

## Goal
The Colossus goes out of reach for a beat, then again every 8 s — but between beats the player counts dead air. A thin ring at its feet makes the next beat readable before it lands, so a single-target build plans its burst windows around a clock it can see.

## Details
- While the run's Colossus (any boss with the out-of-reach mechanic, T0253) is alive and at half health or below, one thin ring in the boss's own color (purple) sits on the road under its token, at ground level, and sweeps 0°→360° clockwise from 12 o'clock over the boss's full 8 s between phases — the Push wind-up's sweep (T0258) in the Mute ring's ground placement (T0219).
- The sweep starts the moment the boss returns to targetable and completes exactly as the white telegraph flashes (0.5 s). For the 2.5 s out-of-reach beat the ring rests — a dim, un-swept full circle — and resumes a fresh sweep at the next return. The moment the boss first reaches half health the first phase starts at once, so the ring appears already complete and its first full sweep counts the next 8 s.
- The ring only exists at half health or below: above it, nothing (the first phase is still read by the boss card's notch, T0256). It follows the boss along the road and clears the moment the boss dies or leaks.
- It is driven by the boss's own phase clock, so at 2× speed (T0019) it sweeps in half the real time and stays true to the beat.
- A new enemy-mark hook file on the markTick/crackTick pattern (one Graphics mark around the boss, per frame, reading the boss's out-of-reach state), registered in the enemy-hooks index. No sound, no HUD, no card change; the boss card (T0256) and the phase note (T0284) stay as they are. This is a wind-up, not a status chip: it shows the clock to the next beat, which nothing else shows (the removed chips, T0179, marked states the enemy's own look already shows).

## Acceptance criteria
- [ ] Above half health the Colossus wears no ring; from the moment it reaches half health, a thin purple ring at ground level under its token sweeps 0°→360° clockwise over 8 s.
- [ ] The sweep completes as the telegraph's white flash begins; through the 2.5 s out-of-reach beat the ring rests as a dim un-swept circle; it resumes a full sweep when the boss returns.
- [ ] The ring tracks the boss along the road and clears the moment the boss dies or leaks.
- [ ] No sound, no HUD element, no change to the boss card or the phase note; at 2× speed the ring sweeps in 4 real seconds.
- [ ] Bosses without the out-of-reach mechanic (the Titan and its Guard, the Orb) wear no ring.
