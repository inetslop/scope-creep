---
id: T0149
title: Puddle plop — the slow is felt the instant it starts
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T22:11:29Z
---

## Goal
The moment your center enters a slow puddle, you hear and see it — one soft plop and one edge pulse — so the Wash's puddles (T0111) are felt the instant the slow starts, not discovered mid-slow.

## Details
- The moment the player's circle center crosses from outside to inside any slow puddle on the page (today the Wash puddle — 120 u across, 2.0 s life; when the ink rain (T0137) lands, its puddles reuse the same hook):
  - one soft low plop plays: a new `Sfx.puddlePlop()` in `src/audio/Sfx.ts` in the `orbitHum()` idiom (T0107) — a ~120 ms sine glide 90→45 Hz at about half the gain of a normal hit, mute-gated by the same gate the other Sfx use, throttled to one per 250 ms.
  - the puddle's edge pulses once: a flat 2 u ink ring at the puddle's own radius, fading over 200 ms — a new emitter in the FxSystem `restRing` pattern (T0143; the first-light ring idiom, T0138).
- The edge rides the existing slow check — the same place the Wash puddle decides the player is slowed: one entry event per outside→inside crossing; leaving and re-entering the same puddle plays again; standing inside plays exactly once, never per frame.
- No change to the slow value (20% while inside), the puddle's look, its life or anything else — no damage, key, HUD element, scene or stat change.

## Acceptance criteria
- [ ] Walking into a Wash puddle: exactly one plop and one 200 ms edge pulse at the crossing moment; the 20% slow applies as before.
- [ ] Standing still inside a puddle: no repeated plops or pulses.
- [ ] Leaving the puddle and re-entering it: the plop and pulse play again.
- [ ] Two overlapping puddles: at most one plop per 250 ms.
- [ ] The puddle's look, life and slow are unchanged; desktop + mobile smoke runs pass.
