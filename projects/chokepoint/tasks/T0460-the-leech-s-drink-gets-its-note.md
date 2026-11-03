---
id: T0460
title: "The Leech's drink gets its note"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T01:27:12Z
---

## Goal
The wave-80 Leech's drink is the boss's whole trick and right now it is only the white flash — the moment the Leech starts drinking, a quiet note plays, so the drink is heard the way the Mute's silence is heard (T0419).

## Details
- One note per drink: the Leech's drink is its 0.8 s white flash every 5 s (T0405) that draws 8% of its max hp from its nearest escort. The note plays at the flash's start, once per drink; it is silent whenever the Leech is not drinking.
- The note is a short quiet falling sip in Sfx's softest class (the Mute note's volume class, 0.05–0.08 pre-master, never above a kill blip): two 70 ms sine notes falling, ~40 ms apart, a step below A4 (G4→E4, 392→330 Hz).
- A new enemy-hook file on the per-frame reconcile pattern (src/systems/enemyHooks/skyNote.ts, T0376 — the closest example): it plays when a live Leech's drink flash begins and is silent otherwise, registered in the hooks' index next to skyNote. The new sound method (Sfx.leechDrink()) sits beside the Mute note's and sky note's methods in src/audio/Sfx.ts.
- It respects the pause's Sound toggle the way the other notes do (Sfx.tone's existing mute check).
- No HUD, no chip, no text: sound only, like T0419 and T0376.

## Acceptance criteria
- [ ] In a wave-80 run, each Leech drink flash plays exactly one short falling two-note sip at the flash's start.
- [ ] The note never plays when the Leech is not drinking (dead, or a wave without a Leech).
- [ ] The note is silent with the pause's Sound toggle off, and no other boss or wave moment gains a sound.
- [ ] The note sits at ~0.05–0.08 pre-master volume — quiet, below a kill blip.
- [ ] No HUD element, chip or text is added; everything else is byte-identical.
