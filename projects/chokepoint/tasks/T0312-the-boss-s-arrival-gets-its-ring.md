---
id: T0312
title: "The boss's arrival gets its ring"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T23:07:23Z
claimed_at: 2026-10-30T23:15:46Z
designer: yoga
---

## Goal
The run's biggest threat announces itself on the board, not only on the top-center card: the moment a boss walks in, its spot is seen.

## Details
- The moment the run's boss first appears on the board (its live spawn), a single muted ring in the boss's own body color expands from its base and fades over ~0.6 s — the working-aura ring's language (T0055) at boss scale.
- One ring per boss: the wave-10, 20 and 30 bosses each get theirs, and later bosses inherit it. The death burst and name card (T0273, T0302), the phase windup (T0286) and the boss card are untouched.
- No sound, no input, no new readout: a ~0.6 s transient at the boss's spot. It replaces nothing — the card is top-center (name and hp), the ring says where the boss is.

## Acceptance criteria
- [ ] In a fresh run, when the wave-10 boss first appears on the board, one muted ring in its own color expands from its base over ~0.6 s and fades.
- [ ] Each later boss (wave 20, 30) gets its own ring on first appearance; no second ring on the same boss.
- [ ] Resuming a run while a boss is already alive shows no ring.
- [ ] No sound plays with the ring, and the boss card, death burst and phase windup behave exactly as before.
